import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const workspaces = dbOps.getUserWorkspaces(user.id);
    const settings = dbOps.getUserSettings(user.id);
    const presence = dbOps.getPresence(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status,
        customStatus: user.customStatus
      },
      workspaces,
      settings,
      presence
    });
  } catch (err: any) {
    console.error('Error fetching current user:', err);
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 });
  }
}
