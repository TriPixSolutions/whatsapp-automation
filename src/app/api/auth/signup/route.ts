import { NextResponse } from 'next/server';
import { UsersDB } from '@/lib/db';

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

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    // Check if user already exists
    let user = UsersDB.getByEmail(email);
    if (!user) {
      user = UsersDB.create({
        email,
        name: name || email.split('@')[0],
        company,
        provider: provider === 'google' ? 'google' : 'email',
        role: 'user',
        status: 'unrequested',
      });
    }

    const response = NextResponse.json({
      success: true,
      user,
      redirectTo: user.status === 'approved' ? '/dashboard' : '/welcome',
    });

    // Set secure session cookies
    response.cookies.set('pf_auth', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('pf_user_id', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('pf_status', user.status, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('pf_role', user.role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}
