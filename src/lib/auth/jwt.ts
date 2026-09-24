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

function getJwtSecret(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'production_secure_tripix_jwt_secret_key_minimum_32_characters_long'
  );
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

  const secret = getJwtSecret();
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64');
  const encodedSignature = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode an HMAC-SHA256 JWT
 */
export function verifyJwt(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const secret = getJwtSecret();

  const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64');
  const normalizedExpected = expectedSignature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // Timing safe comparison
  const sigBuf = Buffer.from(encodedSignature);
  const expBuf = Buffer.from(normalizedExpected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Expired token
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
