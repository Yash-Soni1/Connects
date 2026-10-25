import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

const eventSchema = z.object({
  workspaceId: z.string(),
  title: z.string().min(2, 'Event title is required'),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  createVideoMeeting: z.boolean().optional(),
  privacy: z.enum(['PUBLIC', 'BUSY_ONLY', 'PRIVATE']).default('PUBLIC')
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });

    const events = dbOps.getCalendarEvents(workspaceId, user.id);
    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).issues?.[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const { workspaceId, title, description, startTime, endTime, location, createVideoMeeting, privacy } = result.data;
    const eventId = `cal_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let videoMeetingId: string | undefined = undefined;
    if (createVideoMeeting) {
      const meetingId = `meet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const meeting = dbOps.createMeeting({
        id: meetingId,
        workspaceId,
        title: `Meeting: ${title}`,
        hostId: user.id
      });
      videoMeetingId = meeting.id;
    }

    const event = dbOps.createCalendarEvent({
      id: eventId,
      workspaceId,
      title,
      description,
      startTime,
      endTime,
      location: location || (videoMeetingId ? 'Connects Video Room' : ''),
      videoMeetingId,
      privacy,
      createdBy: user.id
    });

    // Notify workspace members of calendar event
    const members = dbOps.getWorkspaceMembers(workspaceId) as any[];
    for (const m of members) {
      if (m.userId !== user.id) {
        dbOps.createNotification({
          userId: m.userId,
          workspaceId,
          type: 'CALENDAR',
          title: `New event: ${title}`,
          message: `${user.name} scheduled "${title}" starting ${new Date(startTime).toLocaleString()}`,
          link: `/workspace/${workspaceId}/calendar`
        });
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error('Error creating calendar event:', err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
