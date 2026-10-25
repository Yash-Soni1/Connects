import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, targetUserId } = await req.json();
    if (!workspaceId || !targetUserId) {
      return NextResponse.json({ error: 'Workspace ID and Target User ID are required' }, { status: 400 });
    }

    const dmId = dbOps.getOrCreateDirectMessage(workspaceId, user.id, targetUserId);
    return NextResponse.json({ success: true, dmId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create DM' }, { status: 500 });
  }
}
