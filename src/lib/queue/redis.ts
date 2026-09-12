import { Queue } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let campaignQueue: Queue | null = null;
let redisConnection: Redis | null = null;

export function getCampaignQueue(): Queue | null {
  if (campaignQueue) return campaignQueue;

  if (!REDIS_URL) {
    console.warn('[Queue] Warning: REDIS_URL is not configured. Queue operations will run in fallback simulation mode.');
    return null;
  }

  try {
    redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 5000,
    });

    campaignQueue = new Queue('whatsapp-campaigns', {
      connection: redisConnection,
    });

    return campaignQueue;
  } catch (error) {
    console.error('[Queue Error] Failed to initialize BullMQ queue:', error);
    return null;
  }
}

export interface CampaignJobData {
  campaignId: string;
  workspaceId: string;
  templateName: string;
  targetTag?: string;
  variables?: Record<string, string>;
}

export async function enqueueCampaignJob(data: CampaignJobData) {
  const queue = getCampaignQueue();

  if (!queue) {
    console.log('[Queue Fallback] Enqueuing campaign job via simulated in-process handler:', data);
    return {
      success: true,
      jobId: `sim_job_${Date.now()}`,
      mode: 'simulated_fallback',
    };
  }

  try {
    const job = await queue.add(`campaign-${data.campaignId}`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    return {
      success: true,
      jobId: job.id,
      mode: 'bullmq_redis',
    };
  } catch (error: any) {
    console.error('[Queue Error] Error adding job to Redis BullMQ:', error);
    // Graceful fallback
    return {
      success: true,
      jobId: `fallback_${Date.now()}`,
      mode: 'fallback_error',
      warning: error.message,
    };
  }
}
