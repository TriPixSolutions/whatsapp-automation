const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const { NextRequest, NextResponse } = require('next/server');

// ============================================================================
// META VALIDATION & DIAGNOSTICS TESTS
// ============================================================================

test('parseMetaGraphError parses code 190 application validation system error into actionable message', () => {
  const { parseMetaGraphError } = load('src/lib/meta/validation.ts', {
    axios: {},
    '@/lib/db': { SettingsDB: { get: async () => ({}) } },
  });

  // The exact error from user screenshot
  const rawMetaError = {
    response: {
      status: 400,
      data: {
        error: {
          message: 'Error validating application. Cannot get application info due to a system error.',
          type: 'OAuthException',
          code: 190,
          fbtrace_id: 'AEbgAJew3DuyuMEfO7qQ6b2',
        },
      },
    },
  };

  const parsed = parseMetaGraphError(rawMetaError, 'GET /subscriptions');
  assert.equal(parsed.code, 'META_APP_VALIDATION_ERROR');
  assert.equal(parsed.metaErrorCode, 190);
  assert.equal(parsed.fbTraceId, 'AEbgAJew3DuyuMEfO7qQ6b2');
  assert.ok(parsed.message.includes('Meta Application Validation Error (#190)'));
  assert.ok(parsed.message.includes('App ID and App Secret'));
});

test('parseMetaGraphError distinguishes standard token expiry from app validation failure', () => {
  const { parseMetaGraphError } = load('src/lib/meta/validation.ts', {
    axios: {},
    '@/lib/db': { SettingsDB: { get: async () => ({}) } },
  });

  const expiredTokenError = {
    response: {
      status: 401,
      data: {
        error: {
          message: 'Session has expired are you sure this is valid?',
          type: 'OAuthException',
          code: 190,
          error_subcode: 463,
          fbtrace_id: 'trace_123',
        },
      },
    },
  };

  const parsed = parseMetaGraphError(expiredTokenError, 'GET /me');
  assert.equal(parsed.code, 'META_TOKEN_EXPIRED');
  assert.equal(parsed.metaErrorCode, 190);
  assert.ok(parsed.message.includes('Token Expired (#190)'));
});

test('validateMetaConnection detects mismatch between entered App ID and token issuing App ID', async () => {
  const mockAxios = {
    get: async (url, config) => {
      if (url.includes('/debug_token')) {
        return {
          data: {
            data: {
              app_id: '999888777666', // Actual issuing App ID
              application: 'Live Production WhatsApp App',
              type: 'SYSTEM_USER',
              is_valid: true,
              scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
            },
          },
        };
      }
      if (url.includes('/1343260565532810')) {
        return {
          data: {
            id: '1343260565532810',
            display_phone_number: '+1 555-144-3801',
            verified_name: 'Verified Business',
            quality_rating: 'GREEN',
            code_verification_status: 'VERIFIED',
          },
        };
      }
      if (url.includes('/1637279114649156/subscribed_apps')) {
        return { data: { data: [{ id: '999888777666', name: 'Live Production WhatsApp App' }] } };
      }
      if (url.includes('/1637279114649156')) {
        return { data: { id: '1637279114649156', name: 'Official WABA' } };
      }
      throw new Error(`Unhandled URL: ${url}`);
    },
    post: async () => ({ data: { success: true } }),
  };

  const { validateMetaConnection } = load('src/lib/meta/validation.ts', {
    axios: mockAxios,
    '@/lib/db': { SettingsDB: { get: async () => ({}) } },
  });

  const diagnostics = await validateMetaConnection({
    accessToken: 'EAAG_valid_system_token',
    appId: '28933872952719615', // User entered mismatched App ID
    phoneNumberId: '1343260565532810',
    wabaId: '1637279114649156',
    verifyToken: 'tripix_verify_token_2026',
  });

  assert.equal(diagnostics.app.status, 'mismatch');
  assert.ok(diagnostics.app.error.includes('28933872952719615'));
  assert.ok(diagnostics.app.error.includes('999888777666'));
  assert.equal(diagnostics.token.status, 'valid');
  assert.equal(diagnostics.phoneNumber.status, 'verified');
  assert.equal(diagnostics.subscription.status, 'subscribed');
  assert.equal(diagnostics.webhook.status, 'verified');
});

