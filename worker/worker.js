const { getWorkspaceConnection } = require('./connection');
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
const axios = require('axios');
const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

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

    const metaMessageId = response.data?.messages?.[0]?.id;
    if (!metaMessageId) return { success: false, error: 'Meta accepted the request without returning a message ID' };
    return { success: true, metaMessageId, responseData: response.data };
  } catch (error) {
    const errorDetail = error.response?.data?.error?.message || error.message;
    console.error('[Worker API Error] Meta template dispatch failed:', errorDetail);
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

    const {
      campaignId,
      workspaceId,
      templateName = 'teaser_alert',
      targetTag = 'all',
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

    // 1. Fetch Workspace Credentials
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .maybeSingle();

    if (wsError) {
      console.warn(`[Worker] Workspace lookup warning for ${workspaceId}:`, wsError.message);
    }

    const { encryptedToken, phoneNumberId } = await getWorkspaceConnection(supabase, workspaceId);
    const accessToken = decryptToken(encryptedToken);

    // 2. Update Campaign status to 'processing'
    await supabase
      .from('campaigns')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('workspace_id', workspaceId);

    // 3. Fetch Targeted Contacts
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

    // 4. Iterate and dispatch with 60ms rate limit pacing
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
        phoneNumberId,
        accessToken,
        recipientPhone: contact.phone_number,
        templateName,
        languageCode,
      });

      if (result.success) {
        sentCount++;
        const { error: messageError } = await supabase.from('messages').upsert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          phone_number: contact.phone_number,
          meta_message_id: result.metaMessageId,
          direction: 'outbound',
          type: 'template',
          status: 'sent',
          content: `Template: ${templateName}`,
          payload: { template: templateName, recipient: contact.phone_number },
        }, { onConflict: 'meta_message_id', ignoreDuplicates: true });
        if (messageError) console.error(`[Worker] Message ledger warning for campaign recipient ${contact.id}:`, messageError.message);
        const { error: recipientError } = await supabase.from('campaign_contacts').update({
          status: 'sent', meta_message_id: result.metaMessageId, sent_at: new Date().toISOString(), error_message: null,
        }).eq('campaign_id', campaignId).eq('contact_id', contact.id);
        if (recipientError) throw recipientError;
      } else {
        failedCount++;
        const { error: messageError } = await supabase.from('messages').insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          phone_number: contact.phone_number,
          direction: 'outbound',
          type: 'template',
          status: 'failed',
          content: `Template: ${templateName}`,
          error_message: result.error,
          payload: { template: templateName, error: result.error },
        });
        if (messageError) console.error(`[Worker] Failure ledger warning for campaign recipient ${contact.id}:`, messageError.message);
        const { error: recipientError } = await supabase.from('campaign_contacts').update({
          status: 'failed', error_message: result.error,
        }).eq('campaign_id', campaignId).eq('contact_id', contact.id);
        if (recipientError) throw recipientError;
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
  if (workflowDelayTimer) clearInterval(workflowDelayTimer);
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
        const { encryptedToken, phoneNumberId } = await getWorkspaceConnection(supabase, workspaceId);
        const result = await sendWhatsAppTemplateMessage({ phoneNumberId, accessToken: decryptToken(encryptedToken),
          recipientPhone, templateName, languageCode });
        if (!result.success) throw new Error(result.error || 'Meta dispatch failed');
        const { error: ledgerError } = await supabase.from('messages').upsert({
          workspace_id: workspaceId, phone_number: recipientPhone, meta_message_id: result.metaMessageId,
          direction: 'outbound', type: 'template', status: 'sent', content: `Follow-Up: ${templateName}`,
          payload: { template: templateName, jobId: job.id },
        }, { onConflict: 'meta_message_id', ignoreDuplicates: true });
        if (ledgerError) console.error(`[Follow-Up Runner] Message ledger warning for job ${job.id}:`, ledgerError.message);
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

// Start polling every 15 seconds
followUpIntervalTimer = setInterval(processDueFollowUpJobs, 15000);
console.log('[Worker] Scheduled follow-up dispatch runner active (15s polling interval).');


const { createDelayPoller } = require('./workflow-delays');
const pollWorkflowDelays = createDelayPoller();
const workflowDelayTimer = setInterval(() => {
  pollWorkflowDelays().catch(error => console.error('[Workflow Delay Runner]', error.message));
}, 15000);
