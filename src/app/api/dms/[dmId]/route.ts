import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

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
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const participants = dbOps.raw.prepare(`
      SELECT u.id, u.name, u.email, u.avatarUrl, u.bio, p.status, p.customStatus
      FROM direct_message_participants dmp
      JOIN users u ON dmp.userId = u.id
      LEFT JOIN presence p ON u.id = p.userId
      WHERE dmp.directMessageId = ?
    `).all(dmId) as any[];

    const otherUser = participants.find(p => p.id !== user.id) || user;
    const activeMeeting = dbOps.getActiveMeeting(dm.workspaceId);

    return NextResponse.json({ dm, otherUser, participants, activeMeeting });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