test('validateMetaConnection verifies WABA subscription and webhook readiness', async () => {
  const mockAxios = {
    get: async (url) => {
      if (url.includes('/debug_token')) {
        return {
          data: {
            data: {
              app_id: '28933872952719615',
              application: 'WhatsApp SaaS App',
              type: 'SYSTEM_USER',
              is_valid: true,
              scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
            },
          },
        };
      }
      if (url.includes('/1343260565532810')) {
        return {
          data: {
            id: '1343260565532810',
            display_phone_number: '+1 555-144-3801',
            verified_name: 'Verified Business',
            quality_rating: 'GREEN',
            code_verification_status: 'VERIFIED',
          },
        };
      }
      if (url.includes('/1637279114649156/subscribed_apps')) {
        return { data: { data: [{ id: '28933872952719615', name: 'WhatsApp SaaS App' }] } };
      }
      if (url.includes('/1637279114649156')) {
        return { data: { id: '1637279114649156', name: 'Official WABA' } };
      }
      return { data: { id: 'app' } };
    },
    post: async () => ({ data: { success: true } }),
  };

  const { validateMetaConnection } = load('src/lib/meta/validation.ts', {
    axios: mockAxios,
    '@/lib/db': { SettingsDB: { get: async () => ({}) } },
  });

  const diagnostics = await validateMetaConnection({
    accessToken: 'EAAG_valid_system_token',
    appId: '28933872952719615',
    phoneNumberId: '1343260565532810',
    wabaId: '1637279114649156',
    verifyToken: 'tripix_verify_token_2026',
  });

  assert.equal(diagnostics.overallStatus, 'PASS');
  assert.equal(diagnostics.token.status, 'valid');
  assert.equal(diagnostics.phoneNumber.status, 'verified');
  assert.equal(diagnostics.waba.status, 'verified');
  assert.equal(diagnostics.permissions.status, 'verified');
  assert.equal(diagnostics.subscription.status, 'subscribed');
  assert.equal(diagnostics.webhook.status, 'verified');
});

test('meta-validate route returns structured diagnostics and clean error messages without raw system error', async () => {
  const mockDiagnostics = {
    overallStatus: 'PASS',
    app: { status: 'valid' },
    token: { status: 'valid', details: { scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'] } },
    business: { status: 'unconfigured' },
    waba: { status: 'verified', details: { id: 'waba-1' } },
    phoneNumber: { status: 'verified', details: { displayPhoneNumber: '+1 555-144-3801', verifiedName: 'Business' } },
    permissions: { status: 'verified' },
    webhook: { status: 'verified' },
    subscription: { status: 'subscribed' },
    timestamp: new Date().toISOString(),
  };

  const route = load('src/app/api/test-center/meta-validate/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => ({ id: 'usr-1', workspaceId: 'ws-1' }) },
    '@/lib/db': {
      WebhookEventsDB: { latestProcessedAt: async () => null },
      SettingsDB: {
        get: async () => ({
          accessToken: 'valid-token',
          phoneNumberId: '1343260565532810',
          wabaId: '1637279114649156',
          verifyToken: 'tripix_verify_token_2026',
        }),
      },
    },
    '@/lib/meta/validation': {
      validateMetaConnection: async () => mockDiagnostics,
      META_GRAPH_VERSION: 'v21.0',
    },
    '@/types/automations': {},
  });

  const response = await route.GET(new NextRequest('https://example.test/api/test-center/meta-validate'));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.valid, true);
  assert.equal(body.webhookActive, false);
  assert.equal(body.webhookHandshakeVerified, true);
  assert.equal(body.signedEventVerified, false);
  assert.ok(body.error);
  assert.equal(body.details.templateAvailable, undefined);
  assert.equal(body.details.qualityRating, 'UNKNOWN');
  assert.equal(body.diagnostics.token.status, 'valid');
  assert.equal(body.diagnostics.phoneNumber.status, 'verified');
  assert.equal(body.diagnostics.subscription.status, 'subscribed');
});


test('webhook active requires a fresh processed event and a valid signing secret', async () => {
  let processedAt = '2026-10-02T09:01:00Z';
  let appSecret = 'a'.repeat(32);
  const diagnostics = {
    app: { status: 'valid' }, business: { status: 'unconfigured' },
    token: { status: 'valid' }, phoneNumber: { status: 'verified' },
    waba: { status: 'verified' }, subscription: { status: 'subscribed' },
    webhook: { status: 'verified' }, permissions: { status: 'verified' },
    timestamp: '2026-10-02T09:02:00Z',
  };
  const route = load('src/app/api/test-center/meta-validate/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => ({ workspaceId: 'ws-1' }) },
    '@/lib/db': {
      SettingsDB: { get: async () => ({ accessToken: 'valid-token', phoneNumberId: 'phone-1', appSecret, updatedAt: '2026-10-02T09:00:00Z' }) },
      WebhookEventsDB: { latestProcessedAt: async (workspaceId) => { assert.equal(workspaceId, 'ws-1'); return processedAt; } },
    },
    '@/lib/meta/validation': { validateMetaConnection: async () => diagnostics, META_GRAPH_VERSION: 'v25.0' },
    '@/types/automations': {},
  });
  const check = async () => (await route.GET(new NextRequest('https://example.test/api/test-center/meta-validate'))).json();
  assert.equal((await check()).webhookActive, true);
  processedAt = '2026-10-02T08:59:00Z';
  assert.equal((await check()).webhookActive, false);
  processedAt = '2026-10-02T09:01:00Z';
  appSecret = 'invalid';
  assert.equal((await check()).webhookActive, false);
});
