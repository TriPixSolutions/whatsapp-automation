// Read-only production probe. It never prints credentials or customer data.
const path = require('path');
const Redis = require('ioredis');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.local') });
require('dotenv').config({ path: path.join(root, '.env') });

const requiredTables = [
  'users', 'workspaces', 'workspace_members', 'meta_connections', 'phone_numbers',
  'contacts', 'contact_tags', 'contact_notes', 'contact_activities', 'messages',
  'message_statuses', 'conversations', 'conversation_events', 'workflow_definitions',
  'workflow_sessions', 'workflow_executions', 'webhook_events', 'campaigns',
  'campaign_contacts', 'scheduled_jobs', 'companies', 'templates', 'media_assets', 'data_deletions',
  'worker_heartbeats',
];

const results = [];
let savedWebhookSecretReady = false;
let savedMetaCandidates = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
}

function configured(value) {
  return Boolean(value && !/placeholder|your_|change-me|example/i.test(value));
}

function decryptSavedCredential(value) {
  if (!value) return '';
  if (!value.startsWith('enc:gcm:')) return value;
  const parts = value.split(':');
  if (parts.length !== 5 || !process.env.ENCRYPTION_KEY) return '';
  try {
    const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[2], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[3], 'hex'));
    return decipher.update(parts[4], 'hex', 'utf8') + decipher.final('utf8');
  } catch { return ''; }
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
    const columns = await db.from('companies').select('phone,contact_count,deal_value', {head:true});
    if(columns.error) throw new Error('Business/media migration required');
    const bucket = await db.storage.getBucket('workspace-media');
    if(bucket.error || bucket.data.public) throw new Error('Private workspace-media bucket required');
    const savedSecrets = await db
      .from('meta_connections')
      .select('workspace_id,app_secret_encrypted,access_token_encrypted,waba_id')
      .limit(50);
    if (savedSecrets.error) throw new Error('Meta connection settings unavailable');
    const savedPhones = await db
      .from('phone_numbers')
      .select('workspace_id,phone_number_id,is_default')
      .eq('is_default', true)
      .limit(50);
    if (savedPhones.error) throw new Error('Meta phone settings unavailable');
    const phoneByWorkspace = new Map((savedPhones.data || []).map(row => [row.workspace_id, row.phone_number_id]));
    savedWebhookSecretReady = (savedSecrets.data || []).some(row => /^[a-f0-9]{32}$/i.test(decryptSavedCredential(row.app_secret_encrypted)));
    savedMetaCandidates = (savedSecrets.data || [])
      .map(row => ({
        token: decryptSavedCredential(row.access_token_encrypted),
        phoneId: phoneByWorkspace.get(row.workspace_id),
        wabaId: row.waba_id,
      }))
      .filter(candidate => [candidate.token, candidate.phoneId, candidate.wabaId].every(configured));
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
  const version = require('../shared/meta-config.cjs').graphVersion(process.env);
  const envCandidate = {
    token: process.env.META_ACCESS_TOKEN,
    phoneId: process.env.META_PHONE_NUMBER_ID,
    wabaId: process.env.META_WABA_ID,
  };
  const candidates = [envCandidate, ...savedMetaCandidates]
    .filter(candidate => [candidate.token, candidate.phoneId, candidate.wabaId].every(configured));
  if (candidates.length === 0) {
    record('Meta WhatsApp credentials', false, 'token, Phone Number ID or WABA ID is missing');
    return;
  }

  let lastFailure = 'live probe failed';
  for (const candidate of candidates) {
    try {
      const endpoint = new URL(`https://graph.facebook.com/${version}/${candidate.phoneId}`);
      endpoint.searchParams.set('fields', 'id');
      const response = await fetch(endpoint, {
        headers: { authorization: `Bearer ${candidate.token}` },
        signal: AbortSignal.timeout(10000),
      });
      const body = await response.json();
      if (response.ok && body.id === candidate.phoneId) {
        record('Meta WhatsApp credentials', true, 'live Phone Number ID probe succeeded');
        return;
      }
      lastFailure = `Graph API HTTP ${response.status}, code ${body.error?.code || 'unknown'}`;
    } catch (error) {
      lastFailure = error.cause?.code || error.name || 'probe failed';
    }
  }
  record('Meta WhatsApp credentials', false, lastFailure);
}

async function main() {
  const sessionSecret = process.env.AUTH_SESSION_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  const sessionReady = Boolean(sessionSecret && sessionSecret.length >= 32);
  const workerReady = Boolean(process.env.WORKER_SECRET && process.env.WORKER_SECRET.length >= 32);
  record('Credential encryption', Boolean(process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32), 'stable ENCRYPTION_KEY of at least 32 characters required');
  record('Session signing', sessionReady, sessionReady ? 'configured' : 'requires at least 32 characters');
  record('Worker authentication', workerReady, workerReady ? 'configured' : 'requires at least 32 characters');

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
  let publicUrlReady = false;
  try {
    const parsed = new URL(publicUrl);
    publicUrlReady = parsed.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {}
  record('Public HTTPS application URL', publicUrlReady, publicUrlReady ? 'configured' : 'required for the Meta webhook callback');

  await checkDatabase();
  const webhookSecretReady = configured(process.env.META_APP_SECRET) || savedWebhookSecretReady;
  record('Webhook signature secret', webhookSecretReady, webhookSecretReady ? 'configured for at least one workspace' : 'META_APP_SECRET or a saved workspace App Secret is required');
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
