import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

const joinSchema = z.object({
  code: z.string().min(4, 'Please enter a valid invitation code')
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = joinSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid invitation code format' }, { status: 400 });
    }

    const cleanCode = result.data.code.trim().toUpperCase();
    const workspace = dbOps.joinWorkspaceViaCode(cleanCode, user.id);

    return NextResponse.json({ success: true, workspace });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to join workspace' }, { status: 400 });
  }
}
