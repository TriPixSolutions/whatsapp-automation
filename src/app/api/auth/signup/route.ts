import { randomUUID } from 'crypto';
import { publicUser } from '@/lib/auth/publicUser';
import { NextResponse } from 'next/server';
import { UsersDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { setSessionCookies } from '@/lib/auth/session';
import { SessionPayload } from '@/lib/auth/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const name = (body.name || '').trim();
    const company = (body.company || '').trim();
    const provider = body.provider || 'email';

    if (provider !== 'email') return NextResponse.json({ error: 'Use Google OAuth to sign up with Google.' }, { status: 400 });

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (provider === 'email' && (!password || password.length < 6)) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Check if user already exists
    const avatarUrl = (body.avatarUrl || body.picture || '').trim();
    let user = await UsersDB.getByEmail(email);

    if (user) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
    }

    user = await UsersDB.create({
      email,
      workspaceId: randomUUID(),
      password,
      name: name || email.split('@')[0],
      avatarUrl: avatarUrl || undefined,
      company,
      provider: provider === 'google' ? 'google' : 'email',
      role: 'owner', // Initial creator is workspace owner
      status: 'approved',
    });

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      workspaceId: user.workspaceId!,
    };

    const response = NextResponse.json({
      success: true,
      user: publicUser(user),
      redirectTo: '/dashboard',
    });

    setSessionCookies(response, sessionPayload);
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}
