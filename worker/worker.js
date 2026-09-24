/**
 * ==============================================================================
 * Hostinger Cloud Server Background Worker
 * WhatsApp Bulk Broadcast Engine via BullMQ & Redis
 * ==============================================================================
 */

require('dotenv').config();
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Redis Client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
});

redisConnection.on('connect', () => {
  console.log('[Worker] Connected to Redis queue server successfully.');
});

redisConnection.on('error', (err) => {
  console.error('[Worker] Redis connection error:', err.message);
});

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Worker] Warning: Supabase credentials not found in environment.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const crypto = require('crypto');

// AES-256-GCM Decryption Helper
const ALGORITHM = 'aes-256-gcm';
function getEncryptionKey() {
  const envKey =
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'production_secure_tripix_aes256_key_32bytes_min';
  return crypto.createHash('sha256').update(envKey).digest();
}

function decryptToken(cipherString) {
  if (!cipherString) return '';
  if (!cipherString.startsWith('enc:gcm:')) {
    return cipherString;
  }
  try {
    const parts = cipherString.split(':');
    if (parts.length !== 5) return cipherString;
    const [, , ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Worker Crypto] Decryption failed:', error.message);
    return cipherString;
  }
}

// Helper: Sleep to respect Meta API rate limits (60ms per request = ~16 req/s)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispatch single message through Meta WhatsApp Cloud API
 */
async function sendWhatsAppTemplateMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  templateName,
  languageCode = 'en_US',
}) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone.replace(/[^0-9]/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  if (!accessToken || accessToken.includes('SAMPLE_TOKEN') || !phoneNumberId) {
    return {
      success: false,
      error: 'Unconfigured Meta credentials. Connect live Meta WABA access token.',
    };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    });

    const metaMessageId = response.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
    return { success: true, metaMessageId, responseData: response.data };
  } catch (error) {
    const errorDetail = error.response?.data?.error?.message || error.message;
    console.error(`[Worker API Error] Failed to send to ${recipientPhone}:`, errorDetail);
    return { success: false, error: errorDetail };
  }
}

/**
 * BullMQ Worker instance handling 'whatsapp-campaigns' queue
 */
const queueName = 'whatsapp-campaigns';
console.log(`[Worker] Initializing queue worker listening on '${queueName}'...`);

const campaignWorker = new Worker(
  queueName,
  async (job) => {
    console.log(`\n======================================================`);
    console.log(`[Worker] Processing Job #${job.id}: Campaign '${job.name}'`);
    console.log(`[Worker] Job Data:`, job.data);

    const {
      campaignId,
      workspaceId,
      templateName = 'teaser_alert',
      targetTag = 'all',
      languageCode = 'en_US',
    } = job.data;

    if (!campaignId || !workspaceId) {
      throw new Error('Missing required campaignId or workspaceId in job data.');
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized in worker environment.');
    }

    // 1. Fetch Workspace Credentials
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .maybeSingle();

    if (wsError) {
      console.warn(`[Worker] Workspace lookup warning for ${workspaceId}:`, wsError.message);
    }

    const { data: metaConn } = await supabase
      .from('meta_connections')
      .select('access_token_encrypted, phone_number_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const rawToken = metaConn?.access_token_encrypted || process.env.META_ACCESS_TOKEN || '';
    const accessToken = decryptToken(rawToken);
    const phoneNumberId = metaConn?.phone_number_id || process.env.META_PHONE_NUMBER_ID;

    // 2. Update Campaign status to 'processing'
    await supabase
      .from('campaigns')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    // 3. Fetch Targeted Contacts
    let query = supabase
      .from('contacts')
      .select('id, phone_number, first_name, last_name, optin_status')
      .eq('workspace_id', workspaceId)
      .eq('optin_status', true);

    const { data: contacts, error: contactError } = await query;

    if (contactError) {
      console.error('[Worker] Error fetching contacts:', contactError);
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId);
      throw contactError;
    }

    const totalContacts = contacts?.length || 0;
    console.log(`[Worker] Found ${totalContacts} opted-in contacts for broadcast`);

    let sentCount = 0;
    let failedCount = 0;

    // 4. Iterate and dispatch with 60ms rate limit pacing
    for (let i = 0; i < totalContacts; i++) {
      const contact = contacts[i];

      console.log(`[Worker] [${i + 1}/${totalContacts}] Dispatching to ${contact.first_name || 'Contact'} (${contact.phone_number})...`);

      const result = await sendWhatsAppTemplateMessage({
        phoneNumberId,
        accessToken,
        recipientPhone: contact.phone_number,
        templateName,
        languageCode,
      });

      if (result.success) {
        sentCount++;
        await supabase.from('messages').insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          phone_number: contact.phone_number,
          meta_message_id: result.metaMessageId,
          direction: 'outbound',
          type: 'template',
          status: 'sent',
          content: `Template: ${templateName}`,
          payload: { template: templateName, recipient: contact.phone_number },
        }).catch(() => {});
      } else {
        failedCount++;
        await supabase.from('messages').insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          phone_number: contact.phone_number,
          direction: 'outbound',
          type: 'template',
          status: 'failed',
          content: `Template: ${templateName}`,
          error_message: result.error,
          payload: { template: templateName, error: result.error },
        }).catch(() => {});
      }

      await job.updateProgress(Math.round(((i + 1) / totalContacts) * 100));
      await sleep(60);
    }

    // 5. Mark Campaign Completed in Supabase
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
      .eq('id', campaignId);

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
);

