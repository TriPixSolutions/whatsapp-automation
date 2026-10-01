const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextResponse } = require('next/server');
const load = require('./load-ts.cjs');

const user = { id: 'user-a', workspaceId: 'workspace-a', email: 'owner@example.test' };

test('authenticated message sends ignore a request-supplied workspace', async () => {
  let options;
  const route = load('src/app/api/messages/send/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => user },
    '@/lib/whatsapp/messageService': { WhatsAppMessageService: { send: async value => {
      options = value;
      return { success: true, metaMessageId: 'wamid.real', phoneNumberIdUsed: 'phone-a' };
    } } },
  });
  const response = await route.POST(new Request('https://example.test/api/messages/send', {
    method: 'POST',
    body: JSON.stringify({ workspaceId: 'workspace-b', phoneNumber: '+15550001111', type: 'template', templateName: 'hello_world' }),
  }));
  assert.equal(response.status, 200);
  assert.equal(options.workspaceId, 'workspace-a');
});

test('test send persists a real Meta acceptance in the authenticated workspace', async () => {
  const calls = { messageWorkspaces: [], conversationWorkspaces: [] };
  let templateOptions;
  const route = load('src/app/api/test-center/send-test/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => user },
    '@/lib/meta/api': { MetaWhatsAppClient: {
      sendTemplate: async value => { templateOptions = value; return { success: true, messageId: 'wamid.real' }; },
    } },
    '@/lib/automations/testCenterStore': { TestCenterStore: {
      recordMetaLog() {}, recordDeliveryReceipt() {},
    } },
    '@/lib/db': {
      SettingsDB: { get: async () => ({ phoneNumberId: 'phone-a', accessToken: 'live-token' }) },
      ContactsDB: { upsert: async (_data, workspaceId) => ({ id: `contact-${workspaceId}` }) },
      MessagesDB: { create: async (_data, workspaceId) => {
        calls.messageWorkspaces.push(workspaceId);
        return { id: 'message-a', metaMessageId: 'wamid.real' };
      } },
      ConversationsDB: { recordOutbound: async (_phone, _contact, workspaceId) => {
        calls.conversationWorkspaces.push(workspaceId);
      } },
    },
    '@/types': {},
    '@/types/automations': {},
  }, { META_GRAPH_API_VERSION: 'v25.0' });
  const response = await route.POST(new Request('https://example.test/api/test-center/send-test', {
    method: 'POST',
    body: JSON.stringify({ type: 'template', phoneNumber: '+15550001111', templateName: 'hello_world' }),
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(templateOptions.components, undefined);
  assert.deepEqual(calls.messageWorkspaces, ['workspace-a']);
  assert.deepEqual(calls.conversationWorkspaces, ['workspace-a']);
});

test('test send reports Meta rejection and does not fabricate persistence', async () => {
  let persisted = false;
  const route = load('src/app/api/test-center/send-test/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => user },
    '@/lib/meta/api': { MetaWhatsAppClient: {
      sendText: async () => ({ success: false, error: 'Recipient not allowed', errorCode: 131030 }),
    } },
    '@/lib/automations/testCenterStore': { TestCenterStore: {} },
    '@/lib/db': {
      SettingsDB: { get: async () => ({ phoneNumberId: 'phone-a', accessToken: 'live-token' }) },
      ContactsDB: { upsert: async () => { persisted = true; } },
      MessagesDB: { create: async () => { persisted = true; } },
      ConversationsDB: {},
    },
    '@/types': {},
    '@/types/automations': {},
  });
  const response = await route.POST(new Request('https://example.test/api/test-center/send-test', {
    method: 'POST',
    body: JSON.stringify({ type: 'text', phoneNumber: '+15550001111', text: 'hello' }),
  }));
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.code, 131030);
  assert.equal(persisted, false);
});
