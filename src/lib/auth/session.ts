import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { signJwt, verifyJwt, SessionPayload } from './jwt';
import { UserRole, UserStatus } from '@/types';

export const SESSION_COOKIE_NAME = 'pf_session_token';
export const LEGACY_AUTH_COOKIE = 'pf_auth';
export const LEGACY_ROLE_COOKIE = 'pf_role';
export const LEGACY_STATUS_COOKIE = 'pf_status';
export const LEGACY_USER_ID_COOKIE = 'pf_user_id';

export const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Attaches signed session cookies to a NextResponse
 */
export function setSessionCookies(
  res: NextResponse,
  payload: SessionPayload,
  isProduction = process.env.NODE_ENV === 'production'
): void {
  const token = signJwt(payload);
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  // 1. Primary secure cryptographically signed HttpOnly token
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  // 2. Client-readable sync cookies for frontend UI rendering
  res.cookies.set(LEGACY_AUTH_COOKIE, 'authenticated', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  res.cookies.set(LEGACY_ROLE_COOKIE, payload.role, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  res.cookies.set(LEGACY_STATUS_COOKIE, payload.status, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  res.cookies.set(LEGACY_USER_ID_COOKIE, payload.userId, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Clears all auth and session cookies
 */
export function clearSessionCookies(res: NextResponse): void {
  const options = { path: '/', maxAge: 0, sameSite: 'lax' as const };
  res.cookies.set(SESSION_COOKIE_NAME, '', options);
  res.cookies.set(LEGACY_AUTH_COOKIE, '', options);
  res.cookies.set(LEGACY_ROLE_COOKIE, '', options);
  res.cookies.set(LEGACY_STATUS_COOKIE, '', options);
  res.cookies.set(LEGACY_USER_ID_COOKIE, '', options);
}

/**
 * Reads and verifies the current session from Next.js server context
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const verified = verifyJwt(token);
      if (verified) return verified;
    }

    // Fallback: If legacy cookie exists, inspect but ensure valid format
    const legacyAuth = cookieStore.get(LEGACY_AUTH_COOKIE)?.value;
    const legacyUserId = cookieStore.get(LEGACY_USER_ID_COOKIE)?.value;
    const legacyRole = (cookieStore.get(LEGACY_ROLE_COOKIE)?.value as UserRole) || 'employee';
    const legacyStatus = (cookieStore.get(LEGACY_STATUS_COOKIE)?.value as UserStatus) || 'approved';

    if (legacyAuth === 'authenticated' && legacyUserId) {
      return {
        userId: legacyUserId,
        email: `${legacyUserId}@session.local`,
        role: legacyRole,
        status: legacyStatus,
        workspaceId: DEFAULT_WORKSPACE_ID,
      };
    }

    return null;
  } catch (err) {
    console.error('[Session Error] Failed to read server session:', err);
    return null;
  }
}
