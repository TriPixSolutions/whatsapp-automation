// Unit regressions run with mocked I/O: no credentials, disk state or real messages.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');

function load(file, imports, env = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }}).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports,
    require(id) {
      if (Object.hasOwn(imports, id)) return imports[id];
      if (id === "crypto") return require("node:crypto");
      if (id === "@/lib/meta/config" || (id === "./config" && file.includes("/meta/"))) return { META_GRAPH_VERSION: require("../shared/meta-config.cjs").graphVersion(env) };
      throw new Error(`Unexpected dependency ${id} in ${file}`);
    },
    process: { env, cwd: () => '/isolated-test' },
    console: { log() {}, warn() {}, error() {} },
    setTimeout: () => 0, clearTimeout() {}, Buffer, URL,
  }, { filename: file });
  return module.exports;
}

function webhookHarness(env = {}) {
  const seen = new Set();
  const received = [], statuses = [];
  let fail = false, busy = false;
  const settings = { id: 'ws-a', phoneNumberId: 'phone-a', wabaId: 'waba-a', appSecret: 'secret' };
  const route = load('src/app/api/webhook/whatsapp/route.ts', {
    'next/server': { NextResponse },
    '@/lib/db': {
      DEFAULT_WORKSPACE_ID: 'default',
      SettingsDB: { getByPhoneNumberId: () => settings, getByWabaId: () => settings },
      WebhookEventsDB: {
        async claim(key) { if (busy) { busy = false; return { state: 'busy' }; } if (seen.has(key)) return { state: 'processed' }; seen.add(key); return { state: 'claimed', claimToken: key }; },
        async complete() {}, async fail(key) { seen.delete(key); },
      },
    },
    '@/lib/crypto': { verifyMetaSignature: (_body, signature) => signature === 'valid' },
    '@/lib/webhook/webhookVerification': { handleWebhookVerification() {} },
    '@/lib/webhook/webhookInbound': { async handleWebhookInboundMessages(messages) {
      if (fail) { fail = false; throw new Error('temporary failure'); }
      received.push(...messages);
    } },
    '@/lib/webhook/webhookStatus': { handleWebhookStatuses: items => statuses.push(...items) },
  }, env);
  return { received, statuses, failNext: () => { fail = true; }, busyNext: () => { busy = true; }, async post(value, signature = 'valid') {
    return route.POST(new NextRequest('https://example.test/api/webhook/whatsapp', {
      method: 'POST', headers: signature ? { 'x-hub-signature-256': signature } : {},
      body: JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: 'waba-a', changes: [{ value: {
        metadata: { phone_number_id: 'phone-a' }, ...value,
      }}] }] }),
    }));
  }};
}
const message = id => ({ id, from: '15550001111', type: 'text', text: { body: 'hi' } });

test('delivery states and batched messages are deduplicated individually', async () => {
  const h = webhookHarness();
  await h.post({ messages: [message('one'), message('two')] });
  await h.post({ messages: [message('one'), message('three')] });
  assert.deepEqual(h.received.map(m => m.id), ['one', 'two', 'three']);
  for (const status of ['sent', 'delivered', 'read', 'read']) {
    assert.equal((await h.post({ statuses: [{ id: 'outgoing', status }] })).status, 200);
  }
  assert.deepEqual(h.statuses.map(s => s.status), ['sent', 'delivered', 'read']);
});

test('failed webhook event can be retried', async () => {
  const h = webhookHarness(); h.failNext();
  assert.equal((await h.post({ messages: [message('retry')] })).status, 500);
  assert.equal((await h.post({ messages: [message('retry')] })).status, 200);
  assert.equal(h.received.length, 1);
});

test('an event already being processed asks Meta to retry instead of acknowledging it', async () => {
  const h = webhookHarness(); h.busyNext();
  assert.equal((await h.post({ messages: [message('busy')] })).status, 500);
  assert.equal(h.received.length, 0);
});

test('invalid signatures and unknown connections do not run automations', async () => {
  const h = webhookHarness();
  assert.equal((await h.post({ messages: [message('bad')] }, 'invalid')).status, 401);
  assert.equal((await h.post({ metadata: { phone_number_id: 'unknown' }, messages: [message('bad')] })).status, 404);
  assert.equal(h.received.length, 0);
  const production = webhookHarness({ NODE_ENV: 'production' });
  assert.equal((await production.post({}, '')).status, 401);
});

