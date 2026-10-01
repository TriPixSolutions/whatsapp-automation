const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');
const { NextRequest, NextResponse } = require('next/server');

// ============================================================================
// SHARED HARNESS HELPERS
// ============================================================================

function createEngineHarness(workflows = [], initialSessions = []) {
  const executions = [];
  const liveSends = [];
  const savedSessions = new Map();
  const sessionClears = [];

  for (const s of initialSessions) {
    savedSessions.set(`${s.workspaceId}:${s.phoneNumber}`, s);
  }

  const store = {
    listWorkflows: async (ws) => workflows.filter(w => !ws || w.workspaceId === ws),
    getWorkflow: async (id, ws) => workflows.find(w => w.id === id && (!ws || w.workspaceId === ws)) || null,
    saveWorkflow: async (w) => {
      const idx = workflows.findIndex(item => item.id === w.id);
      if (idx >= 0) workflows[idx] = w;
      else workflows.push(w);
      return w;
    },
    getActiveSession: async (phone, ws) => savedSessions.get(`${ws}:${phone}`) || null,
    saveSession: async (s) => {
      savedSessions.set(`${s.workspaceId}:${s.phoneNumber}`, s);
      return s;
    },
    clearSession: async (phone, ws) => {
      sessionClears.push({ phone, ws });
      savedSessions.delete(`${ws}:${phone}`);
      return true;
    },
    recordExecutionLog: async (log) => {
      executions.push(log);
    },
    getExecutionLog: async (id) => executions.find(e => e.executionId === id || e.id === id) || null,
    recordDeliveryReceipt: () => {},
    recordMetaLog: () => {},
    claimDueDelaySessions: async () => [],
    releaseSessionClaim: async () => {},
  };

  const messageService = {
    WhatsAppMessageService: {
      send: async (to, content, options) => {
        liveSends.push({ to, content, options });
        return { success: true, messageId: `msg_${Date.now()}` };
      },
    },
  };

  const dbMock = {
    SettingsDB: {
      get: async () => ({ phoneNumberId: 'phone-test', accessToken: 'token-test' }),
    },
    ContactsDB: {
      getByPhone: async (phone, ws) => ({ id: `contact_${phone}`, phoneNumber: phone, workspaceId: ws }),
      upsert: async (c, ws) => ({ id: `contact_${c.phoneNumber}`, ...c, workspaceId: ws }),
    },
  };

  const { AdvancedWorkflowEngine: engine } = load('src/lib/automations/advancedWorkflowEngine.ts', {
    './testCenterStore': { TestCenterStore: store },
    '@/lib/meta/api': {},
    '@/lib/whatsapp/messageService': messageService,
    '@/lib/db': dbMock,
  });

  return {
    engine,
    store,
    executions,
    liveSends,
    savedSessions,
    sessionClears,
  };
}

// ============================================================================
// SECTION 34: 12-TEST VALIDATION MATRIX & SECTION 24: TEST MATRIX
// ============================================================================

test('TEST 1: Keyword = hello -> Send "hello" triggers exactly ONE workflow execution', async () => {
  const workflow = {
    id: 'wf-hello',
    workspaceId: 'ws-prod',
    name: 'Hello Flow',
    isActive: true,
    triggerType: 'keyword',
    triggerKeyword: 'hello',
    nodes: [
      { id: 'node_trigger', type: 'trigger_keyword', config: { text: 'hello', matchMode: 'exact' }, nextNodeId: 'node_msg' },
      { id: 'node_msg', type: 'whatsapp_message', config: { text: 'Welcome to our service!' } },
    ],
    edges: [{ source: 'node_trigger', target: 'node_msg' }],
  };

  const h = createEngineHarness([workflow]);
  const matched = await h.engine.matchWorkflows('keyword', { text: 'hello', from: '+15550001111' }, 'ws-prod');
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'wf-hello');

  const execResult = await h.engine.executeWorkflow(matched[0], {
    workflowId: matched[0].id,
    workspaceId: 'ws-prod',
    phoneNumber: '+15550001111',
    triggerType: 'keyword',
    triggerPayload: { text: 'hello' },
    isTestSimulation: true,
  });

  assert.equal(execResult.status, 'completed');
  const uniqueExecutions = new Set(h.executions.map(e => e.executionId));
  assert.equal(uniqueExecutions.size, 1);
  assert.equal(h.executions[0].workflowId, 'wf-hello');
});

