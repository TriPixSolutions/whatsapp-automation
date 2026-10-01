const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');

function repository(client) {
  return load('src/lib/db/workflows.ts', { crypto, './client': client }).WorkflowsDB;
}
function repositories(client) {
  return load('src/lib/db/workflows.ts', { crypto, './client': client });
}
const workflow = ws => ({ id: `wf-${ws}`, workspaceId: ws, name: `Flow ${ws}`, triggerType: 'keyword',
  triggerKeyword: 'hello', nodes: [], edges: [], isActive: true, executionCount: 0,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
const execution = ws => ({ id: `exec-${ws}`, executionId: `exec-${ws}`, workflowId: `wf-${ws}`,
  workflowName: `Flow ${ws}`, workspaceId: ws, phoneNumber: '+15550001111', triggerType: 'keyword',
  triggerValue: 'hello', status: 'waiting', startedAt: new Date().toISOString(), totalDurationMs: 0,
  steps: [], metaResponses: [] });
const session = (ws, waitingFor = 'delay', expires = Date.now() - 1000) => ({ id: `session-${ws}`,
  workspaceId: ws, phoneNumber: '+15550001111', workflowId: `wf-${ws}`, executionId: `exec-${ws}`,
  currentNodeId: 'delay', waitingFor, variables: {}, pausedAt: new Date().toISOString(),
  expiresAt: new Date(expires).toISOString() });

test('workflow definitions persist across repository instances and remain tenant scoped', async () => {
  const { client, tables } = backend();
  await repository(client).save(workflow('a'));
  await repository(client).save(workflow('b'));
  assert.equal((await repository(client).list('a')).length, 1);
  assert.equal(await repository(client).get('wf-a', 'b'), null);
  const changed = { ...workflow('a'), name: 'Updated', executionCount: 2 };
  assert.equal((await repository(client).save(changed)).name, 'Updated');
  assert.equal(tables.workflow_definitions.length, 2);
  await assert.rejects(() => repository(client).save({ ...workflow('b'), id: 'wf-a' }), /another workspace/);
  assert.equal((await repository(client).get('wf-a', 'a')).name, 'Updated');
  assert.equal(await repository(client).delete('wf-a', 'b'), false);
  assert.equal(await repository(client).delete('wf-a', 'a'), true);
});

test('waiting sessions and execution traces persist and isolate identical phones by workspace', async () => {
  const { client } = backend();
  const repos = repositories(client);
  for (const ws of ['a', 'b']) {
    await repos.WorkflowsDB.save(workflow(ws));
    await repos.WorkflowExecutionsDB.save(execution(ws));
    await repos.WorkflowSessionsDB.save(session(ws));
  }
  const fresh = repositories(client);
  assert.equal((await fresh.WorkflowSessionsDB.get('+15550001111', 'a')).id, 'session-a');
  assert.equal((await fresh.WorkflowSessionsDB.get('+15550001111', 'b')).id, 'session-b');
  assert.equal((await fresh.WorkflowSessionsDB.list('a')).length, 1);
  assert.equal((await fresh.WorkflowExecutionsDB.get('exec-a', 'a')).workflowName, 'Flow a');
  assert.equal(await fresh.WorkflowExecutionsDB.get('exec-a', 'b'), null);
  await assert.rejects(() => fresh.WorkflowExecutionsDB.save({ ...execution('b'), id: 'exec-a', executionId: 'exec-a' }), /another workspace/);
  assert.equal(await fresh.WorkflowSessionsDB.delete('+15550001111', 'a', 'wrong-id'), false);
  assert.equal(await fresh.WorkflowSessionsDB.delete('+15550001111', 'a', 'session-a'), true);
  assert.equal((await fresh.WorkflowSessionsDB.get('+15550001111', 'b')).id, 'session-b');
});

test('expired reply sessions are removed while due delays are claimed by the database RPC', async () => {
  const { client, tables } = backend();
  const repos = repositories(client);
  await repos.WorkflowsDB.save(workflow('a'));
  await repos.WorkflowExecutionsDB.save(execution('a'));
  await repos.WorkflowSessionsDB.save(session('a', 'reply'));
  assert.equal(await repos.WorkflowSessionsDB.get('+15550001111', 'a'), null);
  assert.equal(tables.workflow_sessions.length, 0);
  await repos.WorkflowSessionsDB.save(session('a'));
  let rpcArgs;
  client.database().rpc = async (_name, args) => {
    rpcArgs = args;
    return { data: structuredClone(tables.workflow_sessions), error: null };
  };
  const claimed = await repos.WorkflowSessionsDB.claimDueDelays(7);
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].id, 'session-a');
  assert.equal(rpcArgs.p_limit, 7);
  assert.match(rpcArgs.p_claim_token, /^[a-f0-9-]{36}$/);
});
