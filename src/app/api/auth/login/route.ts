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
    const identifier = (body.emailOrUsername || body.email || body.username || '').trim();
    const password = typeof body.password === 'string' ? body.password : '';
    const provider = body.provider || 'email';
    const requestedRedirect = body.redirect || '';

    if (provider !== 'email') {
      return NextResponse.json({ error: 'Use /api/auth/google to sign in with Google.' }, { status: 400 });
    }

    // 2. Email & Password Authentication
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = identifier.toLowerCase();
    const user = await UsersDB.verifyCredentials(cleanEmail, password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials. Please verify your email and password.' }, { status: 401 });
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Your access request was rejected by an administrator.' }, { status: 403 });
    }

    let redirectTo = '/dashboard';
    if (user.status === 'approved') {
      if (typeof requestedRedirect === 'string' && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\') && !requestedRedirect.includes('admin') && !requestedRedirect.includes('super-admin') && !requestedRedirect.includes('pending')) {
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
      workspaceId: user.workspaceId || user.workspace_id || DEFAULT_WORKSPACE_ID,
    };

    const response = NextResponse.json({
      success: true,
      user: publicUser(user),
      redirectTo,
    });

    setSessionCookies(response, sessionPayload);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
