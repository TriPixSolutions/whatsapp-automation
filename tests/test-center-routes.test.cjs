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

test('carousel test sends normalized cards without assuming an unapproved template', async () => {
  let carouselOptions;
  const route = load('src/app/api/test-center/send-test/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => user },
    '@/lib/meta/api': { MetaWhatsAppClient: {
      sendCarouselTemplate: async value => { carouselOptions = value; return { success: true, messageId: 'wamid.carousel' }; },
    } },
    '@/lib/automations/testCenterStore': { TestCenterStore: { recordMetaLog() {}, recordDeliveryReceipt() {} } },
    '@/lib/db': {
      SettingsDB: { get: async () => ({ phoneNumberId: 'phone-a', accessToken: 'live-token' }) },
      ContactsDB: { upsert: async () => ({ id: 'contact-a' }) },
      MessagesDB: { create: async value => ({ id: 'message-a', ...value }) },
      ConversationsDB: { recordOutbound: async () => {} },
    },
    '@/types': {}, '@/types/automations': {},
  });
  const response = await route.POST(new Request('https://example.test/api/test-center/send-test', {
    method: 'POST', body: JSON.stringify({ type: 'carousel', phoneNumber: '+15550001111' }),
  }));
  assert.equal(response.status, 200);
  assert.equal(carouselOptions.templateName, undefined);
  assert.equal(carouselOptions.cards[0].title, 'Runner Pro Sneakers');
  assert.equal(carouselOptions.cards[0].buttons[0].id, 'buy_card_1');
});

function triggerRouteHarness(workflow, initialSession = null) {
  let session = initialSession;
  const executions = [], resumes = [];
  const engine = {
    matchWorkflows: async () => [workflow],
    executeWorkflow: async (_workflow, context) => {
      executions.push(context);
      session = {
        id: 'session-a', workspaceId: user.workspaceId, phoneNumber: '+15550001111',
        workflowId: workflow.id, executionId: 'execution-a', currentNodeId: 'buttons',
        waitingFor: 'button_click', pausedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(),
      };
      return { id: 'execution-a', executionId: 'execution-a', status: 'waiting', steps: [] };
    },
    resumeWorkflowExecution: async (_session, event, isSimulation) => {
      resumes.push({ event, isSimulation });
      if (event.action === 'button_click' && workflow.nodes.some(node => ['carousel', 'whatsapp_carousel'].includes(node.type))) {
        session = { ...session, currentNodeId: 'wait', waitingFor: 'reply' };
        return { id: 'execution-a', status: 'waiting', steps: [] };
      }
      session = null;
      return { id: 'execution-a', status: 'completed', steps: [] };
    },
  };
  const route = load('src/app/api/test-center/simulate-trigger/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => user },
    '@/lib/automations/advancedWorkflowEngine': { AdvancedWorkflowEngine: engine },
    '@/lib/automations/testCenterStore': { TestCenterStore: {
      getActiveSession: async () => session,
      clearSession: async () => { session = null; return true; },
      getWorkflow: async id => id === workflow.id ? workflow : null,
      listWorkflows: async () => [workflow],
      recordButtonEvent() {}, recordCarouselEvent() {}, recordWebhookLog() {},
    } },
    '@/lib/db': {
      ContactsDB: { upsert: async () => ({ id: 'contact-a' }) },
      MessagesDB: { create: async () => ({ id: 'message-a' }) },
      ConversationsDB: { recordInbound: async () => {} },
    },
    '@/types/automations': {},
  });
  return { route, executions, resumes };
}

test('keyword and workflow tests use real engine delivery instead of forced simulation', async () => {
  const workflow = { id: 'workflow-a', workspaceId: user.workspaceId, name: 'Keyword', isActive: true,
    triggerType: 'keyword', triggerKeyword: 'hello', nodes: [{ id: 'trigger', type: 'trigger_keyword', config: { text: 'hello' } }], edges: [] };
  const h = triggerRouteHarness(workflow);
  const response = await h.route.POST(new Request('https://example.test/api/test-center/simulate-trigger', {
    method: 'POST', body: JSON.stringify({ simulationType: 'keyword_trigger', workflowId: workflow.id, phoneNumber: '+15550001111', text: 'hello', isSandbox: true }),
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.deliveryMode, 'test_recipient');
  assert.equal(h.executions[0].isTestSimulation, false);
});

test('standalone button click prepares and resumes the selected workflow', async () => {
  const workflow = { id: 'workflow-buttons', workspaceId: user.workspaceId, name: 'Buttons', isActive: true,
    nodes: [
      { id: 'trigger', type: 'trigger_keyword', config: { text: 'hello' } },
      { id: 'buttons', type: 'whatsapp_button', config: { buttons: [{ id: 'btn_catalog', title: 'Browse Catalog' }] } },
    ], edges: [{ id: 'edge-a', source: 'buttons', sourceHandle: 'btn_catalog', target: 'end' }] };
  const h = triggerRouteHarness(workflow);
  const response = await h.route.POST(new Request('https://example.test/api/test-center/simulate-trigger', {
    method: 'POST', body: JSON.stringify({ simulationType: 'button_click', workflowId: workflow.id, phoneNumber: '+15550001111', buttonId: 'btn_catalog' }),
  }));
  assert.equal(response.status, 200);
  assert.equal(h.executions.length, 1);
  assert.equal(h.resumes[0].event.action, 'button_click');
  assert.equal(h.resumes[0].isSimulation, false);
});

test('standalone carousel click follows the carousel branch before resuming selection', async () => {
  const workflow = { id: 'workflow-carousel', workspaceId: user.workspaceId, name: 'Carousel', isActive: true,
    nodes: [
      { id: 'trigger', type: 'trigger_keyword', config: { text: 'hello' } },
      { id: 'buttons', type: 'whatsapp_button', config: { buttons: [{ id: 'btn_catalog', title: 'Browse Catalog' }] } },
      { id: 'carousel', type: 'whatsapp_carousel', config: { cards: [] }, nextNodeId: 'wait' },
      { id: 'wait', type: 'wait_for_reply', config: {} },
    ], edges: [
      { id: 'edge-a', source: 'buttons', sourceHandle: 'btn_catalog', label: 'Browse Catalog', target: 'carousel' },
      { id: 'edge-b', source: 'carousel', target: 'wait' },
    ] };
  const h = triggerRouteHarness(workflow);
  const response = await h.route.POST(new Request('https://example.test/api/test-center/simulate-trigger', {
    method: 'POST', body: JSON.stringify({ simulationType: 'carousel_click', workflowId: workflow.id, phoneNumber: '+15550001111', cardIndex: 0, cardButtonId: 'buy_shoes' }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(h.resumes.map(item => item.event.action), ['button_click', 'carousel_click']);
});