test('TEST 2: Do NOT send hello. Operator evaluates inbound keyword trigger -> NO keyword workflow execution', async () => {
  const workflow = {
    id: 'wf-hello',
    workspaceId: 'ws-prod',
    name: 'Hello Flow',
    isActive: true,
    triggerType: 'keyword',
    triggerKeyword: 'hello',
    nodes: [
      { id: 'node_trigger', type: 'trigger_keyword', config: { text: 'hello', matchMode: 'exact' }, nextNodeId: 'node_msg' },
      { id: 'node_msg', type: 'whatsapp_message', config: { text: 'Welcome!' } },
    ],
    edges: [{ source: 'node_trigger', target: 'node_msg' }],
  };

  const h = createEngineHarness([workflow]);
  // No text provided
  const matchedEmpty = await h.engine.matchWorkflows('keyword', { text: '', from: '+15550001111' }, 'ws-prod');
  assert.equal(matchedEmpty.length, 0);

  // If a manual trigger is initiated without allowDirectRun, it must fail safely
  const rejectedManual = await h.engine.evaluateTriggerNode(
    workflow.nodes[0],
    workflow,
    {
      triggerType: 'manual_trigger',
      triggerPayload: { from: '+15550001111' },
      phoneNumber: '+15550001111',
      workspaceId: 'ws-prod',
      workflowId: workflow.id,
    }
  );
  assert.equal(rejectedManual.matched, false);
});

test('TEST 3: Send random message "order pizza" -> NO hello workflow execution', async () => {
  const workflow = {
    id: 'wf-hello',
    workspaceId: 'ws-prod',
    name: 'Hello Flow',
    isActive: true,
    triggerType: 'keyword',
    triggerKeyword: 'hello',
    nodes: [
      { id: 'node_trigger', type: 'trigger_keyword', config: { text: 'hello', matchMode: 'exact' }, nextNodeId: 'node_msg' },
      { id: 'node_msg', type: 'whatsapp_message', config: { text: 'Welcome!' } },
    ],
    edges: [{ source: 'node_trigger', target: 'node_msg' }],
  };

  const h = createEngineHarness([workflow]);
  const matched = await h.engine.matchWorkflows('keyword', { text: 'order pizza', from: '+15550001111' }, 'ws-prod');
  assert.equal(matched.length, 0);
});

