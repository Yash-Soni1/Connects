import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const query = (searchParams.get('q') || '').trim();

    if (!workspaceId || !query) {
      return NextResponse.json({ channels: [], messages: [], members: [] });
    }

    const likeQuery = `%${query}%`;

    // Search Channels
    const channels = dbOps.raw.prepare(`
      SELECT c.* FROM channels c
      WHERE c.workspaceId = ? AND c.name LIKE ? AND (
        c.isPrivate = 0 OR 
        EXISTS(SELECT 1 FROM channel_members cm WHERE cm.channelId = c.id AND cm.userId = ?)
      )
      LIMIT 10
    `).all(workspaceId, likeQuery, user.id);

    // Search Members
    const members = dbOps.raw.prepare(`
      SELECT u.id, u.name, u.email, u.avatarUrl, p.status
      FROM workspace_members wm
      JOIN users u ON wm.userId = u.id
      LEFT JOIN presence p ON u.id = p.userId
      WHERE wm.workspaceId = ? AND (u.name LIKE ? OR u.email LIKE ?)
      LIMIT 10
    `).all(workspaceId, likeQuery, likeQuery);

    // Search Messages
    const messages = dbOps.raw.prepare(`
      SELECT m.*, u.name as senderName, u.avatarUrl as senderAvatar, c.name as channelName
      FROM messages m
      JOIN users u ON m.senderId = u.id
      LEFT JOIN channels c ON m.channelId = c.id
      WHERE m.workspaceId = ? AND m.content LIKE ?
      ORDER BY m.createdAt DESC
      LIMIT 20
    `).all(workspaceId, likeQuery);

    return NextResponse.json({ channels, members, messages });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
