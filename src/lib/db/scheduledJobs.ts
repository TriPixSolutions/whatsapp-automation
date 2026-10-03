import { randomUUID } from 'crypto';
import { database, checked } from './client';
import type { WorkflowDefinition } from '@/types/automations';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id: string) => id === 'default' ? DEFAULT_ID : id;
const phone = (value: string) => `+${value.replace(/\D/g, '')}`;

export const ScheduledJobsDB = {
  async schedule(data: { workspaceId: string; phoneNumber: string; contactId?: string; stepName: string;
    scheduledAt: string; payload: Record<string, unknown> }) {
    const id = randomUUID();
    const row = checked(await database().from('scheduled_jobs').insert({ id,
      workspace_id: workspace(data.workspaceId), job_type: 'follow_up', reference_id: phone(data.phoneNumber),
      payload: { ...data.payload, contactId: data.contactId, stepName: data.stepName },
      scheduled_at: data.scheduledAt, status: 'pending',
    }).select('*').single());
    return row;
  },
  async cancelPending(phoneNumber: string, workspaceId = DEFAULT_ID): Promise<number> {
    const rows = checked(await database().from('scheduled_jobs').update({ status: 'cancelled',
      updated_at: new Date().toISOString() }).eq('workspace_id', workspace(workspaceId))
      .eq('reference_id', phone(phoneNumber)).eq('job_type', 'follow_up').eq('status', 'pending').select('id')) || [];
    return rows.length;
  },

  async syncWorkflowTrigger(definition: WorkflowDefinition): Promise<void> {
    const workspaceId = workspace(definition.workspaceId);
    checked(await database().from('scheduled_jobs').update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId).eq('job_type', 'workflow_trigger')
      .eq('reference_id', definition.id).eq('status', 'pending'));

    if (!definition.isActive || definition.triggerType !== 'scheduled_trigger') return;
    const trigger = definition.nodes.find((node) => node.type === 'trigger_scheduled');
    if (!trigger) throw new Error('Scheduled workflow needs a scheduled trigger step.');
    const scheduledAt = String(trigger.config?.scheduleAt || '');
    const recipientPhone = phone(String(trigger.config?.recipientPhone || ''));
    const recurrenceMinutes = Number(trigger.config?.recurrenceMinutes || 0);
    if (!scheduledAt || !Number.isFinite(Date.parse(scheduledAt))) throw new Error('Scheduled trigger needs a valid start date and time.');
    if (!/^\+[1-9]\d{7,14}$/.test(recipientPhone)) throw new Error('Scheduled trigger needs an E.164 recipient phone number.');
    checked(await database().from('scheduled_jobs').insert({
      id: randomUUID(), workspace_id: workspaceId, job_type: 'workflow_trigger', reference_id: definition.id,
      payload: { phoneNumber: recipientPhone, recurrenceMinutes: Number.isFinite(recurrenceMinutes) && recurrenceMinutes > 0 ? recurrenceMinutes : 0 },
      scheduled_at: scheduledAt, status: 'pending',
    }));
  },

  async cancelWorkflowTrigger(workflowId: string, workspaceId = DEFAULT_ID): Promise<void> {
    checked(await database().from('scheduled_jobs').update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('workspace_id', workspace(workspaceId)).eq('job_type', 'workflow_trigger')
      .eq('reference_id', workflowId).eq('status', 'pending'));
  },
};
