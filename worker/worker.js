const { claimDueJobs, completeJob, failJob } = require('./scheduled-jobs');
/**
 * ==============================================================================
 * Hostinger Cloud Server Background Worker
 * WhatsApp Bulk Broadcast Engine via BullMQ & Redis
 * ==============================================================================
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { createClient } = require('@supabase/supabase-js');

// Redis is required for broadcasts. Database-backed schedules continue without it.
const redisUrl = process.env.REDIS_URL;
const redisConnection = redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
}) : null;

let lastLoggedRedisError = null;
let lastLoggedRedisTime = 0;

redisConnection?.on('connect', () => {
  lastLoggedRedisError = null;
  console.log('[Worker] Connected to Redis queue server successfully.');
  recordWorkerHeartbeat('online').catch(() => {});
});

redisConnection?.on('error', (err) => {
  const now = Date.now();
  if (err.message !== lastLoggedRedisError || now - lastLoggedRedisTime > 30000) {
    lastLoggedRedisError = err.message;
    lastLoggedRedisTime = now;
    console.warn(`[Worker] Redis connection unavailable (${err.message}). Retrying in background; scheduled database jobs remain active.`);
  }
});

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Worker] Warning: Supabase credentials not found in environment.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const workerStartedAt = new Date().toISOString();
let heartbeatTimer = null;

async function recordWorkerHeartbeat(status = 'online') {
  if (!supabase) return;
  const { error } = await supabase.from('worker_heartbeats').upsert({
    worker_name: 'whatsapp-background-worker',
    status,
    capabilities: ['broadcasts', 'follow_ups', 'workflow_delays', 'scheduled_workflows'],
    details: { redisConfigured: Boolean(process.env.REDIS_URL), redisStatus: redisConnection?.status || 'not_configured' },
    last_seen_at: new Date().toISOString(),
    started_at: workerStartedAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'worker_name' });
  if (error) console.error('[Worker] Heartbeat update failed:', error.message);
}

const crypto = require('crypto');

// Helper: Sleep to respect Meta API rate limits (60ms per request = ~16 req/s)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispatch single message through Meta WhatsApp Cloud API
 */
