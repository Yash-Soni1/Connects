import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await params;
    const workspace = dbOps.getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = dbOps.getWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 });
    }

    const members = dbOps.getWorkspaceMembers(workspaceId);
    const channels = dbOps.getWorkspaceChannels(workspaceId, user.id);
    const dms = dbOps.getUserDMs(workspaceId, user.id);
    const invitation = dbOps.getWorkspaceInvitation(workspaceId);
    const activeMeeting = dbOps.getActiveMeeting(workspaceId);

    return NextResponse.json({
      workspace,
      currentRole: member.role,
      members,
      channels,
      dms,
      invitation,
      activeMeeting
    });
  } catch (err: any) {
    console.error('Error fetching workspace:', err);
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { name, description, iconUrl } = body;

    const current = dbOps.getWorkspaceById(workspaceId);
    if (!current) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    dbOps.raw.prepare(`
      UPDATE workspaces
      SET name = ?, description = ?, iconUrl = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || current.name, description !== undefined ? description : current.description, iconUrl || current.iconUrl, workspaceId);

    return NextResponse.json({ success: true, workspace: dbOps.getWorkspaceById(workspaceId) });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
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
    const workspace = dbOps.getWorkspaceById(workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    if (workspace.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the workspace owner can delete this workspace' }, { status: 403 });
    }

    dbOps.raw.prepare('DELETE FROM workspaces WHERE id = ?').run(workspaceId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