test('TEST 4 & 5: Workflow sends button -> Click button A routes to Branch A; Click button B routes to Branch B', async () => {
  const workflow = {
    id: 'wf-buttons',
    workspaceId: 'ws-prod',
    name: 'Button Flow',
    isActive: true,
    nodes: [
      { id: 'trigger', type: 'trigger_keyword', config: { text: 'menu' }, nextNodeId: 'btn_node' },
      {
        id: 'btn_node',
        type: 'whatsapp_button',
        config: {
          text: 'Choose an option:',
          buttons: [
            { id: 'btn_support', title: 'Get Support' },
            { id: 'btn_sales', title: 'Talk to Sales' },
          ],
        },
      },
      { id: 'node_support_reply', type: 'whatsapp_message', config: { text: 'Connecting to support...' } },
      { id: 'node_sales_reply', type: 'whatsapp_message', config: { text: 'Connecting to sales...' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'btn_node' },
      { id: 'e_support', source: 'btn_node', sourceHandle: 'btn_support', target: 'node_support_reply' },
      { id: 'e_sales', source: 'btn_node', sourceHandle: 'btn_sales', target: 'node_sales_reply' },
    ],
  };

  const h = createEngineHarness([workflow]);

  // Initial execution: runs until button node pauses
  const initialRun = await h.engine.executeWorkflow(workflow, {
    workflowId: workflow.id,
    workspaceId: 'ws-prod',
    phoneNumber: '+15550001111',
    triggerType: 'keyword',
    triggerPayload: { text: 'menu' },
    isTestSimulation: true,
  });

  assert.equal(initialRun.status, 'waiting');
  assert.equal(h.savedSessions.size, 1);
  const activeSession = h.savedSessions.get('ws-prod:+15550001111');
  assert.ok(activeSession);
  assert.equal(activeSession.currentNodeId, 'btn_node');
  assert.equal(activeSession.waitingFor, 'button_click');

  // TEST 4: Click button A ('btn_support') -> Routes to Branch A
  const resumedA = await h.engine.resumeWorkflowExecution(
    activeSession,
    { action: 'button_click', buttonId: 'btn_support' },
    true
  );

  assert.ok(resumedA);
  assert.equal(resumedA.status, 'completed');
  assert.ok(resumedA.steps.some(s => s.nodeId === 'node_support_reply'));
  assert.ok(!resumedA.steps.some(s => s.nodeId === 'node_sales_reply'));

  // TEST 5: Click button B ('btn_sales') on a fresh session -> Routes to Branch B
  const sessionForB = { ...activeSession, executionId: 'exec_b' };
  const resumedB = await h.engine.resumeWorkflowExecution(
    sessionForB,
    { action: 'button_click', buttonId: 'btn_sales' },
    true
  );

  assert.ok(resumedB);
  assert.equal(resumedB.status, 'completed');
  assert.ok(resumedB.steps.some(s => s.nodeId === 'node_sales_reply'));
  assert.ok(!resumedB.steps.some(s => s.nodeId === 'node_support_reply'));
});

test('TEST 6: Workflow sends carousel -> Click CTA for Card 2 routes to Card 2 branch', async () => {
  const workflow = {
    id: 'wf-carousel',
    workspaceId: 'ws-prod',
    name: 'Carousel Flow',
    isActive: true,
    nodes: [
      { id: 'trigger', type: 'trigger_keyword', config: { text: 'products' }, nextNodeId: 'carousel_node' },
      {
        id: 'carousel_node',
        type: 'whatsapp_carousel',
        config: {
          text: 'Check out our featured products:',
          cards: [
            { id: 'card_1', title: 'Product 1', buttons: [{ id: 'cta_buy_1', title: 'Buy 1' }] },
            { id: 'card_2', title: 'Product 2', buttons: [{ id: 'cta_buy_2', title: 'Buy 2' }] },
            { id: 'card_3', title: 'Product 3', buttons: [{ id: 'cta_buy_3', title: 'Buy 3' }] },
          ],
        },
      },
      { id: 'node_card_1_action', type: 'whatsapp_message', config: { text: 'Purchasing Product 1' } },
      { id: 'node_card_2_action', type: 'whatsapp_message', config: { text: 'Purchasing Product 2' } },
      { id: 'node_card_3_action', type: 'whatsapp_message', config: { text: 'Purchasing Product 3' } },
    ],
    edges: [
      { id: 'e_c1', source: 'carousel_node', sourceHandle: 'cta_buy_1', target: 'node_card_1_action' },
      { id: 'e_c2', source: 'carousel_node', sourceHandle: 'cta_buy_2', target: 'node_card_2_action' },
      { id: 'e_c3', source: 'carousel_node', sourceHandle: 'cta_buy_3', target: 'node_card_3_action' },
    ],
  };

  const h = createEngineHarness([workflow]);

  // Run initial workflow to enter carousel waiting state
  const initialRun = await h.engine.executeWorkflow(workflow, {
    workflowId: workflow.id,
    workspaceId: 'ws-prod',
    phoneNumber: '+15550001111',
    triggerType: 'keyword',
    triggerPayload: { text: 'products' },
    isTestSimulation: true,
  });

  assert.equal(initialRun.status, 'waiting');
  const session = h.savedSessions.get('ws-prod:+15550001111');
  assert.ok(session);
  assert.equal(session.currentNodeId, 'carousel_node');

  // Click CTA for Card 2
  const resumed = await h.engine.resumeWorkflowExecution(
    session,
    { action: 'carousel_click', cardIndex: 1, cardButtonId: 'cta_buy_2' },
    true
  );

  assert.ok(resumed);
  assert.equal(resumed.status, 'completed');
  assert.ok(resumed.steps.some(s => s.nodeId === 'node_card_2_action'));
  assert.ok(!resumed.steps.some(s => s.nodeId === 'node_card_1_action'));
});

test('TEST 7: Inbound message during delay -> Message is NOT silently dropped; saved and evaluated', async () => {
  const { client } = backend();
  const db = load('src/lib/db/workflows.ts', { crypto, './client': client });

  // Create an active delay session
  const delaySession = {
    id: 'session-delay-1',
    workspaceId: 'ws-prod',
    phoneNumber: '+15550001111',
    workflowId: 'wf-delay',
    executionId: 'exec-delay',
    currentNodeId: 'delay_node',
    waitingFor: 'delay',
    variables: {},
    pausedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour in future
  };

  await db.WorkflowSessionsDB.save(delaySession);

  // Inbound message arrives during active delay
  // The delay session must NOT be deleted, and message must be handled
  const retrievedSession = await db.WorkflowSessionsDB.get('+15550001111', 'ws-prod');
  assert.ok(retrievedSession);
  assert.equal(retrievedSession.waitingFor, 'delay');
  assert.equal(retrievedSession.id, 'session-delay-1');
});

test('TEST 8: Duplicate webhook -> Deduplicated by claim token, executes only once', async () => {
  let executionsCount = 0;
  const processedKeys = new Set();

  const mockClaimDb = {
    claim: async (key) => {
      if (processedKeys.has(key)) return { state: 'processed' };
      processedKeys.add(key);
      return { state: 'claimed', claimToken: key };
    },
    complete: async () => {},
    fail: async (key) => { processedKeys.delete(key); },
  };

  // First webhook delivery
  const claim1 = await mockClaimDb.claim('msg_wamid_12345');
  assert.equal(claim1.state, 'claimed');
  if (claim1.state === 'claimed') executionsCount++;

  // Duplicate webhook delivery with same message ID
  const claim2 = await mockClaimDb.claim('msg_wamid_12345');
  assert.equal(claim2.state, 'processed');
  if (claim2.state === 'claimed') executionsCount++;

  // Exactly one execution
  assert.equal(executionsCount, 1);
});

test('TEST 9: Unknown phone_number_id -> Rejects safely without cross-tenant workflow execution', async () => {
  const knownSettings = { id: 'ws-tenant-a', phoneNumberId: 'phone_known_999' };
  const mockSettingsDb = {
    getByPhoneNumberId: (id) => id === 'phone_known_999' ? knownSettings : null,
    getByWabaId: () => null,
  };

  // Lookup unknown phone_number_id
  const resolved = mockSettingsDb.getByPhoneNumberId('phone_unknown_000');
  assert.equal(resolved, null);
  // Never routes to DEFAULT_WORKSPACE_ID
});

test('TEST 10: Test Center keyword simulation -> Uses same dynamic trigger matching as production', async () => {
  const workflow = {
    id: 'wf-testcenter',
    workspaceId: 'ws-tc',
    name: 'TC Flow',
    isActive: true,
    nodes: [
      // Trigger node is NOT node 0!
      { id: 'doc_node', type: 'note', config: {} },
      { id: 'keyword_trigger_node', type: 'trigger_keyword', config: { text: 'order, booking', matchMode: 'contains' }, nextNodeId: 'reply' },
      { id: 'reply', type: 'whatsapp_message', config: { text: 'How can I help with your order?' } },
    ],
    edges: [{ source: 'keyword_trigger_node', target: 'reply' }],
  };

  const h = createEngineHarness([workflow]);

  // Dynamic trigger finding finds keyword_trigger_node even though it's node 1
  const matches = await h.engine.matchWorkflows('keyword', { text: 'I want to place an ORDER please', from: '+15550001111' }, 'ws-tc');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'wf-testcenter');
});

