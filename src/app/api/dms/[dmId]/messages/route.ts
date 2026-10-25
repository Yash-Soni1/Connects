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
  { params }: { params: Promise<{ dmId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dmId } = await params;
    const dm = dbOps.raw.prepare('SELECT * FROM direct_messages WHERE id = ?').get(dmId) as any;
    if (!dm) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const isParticipant = dbOps.raw.prepare('SELECT 1 FROM direct_message_participants WHERE directMessageId = ? AND userId = ?').get(dmId, user.id);
    if (!isParticipant) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const messages = dbOps.getDirectMessages(dmId);
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dmId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dmId } = await params;
    const dm = dbOps.raw.prepare('SELECT * FROM direct_messages WHERE id = ?').get(dmId) as any;
    if (!dm) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const isParticipant = dbOps.raw.prepare('SELECT 1 FROM direct_message_participants WHERE directMessageId = ? AND userId = ?').get(dmId, user.id);
    if (!isParticipant) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const body = await req.json();
    const result = messageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).issues?.[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const { content, attachments, replyToId } = result.data;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const message = dbOps.createMessage({
      id: messageId,
      workspaceId: dm.workspaceId,
      directMessageId: dmId,
      senderId: user.id,
      content,
      attachments,
      replyToId: replyToId || null
    });

    dbOps.raw.prepare('UPDATE direct_messages SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(dmId);

    // Notify other participant
    const otherParticipant = dbOps.raw.prepare(`
      SELECT userId FROM direct_message_participants WHERE directMessageId = ? AND userId != ?
    `).get(dmId, user.id) as any;

    if (otherParticipant) {
      dbOps.createNotification({
        userId: otherParticipant.userId,
        workspaceId: dm.workspaceId,
        type: 'DM',
        title: `New message from ${user.name}`,
        message: content.slice(0, 100),
        link: `/workspace/${dm.workspaceId}/dm/${dmId}`
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error('Error posting DM message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
