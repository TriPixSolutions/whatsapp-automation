const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');

test('follow-up scheduling persists UUID jobs and cancellation is tenant scoped', async () => {
  const { client, tables } = backend();
  const { ScheduledJobsDB } = load('src/lib/db/scheduledJobs.ts', { crypto, './client': client });
  const first = await ScheduledJobsDB.schedule({ workspaceId: 'a', phoneNumber: '+15550001111',
    stepName: 'Reminder', scheduledAt: new Date().toISOString(), payload: { templateName: 'reminder' } });
  await ScheduledJobsDB.schedule({ workspaceId: 'b', phoneNumber: '+15550001111',
    stepName: 'Reminder', scheduledAt: new Date().toISOString(), payload: {} });
  assert.match(first.id, /^[a-f0-9-]{36}$/);
  assert.equal(await ScheduledJobsDB.cancelPending('+15550001111', 'a'), 1);
  assert.equal(tables.scheduled_jobs.find(row => row.workspace_id === 'a').status, 'cancelled');
  assert.equal(tables.scheduled_jobs.find(row => row.workspace_id === 'b').status, 'pending');
});

function jobClient() {
  const updates = [];
  const query = { update(value) { updates.push(value); return this; }, eq() { return this; },
    select: async () => ({ data: [{ id: 'job' }], error: null }),
    then(resolve) { return Promise.resolve({ data: null, error: null }).then(resolve); } };
  return { updates, client: { rpc: async (_name, args) => ({ data: [{ id: 'job', attempt_count: 1,
    max_attempts: 3, claim_token: args.p_claim_token }], error: null }), from: () => query } };
}

test('scheduled worker claims once, completes with the token and retries transient failures', async () => {
  const { claimDueJobs, completeJob, failJob } = require('../worker/scheduled-jobs');
  const h = jobClient();
  const jobs = await claimDueJobs(h.client, 'follow_up', 5);
  assert.equal(jobs.length, 1);
  assert.match(jobs[0].claim_token, /^[a-f0-9-]{36}$/);
  await completeJob(h.client, jobs[0]);
  assert.equal(h.updates[0].status, 'completed');
  const retry = await failJob(h.client, jobs[0], new Error('temporary'));
  assert.equal(retry.terminal, false);
  assert.equal(h.updates[1].status, 'pending');
  assert.equal(h.updates[1].last_error, 'temporary');
});

test('scheduled worker stops retrying after the configured attempt limit', async () => {
  const { failJob } = require('../worker/scheduled-jobs');
  const h = jobClient();
  const result = await failJob(h.client, { id: 'job', claim_token: 'claim', attempt_count: 3, max_attempts: 3 }, 'bad');
  assert.equal(result.terminal, true);
  assert.equal(h.updates[0].status, 'failed');
});
