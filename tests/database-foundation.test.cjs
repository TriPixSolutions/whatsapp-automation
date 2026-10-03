const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');

const backend = require('./fake-database.cjs');
const encryption = { encryptToken: value => value ? `encrypted:${value}` : '', decryptToken: value => value.replace(/^encrypted:/, '') };
const settingsRepo = client => load('src/lib/db/settings.ts', { './client': client, '@/lib/crypto': encryption }, {
  META_ACCESS_TOKEN: 'default-only', META_PHONE_NUMBER_ID: 'default-phone',
}).SettingsDB;

test('settings survive a fresh repository instance and stay scoped to their workspace', async () => {
  const { client, tables } = backend();
  const settings = settingsRepo(client);
  await settings.update({ name: 'A', phoneNumberId: 'phone-a', accessToken: 'secret-a', verifyToken: 'verify-a' }, 'a');
  await settings.update({ name: 'B', phoneNumberId: 'phone-b', accessToken: 'secret-b', verifyToken: 'verify-b' }, 'b');
  const fresh = settingsRepo(client);
  assert.equal((await fresh.get('a')).accessToken, 'secret-a');
  assert.equal((await fresh.get('b')).phoneNumberId, 'phone-b');
  assert.equal((await fresh.get('unconfigured')).accessToken, '');
  assert.equal((await fresh.getByPhoneNumberId('phone-a')).id, 'a');
  assert.equal((await fresh.getByVerifyToken('verify-b')).id, 'b');
  assert.equal(await fresh.getByPhoneNumberId('unknown'), null);
  assert.equal(tables.meta_connections[0].access_token_encrypted, 'encrypted:secret-a');
  assert.equal(tables.meta_connections[0].phone_number_id, undefined);
  await assert.rejects(() => fresh.update({ phoneNumberId: 'phone-a' }, 'b'), /another workspace/);
  assert.equal((await fresh.getByPhoneNumberId('phone-a')).id, 'a');
});

test('database errors surface instead of returning default or cached settings', async () => {
  const client = { database() { throw new Error('Database unavailable'); } };
  const settings = settingsRepo(client);
  await assert.rejects(() => settings.get('a'), /Database unavailable/);
});

test('accounts and membership come from persisted records and new owners receive distinct workspaces', async () => {
  const { client, tables } = backend();
  const createRepo = () => load('src/lib/db/users.ts', {
    crypto, './client': client,
    '@/lib/crypto': { hashPassword: value => `hash:${value}`, verifyPassword: (value, hash) => hash === `hash:${value}` },
  }).UsersDB;
  const users = createRepo();
  const a = await users.create({ email: 'a@example.test', password: 'password-a', name: 'A' });
  const b = await users.create({ email: 'b@example.test', password: 'password-b', name: 'B' });
  assert.notEqual(a.workspaceId, b.workspaceId);
  assert.match(a.id, /^[a-f0-9-]{36}$/);
  assert.equal((await createRepo().verifyCredentials('a@example.test', 'password-a')).id, a.id);
  assert.equal(await createRepo().getById(a.id, b.workspaceId), null);
  tables.workspace_members.find(row => row.user_id === a.id).is_active = false;
  assert.equal(await createRepo().getById(a.id, a.workspaceId), null);
});

test('workflow update/delete reject another workspace even for a known workflow ID', async () => {
  const { NextRequest, NextResponse } = require('next/server');
  let mutated = false;
  const validator = load('src/lib/automations/validateWorkflow.ts', {
    '@/lib/whatsapp/messageModel': { messageFromWorkflowNode: () => null, validateOutboundMessage: () => [] },
  });
  const route = load('src/app/api/automations/route.ts', {
    '@/lib/automations/validateWorkflow': validator,
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => ({ id: 'a', workspaceId: 'a' }) },
    '@/lib/db': { DEFAULT_WORKSPACE_ID: 'default', AutomationsDB: {} },
    '@/lib/automations/testCenterStore': { TestCenterStore: {
      getWorkflow: () => ({ id: 'private', workspaceId: 'b' }),
      saveWorkflow() { mutated = true; }, deleteWorkflow() { mutated = true; },
    } },
  });
  const update = await route.PUT(new NextRequest('https://example.test/api/automations', {
    method: 'PUT', body: JSON.stringify({ id: 'private', workspaceId: 'a', name: 'Stolen' }),
  }));
  assert.equal(update.status, 404);
  const deletion = await route.DELETE(new NextRequest('https://example.test/api/automations?id=private'));
  assert.equal(deletion.status, 404);
  assert.equal(mutated, false);
});

