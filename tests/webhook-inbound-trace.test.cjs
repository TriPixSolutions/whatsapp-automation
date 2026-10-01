const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
const crypto = require('crypto');

function load(file, imports, env = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    js,
    {
      module,
      exports: module.exports,
      require(id) {
        if (Object.hasOwn(imports, id)) return imports[id];
        throw new Error(`Unexpected dependency ${id} in ${file}`);
      },
      process: { env, cwd: () => '/isolated-test' },
      console: { log() {}, warn() {}, error() {} },
      setTimeout: () => 0,
      clearTimeout() {},
      Buffer,
      URL,
    },
    { filename: file }
  );
  return module.exports;
}

test('Webhook Pipeline: GET verification and POST signature validation', async () => {
  const settings = {
    id: 'bae1f76a-7f84-48f0-adf8-8d95ee223008',
    phoneNumberId: '1343260565532810',
    wabaId: '1637279114649156',
    appSecret: 'test_meta_app_secret_123',
    verifyToken: 'tripix_verify_token_2026',
  };

  const processedMessages = [];
  const route = load(
    'src/app/api/webhook/whatsapp/route.ts',
    {
      'next/server': { NextResponse },
      '@/lib/db': {
        DEFAULT_WORKSPACE_ID: 'bae1f76a-7f84-48f0-adf8-8d95ee223008',
        SettingsDB: {
          getByPhoneNumberId: async (id) => (id === '1343260565532810' ? settings : null),
          getByWabaId: async (id) => (id === '1637279114649156' ? settings : null),
        },
        WebhookEventsDB: {
          async claim(key) {
            return { state: 'claimed', claimToken: key };
          },
          async complete() {},
          async fail() {},
        },
      },
      '@/lib/crypto': {
        verifyMetaSignature: (rawBody, signature, secret) => {
          if (!signature || !secret) return false;
          const hmac = crypto.createHmac('sha256', secret);
          hmac.update(rawBody);
          const expected = 'sha256=' + hmac.digest('hex');
          return signature === expected;
        },
      },
      '@/lib/webhook/webhookVerification': {
        handleWebhookVerification(request) {
          const { searchParams } = new URL(request.url);
          const mode = searchParams.get('hub.mode');
          const token = searchParams.get('hub.verify_token');
          const challenge = searchParams.get('hub.challenge');
          if (mode === 'subscribe' && token === settings.verifyToken) {
            return new NextResponse(challenge, { status: 200 });
          }
          return new NextResponse('Forbidden', { status: 403 });
        },
      },
      '@/lib/webhook/webhookInbound': {
        async handleWebhookInboundMessages(messages, contacts, wsId) {
          processedMessages.push({ messages, contacts, wsId });
        },
      },
      '@/lib/webhook/webhookStatus': {
        async handleWebhookStatuses() {},
      },
    },
    { NODE_ENV: 'production' }
  );

  // 1. GET verification: correct token returns challenge with 200
  const getReq = new NextRequest(
    'https://example.test/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=tripix_verify_token_2026&hub.challenge=test_challenge_abc'
  );
  const getRes = await route.GET(getReq);
  assert.equal(getRes.status, 200);
  assert.equal(await getRes.text(), 'test_challenge_abc');

  // 2. GET verification: incorrect token returns 403
  const badGetReq = new NextRequest(
    'https://example.test/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_abc'
  );
  const badGetRes = await route.GET(badGetReq);
  assert.equal(badGetRes.status, 403);

  // 3. POST with valid signature and real phone_number_id "1343260565532810"
  const payload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1637279114649156',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551443801',
                phone_number_id: '1343260565532810',
              },
              contacts: [{ profile: { name: 'Rishal' }, wa_id: '919876543210' }],
              messages: [
                {
                  from: '919876543210',
                  id: 'wamid.test_001',
                  timestamp: '1727800000',
                  text: { body: 'hello' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      },
    ],
  });

  const validSig = 'sha256=' + crypto.createHmac('sha256', settings.appSecret).update(payload).digest('hex');

  const postReq = new NextRequest('https://example.test/api/webhook/whatsapp', {
    method: 'POST',
    headers: { 'x-hub-signature-256': validSig },
    body: payload,
  });

  const postRes = await route.POST(postReq);
  assert.equal(postRes.status, 200);
  const postData = await postRes.json();
  assert.equal(postData.received, true);
  assert.equal(processedMessages.length, 1);
  assert.equal(processedMessages[0].wsId, settings.id);
  assert.equal(processedMessages[0].messages[0].text.body, 'hello');

  // 4. POST with invalid signature returns 401
  const badSigReq = new NextRequest('https://example.test/api/webhook/whatsapp', {
    method: 'POST',
    headers: { 'x-hub-signature-256': 'sha256=invalid_hash' },
    body: payload,
  });
  const badSigRes = await route.POST(badSigReq);
  assert.equal(badSigRes.status, 401);

  // 5. POST with missing signature in production returns 401
  const noSigReq = new NextRequest('https://example.test/api/webhook/whatsapp', {
    method: 'POST',
    body: payload,
  });
  const noSigRes = await route.POST(noSigReq);
  assert.equal(noSigRes.status, 401);

  // 6. POST with unknown phone_number_id returns 404 (NO DEFAULT WORKSPACE FALLBACK)
  const unknownPhonePayload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1637279114649156',
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: 'unknown_999999999' },
              messages: [{ from: '919876543210', id: 'wamid.x', type: 'text', text: { body: 'hello' } }],
            },
          },
        ],
      },
    ],
  });
  const unknownSig = 'sha256=' + crypto.createHmac('sha256', settings.appSecret).update(unknownPhonePayload).digest('hex');
  const unknownReq = new NextRequest('https://example.test/api/webhook/whatsapp', {
    method: 'POST',
    headers: { 'x-hub-signature-256': unknownSig },
    body: unknownPhonePayload,
  });
  const unknownRes = await route.POST(unknownReq);
  assert.equal(unknownRes.status, 404);
});
