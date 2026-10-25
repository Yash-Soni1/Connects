import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, maxUses, expiresDays } = await req.json();
    const member = dbOps.getWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const newCode = `CNX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    let expiresAt: string | null = null;
    if (expiresDays) {
      const d = new Date();
      d.setDate(d.getDate() + expiresDays);
      expiresAt = d.toISOString();
    }

    dbOps.raw.prepare(`
      INSERT INTO invitations (id, workspaceId, code, maxUses, usedCount, expiresAt, createdBy)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(id, workspaceId, newCode, maxUses || 100, expiresAt, user.id);

    const invitation = dbOps.getInvitationByCode(newCode);
    return NextResponse.json({ success: true, invitation });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create invite code' }, { status: 500 });
  }
}
