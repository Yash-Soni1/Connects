import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbOps } from '@/lib/db';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: (result.error as any).issues?.[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const existing = dbOps.getUserByEmail(email);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Choose an initial avatar
    const avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;

    const user = dbOps.createUser({
      id: userId,
      name,
      email,
      passwordHash,
      avatarUrl
    });

    const token = await createSession(user.id);
    await setSessionCookie(token);

    // Check if there are any public workspaces or add to default Connects HQ
    const defaultWs = dbOps.getWorkspaceById('ws_connects');
    if (defaultWs) {
      try {
        dbOps.joinWorkspaceViaCode('CNX-7H2K9P', user.id);
      } catch (err) {
        console.warn('Could not auto-add to default workspace:', err);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status
      }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
