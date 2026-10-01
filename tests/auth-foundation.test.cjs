const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { NextRequest, NextResponse } = require('next/server');
const load = require('./load-ts.cjs');
const env = { AUTH_SESSION_SECRET: 'test-only-secret-with-more-than-thirty-two-characters' };
const token = load('src/lib/auth/token.ts', {}, env);
const jwt = load('src/lib/auth/jwt.ts', { crypto, './token': token }, env);
const identity = { userId: 'user-a', email: 'a@example.test', role: 'owner', status: 'approved', workspaceId: 'a' };

test('Node and Edge verify signed sessions and reject tampering, expiry, and unsigned payloads', async () => {
  const signed = jwt.signJwt(identity);
  assert.equal(jwt.verifyJwt(signed).workspaceId, 'a');
  assert.equal((await token.verifyEdgeSession(signed)).workspaceId, 'a');
  const parts = signed.split('.');
  parts[1] = Buffer.from(JSON.stringify({ ...identity, workspaceId: 'b' })).toString('base64url');
  for (const bad of [parts.join('.'), 'header.payload.signature', jwt.signJwt(identity, -1)]) {
    assert.equal(jwt.verifyJwt(bad), null);
    assert.equal(await token.verifyEdgeSession(bad), null);
  }
});

test('middleware ignores forged compatibility cookies and protects previously open test APIs', async () => {
  const { middleware } = load('src/middleware.ts', { 'next/server': { NextResponse }, '@/lib/auth/token': token });
  const denied = await middleware(new NextRequest('https://example.test/api/test-center/send-test', {
    headers: { cookie: 'pf_auth=authenticated; pf_role=super_admin; pf_status=approved' },
  }));
  assert.equal(denied.status, 401);
  const allowed = await middleware(new NextRequest('https://example.test/api/automations', {
    headers: { cookie: `pf_session_token=${jwt.signJwt(identity)}` },
  }));
  assert.equal(allowed.headers.get('x-middleware-next'), '1');
});

test('server session ignores legacy cookies even when they name an administrator', async () => {
  const session = load('src/lib/auth/session.ts', {
    'next/headers': { cookies: async () => ({ get: name => ({ value: { pf_auth: 'authenticated', pf_user_id: 'admin', pf_role: 'super_admin' }[name] }) }) },
    './jwt': jwt,
  });
  assert.equal(await session.getServerSession(), null);
});

test('authorization checks persisted membership and rejects revoked owners and deleted users', async () => {
  let user = { ...identity, id: identity.userId };
  const { getAuthorizedUser } = load('src/lib/auth-server.ts', {
    '@/lib/auth/jwt': jwt,
    '@/lib/db': { UsersDB: { getById: async () => user } },
    '@/lib/auth/session': { getServerSession: async () => null },
  });
  const req = new NextRequest('https://example.test/', { headers: { authorization: `Bearer ${jwt.signJwt(identity)}` } });
  assert.equal((await getAuthorizedUser(req)).id, 'user-a');
  user = { ...user, workspaceId: 'b' };
  assert.equal(await getAuthorizedUser(req), null);
  user = { ...user, workspaceId: 'a', status: 'rejected' };
  assert.equal(await getAuthorizedUser(req), null);
  user = null;
  assert.equal(await getAuthorizedUser(req), null);
});

test('password hashing uses random salts and handles legacy and malformed hashes safely', () => {
  const passwords = load('src/lib/crypto.ts', { crypto });
  const first = passwords.hashPassword('correct password');
  const second = passwords.hashPassword('correct password');
  assert.notEqual(first, second);
  assert.equal(passwords.verifyPassword('correct password', first), true);
  assert.equal(passwords.verifyPassword('wrong password', first), false);
  assert.equal(passwords.verifyPassword('x', 'malformed'), false);
  const old = crypto.pbkdf2Sync('old', 'tripix_salt_2026', 10000, 64, 'sha512').toString('hex');
  assert.equal(passwords.verifyPassword('old', old), true);
});

test('email-only Google impersonation cannot create a login session', async () => {
  const route = load('src/app/api/auth/login/route.ts', {
    'next/server': { NextResponse }, '@/lib/db': {},
    '@/lib/auth/session': { setSessionCookies() { throw new Error('Must not sign session'); } },
    '@/lib/auth/publicUser': {},
  });
  const response = await route.POST(new Request('https://example.test/', {
    method: 'POST', body: JSON.stringify({ provider: 'google', email: 'victim@example.test' }),
  }));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('OAuth rejects a callback without matching state before exchanging tokens', async () => {
  const route = load('src/app/api/auth/google/callback/route.ts', {
    'next/server': { NextResponse }, '@/lib/db': {}, '@/lib/auth/session': {},
  });
  const response = await route.GET(new NextRequest('https://example.test/?code=stolen'));
  assert.equal(response.status, 400);
});

test('public user responses exclude both password hash field names', () => {
  const { publicUser } = load('src/lib/auth/publicUser.ts');
  const publicRecord = publicUser({ id: 'a', passwordHash: 'secret', password_hash: 'secret' });
  assert.equal(publicRecord.passwordHash, undefined);
  assert.equal(publicRecord.password_hash, undefined);
});

test('logout remains available after a session expires', async () => {
  const { middleware } = load('src/middleware.ts', { 'next/server': { NextResponse }, '@/lib/auth/token': token });
  const response = await middleware(new NextRequest('https://example.test/api/auth/logout', {
    method: 'POST', headers: { cookie: `pf_session_token=${jwt.signJwt(identity, -1)}` },
  }));
  assert.equal(response.headers.get('x-middleware-next'), '1');
});
