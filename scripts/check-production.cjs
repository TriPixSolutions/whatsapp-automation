// Read-only production probe. It never prints credentials or customer data.
const path = require('path');
const Redis = require('ioredis');
const { createClient } = require('@supabase/supabase-js');

const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.local') });
require('dotenv').config({ path: path.join(root, '.env') });

const requiredTables = [
  'users', 'workspaces', 'workspace_members', 'meta_connections', 'phone_numbers',
  'contacts', 'contact_tags', 'contact_notes', 'contact_activities', 'messages',
  'message_statuses', 'conversations', 'conversation_events', 'workflow_definitions',
  'workflow_sessions', 'workflow_executions', 'webhook_events', 'campaigns',
  'campaign_contacts', 'scheduled_jobs',
];

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
}

function configured(value) {
  return Boolean(value && !/placeholder|your_|change-me|example/i.test(value));
}

async function checkDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!configured(url) || !configured(key)) {
    record('Supabase configuration', false, 'URL or service-role key is missing');
    return;
  }
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const table of requiredTables) {
      const { error } = await db.from(table).select('*', { head: true }).abortSignal(AbortSignal.timeout(8000));
      if (error) throw new Error(`${table} unavailable`);
    }
    record('Supabase schema', true, `${requiredTables.length} core tables available`);
  } catch (error) {
    record('Supabase schema', false, error.message || 'probe failed');
  }
}

async function checkRedis() {
  const url = process.env.REDIS_URL;
  if (!configured(url)) {
    record('Redis queue', false, 'REDIS_URL is missing');
    return;
  }
  const redis = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: null,
    enableReadyCheck: true,
  });
  redis.on('error', () => {});
  try {
    await redis.connect();
    const response = await redis.ping();
    record('Redis queue', response === 'PONG', response === 'PONG' ? 'PING succeeded' : 'unexpected response');
  } catch (error) {
    record('Redis queue', false, error.code || 'connection failed');
  } finally {
    redis.disconnect();
  }
}

async function checkMeta() {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;
  const wabaId = process.env.META_WABA_ID;
  const version = process.env.META_GRAPH_API_VERSION || 'v18.0';
  if (![token, phoneId, wabaId].every(configured)) {
    record('Meta WhatsApp credentials', false, 'token, Phone Number ID or WABA ID is missing');
    return;
  }
  try {
    const endpoint = new URL(`https://graph.facebook.com/${version}/${phoneId}`);
    endpoint.searchParams.set('fields', 'id');
    const response = await fetch(endpoint, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    record(
      'Meta WhatsApp credentials',
      response.ok && body.id === phoneId,
      response.ok ? 'live Phone Number ID probe succeeded' : `Graph API HTTP ${response.status}, code ${body.error?.code || 'unknown'}`,
    );
  } catch (error) {
    record('Meta WhatsApp credentials', false, error.cause?.code || error.name || 'probe failed');
  }
}

async function main() {
  const sessionSecret = process.env.AUTH_SESSION_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  const sessionReady = Boolean(sessionSecret && sessionSecret.length >= 32);
  const workerReady = Boolean(process.env.WORKER_SECRET && process.env.WORKER_SECRET.length >= 32);
  const webhookSecretReady = configured(process.env.META_APP_SECRET);
  record('Session signing', sessionReady, sessionReady ? 'configured' : 'requires at least 32 characters');
  record('Worker authentication', workerReady, workerReady ? 'configured' : 'requires at least 32 characters');
  record('Webhook signature secret', webhookSecretReady, webhookSecretReady ? 'configured' : 'META_APP_SECRET is required for inbound signature checks');

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
  let publicUrlReady = false;
  try {
    const parsed = new URL(publicUrl);
    publicUrlReady = parsed.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {}
  record('Public HTTPS application URL', publicUrlReady, publicUrlReady ? 'configured' : 'required for the Meta webhook callback');

  await checkDatabase();
  await checkRedis();
  await checkMeta();

  const failed = results.filter(result => !result.ok).length;
  console.log(`\nProduction readiness: ${failed === 0 ? 'READY' : `NOT READY (${failed} failed check${failed === 1 ? '' : 's'})`}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch(error => {
  console.error('Production readiness probe failed:', error.message);
  process.exitCode = 1;
});
