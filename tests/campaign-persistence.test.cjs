const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');

test('campaigns use database UUIDs, survive repository reloads and remain tenant scoped', async () => {
  const { client, tables } = backend();
  const fresh = () => load('src/lib/db/campaigns.ts', { crypto, './client': client }).CampaignsDB;
  const campaign = await fresh().create({ name: 'Launch', templateName: 'offer', targetTag: 'vip', totalRecipients: 20 }, 'a');
  assert.match(campaign.id, /^[a-f0-9-]{36}$/);
  assert.equal((await fresh().list('a'))[0].name, 'Launch');
  assert.equal((await fresh().list('b')).length, 0);
  assert.equal(await fresh().getById(campaign.id, 'b'), null);
  assert.equal(await fresh().update(campaign.id, { status: 'completed', sentCount: 18, failedCount: 2 }, 'b'), null);
  const updated = await fresh().update(campaign.id, { status: 'completed', sentCount: 18, failedCount: 2 }, 'a');
  assert.equal(updated.sentCount, 18);
  assert.equal(updated.failedCount, 2);
  assert.equal(tables.campaigns.length, 1);
});
