import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Track active socket connections by userId
  const userSockets = new Map(); // userId -> Set of socketIds
  const meetingRooms = new Map(); // roomId -> Set of { socketId, userId, name, avatar, audioMuted, videoOff, screenSharing }

  io.on('connection', (socket) => {
    let currentUserId = null;

    socket.on('authenticate', ({ userId }) => {
      if (!userId) return;
      currentUserId = userId;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      socket.join(`user:${userId}`);
    });

    // Workspace & Channel Rooms
    socket.on('join-workspace', ({ workspaceId }) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on('leave-workspace', ({ workspaceId }) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('join-channel', ({ channelId }) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave-channel', ({ channelId }) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('join-dm', ({ dmId }) => {
      socket.join(`dm:${dmId}`);
    });

    socket.on('leave-dm', ({ dmId }) => {
      socket.leave(`dm:${dmId}`);
    });

    // Realtime typing indicators
    socket.on('typing:start', ({ roomType, roomId, user }) => {
      socket.to(`${roomType}:${roomId}`).emit('typing:update', {
        roomId,
        user,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ roomType, roomId, user }) => {
      socket.to(`${roomType}:${roomId}`).emit('typing:update', {
        roomId,
        user,
        isTyping: false
      });
    });

    // Messages & Reactions Broadcast
    socket.on('message:send', ({ roomType, roomId, message }) => {
      io.to(`${roomType}:${roomId}`).emit('message:new', message);
    });

    socket.on('reaction:toggle', ({ roomType, roomId, reactionData }) => {
      io.to(`${roomType}:${roomId}`).emit('reaction:update', reactionData);
    });

    socket.on('message:update', ({ roomType, roomId, message }) => {
      io.to(`${roomType}:${roomId}`).emit('message:edited', message);
    });

    socket.on('message:remove', ({ roomType, roomId, messageId }) => {
      io.to(`${roomType}:${roomId}`).emit('message:deleted', { messageId });
    });

    // Realtime User Presence
    socket.on('presence:set', ({ userId, status, customStatus, workspaceId }) => {
      if (workspaceId) {
        io.to(`workspace:${workspaceId}`).emit('presence:changed', { userId, status, customStatus });
      } else {
        io.emit('presence:changed', { userId, status, customStatus });
      }
    });

    // Realtime Notifications
    socket.on('notification:push', ({ userId, notification }) => {
      io.to(`user:${userId}`).emit('notification:new', notification);
    });

    // WebRTC Video Meeting Signaling
    socket.on('meeting:join', ({ roomId, user, audioMuted, videoOff }) => {
      socket.join(`meeting:${roomId}`);
      if (!meetingRooms.has(roomId)) {
        meetingRooms.set(roomId, new Map());
      }
      const roomParticipants = meetingRooms.get(roomId);
      const participantInfo = {
        socketId: socket.id,
        userId: user.id,
        name: user.name,
        avatar: user.avatarUrl,
        audioMuted: !!audioMuted,
        videoOff: !!videoOff,
        screenSharing: false
      };
      roomParticipants.set(socket.id, participantInfo);

      // Send existing participants in the room to new user
      const currentParticipants = Array.from(roomParticipants.values()).filter(p => p.socketId !== socket.id);
      socket.emit('meeting:existing-participants', currentParticipants);

      // Broadcast to other participants that a new user joined
      socket.to(`meeting:${roomId}`).emit('meeting:user-joined', participantInfo);
    });

    socket.on('meeting:signal', ({ toSocketId, signal, fromUser }) => {
      io.to(toSocketId).emit('meeting:signal', {
        fromSocketId: socket.id,
        signal,
        fromUser
      });
    });

    socket.on('meeting:state-toggle', ({ roomId, field, value }) => {
      const room = meetingRooms.get(roomId);
      if (room && room.has(socket.id)) {
        const participant = room.get(socket.id);
        participant[field] = value;
        io.to(`meeting:${roomId}`).emit('meeting:participant-updated', {
          socketId: socket.id,
          field,
          value
        });
      }
    });

    socket.on('meeting:leave', ({ roomId }) => {
      socket.leave(`meeting:${roomId}`);
      const room = meetingRooms.get(roomId);
      if (room && room.has(socket.id)) {
        room.delete(socket.id);
        socket.to(`meeting:${roomId}`).emit('meeting:user-left', { socketId: socket.id });
        if (room.size === 0) {
          meetingRooms.delete(roomId);
        }
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const sockets = userSockets.get(currentUserId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(currentUserId);
          // Broadcast offline status if no more sockets
          io.emit('presence:changed', { userId: currentUserId, status: 'OFFLINE' });
        }
      }

      // Check meetings
      for (const [roomId, room] of meetingRooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(`meeting:${roomId}`).emit('meeting:user-left', { socketId: socket.id });
          if (room.size === 0) {
            meetingRooms.delete(roomId);
          }
        }
      }
    });
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Connects server ready on http://${hostname}:${port}`);
  });
});
