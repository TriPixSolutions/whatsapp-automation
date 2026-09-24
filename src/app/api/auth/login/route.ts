import { NextResponse } from 'next/server';
import { UsersDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { setSessionCookies } from '@/lib/auth/session';
import { SessionPayload } from '@/lib/auth/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.emailOrUsername || body.email || body.username || '').trim();
    const password = (body.password || '').trim();
    const provider = body.provider || 'email';
    const requestedRedirect = body.redirect || '';

    // 1. Google OAuth sign-in flow
    if (provider === 'google') {
      const email = identifier.toLowerCase() || `google.user.${Date.now()}@example.com`;
      let user = UsersDB.getByEmail(email);
      if (!user) {
        user = UsersDB.create({
          email,
          name: body.name || email.split('@')[0],
          avatarUrl: body.avatarUrl || body.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          provider: 'google',
          role: 'employee',
          status: 'approved',
        });
      }

      const redirectTo = user.status === 'approved' ? '/dashboard' : '/pending';
      const sessionPayload: SessionPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        workspaceId: DEFAULT_WORKSPACE_ID,
      };

      const response = NextResponse.json({ success: true, user, redirectTo });
      setSessionCookies(response, sessionPayload);
      return response;
    }

    // 2. Email & Password Authentication
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = identifier.toLowerCase();
    const user = UsersDB.verifyCredentials(cleanEmail, password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials. Please verify your email and password.' }, { status: 401 });
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Your access request was rejected by an administrator.' }, { status: 403 });
    }

    let redirectTo = '/pending';
    if (user.status === 'approved') {
      if (user.role === 'super_admin') {
        redirectTo = requestedRedirect || '/admin';
      } else if (requestedRedirect && !requestedRedirect.includes('admin') && !requestedRedirect.includes('super-admin')) {
        redirectTo = requestedRedirect;
      } else {
        redirectTo = '/dashboard';
      }
    }

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      workspaceId: DEFAULT_WORKSPACE_ID,
    };

    const response = NextResponse.json({
      success: true,
      user,
      redirectTo,
    });

    setSessionCookies(response, sessionPayload);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
