import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

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

    if (channel.isPrivate) {
      const isChannelMember = dbOps.raw.prepare('SELECT 1 FROM channel_members WHERE channelId = ? AND userId = ?').get(channelId, user.id);
      if (!isChannelMember && member.role !== 'OWNER' && member.role !== 'ADMIN') {
        return NextResponse.json({ error: 'This is a private channel' }, { status: 403 });
      }
    }

    const members = dbOps.raw.prepare(`
      SELECT u.id, u.name, u.avatarUrl, p.status, p.customStatus
      FROM channel_members cm
      JOIN users u ON cm.userId = u.id
      LEFT JOIN presence p ON u.id = p.userId
      WHERE cm.channelId = ?
    `).all(channelId);

    const activeMeeting = dbOps.getActiveMeeting(channel.workspaceId, channelId);

    return NextResponse.json({ channel, members, activeMeeting });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}

export async function DELETE(
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
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN' && channel.createdBy !== user.id)) {
      return NextResponse.json({ error: 'Permission denied to delete channel' }, { status: 403 });
    }

    if (channel.name === 'general') {
      return NextResponse.json({ error: 'Cannot delete default general channel' }, { status: 400 });
    }

    dbOps.raw.prepare('DELETE FROM channels WHERE id = ?').run(channelId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
