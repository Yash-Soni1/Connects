import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, bio, avatarUrl, customStatus, status } = body;

    const updated = dbOps.updateUserProfile(user.id, { name, bio, avatarUrl, customStatus });
    if (status) {
      dbOps.updatePresence(user.id, status, customStatus);
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
