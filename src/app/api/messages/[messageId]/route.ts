import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    const message = dbOps.raw.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as any;
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    if (message.senderId !== user.id) {
      return NextResponse.json({ error: 'Only the sender can edit this message' }, { status: 403 });
    }

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    dbOps.raw.prepare(`
      UPDATE messages SET content = ?, isEdited = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `).run(content.trim(), messageId);

    const updated = dbOps.raw.prepare(`
      SELECT m.*, u.name as senderName, u.avatarUrl as senderAvatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `).get(messageId) as any;

    return NextResponse.json({ success: true, message: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    const message = dbOps.raw.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as any;
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const member = dbOps.getWorkspaceMember(message.workspaceId, user.id);
    const isSender = message.senderId === user.id;
    const isAdmin = member && (member.role === 'OWNER' || member.role === 'ADMIN');

    if (!isSender && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied to delete message' }, { status: 403 });
    }

    dbOps.raw.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
    return NextResponse.json({ success: true, messageId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