test('webhook verification accepts only configured token', async () => {
  const { handleWebhookVerification } = load('src/lib/webhook/webhookVerification.ts', {
    'next/server': { NextResponse }, '@/lib/db': { SettingsDB: { getByVerifyToken: async token => token === 'configured' ? { verifyToken: 'configured' } : null } },
  });
  for (const token of ['passion_fruit_verify_token_2025', 'apex_luxury_secret_token_2025', 'configured']) {
    const res = await handleWebhookVerification(new NextRequest(`https://example.test/?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=123`));
    assert.equal(res.status, token === 'configured' ? 200 : 403);
  }
});

test('missing live credentials fail instead of recording a sent message', async () => {
  const saved = [];
  const { WhatsAppMessageService } = load('src/lib/whatsapp/messageService.ts', {
    '@/lib/db': { DEFAULT_WORKSPACE_ID: 'default', SettingsDB: { get: () => ({}) },
      ContactsDB: { upsert: () => ({ id: 'contact' }) },
      MessagesDB: { create: msg => { saved.push(msg); return msg; } },
      ConversationsDB: { isWindowOpen: () => true, recordOutbound() {} },
    }, '@/lib/meta/api': {}, '@/lib/crypto': { decryptToken: v => v },
    './messageModel': {
      canonicalizeOutboundMessage: value => ({ ...value, bodyText: value.bodyText || value.text }),
      validateOutboundMessage: () => [],
      dbMessageType: kind => kind,
    },
  });
  const result = await WhatsAppMessageService.send({ to: '+15550001111', type: 'text', text: 'hello' });
  assert.equal(result.success, false);
  assert.equal(result.isSimulated, false);
  assert.equal(saved.length, 0);
  const simulation = await WhatsAppMessageService.send({ to: '+15550001111', type: 'text', text: 'hello', allowSimulation: true });
  assert.equal(simulation.isSimulated, true);
});

test('follow-up cancellation is confined to the replying workspace', async () => {
  const scheduled = [], cancelled = [];
  const { FollowUpEngine } = load('src/lib/followup/followupEngine.ts', {
    '@/lib/db': { DEFAULT_WORKSPACE_ID: 'default', ScheduledJobsDB: {
      async schedule(value) { scheduled.push(value); return { id: `${value.workspaceId}-job` }; },
      async cancelPending(phone, workspace) { cancelled.push([phone, workspace]); return 1; },
    } },
  });
  for (const workspaceId of ['a', 'b']) await FollowUpEngine.scheduleCustomFollowUp({
    workspaceId, phoneNumber: '+15550001111', interval: 1, unit: 'hours',
  });
  assert.equal(await FollowUpEngine.cancelPendingOnReply('+15550001111', 'a'), 1);
  assert.equal(await FollowUpEngine.cancelPendingOnReply('+15550001111', 'b'), 1);
  assert.deepEqual(cancelled, [['+15550001111', 'a'], ['+15550001111', 'b']]);
  assert.equal(scheduled.length, 2);
});

test('outgoing read receipts do not mark incoming messages as read', async () => {
  let updated = false;
  const { handleWebhookStatuses } = load('src/lib/webhook/webhookStatus.ts', {
    '@/lib/db': { MessagesDB: { updateStatus() { updated = true; } } },
    '@/lib/automations/testCenterStore': { TestCenterStore: { updateDeliveryStatus() {} } },
  });
  await handleWebhookStatuses([{ id: 'outgoing', status: 'read' }]);
  assert.equal(updated, true);
});

