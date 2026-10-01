const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const load = require('./load-ts.cjs');
const { NextRequest, NextResponse } = require('next/server');
const session = (ws, waitingFor = 'delay', time = Date.now() - 1000) => ({
  id: `session-${ws}`, workspaceId: ws, phoneNumber: '+15550001111', workflowId: `wf-${ws}`,
  executionId: `exec-${ws}`, currentNodeId: 'delay', waitingFor, variables: {},
  pausedAt: new Date(Date.now() - 10000).toISOString(), expiresAt: new Date(time).toISOString(),
});

function engineHarness() {
  const sessions = []; let cleared = 0;
  const workflow = { id: 'wf-a', workspaceId: 'a', isActive: true, name: 'Delay flow', nodes: [
    { id: 'delay', type: 'delay', title: 'Delay', config: { delayAmount: 1, delayUnit: 'days' }, nextNodeId: 'end' },
    { id: 'end', type: 'end', title: 'Done', config: {} },
  ], edges: [{ source: 'delay', target: 'end' }] };
  const store = { getWorkflow: () => workflow, getExecutionLog: () => null, recordExecutionLog() {}, saveWorkflow() {},
    clearSession() { cleared++; }, saveSession(s) { sessions.push(s); } };
  const { AdvancedWorkflowEngine: engine } = load('src/lib/automations/advancedWorkflowEngine.ts', {
    './testCenterStore': { TestCenterStore: store }, '@/lib/meta/api': {},
    '@/lib/whatsapp/messageService': { WhatsAppMessageService: { send() { throw new Error('Unexpected live send'); } } },
    '@/lib/db': { ContactsDB: { getByPhone: async () => ({ id: 'contact-a' }) } },
  });
  return { engine, sessions, workflow, cleared: () => cleared };
}

test('only a due timer can resume a delay and advance the actual workflow branch', async () => {
  const h = engineHarness();
  assert.equal(await h.engine.resumeWorkflowExecution(session('a'), { action: 'reply' }), null);
  assert.equal(await h.engine.resumeWorkflowExecution(session('a', 'delay', Date.now() + 3600000), { action: 'delay_expired' }), null);
  assert.equal(h.cleared(), 0);
  const result = await h.engine.resumeWorkflowExecution(session('a'), { action: 'delay_expired' });
  assert.equal(result.status, 'completed');
  assert.ok(result.steps.some(step => step.nodeId === 'end'));
});

test('simulating a long delay fast-forwards without creating a live scheduled session', async () => {
  const h = engineHarness();
  const result = await h.engine.executeWorkflow(h.workflow, { workflowId: 'wf-a', workspaceId: 'a', phoneNumber: '+15550001111', triggerType: 'keyword', triggerPayload: {}, isTestSimulation: true });
  assert.equal(result.status, 'completed');
  assert.equal(h.sessions.length, 0);
});

test('delay endpoint requires its worker secret and serializes overlapping scans', async () => {
  let release, calls = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const secret = 'x'.repeat(32);
  const route = load('src/app/api/internal/workflow-delays/route.ts', {
    crypto, 'next/server': { NextResponse },
    '@/lib/automations/testCenterStore': { TestCenterStore: {
      claimDueDelaySessions: async () => [{ ...session('a'), claimToken: 'claim' }], releaseSessionClaim: async () => {},
    } },
    '@/lib/automations/advancedWorkflowEngine': { AdvancedWorkflowEngine: { async resumeWorkflowExecution() { calls++; await gate; return { status: 'completed' }; } } },
  }, { WORKER_SECRET: secret });
  const request = token => new NextRequest('http://localhost/api/internal/workflow-delays', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  assert.equal((await route.POST(request('wrong'))).status, 401);
  const first = route.POST(request(secret));
  assert.equal((await (await route.POST(request(secret))).json()).skipped, true);
  release();
  assert.equal((await (await first).json()).resumed, 1);
  assert.equal(calls, 1);
});

test('worker authenticates, reports runner failures, and avoids overlapping requests', async () => {
  const { createDelayPoller } = require('../worker/workflow-delays');
  let release, captured;
  const poll = createDelayPoller({ env: { WORKER_SECRET: 'x'.repeat(32) }, fetchImpl: async (url, options) => {
    captured = { url, options }; await new Promise(resolve => { release = resolve; });
    return { ok: true, json: async () => ({ resumed: 1, failed: 0 }) };
  } });
  const pending = poll();
  assert.equal((await poll()).skipped, true);
  release(); await pending;
  assert.match(captured.url, /^http:\/\/127\.0\.0\.1:3000/);
  assert.equal(captured.options.headers.authorization, `Bearer ${'x'.repeat(32)}`);
  const bad = createDelayPoller({ env: { WORKER_SECRET: 'x'.repeat(32) }, fetchImpl: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(bad, /HTTP 503/);
});
