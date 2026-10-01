import { randomUUID } from 'crypto';
import { database, checked } from './client';
import type { Campaign } from './types';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id: string) => id === 'default' ? DEFAULT_ID : id;

function map(row: any): Campaign {
  return { id: row.id, workspaceId: row.workspace_id, workspace_id: row.workspace_id,
    name: row.name, campaign_name: row.name, templateName: row.template_name, template_name: row.template_name,
    targetTag: row.target_tag, target_tag: row.target_tag, status: row.status,
    totalRecipients: row.total_recipients, total_recipients: row.total_recipients,
    sentCount: row.sent_count, sent_count: row.sent_count,
    deliveredCount: row.delivered_count, delivered_count: row.delivered_count,
    readCount: row.read_count, read_count: row.read_count, failedCount: row.failed_count,
    failed_count: row.failed_count, variables: row.variables, scheduledAt: row.scheduled_at,
    completedAt: row.completed_at, completed_at: row.completed_at,
    createdAt: row.created_at, created_at: row.created_at };
}

function values(data: Partial<Campaign>) {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.templateName !== undefined) row.template_name = data.templateName;
  if (data.targetTag !== undefined) row.target_tag = data.targetTag;
  if (data.status !== undefined) row.status = data.status;
  if (data.totalRecipients !== undefined) row.total_recipients = data.totalRecipients;
  if (data.sentCount !== undefined) row.sent_count = data.sentCount;
  if (data.deliveredCount !== undefined) row.delivered_count = data.deliveredCount;
  if (data.readCount !== undefined) row.read_count = data.readCount;
  if (data.failedCount !== undefined) row.failed_count = data.failedCount;
  if (data.variables !== undefined) row.variables = data.variables;
  if (data.scheduledAt !== undefined) row.scheduled_at = data.scheduledAt;
  if (data.completedAt !== undefined) row.completed_at = data.completedAt;
  row.updated_at = new Date().toISOString();
  return row;
}

export const CampaignsDB = {
  async list(workspaceId = DEFAULT_ID): Promise<Campaign[]> {
    const rows = checked(await database().from('campaigns').select('*').eq('workspace_id', workspace(workspaceId))
      .order('created_at', { ascending: false }).limit(1000)) || [];
    return rows.map(map);
  },
  async getById(id: string, workspaceId = DEFAULT_ID): Promise<Campaign | null> {
    const row = checked(await database().from('campaigns').select('*').eq('id', id)
      .eq('workspace_id', workspace(workspaceId)).maybeSingle());
    return row ? map(row) : null;
  },
  async create(data: Partial<Campaign> & { name: string; templateName: string }, workspaceId = DEFAULT_ID): Promise<Campaign> {
    const now = new Date().toISOString();
    const row = checked(await database().from('campaigns').insert({ id: data.id || randomUUID(),
      workspace_id: workspace(workspaceId), name: data.name, template_name: data.templateName,
      target_tag: data.targetTag || 'all', status: data.status || 'pending',
      total_recipients: data.totalRecipients || 0, sent_count: data.sentCount || 0,
      delivered_count: data.deliveredCount || 0, read_count: data.readCount || 0,
      failed_count: data.failedCount || 0, variables: data.variables || {},
      scheduled_at: data.scheduledAt || null, completed_at: data.completedAt || null,
      created_at: now, updated_at: now,
    }).select('*').single());
    return map(row);
  },
  async update(id: string, partial: Partial<Campaign>, workspaceId = DEFAULT_ID): Promise<Campaign | null> {
    const row = checked(await database().from('campaigns').update(values(partial)).eq('id', id)
      .eq('workspace_id', workspace(workspaceId)).select('*').maybeSingle());
    return row ? map(row) : null;
  },
};
