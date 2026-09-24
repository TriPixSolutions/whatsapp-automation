import { getAdminClient } from '@/lib/supabase/server';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';

export interface FollowUpJob {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  contactId?: string;
  stepName: string;
  scheduledAt: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled';
  payload: any;
}

// In-memory registry for low-latency VPS tracking
const inMemoryJobs = new Map<string, FollowUpJob>();

export class FollowUpEngine {
  /**
   * Schedule standard tiered follow-up sequence:
   * T+10m Details -> T+6h Reminder -> T+24h Final Reminder
   */
  static async scheduleSequence(options: {
    phoneNumber: string;
    contactId?: string;
    workspaceId?: string;
  }): Promise<{ scheduledCount: number; jobIds: string[] }> {
    const workspaceId = options.workspaceId || DEFAULT_WORKSPACE_ID;
    const now = Date.now();

    const sequence = [
      {
        stepName: 'T+10m Details',
        delayMs: 10 * 60 * 1000, // 10 minutes
        templateName: 'teaser_alert',
        bodyText: 'Following up on your inquiry! Here are our featured specs and exclusive pricing tiers.',
      },
      {
        stepName: 'T+6h Reminder',
        delayMs: 6 * 60 * 60 * 1000, // 6 hours
        templateName: 'teaser_alert',
        bodyText: 'Just checking in! Would you like our specialist to schedule a 1-on-1 consultation for you?',
      },
      {
        stepName: 'T+24h Final Reminder',
        delayMs: 24 * 60 * 60 * 1000, // 24 hours
        templateName: 'teaser_alert',
        bodyText: 'Final reminder regarding our private showcase catalog. Let us know if you need any assistance!',
      },
    ];

    const jobIds: string[] = [];

    for (const item of sequence) {
      const scheduledTime = new Date(now + item.delayMs).toISOString();
      const jobId = `job_fu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const job: FollowUpJob = {
        id: jobId,
        workspaceId,
        phoneNumber: options.phoneNumber,
        contactId: options.contactId,
        stepName: item.stepName,
        scheduledAt: scheduledTime,
        status: 'pending',
        payload: item,
      };

      inMemoryJobs.set(jobId, job);
      jobIds.push(jobId);

      const supabase = getAdminClient();
      if (supabase) {
        try {
          await supabase
            .from('scheduled_jobs')
            .insert({
              id: jobId,
              workspace_id: workspaceId,
              job_type: 'follow_up',
              reference_id: options.phoneNumber,
              payload: job,
              scheduled_at: scheduledTime,
              status: 'pending',
            });
        } catch {
          // ignore
        }
      }
    }

    console.log(`[Follow-Up Engine] Scheduled ${jobIds.length} follow-up jobs for ${options.phoneNumber}`);
    return { scheduledCount: jobIds.length, jobIds };
  }

  /**
   * Automatically cancel all pending follow-ups when customer sends an inbound reply
   */
  static async cancelPendingOnReply(phoneNumber: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<number> {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    let cancelledCount = 0;

    for (const [id, job] of inMemoryJobs.entries()) {
      if (job.phoneNumber.replace(/[^0-9]/g, '') === cleanPhone && job.status === 'pending') {
        job.status = 'cancelled';
        cancelledCount++;
      }
    }

    const supabase = getAdminClient();
    if (supabase) {
      try {
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'cancelled' })
          .eq('reference_id', phoneNumber)
          .eq('status', 'pending');
      } catch {
        // ignore
      }
    }

    if (cancelledCount > 0) {
      console.log(`[Follow-Up Engine] Customer replied! Cancelled ${cancelledCount} pending follow-ups for ${phoneNumber}`);
    }

    return cancelledCount;
  }

  /**
   * Schedule custom follow-up with flexible duration (minutes, hours, days)
   */
  static async scheduleCustomFollowUp(options: {
    phoneNumber: string;
    contactId?: string;
    workspaceId?: string;
    interval: number;
    unit: 'minutes' | 'hours' | 'days';
    templateName?: string;
    bodyText?: string;
    stepName?: string;
  }): Promise<{ jobId: string; scheduledAt: string }> {
    const workspaceId = options.workspaceId || DEFAULT_WORKSPACE_ID;
    const now = Date.now();
    let delayMs = 0;

    if (options.unit === 'minutes') {
      delayMs = options.interval * 60 * 1000;
    } else if (options.unit === 'hours') {
      delayMs = options.interval * 60 * 60 * 1000;
    } else if (options.unit === 'days') {
      delayMs = options.interval * 24 * 60 * 60 * 1000;
    }

    const scheduledTime = new Date(now + delayMs).toISOString();
    const jobId = `job_fu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const job: FollowUpJob = {
      id: jobId,
      workspaceId,
      phoneNumber: options.phoneNumber,
      contactId: options.contactId,
      stepName: options.stepName || `T+${options.interval}${options.unit[0]}`,
      scheduledAt: scheduledTime,
      status: 'pending',
      payload: {
        templateName: options.templateName || 'teaser_alert',
        bodyText: options.bodyText,
      },
    };

    inMemoryJobs.set(jobId, job);

    const supabase = getAdminClient();
    if (supabase) {
      try {
        await supabase.from('scheduled_jobs').insert({
          id: jobId,
          workspace_id: workspaceId,
          job_type: 'follow_up',
          reference_id: options.phoneNumber,
          payload: job,
          scheduled_at: scheduledTime,
          status: 'pending',
        });
      } catch {
        // ignore
      }
    }

    return { jobId, scheduledAt: scheduledTime };
  }

  /**
   * Schedule multi-step sequence (e.g. 1h, 2h, 5h, 24h)
   */
  static async scheduleMultiStepSequence(options: {
    phoneNumber: string;
    contactId?: string;
    workspaceId?: string;
    steps: {
      interval: number;
      unit: 'minutes' | 'hours' | 'days';
      stepName?: string;
      bodyText?: string;
      templateName?: string;
    }[];
  }): Promise<{ scheduledCount: number; jobIds: string[] }> {
    const jobIds: string[] = [];
    for (const step of options.steps) {
      const res = await this.scheduleCustomFollowUp({
        phoneNumber: options.phoneNumber,
        contactId: options.contactId,
        workspaceId: options.workspaceId,
        interval: step.interval,
        unit: step.unit,
        stepName: step.stepName,
        bodyText: step.bodyText,
        templateName: step.templateName,
      });
      jobIds.push(res.jobId);
    }
    return { scheduledCount: jobIds.length, jobIds };
  }

  /**
   * Run due follow-up jobs
   */
  static async processDueJobs(): Promise<{ executed: number }> {
    const now = new Date();
    let executed = 0;

    for (const job of inMemoryJobs.values()) {
      if (job.status === 'pending' && new Date(job.scheduledAt) <= now) {
        job.status = 'running';

        try {
          await WhatsAppMessageService.send({
            workspaceId: job.workspaceId,
            to: job.phoneNumber,
            type: 'template',
            templateName: job.payload.templateName || 'teaser_alert',
          });

          job.status = 'completed';
          executed++;
        } catch (err: any) {
          console.error(`[Follow-Up Worker Error] Job ${job.id} failed:`, err.message);
          job.status = 'cancelled';
        }
      }
    }

    return { executed };
  }
}
