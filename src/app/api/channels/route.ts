import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

const channelSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(2, 'Channel name must be at least 2 characters'),
  topic: z.string().optional(),
  isPrivate: z.boolean().default(false)
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = channelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).issues?.[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const { workspaceId, name, topic, isPrivate } = result.data;
    const member = dbOps.getWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const channelId = `chan_${workspaceId}_${name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = dbOps.createChannel({
      id: channelId,
      workspaceId,
      name,
      topic,
      isPrivate,
      createdBy: user.id
    });

    return NextResponse.json({ success: true, channel });
  } catch (err: any) {
    console.error('Error creating channel:', err);
    return NextResponse.json({ error: err.message || 'Failed to create channel' }, { status: 500 });
  }
}
