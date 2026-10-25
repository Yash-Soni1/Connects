import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { dbOps } from '@/lib/db';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  slug: z.string().optional(),
  iconUrl: z.string().optional(),
  description: z.string().optional()
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = dbOps.getUserWorkspaces(user.id);
    return NextResponse.json({ workspaces });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: (result.error as any).issues?.[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, iconUrl, description } = result.data;
    const slug = (result.data.slug || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')) + '-' + Math.random().toString(36).substring(2, 6);
    const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const workspace = dbOps.createWorkspace({
      id: workspaceId,
      name,
      slug,
      iconUrl: iconUrl || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80`,
      description,
      ownerId: user.id
    });

    return NextResponse.json({ success: true, workspace });
  } catch (err: any) {
    console.error('Error creating workspace:', err);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
