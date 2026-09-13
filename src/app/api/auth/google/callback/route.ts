import { NextRequest, NextResponse } from 'next/server';
import { UsersDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Google OAuth callback handler.
 * Google redirects here with ?code=... after the user consents.
 * We exchange the code for an access token, fetch the user profile,
 * then create/update the user in the JSON DB and set auth cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login?error=google_denied`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }

    // 2. Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      throw new Error('Failed to fetch Google profile');
    }

    const { email, name, picture, sub: googleId } = profile;

    // 3. Find or create user in our JSON DB
    let user = UsersDB.getByEmail(email);

    if (!user) {
      // Create new user with status 'new_user', using real Google avatar
      user = UsersDB.create({
        email,
        name: name || email.split('@')[0],
        provider: 'google',
        avatarUrl: picture || undefined,
        status: 'new_user',
        role: 'user',
        company: '',
      });
    }
    // Existing users: use their stored record as-is (avatar already set at creation)

    // 4. Set auth cookies (same as email/password login)
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const redirectTo = user.status === 'approved' ? '/dashboard' : '/pending';

    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    response.cookies.set('pf_auth', 'authenticated', { path: '/', maxAge, sameSite: 'lax', httpOnly: false });
    response.cookies.set('pf_user_id', user.id, { path: '/', maxAge, sameSite: 'lax', httpOnly: false });
    response.cookies.set('pf_status', user.status, { path: '/', maxAge, sameSite: 'lax', httpOnly: false });
    response.cookies.set('pf_role', user.role, { path: '/', maxAge, sameSite: 'lax', httpOnly: false });

    return response;
  } catch (err: any) {
    console.error('[Google OAuth Callback Error]', err.message);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login?error=google_failed`
    );
  }
}
