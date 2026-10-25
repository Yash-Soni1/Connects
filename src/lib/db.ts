import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'connects.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    avatarUrl TEXT,
    bio TEXT DEFAULT '',
    status TEXT DEFAULT 'ONLINE',
    customStatus TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    iconUrl TEXT,
    description TEXT DEFAULT '',
    ownerId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT DEFAULT 'MEMBER', -- OWNER, ADMIN, MEMBER
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspaceId, userId),
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    name TEXT NOT NULL,
    topic TEXT DEFAULT '',
    isPrivate INTEGER DEFAULT 0,
    createdBy TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspaceId, name),
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(createdBy) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channel_members (
    id TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    userId TEXT NOT NULL,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channelId, userId),
    FOREIGN KEY(channelId) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS direct_message_participants (
    id TEXT PRIMARY KEY,
    directMessageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    UNIQUE(directMessageId, userId),
    FOREIGN KEY(directMessageId) REFERENCES direct_messages(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    channelId TEXT,
    directMessageId TEXT,
    senderId TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT DEFAULT '[]', -- JSON string of {url, name, type, size}
    replyToId TEXT,
    isEdited INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(channelId) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY(directMessageId) REFERENCES direct_messages(id) ON DELETE CASCADE,
    FOREIGN KEY(senderId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS message_reactions (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    emoji TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(messageId, userId, emoji),
    FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS presence (
    userId TEXT PRIMARY KEY,
    status TEXT DEFAULT 'ONLINE', -- ONLINE, AWAY, DND, OFFLINE
    customStatus TEXT DEFAULT '',
    lastSeenAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    workspaceId TEXT,
    type TEXT NOT NULL, -- MENTION, REPLY, DM, INVITE, MEETING, CALENDAR
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    maxUses INTEGER DEFAULT 50,
    usedCount INTEGER DEFAULT 0,
    expiresAt DATETIME,
    createdBy TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(createdBy) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    channelId TEXT,
    title TEXT NOT NULL,
    isVideo INTEGER DEFAULT 1,
    isActive INTEGER DEFAULT 1,
    roomCode TEXT UNIQUE NOT NULL,
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    endedAt DATETIME,
    hostId TEXT NOT NULL,
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(channelId) REFERENCES channels(id) ON DELETE SET NULL,
    FOREIGN KEY(hostId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meeting_participants (
    id TEXT PRIMARY KEY,
    meetingId TEXT NOT NULL,
    userId TEXT NOT NULL,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    leftAt DATETIME,
    isAudioMuted INTEGER DEFAULT 0,
    isVideoOff INTEGER DEFAULT 0,
    isScreenSharing INTEGER DEFAULT 0,
    FOREIGN KEY(meetingId) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    location TEXT DEFAULT '',
    videoMeetingId TEXT,
    privacy TEXT DEFAULT 'PUBLIC', -- PUBLIC, BUSY_ONLY, PRIVATE
    createdBy TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY(createdBy) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS calendar_participants (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    userId TEXT NOT NULL,
    status TEXT DEFAULT 'ACCEPTED', -- ACCEPTED, TENTATIVE, DECLINED
    UNIQUE(eventId, userId),
    FOREIGN KEY(eventId) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    userId TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'dark', -- dark, light, system
    notificationSound INTEGER DEFAULT 1,
    emailNotifications INTEGER DEFAULT 1,
    calendarPrivacy TEXT DEFAULT 'PUBLIC',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Indexes for lightning fast queries
  CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channelId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_messages_dm ON messages(directMessageId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_messages_workspace ON messages(workspaceId);
  CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(userId);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId, isRead);
  CREATE INDEX IF NOT EXISTS idx_calendar_events_ws ON calendar_events(workspaceId, startTime);
`);

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  bio: string | null;
  status: string;
  customStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  topic: string | null;
  isPrivate: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  workspaceId: string;
  channelId: string | null;
  directMessageId: string | null;
  senderId: string;
  content: string;
  attachments: string;
  replyToId: string | null;
  isEdited: number;
  isDeleted: number;
  createdAt: string;
  updatedAt: string;
}

// Database helper functions
export const dbOps = {
  // Direct DB access for prepared statements
  raw: db,

  // Users
  getUserByEmail(email: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as unknown;
    return (row as User) || null;
  },

  getUserById(id: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown;
    return (row as User) || null;
  },

  createUser(user: { id: string; name: string; email: string; passwordHash: string; avatarUrl?: string; bio?: string }): User {
    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, avatarUrl, bio, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ONLINE')
    `).run(user.id, user.name, user.email, user.passwordHash, user.avatarUrl || null, user.bio || '');

    db.prepare(`
      INSERT INTO user_settings (userId, theme) VALUES (?, 'dark')
    `).run(user.id);

    db.prepare(`
      INSERT INTO presence (userId, status) VALUES (?, 'ONLINE')
    `).run(user.id);

    return this.getUserById(user.id)!;
  },

  updateUserProfile(userId: string, data: { name?: string; bio?: string; avatarUrl?: string; customStatus?: string }): User | null {
    const current = this.getUserById(userId);
    if (!current) return null;
    const name = data.name !== undefined ? data.name : current.name;
    const bio = data.bio !== undefined ? data.bio : current.bio;
    const avatarUrl = data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl;
    const customStatus = data.customStatus !== undefined ? data.customStatus : current.customStatus;

    db.prepare(`
      UPDATE users SET name = ?, bio = ?, avatarUrl = ?, customStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, bio, avatarUrl, customStatus, userId);

    return this.getUserById(userId);
  },

  // Sessions
  createSession(id: string, token: string, userId: string, expiresAt: string) {
    db.prepare(`
      INSERT INTO sessions (id, token, userId, expiresAt) VALUES (?, ?, ?, ?)
    `).run(id, token, userId, expiresAt);
  },

  getSession(token: string): { userId: string; user: User } | null {
    const row = db.prepare(`
      SELECT s.userId, u.id, u.name, u.email, u.passwordHash, u.avatarUrl, u.bio, u.status, u.customStatus, u.createdAt, u.updatedAt
      FROM sessions s
      JOIN users u ON s.userId = u.id
      WHERE s.token = ? AND datetime(s.expiresAt) > datetime('now')
    `).get(token) as any;

    if (!row) return null;
    return {
      userId: row.userId,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.passwordHash,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
        status: row.status,
        customStatus: row.customStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }
    };
  },

  deleteSession(token: string) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  },

  // Workspaces
  getUserWorkspaces(userId: string) {
    return db.prepare(`
      SELECT w.*, wm.role, wm.joinedAt,
        (SELECT COUNT(*) FROM workspace_members WHERE workspaceId = w.id) as memberCount
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspaceId
      WHERE wm.userId = ?
      ORDER BY w.createdAt ASC
    `).all(userId);
  },

  getWorkspaceById(workspaceId: string) {
    return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspaceId) as Workspace | null;
  },

  getWorkspaceMember(workspaceId: string, userId: string) {
    return db.prepare('SELECT * FROM workspace_members WHERE workspaceId = ? AND userId = ?').get(workspaceId, userId) as any;
  },

  getWorkspaceMembers(workspaceId: string) {
    return db.prepare(`
      SELECT wm.id, wm.role, wm.joinedAt, u.id as userId, u.name, u.email, u.avatarUrl, u.bio, p.status, p.customStatus
      FROM workspace_members wm
      JOIN users u ON wm.userId = u.id
      LEFT JOIN presence p ON u.id = p.userId
      WHERE wm.workspaceId = ?
      ORDER BY 
        CASE wm.role 
          WHEN 'OWNER' THEN 1 
          WHEN 'ADMIN' THEN 2 
          ELSE 3 
        END,
        u.name ASC
    `).all(workspaceId);
  },

  createWorkspace(workspace: { id: string; name: string; slug: string; iconUrl?: string; description?: string; ownerId: string }) {
    db.prepare(`
      INSERT INTO workspaces (id, name, slug, iconUrl, description, ownerId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(workspace.id, workspace.name, workspace.slug, workspace.iconUrl || null, workspace.description || '', workspace.ownerId);

    // Add owner as workspace member
    db.prepare(`
      INSERT INTO workspace_members (id, workspaceId, userId, role)
      VALUES (?, ?, ?, 'OWNER')
    `).run(`wm_${workspace.id}_${workspace.ownerId}`, workspace.id, workspace.ownerId);

    // Create default general channel
    const generalChannelId = `chan_${workspace.id}_general`;
    db.prepare(`
      INSERT INTO channels (id, workspaceId, name, topic, isPrivate, createdBy)
      VALUES (?, ?, 'general', 'Company-wide announcements and work-based matters', 0, ?)
    `).run(generalChannelId, workspace.id, workspace.ownerId);

    db.prepare(`
      INSERT INTO channel_members (id, channelId, userId)
      VALUES (?, ?, ?)
    `).run(`cm_${generalChannelId}_${workspace.ownerId}`, generalChannelId, workspace.ownerId);

    // Generate initial invitation code
    const inviteCode = `CNX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    db.prepare(`
      INSERT INTO invitations (id, workspaceId, code, maxUses, usedCount, createdBy)
      VALUES (?, ?, ?, 100, 0, ?)
    `).run(`inv_${workspace.id}`, workspace.id, inviteCode, workspace.ownerId);

    return this.getWorkspaceById(workspace.id);
  },

  // Channels
  getWorkspaceChannels(workspaceId: string, userId: string) {
    return db.prepare(`
      SELECT c.*, 
        EXISTS(SELECT 1 FROM channel_members cm WHERE cm.channelId = c.id AND cm.userId = ?) as isMember,
        (SELECT COUNT(*) FROM channel_members WHERE channelId = c.id) as memberCount
      FROM channels c
      WHERE c.workspaceId = ? AND (
        c.isPrivate = 0 OR 
        EXISTS(SELECT 1 FROM channel_members cm WHERE cm.channelId = c.id AND cm.userId = ?)
      )
      ORDER BY c.name ASC
    `).all(userId, workspaceId, userId);
  },

  getChannelById(channelId: string) {
    return db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId) as Channel | null;
  },

  createChannel(channel: { id: string; workspaceId: string; name: string; topic?: string; isPrivate: boolean; createdBy: string }) {
    db.prepare(`
      INSERT INTO channels (id, workspaceId, name, topic, isPrivate, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(channel.id, channel.workspaceId, channel.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'), channel.topic || '', channel.isPrivate ? 1 : 0, channel.createdBy);

    db.prepare(`
      INSERT INTO channel_members (id, channelId, userId)
      VALUES (?, ?, ?)
    `).run(`cm_${channel.id}_${channel.createdBy}`, channel.id, channel.createdBy);

    return this.getChannelById(channel.id);
  },

  // Messages
  getChannelMessages(channelId: string, limit = 50, before?: string) {
    let query = `
      SELECT m.*, u.name as senderName, u.avatarUrl as senderAvatar, u.email as senderEmail,
        reply.content as replyContent, replyUser.name as replySenderName
      FROM messages m
      JOIN users u ON m.senderId = u.id
      LEFT JOIN messages reply ON m.replyToId = reply.id
      LEFT JOIN users replyUser ON reply.senderId = replyUser.id
      WHERE m.channelId = ?
    `;
    const params: any[] = [channelId];

    if (before) {
      query += ` AND m.createdAt < ?`;
      params.push(before);
    }

    query += ` ORDER BY m.createdAt ASC LIMIT ?`;
    params.push(limit);

    const rows = db.prepare(query).all(...params) as any[];

    // Fetch reactions for these messages
    if (rows.length > 0) {
      const messageIds = rows.map(r => `'${r.id}'`).join(',');
      const reactions = db.prepare(`
        SELECT mr.id, mr.messageId, mr.userId, mr.emoji, u.name as userName
        FROM message_reactions mr
        JOIN users u ON mr.userId = u.id
        WHERE mr.messageId IN (${messageIds})
      `).all() as any[];

      const reactionMap: Record<string, any[]> = {};
      for (const rx of reactions) {
        if (!reactionMap[rx.messageId]) reactionMap[rx.messageId] = [];
        reactionMap[rx.messageId].push(rx);
      }

      for (const row of rows) {
        row.reactions = reactionMap[row.id] || [];
        try {
          row.attachments = JSON.parse(row.attachments || '[]');
        } catch {
          row.attachments = [];
        }
      }
    }

    return rows;
  },

  getDirectMessages(directMessageId: string, limit = 50) {
    const rows = db.prepare(`
      SELECT m.*, u.name as senderName, u.avatarUrl as senderAvatar, u.email as senderEmail
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.directMessageId = ?
      ORDER BY m.createdAt ASC LIMIT ?
    `).all(directMessageId, limit) as any[];

    if (rows.length > 0) {
      const messageIds = rows.map(r => `'${r.id}'`).join(',');
      const reactions = db.prepare(`
        SELECT mr.id, mr.messageId, mr.userId, mr.emoji, u.name as userName
        FROM message_reactions mr
        JOIN users u ON mr.userId = u.id
        WHERE mr.messageId IN (${messageIds})
      `).all() as any[];

      const reactionMap: Record<string, any[]> = {};
      for (const rx of reactions) {
        if (!reactionMap[rx.messageId]) reactionMap[rx.messageId] = [];
        reactionMap[rx.messageId].push(rx);
      }

      for (const row of rows) {
        row.reactions = reactionMap[row.id] || [];
        try {
          row.attachments = JSON.parse(row.attachments || '[]');
        } catch {
          row.attachments = [];
        }
      }
    }

    return rows;
  },

  createMessage(msg: {
    id: string;
    workspaceId: string;
    channelId?: string | null;
    directMessageId?: string | null;
    senderId: string;
    content: string;
    attachments?: any[];
    replyToId?: string | null;
  }) {
    db.prepare(`
      INSERT INTO messages (id, workspaceId, channelId, directMessageId, senderId, content, attachments, replyToId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      msg.id,
      msg.workspaceId,
      msg.channelId || null,
      msg.directMessageId || null,
      msg.senderId,
      msg.content,
      JSON.stringify(msg.attachments || []),
      msg.replyToId || null
    );

    const message = db.prepare(`
      SELECT m.*, u.name as senderName, u.avatarUrl as senderAvatar, u.email as senderEmail,
        reply.content as replyContent, replyUser.name as replySenderName
      FROM messages m
      JOIN users u ON m.senderId = u.id
      LEFT JOIN messages reply ON m.replyToId = reply.id
      LEFT JOIN users replyUser ON reply.senderId = replyUser.id
      WHERE m.id = ?
    `).get(msg.id) as any;

    if (message) {
      try {
        message.attachments = JSON.parse(message.attachments || '[]');
      } catch {
        message.attachments = [];
      }
      message.reactions = [];
    }
    return message;
  },

  toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = db.prepare('SELECT id FROM message_reactions WHERE messageId = ? AND userId = ? AND emoji = ?').get(messageId, userId, emoji) as any;
    if (existing) {
      db.prepare('DELETE FROM message_reactions WHERE id = ?').run(existing.id);
      return { added: false, emoji, userId, messageId };
    } else {
      const id = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare('INSERT INTO message_reactions (id, messageId, userId, emoji) VALUES (?, ?, ?, ?)').run(id, messageId, userId, emoji);
      return { added: true, emoji, userId, messageId, id };
    }
  },

  // Direct Message Conversations
  getOrCreateDirectMessage(workspaceId: string, user1Id: string, user2Id: string) {
    const existing = db.prepare(`
      SELECT dm.id FROM direct_messages dm
      JOIN direct_message_participants p1 ON dm.id = p1.directMessageId AND p1.userId = ?
      JOIN direct_message_participants p2 ON dm.id = p2.directMessageId AND p2.userId = ?
      WHERE dm.workspaceId = ?
    `).get(user1Id, user2Id, workspaceId) as any;

    if (existing) {
      return existing.id;
    }

    const dmId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare('INSERT INTO direct_messages (id, workspaceId) VALUES (?, ?)').run(dmId, workspaceId);
    db.prepare('INSERT INTO direct_message_participants (id, directMessageId, userId) VALUES (?, ?, ?)').run(`dmp_${dmId}_${user1Id}`, dmId, user1Id);
    db.prepare('INSERT INTO direct_message_participants (id, directMessageId, userId) VALUES (?, ?, ?)').run(`dmp_${dmId}_${user2Id}`, dmId, user2Id);
    return dmId;
  },

  getUserDMs(workspaceId: string, userId: string) {
    return db.prepare(`
      SELECT dm.id, dm.updatedAt,
        u.id as otherUserId, u.name as otherUserName, u.avatarUrl as otherUserAvatar,
        p.status as otherUserStatus,
        (SELECT content FROM messages WHERE directMessageId = dm.id ORDER BY createdAt DESC LIMIT 1) as lastMessage,
        (SELECT createdAt FROM messages WHERE directMessageId = dm.id ORDER BY createdAt DESC LIMIT 1) as lastMessageAt
      FROM direct_messages dm
      JOIN direct_message_participants self ON dm.id = self.directMessageId AND self.userId = ?
      JOIN direct_message_participants other ON dm.id = other.directMessageId AND other.userId != ?
      JOIN users u ON other.userId = u.id
      LEFT JOIN presence p ON u.id = p.userId
      WHERE dm.workspaceId = ?
      ORDER BY dm.updatedAt DESC
    `).all(userId, userId, workspaceId);
  },

  // Presence
  updatePresence(userId: string, status: string, customStatus?: string) {
    db.prepare(`
      INSERT INTO presence (userId, status, customStatus, lastSeenAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        status = excluded.status,
        customStatus = COALESCE(?, presence.customStatus),
        lastSeenAt = CURRENT_TIMESTAMP
    `).run(userId, status, customStatus || '', customStatus || null);

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
  },

  getPresence(userId: string) {
    return db.prepare('SELECT * FROM presence WHERE userId = ?').get(userId);
  },

  // Notifications
  getUserNotifications(userId: string) {
    return db.prepare(`
      SELECT n.*, w.name as workspaceName
      FROM notifications n
      LEFT JOIN workspaces w ON n.workspaceId = w.id
      WHERE n.userId = ?
      ORDER BY n.createdAt DESC LIMIT 40
    `).all(userId);
  },

  createNotification(notif: { userId: string; workspaceId?: string; type: string; title: string; message: string; link?: string }) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO notifications (id, userId, workspaceId, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, notif.userId, notif.workspaceId || null, notif.type, notif.title, notif.message, notif.link || '');
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  },

  markNotificationAsRead(id: string, userId: string) {
    db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?').run(id, userId);
  },

  markAllNotificationsAsRead(userId: string) {
    db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(userId);
  },

  // Calendar
  getCalendarEvents(workspaceId: string, userId: string) {
    return db.prepare(`
      SELECT ce.*, u.name as creatorName, u.avatarUrl as creatorAvatar,
        EXISTS(SELECT 1 FROM calendar_participants cp WHERE cp.eventId = ce.id AND cp.userId = ?) as isParticipant,
        (SELECT COUNT(*) FROM calendar_participants WHERE eventId = ce.id) as participantCount
      FROM calendar_events ce
      JOIN users u ON ce.createdBy = u.id
      WHERE ce.workspaceId = ?
      ORDER BY ce.startTime ASC
    `).all(userId, workspaceId);
  },

  createCalendarEvent(event: {
    id: string;
    workspaceId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    videoMeetingId?: string;
    privacy?: string;
    createdBy: string;
  }) {
    db.prepare(`
      INSERT INTO calendar_events (id, workspaceId, title, description, startTime, endTime, location, videoMeetingId, privacy, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.workspaceId,
      event.title,
      event.description || '',
      event.startTime,
      event.endTime,
      event.location || '',
      event.videoMeetingId || null,
      event.privacy || 'PUBLIC',
      event.createdBy
    );

    // Add creator as participant
    db.prepare(`
      INSERT INTO calendar_participants (id, eventId, userId, status)
      VALUES (?, ?, ?, 'ACCEPTED')
    `).run(`cp_${event.id}_${event.createdBy}`, event.id, event.createdBy);

    return db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(event.id);
  },

  // Invitations
  getWorkspaceInvitation(workspaceId: string) {
    return db.prepare('SELECT * FROM invitations WHERE workspaceId = ? ORDER BY createdAt DESC LIMIT 1').get(workspaceId) as any;
  },

  getInvitationByCode(code: string) {
    return db.prepare('SELECT * FROM invitations WHERE code = ?').get(code) as any;
  },

  joinWorkspaceViaCode(code: string, userId: string) {
    const invite = this.getInvitationByCode(code);
    if (!invite) throw new Error('Invalid invitation code');
    if (invite.maxUses && invite.usedCount >= invite.maxUses) throw new Error('Invitation code reached maximum uses');
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) throw new Error('Invitation code expired');

    const existing = this.getWorkspaceMember(invite.workspaceId, userId);
    if (!existing) {
      db.prepare(`
        INSERT INTO workspace_members (id, workspaceId, userId, role)
        VALUES (?, ?, ?, 'MEMBER')
      `).run(`wm_${invite.workspaceId}_${userId}`, invite.workspaceId, userId);

      // Auto join public channels
      const publicChannels = db.prepare('SELECT id FROM channels WHERE workspaceId = ? AND isPrivate = 0').all(invite.workspaceId) as any[];
      for (const ch of publicChannels) {
        db.prepare('INSERT OR IGNORE INTO channel_members (id, channelId, userId) VALUES (?, ?, ?)').run(`cm_${ch.id}_${userId}`, ch.id, userId);
      }

      db.prepare('UPDATE invitations SET usedCount = usedCount + 1 WHERE id = ?').run(invite.id);
    }

    return this.getWorkspaceById(invite.workspaceId);
  },

  // Meetings
  getActiveMeeting(workspaceId: string, channelId?: string) {
    if (channelId) {
      return db.prepare('SELECT * FROM meetings WHERE workspaceId = ? AND channelId = ? AND isActive = 1').get(workspaceId, channelId) as any;
    }
    return db.prepare('SELECT * FROM meetings WHERE workspaceId = ? AND isActive = 1 ORDER BY startedAt DESC LIMIT 1').get(workspaceId) as any;
  },

  createMeeting(meeting: { id: string; workspaceId: string; channelId?: string; title: string; hostId: string }) {
    const roomCode = `ROOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    db.prepare(`
      INSERT INTO meetings (id, workspaceId, channelId, title, isVideo, isActive, roomCode, hostId)
      VALUES (?, ?, ?, ?, 1, 1, ?, ?)
    `).run(meeting.id, meeting.workspaceId, meeting.channelId || null, meeting.title, roomCode, meeting.hostId);

    db.prepare(`
      INSERT INTO meeting_participants (id, meetingId, userId)
      VALUES (?, ?, ?)
    `).run(`mp_${meeting.id}_${meeting.hostId}`, meeting.id, meeting.hostId);

    return db.prepare('SELECT * FROM meetings WHERE id = ?').get(meeting.id) as any;
  },

  endMeeting(meetingId: string) {
    db.prepare('UPDATE meetings SET isActive = 0, endedAt = CURRENT_TIMESTAMP WHERE id = ?').run(meetingId);
  },

  // User Settings
  getUserSettings(userId: string) {
    let settings = db.prepare('SELECT * FROM user_settings WHERE userId = ?').get(userId) as any;
    if (!settings) {
      db.prepare("INSERT INTO user_settings (userId, theme) VALUES (?, 'dark')").run(userId);
      settings = { userId, theme: 'dark', notificationSound: 1, emailNotifications: 1, calendarPrivacy: 'PUBLIC' };
    }
    return settings;
  },

  updateUserSettings(userId: string, data: { theme?: string; notificationSound?: number; emailNotifications?: number; calendarPrivacy?: string }) {
    const current = this.getUserSettings(userId);
    const theme = data.theme !== undefined ? data.theme : current.theme;
    const notificationSound = data.notificationSound !== undefined ? data.notificationSound : current.notificationSound;
    const emailNotifications = data.emailNotifications !== undefined ? data.emailNotifications : current.emailNotifications;
    const calendarPrivacy = data.calendarPrivacy !== undefined ? data.calendarPrivacy : current.calendarPrivacy;

    db.prepare(`
      UPDATE user_settings
      SET theme = ?, notificationSound = ?, emailNotifications = ?, calendarPrivacy = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE userId = ?
    `).run(theme, notificationSound, emailNotifications, calendarPrivacy, userId);

    return this.getUserSettings(userId);
  }
};

// Seed script helper
export function seedDatabase() {
  const usersCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (usersCount > 0) return; // already seeded

  console.log('Seeding Connects database with realistic team data...');
  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Create Demo Users
  const users = [
    {
      id: 'usr_alex',
      name: 'Alex Rivers',
      email: 'alex@connects.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Lead Architect & Product Designer at Connects',
      status: 'ONLINE',
      customStatus: '🚀 Shipping Connects v2.0'
    },
    {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      email: 'sarah@connects.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Staff Frontend Engineer & Design Systems lead',
      status: 'ONLINE',
      customStatus: '🎨 Tuning micro-interactions'
    },
    {
      id: 'usr_marcus',
      name: 'Marcus Brody',
      email: 'marcus@connects.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Principal Backend Engineer (Realtime & WebSockets)',
      status: 'AWAY',
      customStatus: '☕ Grabbing coffee'
    },
    {
      id: 'usr_elena',
      name: 'Elena Vance',
      email: 'elena@connects.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'VP of Product Management',
      status: 'DND',
      customStatus: '📅 Planning Q4 Roadmap'
    },
    {
      id: 'usr_david',
      name: 'David Kim',
      email: 'david@connects.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Fullstack DevRel & Community Engineer',
      status: 'OFFLINE',
      customStatus: '🌴 On leave'
    }
  ];

  for (const u of users) {
    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, avatarUrl, bio, status, customStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(u.id, u.name, u.email, u.passwordHash, u.avatarUrl, u.bio, u.status, u.customStatus);

    db.prepare('INSERT INTO presence (userId, status, customStatus) VALUES (?, ?, ?)').run(u.id, u.status, u.customStatus);
    db.prepare("INSERT INTO user_settings (userId, theme) VALUES (?, 'dark')").run(u.id);
  }

  // 2. Create Workspace
  const workspaceId = 'ws_connects';
  db.prepare(`
    INSERT INTO workspaces (id, name, slug, iconUrl, description, ownerId)
    VALUES (?, 'Connects HQ', 'connects-hq', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', 'The official workspace for Connects core team', 'usr_alex')
  `).run(workspaceId);

  // Workspace members
  const roles = [
    { userId: 'usr_alex', role: 'OWNER' },
    { userId: 'usr_sarah', role: 'ADMIN' },
    { userId: 'usr_marcus', role: 'ADMIN' },
    { userId: 'usr_elena', role: 'MEMBER' },
    { userId: 'usr_david', role: 'MEMBER' }
  ];

  for (const r of roles) {
    db.prepare(`
      INSERT INTO workspace_members (id, workspaceId, userId, role)
      VALUES (?, ?, ?, ?)
    `).run(`wm_${workspaceId}_${r.userId}`, workspaceId, r.userId, r.role);
  }

  // 3. Channels
  const channels = [
    { id: 'chan_general', name: 'general', topic: 'Company-wide announcements and team discussions', isPrivate: 0 },
    { id: 'chan_announcements', name: 'announcements', topic: 'Important company-wide updates and milestones', isPrivate: 0 },
    { id: 'chan_development', name: 'development', topic: 'Architecture, PR reviews, and engineering sync', isPrivate: 0 },
    { id: 'chan_design', name: 'design', topic: 'Figma prototypes, design tokens, and UI craft', isPrivate: 0 },
    { id: 'chan_leadership', name: 'leadership', topic: 'Executive strategy & confidential planning', isPrivate: 1 },
    { id: 'chan_random', name: 'random', topic: 'Memes, music, weekend banter, and watercooler chats', isPrivate: 0 }
  ];

  for (const ch of channels) {
    db.prepare(`
      INSERT INTO channels (id, workspaceId, name, topic, isPrivate, createdBy)
      VALUES (?, ?, ?, ?, ?, 'usr_alex')
    `).run(ch.id, workspaceId, ch.name, ch.topic, ch.isPrivate);

    // add members
    for (const r of roles) {
      if (ch.isPrivate && (r.role === 'MEMBER' && r.userId !== 'usr_elena')) continue;
      db.prepare(`
        INSERT INTO channel_members (id, channelId, userId)
        VALUES (?, ?, ?)
      `).run(`cm_${ch.id}_${r.userId}`, ch.id, r.userId);
    }
  }

  // 4. Invitation Code
  db.prepare(`
    INSERT INTO invitations (id, workspaceId, code, maxUses, usedCount, createdBy)
    VALUES ('inv_connects_primary', ?, 'CNX-7H2K9P', 100, 5, 'usr_alex')
  `).run(workspaceId);

  // 5. Seed Messages in #development
  const now = Date.now();
  const devMessages = [
    {
      id: 'msg_dev_1',
      senderId: 'usr_marcus',
      content: "Hey everyone! The WebSockets real-time gateway is live with zero-lag heartbeats and presence synchronization.",
      time: new Date(now - 3600000 * 4).toISOString(),
    },
    {
      id: 'msg_dev_2',
      senderId: 'usr_sarah',
      content: "Tested it across multiple browser windows. Instant delivery and the typing indicators feel super fluid!",
      time: new Date(now - 3600000 * 3.5).toISOString(),
    },
    {
      id: 'msg_dev_3',
      senderId: 'usr_alex',
      content: "Amazing work @Sarah Chen and @Marcus Brody! I just pushed the WebRTC video meeting room. You can launch calls straight from the header button.",
      time: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg_dev_4',
      senderId: 'usr_elena',
      content: "Let's review the sprint deliverables in the upcoming Team Sync at 3:00 PM. Check your Connects calendar!",
      time: new Date(now - 3600000 * 1).toISOString(),
    },
    {
      id: 'msg_dev_5',
      senderId: 'usr_alex',
      content: "Welcome to Connects! Everything is synchronized in real time. Try sending a message or switching channels.",
      time: new Date(now - 60000 * 15).toISOString(),
    }
  ];

  for (const m of devMessages) {
    db.prepare(`
      INSERT INTO messages (id, workspaceId, channelId, senderId, content, attachments, createdAt)
      VALUES (?, ?, 'chan_development', ?, ?, '[]', ?)
    `).run(m.id, workspaceId, m.senderId, m.content, m.time);
  }

  // Reactions
  db.prepare(`INSERT INTO message_reactions (id, messageId, userId, emoji) VALUES ('rx_1', 'msg_dev_1', 'usr_sarah', '🔥')`).run();
  db.prepare(`INSERT INTO message_reactions (id, messageId, userId, emoji) VALUES ('rx_2', 'msg_dev_1', 'usr_alex', '🚀')`).run();
  db.prepare(`INSERT INTO message_reactions (id, messageId, userId, emoji) VALUES ('rx_3', 'msg_dev_3', 'usr_marcus', '👍')`).run();
  db.prepare(`INSERT INTO message_reactions (id, messageId, userId, emoji) VALUES ('rx_4', 'msg_dev_3', 'usr_sarah', '❤️')`).run();

  // 6. Direct Messages between Alex and Sarah
  const dmId = 'dm_alex_sarah';
  db.prepare('INSERT INTO direct_messages (id, workspaceId) VALUES (?, ?)').run(dmId, workspaceId);
  db.prepare('INSERT INTO direct_message_participants (id, directMessageId, userId) VALUES (?, ?, ?)').run('dmp_1', dmId, 'usr_alex');
  db.prepare('INSERT INTO direct_message_participants (id, directMessageId, userId) VALUES (?, ?, ?)').run('dmp_2', dmId, 'usr_sarah');

  db.prepare(`
    INSERT INTO messages (id, workspaceId, directMessageId, senderId, content, createdAt)
    VALUES ('msg_dm_1', ?, ?, 'usr_sarah', 'Hey Alex, do we want dark mode enabled by default across all workspaces?', datetime('now', '-2 hours'))
  `).run(workspaceId, dmId);

  db.prepare(`
    INSERT INTO messages (id, workspaceId, directMessageId, senderId, content, createdAt)
    VALUES ('msg_dm_2', ?, ?, 'usr_alex', 'Yes! Sleek modern dark mode with curated purple/indigo accents, and full light mode toggle.', datetime('now', '-1 hour'))
  `).run(workspaceId, dmId);

  // 7. Calendar Events
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startTime1 = new Date(tomorrow);
  startTime1.setHours(10, 0, 0, 0);
  const endTime1 = new Date(tomorrow);
  endTime1.setHours(11, 0, 0, 0);

  const startTime2 = new Date(tomorrow);
  startTime2.setHours(14, 30, 0, 0);
  const endTime2 = new Date(tomorrow);
  endTime2.setHours(15, 30, 0, 0);

  db.prepare(`
    INSERT INTO calendar_events (id, workspaceId, title, description, startTime, endTime, location, videoMeetingId, privacy, createdBy)
    VALUES ('cal_evt_1', ?, 'Product Design & Architecture Review', 'Sprint demo of Connects real-time features and WebRTC calling.', ?, ?, 'Video Room Alpha', 'meet_alpha', 'PUBLIC', 'usr_alex')
  `).run(workspaceId, startTime1.toISOString(), endTime1.toISOString());

  db.prepare(`
    INSERT INTO calendar_events (id, workspaceId, title, description, startTime, endTime, location, privacy, createdBy)
    VALUES ('cal_evt_2', ?, 'Engineering All-Hands & Q4 Milestones', 'Sync with the engineering and DevOps squad.', ?, ?, 'Main Boardroom / Connects Video', 'PUBLIC', 'usr_marcus')
  `).run(workspaceId, startTime2.toISOString(), endTime2.toISOString());

  // 8. Notifications
  db.prepare(`
    INSERT INTO notifications (id, userId, workspaceId, type, title, message, link)
    VALUES ('notif_1', 'usr_alex', ?, 'MENTION', 'Sarah Chen mentioned you', 'Sarah Chen mentioned you in #development: "Tested it across multiple browser windows..."', '/workspace/ws_connects/channel/chan_development')
  `).run(workspaceId);

  db.prepare(`
    INSERT INTO notifications (id, userId, workspaceId, type, title, message, link)
    VALUES ('notif_2', 'usr_alex', ?, 'CALENDAR', 'Upcoming Team Meeting', 'Product Design & Architecture Review starts tomorrow at 10:00 AM', '/workspace/ws_connects/calendar')
  `).run(workspaceId);

  console.log('Connects database seeded successfully!');
}

// Auto-seed on first run
seedDatabase();
