import { randomUUID } from 'crypto';
import { database, checked } from './client';

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
};