campaignWorker.on('completed', (job) => {
  console.log(`[Worker] Event: Job #${job.id} reported completed successfully.`);
});

campaignWorker.on('failed', (job, err) => {
  console.error(`[Worker] Event: Job #${job?.id} failed with error:`, err.message);
});

// Graceful process shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[Worker] Received ${signal}. Gracefully closing worker, intervals, and redis connection...`);
  if (followUpIntervalTimer) clearInterval(followUpIntervalTimer);
  await campaignWorker.close();
  await redisConnection.quit();
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
    const nowIso = new Date().toISOString();
    const { data: dueJobs, error } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('job_type', 'follow_up')
      .lte('scheduled_at', nowIso)
      .limit(20);

    if (error) {
      console.error('[Follow-Up Runner] Error querying due jobs:', error.message);
      return;
    }

    if (!dueJobs || dueJobs.length === 0) {
      return;
    }

    console.log(`[Follow-Up Runner] Found ${dueJobs.length} due follow-up jobs to dispatch.`);

    for (const job of dueJobs) {
      await supabase
        .from('scheduled_jobs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', job.id);

      const workspaceId = job.workspace_id;
      const recipientPhone = job.reference_id;
      const payload = job.payload || {};
      const templateName = payload.templateName || (payload.payload && payload.payload.templateName) || 'teaser_alert';
      const languageCode = payload.languageCode || 'en_US';

      const { data: metaConn } = await supabase
        .from('meta_connections')
        .select('access_token_encrypted, phone_number_id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      const rawToken = metaConn?.access_token_encrypted || process.env.META_ACCESS_TOKEN || '';
      const accessToken = decryptToken(rawToken);
      const phoneNumberId = metaConn?.phone_number_id || process.env.META_PHONE_NUMBER_ID;

      const result = await sendWhatsAppTemplateMessage({
        phoneNumberId,
        accessToken,
        recipientPhone,
        templateName,
        languageCode,
      });

      if (result.success) {
        console.log(`[Follow-Up Runner] Dispatched job ${job.id} to ${recipientPhone}`);
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', job.id);

        await supabase.from('messages').insert({
          workspace_id: workspaceId,
          phone_number: recipientPhone,
          meta_message_id: result.metaMessageId,
          direction: 'outbound',
          type: 'template',
          status: 'sent',
          content: `Follow-Up: ${templateName}`,
          payload: { template: templateName, jobId: job.id },
        }).catch(() => {});
      } else {
        console.error(`[Follow-Up Runner] Failed to dispatch job ${job.id}:`, result.error);
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', job.id);
      }
    }
  } catch (err) {
    console.error('[Follow-Up Runner] Unexpected error in polling cycle:', err.message);
  }
}

// Start polling every 15 seconds
followUpIntervalTimer = setInterval(processDueFollowUpJobs, 15000);
console.log('[Worker] Scheduled follow-up dispatch runner active (15s polling interval).');