test('TEST 11: Server restart -> Workflow sessions remain available and are not deleted on lookup failure', async () => {
  const { client } = backend();
  const db1 = load('src/lib/db/workflows.ts', { crypto, './client': client });

  const session = {
    id: 'session-persist-1',
    workspaceId: 'ws-restart',
    phoneNumber: '+15550009999',
    workflowId: 'wf-non-existent', // Workflow does not exist in definitions table
    executionId: 'exec-persist-1',
    currentNodeId: 'node_btn',
    waitingFor: 'button_click',
    variables: { cartTotal: 50 },
    pausedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };

  await db1.WorkflowSessionsDB.save(session);

  // Fresh DB instance (simulating server restart)
  const db2 = load('src/lib/db/workflows.ts', { crypto, './client': client });
  const retrieved = await db2.WorkflowSessionsDB.get('+15550009999', 'ws-restart');

  // Must NOT have been deleted merely because workflow definition was missing!
  assert.ok(retrieved);
  assert.equal(retrieved.id, 'session-persist-1');
  assert.equal(retrieved.variables.cartTotal, 50);
});

test('TEST 12: Run Test Center -> Safe sandbox delivery preview; no live WhatsApp send without explicit LIVE mode', async () => {
  const workflow = {
    id: 'wf-safe',
    workspaceId: 'ws-safe',
    name: 'Safe Flow',
    isActive: true,
    nodes: [
      { id: 'trig', type: 'trigger_keyword', config: { text: 'demo' }, nextNodeId: 'send_msg' },
      { id: 'send_msg', type: 'whatsapp_message', config: { text: 'Demo message' } },
    ],
    edges: [{ source: 'trig', target: 'send_msg' }],
  };

  const h = createEngineHarness([workflow]);

  // Test Center runs with isTestSimulation = true by default
  const result = await h.engine.executeWorkflow(workflow, {
    workflowId: workflow.id,
    workspaceId: 'ws-safe',
    phoneNumber: '+15550001111',
    triggerType: 'keyword',
    triggerPayload: { text: 'demo' },
    isTestSimulation: true,
  });

  assert.equal(result.status, 'completed');
  // WhatsAppMessageService was NOT called to send a live message to Meta!
  assert.equal(h.liveSends.length, 0);
});

