import type { SessionPayload } from './jwt';

export function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error('Configure AUTH_SESSION_SECRET with at least 32 random characters');
  return secret;
}

export function validSessionPayload(payload: any): payload is SessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return Boolean(payload && typeof payload.userId === 'string' && payload.userId &&
    typeof payload.email === 'string' && payload.email &&
    typeof payload.workspaceId === 'string' && payload.workspaceId &&
    ['super_admin', 'owner', 'admin', 'manager', 'employee', 'user'].includes(payload.role) &&
    ['new_user', 'pending_approval', 'approved', 'rejected'].includes(payload.status) &&
    Number.isFinite(payload.exp) && payload.exp > now &&
    Number.isFinite(payload.iat) && payload.iat <= now + 60);
}

function decodePart(part: string): Uint8Array<ArrayBuffer> {
  const raw = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

// Web Crypto works in Next middleware's Edge runtime; no Node crypto imports.
export async function verifyEdgeSession(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const metadata = JSON.parse(new TextDecoder().decode(decodePart(header)));
    if (metadata.alg !== 'HS256' || metadata.typ !== 'JWT') return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(getSessionSecret()),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, decodePart(signature), new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodePart(body)));
    return validSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}
