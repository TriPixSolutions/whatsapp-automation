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

    // 1. Google OAuth sign-in flow
    if (provider === 'google') {
      const email = identifier.toLowerCase() || `google.user.${Date.now()}@example.com`;
      let user = UsersDB.getByEmail(email);
      if (!user) {
        user = UsersDB.create({
          email,
          name: body.name || email.split('@')[0],
          provider: 'google',
          role: 'user',
          status: 'unrequested',
        });
      }

      const redirectTo = user.status === 'approved' ? '/dashboard' : '/welcome';
      const response = NextResponse.json({ success: true, user, redirectTo });
      
      response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_status', user.status, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_role', user.role, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      return response;
    }

    // 2. Check Super Admin test credentials: User 1 / 0725
    const cleanUser = identifier.toLowerCase();
    const isSuperAdminUser = cleanUser === 'user 1' || cleanUser === 'user1' || cleanUser === 'admin' || cleanUser === 'admin@passionfruit.io';
    const isSuperAdminPass = password === '0725';

    if (isSuperAdminUser && isSuperAdminPass) {
      let adminUser = UsersDB.getByEmail('admin@passionfruit.io');
      if (!adminUser) {
        adminUser = UsersDB.create({
          email: 'admin@passionfruit.io',
          name: 'User 1 (Super Admin)',
          role: 'super_admin',
          status: 'approved',
          provider: 'email',
          company: 'Passion Fruit Global HQ',
        });
      }

      const response = NextResponse.json({
        success: true,
        user: adminUser,
        redirectTo: '/dashboard',
      });

      response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_user_id', adminUser.id, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_status', 'approved', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_role', 'super_admin', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      return response;
    }

    // 3. Regular email lookup
    if (!identifier) {
      return NextResponse.json({ error: 'Username or email is required.' }, { status: 400 });
    }

    const user = UsersDB.getByEmail(cleanUser);
    if (!user) {
      // Auto-register as new user with unrequested access
      const newUser = UsersDB.create({
        email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@example.com`,
        name: identifier,
        provider: 'email',
        role: 'user',
        status: 'unrequested',
      });

      const response = NextResponse.json({
        success: true,
        user: newUser,
        redirectTo: '/welcome',
      });

      response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_user_id', newUser.id, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_status', newUser.status, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      response.cookies.set('pf_role', newUser.role, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
      return response;
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Your access request was rejected by an administrator.' }, { status: 403 });
    }

    const redirectTo = user.status === 'approved' ? '/dashboard' : '/welcome';

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
