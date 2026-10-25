import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = dbOps.getUserNotifications(user.id);
    const unreadCount = (dbOps.raw.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0').get(user.id) as any).count;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      dbOps.markAllNotificationsAsRead(user.id);
    } else if (notificationId) {
      dbOps.markNotificationAsRead(notificationId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
