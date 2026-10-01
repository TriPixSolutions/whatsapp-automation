import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import { UsersDB, UserRecord } from '@/lib/db';
import { getServerSession } from '@/lib/auth/session';

export interface AuthUserOptions {
  allowPending?: boolean;
}

/**
 * Robust server-side user authorization resolver.
 * Cryptographically verifies signed session token (pf_session_token) or Authorization header Bearer token.
 */
export async function getAuthorizedUser(
  requestOrOptions?: NextRequest | AuthUserOptions,
  maybeOptions?: AuthUserOptions
): Promise<UserRecord | null> {
  const req = requestOrOptions && 'headers' in requestOrOptions ? (requestOrOptions as NextRequest) : undefined;
  const options = (req ? maybeOptions : (requestOrOptions as AuthUserOptions)) || {};

  try {
    let sessionPayload: any = null;

    // 1. Check Authorization header: Bearer <jwt> or Request Cookie
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        sessionPayload = verifyJwt(token);
      }
      if (!sessionPayload && req.cookies) {
        const cookieToken = req.cookies.get('pf_session_token')?.value;
        if (cookieToken) {
          sessionPayload = verifyJwt(cookieToken);
        }
      }
    }

    // 2. Fall back to Next.js cookies() server store
    if (!sessionPayload) {
      try {
        sessionPayload = await getServerSession();
      } catch {
        // Context may be outside request store
      }
    }

    if (!sessionPayload?.userId) return null;
    const user = await UsersDB.getById(sessionPayload.userId, sessionPayload.workspaceId);
    if (!user || user.email !== sessionPayload.email) return null;
    const workspaceId = user.workspaceId || user.workspace_id;
    if (!workspaceId || workspaceId !== sessionPayload.workspaceId) return null;
    if (user.status === 'rejected' || (!options.allowPending && user.status !== 'approved')) return null;
    return user;
  } catch (error) {
    console.error('[auth-server] Error verifying authorization:', error);
    return null;
  }
}
