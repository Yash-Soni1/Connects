'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  joinDM: (dmId: string) => void;
  leaveDM: (dmId: string) => void;
  sendTyping: (roomType: 'channel' | 'dm', roomId: string, user: any, isTyping: boolean) => void;
  emitNewMessage: (roomType: 'channel' | 'dm', roomId: string, message: any) => void;
  emitReaction: (roomType: 'channel' | 'dm', roomId: string, reactionData: any) => void;
  emitMessageUpdate: (roomType: 'channel' | 'dm', roomId: string, message: any) => void;
  emitMessageDelete: (roomType: 'channel' | 'dm', roomId: string, messageId: string) => void;
  emitPresence: (userId: string, status: string, customStatus?: string, workspaceId?: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  joinWorkspace: () => {},
  leaveWorkspace: () => {},
  joinChannel: () => {},
  leaveChannel: () => {},
  joinDM: () => {},
  leaveDM: () => {},
  sendTyping: () => {},
  emitNewMessage: () => {},
  emitReaction: () => {},
  emitMessageUpdate: () => {},
  emitMessageDelete: () => {},
  emitPresence: () => {},
});

export function SocketProvider({
  children,
  currentUser
}: {
  children: React.ReactNode;
  currentUser?: any;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      if (currentUser?.id) {
        socketInstance.emit('authenticate', { userId: currentUser.id });
      }
      setToastMessage('Connected');
      setShowStatusToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowStatusToast(false), 2000);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsReconnecting(true);
      setToastMessage('Reconnecting to Connects...');
      setShowStatusToast(true);
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setToastMessage('Connected');
      setShowStatusToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowStatusToast(false), 2000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser?.id]);

  const joinWorkspace = (workspaceId: string) => {
    socket?.emit('join-workspace', { workspaceId });
  };

  const leaveWorkspace = (workspaceId: string) => {
    socket?.emit('leave-workspace', { workspaceId });
  };

  const joinChannel = (channelId: string) => {
    socket?.emit('join-channel', { channelId });
  };

  const leaveChannel = (channelId: string) => {
    socket?.emit('leave-channel', { channelId });
  };

  const joinDM = (dmId: string) => {
    socket?.emit('join-dm', { dmId });
  };

  const leaveDM = (dmId: string) => {
    socket?.emit('leave-dm', { dmId });
  };

  const sendTyping = (roomType: 'channel' | 'dm', roomId: string, user: any, isTyping: boolean) => {
    if (isTyping) {
      socket?.emit('typing:start', { roomType, roomId, user });
    } else {
      socket?.emit('typing:stop', { roomType, roomId, user });
    }
  };

  const emitNewMessage = (roomType: 'channel' | 'dm', roomId: string, message: any) => {
    socket?.emit('message:send', { roomType, roomId, message });
  };

  const emitReaction = (roomType: 'channel' | 'dm', roomId: string, reactionData: any) => {
    socket?.emit('reaction:toggle', { roomType, roomId, reactionData });
  };

  const emitMessageUpdate = (roomType: 'channel' | 'dm', roomId: string, message: any) => {
    socket?.emit('message:update', { roomType, roomId, message });
  };

  const emitMessageDelete = (roomType: 'channel' | 'dm', roomId: string, messageId: string) => {
    socket?.emit('message:remove', { roomType, roomId, messageId });
  };

  const emitPresence = (userId: string, status: string, customStatus?: string, workspaceId?: string) => {
    socket?.emit('presence:set', { userId, status, customStatus, workspaceId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isReconnecting,
        joinWorkspace,
        leaveWorkspace,
        joinChannel,
        leaveChannel,
        joinDM,
        leaveDM,
        sendTyping,
        emitNewMessage,
        emitReaction,
        emitMessageUpdate,
        emitMessageDelete,
        emitPresence,
      }}
    >
      {children}
      {showStatusToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium shadow-xl transition-all duration-300 ${
            isConnected
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 backdrop-blur-md'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 backdrop-blur-md'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
            }`}
          />
          {toastMessage}
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
