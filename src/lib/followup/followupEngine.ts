import { DEFAULT_WORKSPACE_ID, ScheduledJobsDB } from '@/lib/db';

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
      const saved = await ScheduledJobsDB.schedule({ workspaceId, phoneNumber: options.phoneNumber,
        contactId: options.contactId, stepName: item.stepName, scheduledAt: scheduledTime, payload: item });
      jobIds.push(saved.id);
    }

    console.log(`[Follow-Up Engine] Scheduled ${jobIds.length} follow-up jobs for ${options.phoneNumber}`);
    return { scheduledCount: jobIds.length, jobIds };
  }

  /**
   * Automatically cancel all pending follow-ups when customer sends an inbound reply
   */
  static async cancelPendingOnReply(phoneNumber: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<number> {
    const cancelledCount = await ScheduledJobsDB.cancelPending(phoneNumber, workspaceId);

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
    if (!Number.isFinite(options.interval) || options.interval <= 0) throw new Error('Follow-up interval must be positive');
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
    const stepName = options.stepName || `T+${options.interval}${options.unit[0]}`;
    const payload = { templateName: options.templateName || 'teaser_alert', bodyText: options.bodyText };
    const saved = await ScheduledJobsDB.schedule({ workspaceId, phoneNumber: options.phoneNumber,
      contactId: options.contactId, stepName, scheduledAt: scheduledTime, payload });
    return { jobId: saved.id, scheduledAt: scheduledTime };
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

}
