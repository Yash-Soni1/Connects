import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId } = await params;
    const member = dbOps.getWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const { targetUserId, newRole } = await req.json();
    if (!['ADMIN', 'MEMBER'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetMember = dbOps.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      return NextResponse.json({ error: 'Target member not found' }, { status: 404 });
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot modify workspace owner role' }, { status: 403 });
    }

    dbOps.raw.prepare(`
      UPDATE workspace_members SET role = ? WHERE workspaceId = ? AND userId = ?
    `).run(newRole, workspaceId, targetUserId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId } = await params;
    const member = dbOps.getWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetMember = dbOps.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 403 });
    }

    dbOps.raw.prepare('DELETE FROM workspace_members WHERE workspaceId = ? AND userId = ?').run(workspaceId, targetUserId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
