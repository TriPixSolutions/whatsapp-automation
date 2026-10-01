const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');

test('webhook claims use an atomic database RPC and completion is tenant and token scoped', async () => {
  const { client, tables } = backend();
  let rpc;
  client.database().rpc = async (name, args) => {
    rpc = { name, args };
    tables.webhook_events.push({ id: 'row', workspace_id: args.p_workspace_id, meta_event_id: args.p_meta_event_id,
      claim_token: args.p_claim_token, status: 'received' });
    return { data: 'claimed', error: null };
  };
  const { WebhookEventsDB } = load('src/lib/db/webhookEvents.ts', { crypto, './client': client });
  const claim = await WebhookEventsDB.claim('event-a', 'inbound_message', { id: 'wamid' }, 'workspace-a');
  assert.equal(claim.state, 'claimed');
  assert.equal(rpc.name, 'claim_webhook_event');
  assert.equal(rpc.args.p_workspace_id, 'workspace-a');
  assert.match(claim.claimToken, /^[a-f0-9-]{36}$/);
  await WebhookEventsDB.complete('event-a', 'workspace-a', claim.claimToken);
  assert.equal(tables.webhook_events[0].status, 'processed');
  assert.ok(tables.webhook_events[0].processed_at);
  await assert.rejects(() => WebhookEventsDB.complete('event-a', 'workspace-b', claim.claimToken), /claim was lost/);
});

test('failed webhook claims become retryable without exposing raw errors beyond the row', async () => {
  const { client, tables } = backend();
  client.database().rpc = async (_name, args) => {
    tables.webhook_events.push({ id: 'row', workspace_id: args.p_workspace_id, meta_event_id: args.p_meta_event_id,
      claim_token: args.p_claim_token, status: 'received' });
    return { data: 'claimed', error: null };
  };
  const { WebhookEventsDB } = load('src/lib/db/webhookEvents.ts', { crypto, './client': client });
  const claim = await WebhookEventsDB.claim('event-a', 'status', {}, 'workspace-a');
  await WebhookEventsDB.fail('event-a', 'workspace-a', claim.claimToken, new Error('temporary failure'));
  assert.equal(tables.webhook_events[0].status, 'failed');
  assert.equal(tables.webhook_events[0].claim_token, null);
  assert.equal(tables.webhook_events[0].last_error, 'temporary failure');
});

test('processed and busy webhook claim states do not fabricate a claim token', async () => {
  for (const state of ['processed', 'busy']) {
    const client = { database: () => ({ rpc: async () => ({ data: state, error: null }) }), checked: result => result.data };
    const { WebhookEventsDB } = load('src/lib/db/webhookEvents.ts', { crypto, './client': client });
    const result = await WebhookEventsDB.claim('event', 'status', {}, 'workspace');
    assert.equal(result.state, state);
    assert.equal(result.claimToken, undefined);
  }
});
