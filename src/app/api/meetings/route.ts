import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const channelId = searchParams.get('channelId') || undefined;

    if (!workspaceId) return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });

    const activeMeeting = dbOps.getActiveMeeting(workspaceId, channelId);
    return NextResponse.json({ activeMeeting });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch active meeting' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { workspaceId, channelId, title } = body;

    if (!workspaceId) return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });

    const meetingId = `meet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const meeting = dbOps.createMeeting({
      id: meetingId,
      workspaceId,
      channelId,
      title: title || `${user.name}'s Meeting`,
      hostId: user.id
    });

    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to start meeting' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { meetingId } = await req.json();
    if (!meetingId) return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });

    dbOps.endMeeting(meetingId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to end meeting' }, { status: 500 });
  }
}
