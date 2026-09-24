import { NextRequest, NextResponse } from 'next/server';
import { UsersDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { setSessionCookies } from '@/lib/auth/session';
import { SessionPayload } from '@/lib/auth/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Google OAuth callback handler.
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

    const { email, name, picture } = profile;

    // 3. Find or create user in database
    let user = UsersDB.getByEmail(email);

    if (!user) {
      user = UsersDB.create({
        email,
        name: name || email.split('@')[0],
        provider: 'google',
        avatarUrl: picture || undefined,
        status: 'approved',
        role: 'employee',
        company: '',
      });
    }

    const redirectTo = user.status === 'approved' ? '/dashboard' : '/pending';
    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      workspaceId: DEFAULT_WORKSPACE_ID,
    };

    setSessionCookies(response, sessionPayload);
    return response;
  } catch (err: any) {
    console.error('[Google OAuth Callback Error]', err.message);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login?error=google_failed`
    );
  }
}