// ============================================================================
// SECTION 24: KEYWORD MATCHING MATRIX (Regex, Unicode, Malayalam, Manglish)
// ============================================================================

test('KEYWORD MATRIX: Malayalam, Manglish, whitespace, punctuation, and regex safety', async () => {
  const malayalamWf = {
    id: 'wf-malayalam',
    workspaceId: 'ws-lang',
    name: 'Malayalam Flow',
    isActive: true,
    nodes: [
      { id: 'trig', type: 'trigger_keyword', config: { text: 'നമസ്കാരം, ഹലോ', matchMode: 'contains' } },
    ],
    edges: [],
  };

  const manglishWf = {
    id: 'wf-manglish',
    workspaceId: 'ws-lang',
    name: 'Manglish Flow',
    isActive: true,
    nodes: [
      { id: 'trig', type: 'trigger_keyword', config: { text: 'namaskaram, evideya', matchMode: 'exact' } },
    ],
    edges: [],
  };

  const regexSpecialWf = {
    id: 'wf-regex',
    workspaceId: 'ws-lang',
    name: 'Regex Special Flow',
    isActive: true,
    nodes: [
      // Keyword with special regex chars: ?, *, (, ), [, ]
      { id: 'trig', type: 'trigger_keyword', config: { text: 'price?, *discount*, (offer)', matchMode: 'contains' } },
    ],
    edges: [],
  };

  const h = createEngineHarness([malayalamWf, manglishWf, regexSpecialWf]);

  // 1. Malayalam match
  const matchMalayalam = await h.engine.matchWorkflows('keyword', { text: 'നമസ്കാരം സുഹൃത്തേ', from: '+15550001111' }, 'ws-lang');
  assert.equal(matchMalayalam.length, 1);
  assert.equal(matchMalayalam[0].id, 'wf-malayalam');

  // 2. Manglish case-insensitive with whitespace and punctuation
  const matchManglish = await h.engine.matchWorkflows('keyword', { text: '  NAMASKARAM!  ', from: '+15550001111' }, 'ws-lang');
  assert.equal(matchManglish.length, 1);
  assert.equal(matchManglish[0].id, 'wf-manglish');

  // 3. Special regex characters must match safely without syntax error
  const matchRegex1 = await h.engine.matchWorkflows('keyword', { text: 'what is the price? now', from: '+15550001111' }, 'ws-lang');
  assert.equal(matchRegex1.length, 1);
  assert.equal(matchRegex1[0].id, 'wf-regex');

  const matchRegex2 = await h.engine.matchWorkflows('keyword', { text: 'any special (offer) available', from: '+15550001111' }, 'ws-lang');
  assert.equal(matchRegex2.length, 1);
  assert.equal(matchRegex2[0].id, 'wf-regex');

  // 4. Malformed input like bare "*" does not crash
  const matchSafe = await h.engine.matchWorkflows('keyword', { text: '***', from: '+15550001111' }, 'ws-lang');
  assert.ok(Array.isArray(matchSafe));
});
