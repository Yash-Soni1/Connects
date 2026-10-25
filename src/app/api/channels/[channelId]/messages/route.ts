import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  attachments: z.array(z.any()).optional().default([]),
  replyToId: z.string().nullable().optional()
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelId } = await params;
    const channel = dbOps.getChannelById(channelId);
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const member = dbOps.getWorkspaceMember(channel.workspaceId, user.id);
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before') || undefined;

    const messages = dbOps.getChannelMessages(channelId, limit, before);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Error fetching channel messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelId } = await params;
    const channel = dbOps.getChannelById(channelId);
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const member = dbOps.getWorkspaceMember(channel.workspaceId, user.id);
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const body = await req.json();
    const result = messageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).issues?.[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const { content, attachments, replyToId } = result.data;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const message = dbOps.createMessage({
      id: messageId,
      workspaceId: channel.workspaceId,
      channelId,
      senderId: user.id,
      content,
      attachments,
      replyToId: replyToId || null
    });

    // Detect mentions like @Name
    const allMembers = dbOps.getWorkspaceMembers(channel.workspaceId) as any[];
    for (const m of allMembers) {
      if (m.userId !== user.id && content.toLowerCase().includes(`@${m.name.toLowerCase()}`)) {
        dbOps.createNotification({
          userId: m.userId,
          workspaceId: channel.workspaceId,
          type: 'MENTION',
          title: `${user.name} mentioned you`,
          message: `${user.name} mentioned you in #${channel.name}: "${content.slice(0, 100)}"`,
          link: `/workspace/${channel.workspaceId}/channel/${channel.id}`
        });
      }
    }

    // Detect reply notification
    if (replyToId) {
      const parentMsg = dbOps.raw.prepare('SELECT senderId FROM messages WHERE id = ?').get(replyToId) as any;
      if (parentMsg && parentMsg.senderId !== user.id) {
        dbOps.createNotification({
          userId: parentMsg.senderId,
          workspaceId: channel.workspaceId,
          type: 'REPLY',
          title: `${user.name} replied to your message`,
          message: `${user.name} in #${channel.name}: "${content.slice(0, 100)}"`,
          link: `/workspace/${channel.workspaceId}/channel/${channel.id}`
        });
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error('Error posting channel message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