async function sendWhatsAppTemplateMessage({
  workspaceId,
  recipientPhone,
  templateName,
  languageCode = 'en_US',
}) {
  try {
    if (!process.env.WORKER_SECRET || process.env.WORKER_SECRET.length < 32) throw new Error('WORKER_SECRET is not configured');
    const endpoint = process.env.MESSAGE_RUNNER_URL || `http://127.0.0.1:${process.env.PORT || 3000}/api/internal/send-message`;
    const response = await fetch(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { authorization: `Bearer ${process.env.WORKER_SECRET}`, 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId, to: recipientPhone, templateName, languageCode }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success || !body.messageId) return { success: false, error: body.error || `Message runner HTTP ${response.status}` };
    return { success: true, metaMessageId: body.messageId };
  } catch (error) {
    console.error('[Worker API Error] Template dispatch failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * BullMQ Worker instance handling 'whatsapp-campaigns' queue
 */
const queueName = 'whatsapp-campaigns';
console.log(`[Worker] Initializing queue worker listening on '${queueName}'...`);

const campaignWorker = redisConnection ? new Worker(
  queueName,
  async (job) => {
    console.log(`\n======================================================`);
    console.log(`[Worker] Processing Job #${job.id}: Campaign '${job.name}'`);

    const {
      campaignId,
      workspaceId,
      templateName = 'teaser_alert',
      languageCode = 'en_US',
      contactIds = [],
    } = job.data;

    if (!campaignId || !workspaceId) {
      throw new Error('Missing required campaignId or workspaceId in job data.');
    }
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new Error('Campaign job has no explicit contact targets.');
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized in worker environment.');
    }

    // 1. Update Campaign status to 'processing'
    await supabase
      .from('campaigns')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('workspace_id', workspaceId);

    // 2. Fetch Targeted Contacts
    let query = supabase
      .from('contacts')
      .select('id, phone_number, first_name, last_name, optin_status')
      .eq('workspace_id', workspaceId)
      .eq('optin_status', true);

    query = query.in('id', contactIds);
    const { data: contacts, error: contactError } = await query;

    if (contactError) {
      console.error('[Worker] Error fetching contacts:', contactError);
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId).eq('workspace_id', workspaceId);
      throw contactError;
    }

    const totalContacts = contacts?.length || 0;
    console.log(`[Worker] Found ${totalContacts} opted-in contacts for broadcast`);

    let sentCount = 0;
    let failedCount = 0;

    // 3. Iterate and dispatch with 60ms rate limit pacing
    for (let i = 0; i < totalContacts; i++) {
      const contact = contacts[i];

      const { data: existingRecipient, error: recipientReadError } = await supabase.from('campaign_contacts')
        .select('id,status').eq('campaign_id', campaignId).eq('contact_id', contact.id).maybeSingle();
      if (recipientReadError) throw recipientReadError;
      if (existingRecipient && ['sent', 'delivered', 'read'].includes(existingRecipient.status)) {
        sentCount++;
        await job.updateProgress(Math.round(((i + 1) / totalContacts) * 100));
        continue;
      }
      if (!existingRecipient) {
        const { error: recipientInsertError } = await supabase.from('campaign_contacts').insert({
          campaign_id: campaignId, contact_id: contact.id, status: 'pending',
        });
        if (recipientInsertError && recipientInsertError.code !== '23505') throw recipientInsertError;
      }

      console.log(`[Worker] [${i + 1}/${totalContacts}] Dispatching campaign recipient ${contact.id}...`);

      const result = await sendWhatsAppTemplateMessage({
        workspaceId,
        recipientPhone: contact.phone_number,
        templateName,
        languageCode,
      });

      if (result.success) {
        sentCount++;
        const { error: recipientError } = await supabase.from('campaign_contacts').update({
          status: 'sent', meta_message_id: result.metaMessageId, sent_at: new Date().toISOString(), error_message: null,
        }).eq('campaign_id', campaignId).eq('contact_id', contact.id);
        if (recipientError) throw recipientError;
      } else {
        failedCount++;
        const { error: recipientError } = await supabase.from('campaign_contacts').update({
          status: 'failed', error_message: result.error,
        }).eq('campaign_id', campaignId).eq('contact_id', contact.id);
        if (recipientError) throw recipientError;
      }

      await job.updateProgress(Math.round(((i + 1) / totalContacts) * 100));
      await sleep(60);
    }

    // 4. Mark Campaign Completed in Supabase
    await supabase
      .from('campaigns')
      .update({
        status: failedCount === totalContacts && totalContacts > 0 ? 'failed' : 'completed',
        total_recipients: totalContacts,
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('workspace_id', workspaceId);

    console.log(`[Worker] Job #${job.id} Completed! Sent: ${sentCount}, Failed: ${failedCount}`);
    console.log(`======================================================\n`);

    return {
      status: 'completed',
      total: totalContacts,
      sent: sentCount,
      failed: failedCount,
    };
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
) : null;

if (!campaignWorker) console.warn('[Worker] REDIS_URL is not configured. Broadcast queue is unavailable; scheduled database jobs remain active.');

campaignWorker?.on('completed', (job) => {
  console.log(`[Worker] Event: Job #${job.id} reported completed successfully.`);
});

campaignWorker?.on('failed', (job, err) => {
  console.error(`[Worker] Event: Job #${job?.id} failed with error:`, err.message);
});

campaignWorker?.on('error', (err) => {
  const now = Date.now();
  if (now - lastLoggedRedisTime > 30000) {
    lastLoggedRedisTime = now;
    console.warn(`[Worker] Broadcast queue notice (${err.message}). Retrying in background; scheduled database jobs remain active.`);
  }
});

// Graceful process shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[Worker] Received ${signal}. Gracefully closing worker, intervals, and redis connection...`);
  if (workflowDelayTimer) clearInterval(workflowDelayTimer);
  if (followUpIntervalTimer) clearInterval(followUpIntervalTimer);
  if (scheduledWorkflowTimer) clearInterval(scheduledWorkflowTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  try {
    await Promise.race([
      recordWorkerHeartbeat('stopping'),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  } catch (err) {
    console.error('[Worker] Shutdown heartbeat record error:', err.message);
  }
  try {
    if (campaignWorker) {
      await Promise.race([
        campaignWorker.close(),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    }
  } catch (err) {
    console.error('[Worker] Shutdown campaign worker close error:', err.message);
  }
  try {
    if (redisConnection) {
      if (redisConnection.status === 'ready') {
        await Promise.race([
          redisConnection.quit(),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
      } else {
        redisConnection.disconnect();
      }
    }
  } catch (err) {
    console.error('[Worker] Shutdown redis disconnect error:', err.message);
  }
  console.log('[Worker] Shutdown complete.');
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

/**
 * ==============================================================================
 * Scheduled Follow-Up Dispatch Engine
 * Periodically polls Supabase for pending follow-up jobs that are due
 * ==============================================================================
 */
let followUpIntervalTimer = null;

async function processDueFollowUpJobs() {
  if (!supabase) return;

  try {
    const dueJobs = await claimDueJobs(supabase, 'follow_up', 20);

    if (!dueJobs || dueJobs.length === 0) {
      return;
    }

    console.log(`[Follow-Up Runner] Found ${dueJobs.length} due follow-up jobs to dispatch.`);

    for (const job of dueJobs) {
      try {
        const workspaceId = job.workspace_id;
        const recipientPhone = job.reference_id;
        const payload = job.payload || {};
        const templateName = payload.templateName || (payload.payload && payload.payload.templateName) || 'teaser_alert';
        const languageCode = payload.languageCode || 'en_US';
        const result = await sendWhatsAppTemplateMessage({ workspaceId,
          recipientPhone, templateName, languageCode });
        if (!result.success) throw new Error(result.error || 'Meta dispatch failed');
        await completeJob(supabase, job);
        console.log(`[Follow-Up Runner] Dispatched job ${job.id}`);
      } catch (error) {
        const retry = await failJob(supabase, job, error);
        console.error(`[Follow-Up Runner] Job ${job.id} ${retry.terminal ? 'failed permanently' : 'scheduled for retry'}:`, error.message);
      }
    }
  } catch (err) {
    console.error('[Follow-Up Runner] Unexpected error in polling cycle:', err.message);
  }
}

async function processDueWorkflowTriggers() {
  if (!supabase) return;
  try {
    const dueJobs = await claimDueJobs(supabase, 'workflow_trigger', 10);
    for (const job of dueJobs) {
      try {
        const payload = job.payload || {};
        if (!process.env.WORKER_SECRET || process.env.WORKER_SECRET.length < 32) throw new Error('WORKER_SECRET is not configured');
        const endpoint = process.env.SCHEDULED_WORKFLOW_RUNNER_URL || `http://127.0.0.1:${process.env.PORT || 3000}/api/internal/scheduled-workflows`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { authorization: `Bearer ${process.env.WORKER_SECRET}`, 'content-type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, workflowId: job.reference_id, workspaceId: job.workspace_id, phoneNumber: payload.phoneNumber }),
          signal: AbortSignal.timeout(60000),
          redirect: 'error',
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.error || `Scheduled workflow runner HTTP ${response.status}`);

        const recurrenceMinutes = Number(payload.recurrenceMinutes || 0);
        if (Number.isFinite(recurrenceMinutes) && recurrenceMinutes > 0) {
          const digest = crypto.createHash('sha256').update(`${job.id}:${recurrenceMinutes}`).digest('hex');
          const nextJobId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
          const { error: recurrenceError } = await supabase.from('scheduled_jobs').insert({
            id: nextJobId, workspace_id: job.workspace_id, job_type: 'workflow_trigger',
            reference_id: job.reference_id, payload,
            scheduled_at: new Date(Date.now() + recurrenceMinutes * 60_000).toISOString(), status: 'pending',
          });
          if (recurrenceError && recurrenceError.code !== '23505') throw new Error(`Recurring workflow could not be rescheduled: ${recurrenceError.message}`);
        }
        await completeJob(supabase, job);
        console.log(`[Scheduled Workflow Runner] Executed job ${job.id} as ${result.executionId}`);
      } catch (error) {
        const retry = await failJob(supabase, job, error);
        console.error(`[Scheduled Workflow Runner] Job ${job.id} ${retry.terminal ? 'failed permanently' : 'scheduled for retry'}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Scheduled Workflow Runner] Polling failed:', error.message);
  }
}

// Start polling every 15 seconds
followUpIntervalTimer = setInterval(processDueFollowUpJobs, 15000);
console.log('[Worker] Scheduled follow-up dispatch runner active (15s polling interval).');

recordWorkerHeartbeat().catch(error => console.error('[Worker] Initial heartbeat failed:', error.message));
heartbeatTimer = setInterval(() => {
  recordWorkerHeartbeat().catch(error => console.error('[Worker] Heartbeat failed:', error.message));
}, 30000);

const scheduledWorkflowTimer = setInterval(processDueWorkflowTriggers, 15000);


const { createDelayPoller } = require('./workflow-delays');
const pollWorkflowDelays = createDelayPoller();
const workflowDelayTimer = setInterval(() => {
  pollWorkflowDelays().catch(error => console.error('[Workflow Delay Runner]', error.message));
}, 15000);
