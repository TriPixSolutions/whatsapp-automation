import { NextResponse } from 'next/server';
import { UsersDB } from '@/lib/db';

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
          role: 'user',
          status: 'new_user',
        });
      }

      const redirectTo = user.status === 'approved' ? '/dashboard' : '/onboarding';
      const response = NextResponse.json({ success: true, user, redirectTo });

      response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_status', user.status, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_role', user.role, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      return response;
    }

    // 2. Email & Password Authentication (Database-driven, zero hardcoded credentials)
    if (!identifier) {
      return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 });
    }

    const cleanEmail = identifier.toLowerCase();
    const user = UsersDB.verifyCredentials(cleanEmail, password);

    if (!user) {
      // Check if user exists but wrong password, or if not found at all
      const existing = UsersDB.getByEmail(cleanEmail);
      if (existing) {
        return NextResponse.json({ error: 'Invalid password. Please verify your credentials.' }, { status: 401 });
      }

      // Auto-register new users upon first sign-in attempt if password provided
      if (password && password.length >= 4) {
        const newUser = UsersDB.create({
          email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@example.com`,
          name: identifier.split('@')[0],
          password,
          avatarUrl: body.avatarUrl || undefined,
          provider: 'email',
          role: 'user',
          status: 'new_user',
        });

        const response = NextResponse.json({
          success: true,
          user: newUser,
          redirectTo: '/onboarding',
        });

        response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
        response.cookies.set('pf_user_id', newUser.id, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
        response.cookies.set('pf_status', newUser.status, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
        response.cookies.set('pf_role', newUser.role, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
        return response;
      }

      return NextResponse.json({ error: 'User not found. Please sign up first.' }, { status: 401 });
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Your access request was rejected by an administrator.' }, { status: 403 });
    }

    // Role-based routing:
    // - Super Admin with approved status can go to super-admin-control or dashboard
    // - Approved users go directly to /dashboard
    // - New / Pending users go to /onboarding
    let redirectTo = '/onboarding';
    if (user.status === 'approved') {
      if (requestedRedirect && (user.role === 'super_admin' || !requestedRedirect.includes('super-admin'))) {
        redirectTo = requestedRedirect;
      } else {
        redirectTo = '/dashboard';
      }
    } else {
      redirectTo = '/onboarding';
    }

    const response = NextResponse.json({
      success: true,
      user,
      redirectTo,
    });

    response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
    response.cookies.set('pf_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
    response.cookies.set('pf_status', user.status, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
    response.cookies.set('pf_role', user.role, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
