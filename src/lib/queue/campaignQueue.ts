import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { CampaignsDB, MessagesDB, SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';

const REDIS_URL = process.env.REDIS_URL;
const QUEUE_NAME = 'whatsapp-campaigns';

let redisClient: Redis | null = null;
let campaignQueue: Queue | null = null;

function getRedisClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 5000,
        retryStrategy: (times) => Math.min(times * 200, 3000),
      });
      redisClient.on('error', (err) => {
        console.warn('[BullMQ Redis] Connection notice:', err.message);
      });
    } catch (e: any) {
      console.warn('[BullMQ Redis] Client init warning:', e.message);
      return null;
    }
  }
  return redisClient;
}

export function getCampaignQueue(): Queue | null {
  if (campaignQueue) return campaignQueue;
  const client = getRedisClient();
  if (!client) return null;

  try {
    campaignQueue = new Queue(QUEUE_NAME, {
      connection: client,
    });
    return campaignQueue;
  } catch (err: any) {
    console.warn('[BullMQ] Queue creation warning:', err.message);
    return null;
  }
}

export interface EnqueueCampaignOptions {
  campaignId: string;
  workspaceId?: string;
  templateName: string;
  targetTag: string;
  contacts: any[];
  variables?: Record<string, string>;
}

export async function enqueueCampaignJob(options: EnqueueCampaignOptions) {
  const queue = getCampaignQueue();
  const workspaceId = options.workspaceId || DEFAULT_WORKSPACE_ID;

  if (queue) {
    try {
      const job = await queue.add(
        `campaign_${options.campaignId}`,
        {
          campaignId: options.campaignId,
          workspaceId,
          templateName: options.templateName,
          targetTag: options.targetTag,
          contacts: options.contacts,
          variables: options.variables,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        }
      );

      return {
        success: true,
        status: 'queued',
        jobId: job.id,
        mode: 'bullmq_redis',
      };
    } catch (err: any) {
      console.error('[BullMQ] Failed to enqueue to Redis queue:', err.message);
      return {
        success: false,
        status: 'failed',
        error: `BullMQ Redis Queue error: ${err.message}. Ensure Redis server is running.`,
        mode: 'bullmq_redis',
      };
    }
  }

  return {
    success: false,
    status: 'failed',
    error: 'Redis connection unavailable. Campaigns must run through Redis BullMQ workers only.',
    mode: 'bullmq_redis',
  };
}

/**
 * Pause, Resume, Stop, Retry management actions
 */
export async function manageCampaignState(
  campaignId: string,
  action: 'pause' | 'resume' | 'stop' | 'retry',
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  const campaign = CampaignsDB.getById(campaignId, workspaceId);
  if (!campaign) return null;

  if (action === 'pause') {
    return CampaignsDB.update(campaignId, { status: 'paused' }, workspaceId);
  } else if (action === 'resume') {
    return CampaignsDB.update(campaignId, { status: 'processing' }, workspaceId);
  } else if (action === 'stop') {
    return CampaignsDB.update(campaignId, { status: 'stopped' }, workspaceId);
  } else if (action === 'retry') {
    return CampaignsDB.update(campaignId, { status: 'processing', failedCount: 0 }, workspaceId);
  }

  return campaign;
}
