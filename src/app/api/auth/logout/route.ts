import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      dbOps.updatePresence(user.id, 'OFFLINE');
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
