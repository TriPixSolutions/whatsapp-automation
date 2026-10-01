const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');
const phones = { normalizePhone: value => value.replace(/\D/g, ''), ContactsDB: { getById: async (id, ws) => id === `contact-${ws}` ? { id } : null } };
const messages = client => load('src/lib/db/messages.ts', { './client': client, './contacts': phones }).MessagesDB;
const conversations = client => load('src/lib/db/conversations.ts', { crypto, './client': client, './contacts': phones }).ConversationsDB;

test('message records survive new repository instances and duplicate webhooks preserve delivered status', async () => {
  const { client, tables } = backend();
  const data = { phoneNumber: '15550001111', direction: 'outbound', status: 'sent', metaMessageId: 'wamid-a', contactId: 'contact-a' };
  const saved = await messages(client).create(data, 'a');
  await messages(client).updateStatus('wamid-a', 'read', undefined, 'a');
  assert.equal((await messages(client).create(data, 'a')).status, 'read');
  assert.equal(tables.messages.length, 1);
  assert.equal((await messages(client).list({ workspaceId: 'a' }))[0].id, saved.id);
  assert.equal((await messages(client).list({ workspaceId: 'b' })).length, 0);
  await assert.rejects(() => messages(client).create(data, 'b'), /Contact not found/);
  assert.equal(await messages(client).updateStatus('wamid-a', 'failed', 'bad', 'b'), false);
});

test('out of order and concurrent status receipts cannot regress read to sent or failed', async () => {
  const { client, tables } = backend();
  await messages(client).create({ phoneNumber: '15550001111', direction: 'outbound', status: 'sent', metaMessageId: 'm' }, 'a');
  await Promise.all(['delivered', 'read'].map(status => messages(client).updateStatus('m', status, undefined, 'a')));
  await messages(client).updateStatus('m', 'sent', undefined, 'a');
  await messages(client).updateStatus('m', 'failed', 'late error', 'a');
  assert.equal(tables.messages[0].status, 'read');
  assert.equal(tables.messages[0].error_message, null);
});

test('failed unsent messages have no fabricated provider ID and inbound records do not inflate send statistics', async () => {
  const { client, tables } = backend();
  const repo = messages(client);
  await repo.create({ phoneNumber: '15550001111', direction: 'outbound', status: 'failed' }, 'a');
  await repo.create({ phoneNumber: '15550001111', direction: 'inbound', status: 'read', metaMessageId: 'in' }, 'a');
  await repo.create({ phoneNumber: '15550001111', direction: 'outbound', status: 'read', metaMessageId: 'out' }, 'a');
  assert.equal(tables.messages[0].meta_message_id, null);
  const stats = await repo.getStats('a');
  assert.equal(stats.messagesSent, 2);
  assert.equal(stats.deliveredCount, 1);
  assert.equal(stats.deliveryRate, '50%');
  assert.equal((await repo.getStats('b')).messagesSent, 0);
});

test('the messaging window depends on persisted inbound time, not recent outbound message volume', async () => {
  const { client, tables } = backend();
  tables.conversations.push({ id: 'conversation', workspace_id: 'a', contact_id: 'contact-a', phone_number: '+15550001111', last_inbound_at: new Date(Date.now() - 3600000).toISOString() });
  const repo = conversations(client);
  assert.equal(await repo.isWindowOpen('15550001111', 'a'), true);
  assert.equal(await repo.isWindowOpen('15550001111', 'b'), false);
  tables.conversations[0].last_inbound_at = new Date(Date.now() - 25 * 3600000).toISOString();
  assert.equal(await repo.isWindowOpen('15550001111', 'a'), false);
  tables.conversations[0].last_inbound_at = new Date(Date.now() + 3600000).toISOString();
  assert.equal(await repo.isWindowOpen('15550001111', 'a'), false);
});

test('conversation events pass the provider event ID, tenant and original timestamp to the transactional RPC', async () => {
  const { client } = backend();
  let captured;
  client.database().rpc = async (name, args) => { captured = { name, args }; return { data: [{ id: 'conversation' }], error: null }; };
  const time = new Date(Date.now() - 3600000).toISOString();
  await conversations(client).recordInbound('15550001111', 'contact-a', 'a', 'wamid-original', time);
  assert.equal(captured.name, 'record_conversation_event');
  assert.equal(captured.args.p_event_id, 'wamid-original');
  assert.equal(captured.args.p_workspace_id, 'a');
  assert.equal(captured.args.p_occurred_at, time);
  assert.equal(captured.args.p_direction, 'inbound');
});