test('worker resolves phone IDs from phone_numbers and never borrows a different tenant token', async () => {
  const { getWorkspaceConnection } = require('../worker/connection');
  const { tables, client } = backend();
  tables.meta_connections.push({ workspace_id: 'a', access_token_encrypted: 'encrypted:a' });
  tables.phone_numbers.push({ workspace_id: 'a', phone_number_id: 'phone-a', is_default: true });
  assert.deepEqual(await getWorkspaceConnection(client.database(), 'a'), {
    encryptedToken: 'encrypted:a', phoneNumberId: 'phone-a',
  });
  await assert.rejects(() => getWorkspaceConnection(client.database(), 'b'), /not configured/);
});


test('contacts normalize phone numbers, persist updates and isolate identical numbers across workspaces', async () => {
  const { client, tables } = backend();
  const createRepo = () => load('src/lib/db/contacts.ts', { crypto, './client': client }).ContactsDB;
  const a = await createRepo().upsert({ phoneNumber: '+1 (555) 000-1111', firstName: 'Asha', tags: ['VIP'], optinStatus: true }, 'a');
  const b = await createRepo().upsert({ phoneNumber: '15550001111', firstName: 'Bina' }, 'b');
  assert.notEqual(a.id, b.id);
  assert.equal(a.phoneNumber, '+15550001111');
  assert.equal(b.optinStatus, false);
  assert.equal(tables.contacts.length, 2);
  await createRepo().upsert({ phoneNumber: '15550001111', firstName: '', stage: 'proposal_sent', leadScore: 87 }, 'a');
  const reloaded = await createRepo().getByPhone('+15550001111', 'a');
  assert.equal(reloaded.firstName, '');
  assert.equal(reloaded.stage, 'proposal_sent');
  assert.equal(reloaded.leadScore, 87);
  assert.equal(reloaded.tags[0], 'vip');
  assert.equal(await createRepo().getById(a.id, 'b'), null);
  assert.equal(await createRepo().delete(a.id, 'b'), false);
  assert.equal((await createRepo().getById(a.id, 'a')).id, a.id);
  assert.equal((await createRepo().list({ workspaceId: 'b' }))[0].firstName, 'Bina');
});

test('notes and timeline reject a different workspace and persist in the owning workspace', async () => {
  const { client } = backend();
  const contacts = load('src/lib/db/contacts.ts', { crypto, './client': client }).ContactsDB;
  const contact = await contacts.upsert({ phoneNumber: '15550001111' }, 'a');
  assert.equal(await contacts.addNote(contact.id, { authorName: 'Other', content: 'forbidden' }, 'b'), null);
  await contacts.addNote(contact.id, { authorName: 'Agent', content: 'Asked about pricing' }, 'a');
  await contacts.addTimelineEvent(contact.id, { type: 'stage_changed', title: 'Qualified', description: 'Requested quote' }, 'a');
  assert.equal((await contacts.getById(contact.id, 'a')).notes[0].content, 'Asked about pricing');
  assert.equal((await contacts.getTimeline(contact.id, 'a')).length, 1);
  assert.equal((await contacts.getTimeline(contact.id, 'b')).length, 0);
});

test('CSV import ignores the workspace supplied in request data', async () => {
  const { NextRequest, NextResponse } = require('next/server');
  let workspaceId;
  const route = load('src/app/api/contacts/import/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => ({ workspaceId: 'a' }) },
    '@/lib/db': { ContactsDB: { async upsert(_data, id) { workspaceId = id; } } },
  });
  const response = await route.POST(new NextRequest('https://example.test/api/contacts/import', { method: 'POST',
    body: JSON.stringify({ workspaceId: 'b', contacts: [{ phone: '+15550001111' }] }) }));
  assert.equal(response.status, 200);
  assert.equal(workspaceId, 'a');
});

test('CRM stage changes write through the repository instead of mutating a temporary object', async () => {
  const { NextRequest, NextResponse } = require('next/server');
  let saved;
  const route = load('src/app/api/crm/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-server': { getAuthorizedUser: async () => ({ workspaceId: 'a' }) },
    '@/lib/db': { ContactsDB: {
      getById: async (id, workspaceId) => workspaceId === 'a' ? { id, phoneNumber: '+15550001111' } : null,
      async upsert(data, workspaceId) { saved = { ...data, workspaceId }; return saved; },
      async addTimelineEvent() {},
    } },
  });
  const response = await route.POST(new NextRequest('https://example.test/api/crm', { method: 'POST',
    body: JSON.stringify({ action: 'update_stage', contactId: 'contact-a', stage: 'qualified', workspaceId: 'b' }) }));
  assert.equal(response.status, 200);
  assert.equal(saved.stage, 'qualified');
  assert.equal(saved.workspaceId, 'a');
});
