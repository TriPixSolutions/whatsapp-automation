import { getSessionSecret, validSessionPayload } from './token';
import crypto from 'crypto';
import { UserRole, UserStatus } from '@/types';

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  workspaceId: string;
  name?: string;
  exp?: number;
  iat?: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Sign a payload into a secure HMAC-SHA256 JWT
 */
export function signJwt(payload: SessionPayload, expiresInSeconds = 60 * 60 * 24 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const secret = getSessionSecret();
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64');
  const encodedSignature = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode an HMAC-SHA256 JWT
 */
export function verifyJwt(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const metadata = JSON.parse(base64UrlDecode(header));
    if (metadata.alg !== 'HS256' || metadata.typ !== 'JWT') return null;
    const expected = crypto.createHmac('sha256', getSessionSecret()).update(`${header}.${body}`).digest('base64url');
    const actualBytes = Buffer.from(signature);
    const expectedBytes = Buffer.from(expected);
    if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) return null;
    const payload = JSON.parse(base64UrlDecode(body));
    return validSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}
