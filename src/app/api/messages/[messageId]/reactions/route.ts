import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    const body = await req.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    const result = dbOps.toggleReaction(messageId, user.id, emoji);
    return NextResponse.json({ success: true, ...result, userName: user.name });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
