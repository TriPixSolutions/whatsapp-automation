import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth flow using the project's cookie-based auth system.
 *
 * GET /api/auth/google         → Redirects user to Google's consent screen
 * GET /api/auth/google/callback → Handles the OAuth callback from Google
 *
 * This file is intentionally a stub that redirects to the actual handlers
 * while NextAuth is NOT used (project uses custom cookie-based RBAC).
 *
 * To fully enable Google OAuth:
 * 1. Create a Google Cloud project at https://console.cloud.google.com/
 * 2. Enable the "Google+ API" and "People API"
 * 3. Create OAuth 2.0 credentials (Web Application)
 * 4. Add http://localhost:3000/api/auth/google/callback to Authorized redirect URIs
 * 5. Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId === 'your-google-client-id-here') {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in .env.local' },
      { status: 501 }
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