test('live nodes send interpolated text with policy enforcement; simulations never send', async () => {
  const sends = [];
  const { AdvancedWorkflowEngine } = load('src/lib/automations/advancedWorkflowEngine.ts', {
    './testCenterStore': { TestCenterStore: { recordDeliveryReceipt() {}, recordMetaLog() {} } },
    '@/lib/whatsapp/messageService': { WhatsAppMessageService: { async send(options) {
      sends.push(options); return { success: true, messageId: 'wamid.real' };
    }}},
    '@/lib/db': { SettingsDB: { get: () => ({ accessToken: 'live', phoneNumberId: 'phone' }) } },
    '@/lib/meta/api': {},
    '@/lib/whatsapp/messageModel': {
      messageFromWorkflowNode: node => ({ kind: 'text', text: node.config.text, bodyText: node.config.bodyText || node.config.text }),
      validateOutboundMessage: () => [],
    },
  });
  const node = { id: 'greeting', type: 'message', config: { text: 'Hi {{contact.firstName}}, {{offer}}' } };
  const context = { workspaceId: 'a', workflowId: 'wf', phoneNumber: '+15550001111' };
  await AdvancedWorkflowEngine.dispatchNodeMessage(node, context, { offer: 'welcome' }, { firstName: 'Asha' });
  assert.equal(sends[0].text, 'Hi Asha, welcome');
  assert.equal(sends[0].workspaceId, 'a');
  assert.equal(sends[0].requireRealDelivery, true);
  assert.equal(sends[0].bypassWindowCheck, undefined);
  await AdvancedWorkflowEngine.dispatchNodeMessage(node, { ...context, isTestSimulation: true }, {}, {});
  assert.equal(sends.length, 1);
});

test('a workspace with no workflows cannot run another workspace workflows', async () => {
  const values = new Map();
  const { TestCenterStore } = load('src/lib/automations/testCenterStore.ts', {
    '@/lib/db': { DEFAULT_WORKSPACE_ID: 'default' },
    '@/lib/db/workflows': {
      WorkflowsDB: {
        async save(value) { values.set(value.id, value); return value; },
        async list(workspaceId) { return [...values.values()].filter(value => value.workspaceId === workspaceId); },
        async get(id) { return values.get(id) || null; }, async delete() { return false; },
      },
      WorkflowSessionsDB: {}, WorkflowExecutionsDB: {},
    },
    fs: { existsSync: () => false, mkdirSync() {}, writeFileSync() {}, renameSync() {} }, path,
  });
  await TestCenterStore.saveWorkflow({ id: 'a-only', workspaceId: 'a', nodes: [], edges: [] });
  assert.equal((await TestCenterStore.listWorkflows('a')).length, 1);
  assert.equal((await TestCenterStore.listWorkflows('b')).length, 0);
  TestCenterStore.recordMetaLog({ id: 'meta-a', workspaceId: 'a' });
  TestCenterStore.recordMetaLog({ id: 'meta-b', workspaceId: 'b' });
  TestCenterStore.recordWebhookLog({ id: 'webhook-a', workspaceId: 'a' });
  TestCenterStore.recordWebhookLog({ id: 'webhook-b', workspaceId: 'b' });
  TestCenterStore.recordDeliveryReceipt({ id: 'delivery-a', workspaceId: 'a', metaMessageId: 'a' });
  TestCenterStore.recordDeliveryReceipt({ id: 'delivery-b', workspaceId: 'b', metaMessageId: 'b' });
  assert.equal(TestCenterStore.getMetaLogs('a').map(item => item.id).join(','), 'meta-a');
  assert.equal(TestCenterStore.getWebhookLogs('a').map(item => item.id).join(','), 'webhook-a');
  assert.equal(TestCenterStore.getDeliveryReceipts('a').map(item => item.id).join(','), 'delivery-a');
});

test('webhook adapter retains resolved workspace, live delivery and matching sender profile', async () => {
  const events = [];
  const { handleWebhookInboundMessages } = load('src/lib/webhook/webhookInbound.ts', {
    '@/lib/automations/normalizedEvent': load('src/lib/automations/normalizedEvent.ts', {}),
    '@/lib/db': { DEFAULT_WORKSPACE_ID: 'default' },
    '@/lib/automations/inboundDispatcher': { InboundAutomationDispatcher: { async dispatch(event) { events.push(event); return { success: true }; } } },
  });
  await handleWebhookInboundMessages([message('one')], [
    { wa_id: 'other', profile: { name: 'Wrong Person' } },
    { wa_id: '15550001111', profile: { name: 'Asha Kumar' } },
  ], 'workspace-a');
  assert.equal(events[0].workspaceId, 'workspace-a');
  assert.equal(events[0].isTestSimulation, false);
  assert.equal(events[0].metadata.firstName, 'Asha');
});
