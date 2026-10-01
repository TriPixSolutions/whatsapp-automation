import { randomUUID } from 'crypto';
import { database, checked } from './client';
import type { Contact, ContactNote, ContactTimelineEvent } from './types';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id: string) => id === 'default' ? DEFAULT_ID : id;
const fields = '*,contact_tags(tag),contact_notes(*)';

export function normalizePhone(phone: string): string {
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (!/^[1-9][0-9]{6,14}$/.test(digits)) throw new Error('Enter a phone number with country code');
  return digits;
}

function mapContact(row: any): Contact {
  const metadata = row.metadata || {};
  return {
    id: row.id, workspaceId: row.workspace_id, workspace_id: row.workspace_id,
    phoneNumber: row.phone_number, phone_number: row.phone_number,
    firstName: row.first_name || '', lastName: row.last_name || '',
    email: row.email, company: row.company_name, leadSource: row.lead_source,
    leadScore: row.lead_score, stage: metadata.pipelineStage || row.stage,
    leadStatus: metadata.leadStatus || 'new', assignedAgent: metadata.assignedAgent || row.assigned_agent_id || 'Unassigned',
    tags: (row.contact_tags || []).map((entry: any) => entry.tag),
    optinStatus: row.optin_status, optin_status: row.optin_status,
    customFields: row.custom_fields || {}, metadata,
    notes: (row.contact_notes || []).map((note: any) => ({ id: note.id, contactId: note.contact_id,
      authorName: note.author_name, content: note.content, createdAt: note.created_at })),
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export const ContactsDB = {
  async list(options: { workspaceId?: string; tag?: string; search?: string; limit?: number } = {}): Promise<Contact[]> {
    const id = workspace(options.workspaceId || DEFAULT_ID);
    const limit = Math.min(Math.max(options.limit || 500, 1), 10000);
    let query = database().from('contacts').select(fields).eq('workspace_id', id).order('created_at', { ascending: false });
    if (options.search) {
      // Fetch and filter in this workspace only; avoid injecting raw search text into PostgREST syntax.
      const rows = checked(await query.limit(10000)) || [];
      const text = options.search.toLowerCase();
      return rows.map(mapContact).filter(contact =>
        `${contact.phoneNumber} ${contact.firstName} ${contact.lastName}`.toLowerCase().includes(text) &&
        (!options.tag || options.tag === 'all' || contact.tags.includes(options.tag.toLowerCase()))).slice(0, limit);
    }
    const rows = checked(await query.limit(options.tag && options.tag !== 'all' ? 10000 : limit)) || [];
    return rows.map(mapContact).filter(contact => !options.tag || options.tag === 'all' || contact.tags.includes(options.tag.toLowerCase())).slice(0, limit);
  },
  async getById(id: string, workspaceId = DEFAULT_ID): Promise<Contact | null> {
    const row = checked(await database().from('contacts').select(fields).eq('workspace_id', workspace(workspaceId)).eq('id', id).maybeSingle());
    return row ? mapContact(row) : null;
  },
  async getByPhone(phone: string, workspaceId = DEFAULT_ID): Promise<Contact | null> {
    const row = checked(await database().from('contacts').select(fields).eq('workspace_id', workspace(workspaceId))
      .eq('phone_normalized', normalizePhone(phone)).maybeSingle());
    return row ? mapContact(row) : null;
  },
  async upsert(data: Partial<Contact> & { phoneNumber: string }, workspaceId = DEFAULT_ID): Promise<Contact> {
    const id = workspace(workspaceId);
    const normalized = normalizePhone(data.phoneNumber);
    const existing = await this.getByPhone(normalized, id);
    const stage = data.stage ?? existing?.stage ?? 'lead';
    const canonicalStage = ['lead', 'contacted', 'qualified', 'opportunity', 'customer'].includes(stage) ? stage :
      stage === 'won' ? 'customer' : ['proposal_sent', 'negotiation'].includes(stage) ? 'opportunity' : 'lead';
    const metadata = { ...existing?.metadata, ...data.metadata, pipelineStage: stage,
      leadStatus: data.leadStatus ?? existing?.leadStatus ?? 'new',
      assignedAgent: data.assignedAgent ?? existing?.assignedAgent ?? 'Unassigned' };
    const row = checked(await database().from('contacts').upsert({
      ...(existing ? { id: existing.id } : {}), workspace_id: id,
      phone_number: `+${normalized}`, phone_normalized: normalized,
      first_name: data.firstName ?? data.first_name ?? existing?.firstName ?? '',
      last_name: data.lastName ?? data.last_name ?? existing?.lastName ?? '',
      email: data.email ?? existing?.email, company_name: data.company ?? existing?.company,
      lead_source: data.leadSource ?? existing?.leadSource ?? 'direct',
      lead_score: data.leadScore ?? existing?.leadScore ?? 50, stage: canonicalStage,
      optin_status: data.optinStatus ?? data.optin_status ?? existing?.optinStatus ?? false,
      custom_fields: { ...existing?.customFields, ...data.customFields }, metadata,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,phone_normalized' }).select('id').single());
    if (!row?.id) throw new Error('Database did not return a saved contact');
    if (data.tags !== undefined) {
      const tags = [...new Set(data.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean))];
      checked(await database().from('contact_tags').delete().eq('workspace_id', id).eq('contact_id', row.id));
      if (tags.length) checked(await database().from('contact_tags').insert(tags.map(tag => ({ workspace_id: id, contact_id: row.id, tag }))));
    }
    const saved = await this.getById(row.id, id);
    if (!saved) throw new Error('Saved contact could not be loaded');
    return saved;
  },
  async addNote(contactId: string, note: { authorName: string; content: string }, workspaceId = DEFAULT_ID): Promise<ContactNote | null> {
    const id = workspace(workspaceId);
    if (!await this.getById(contactId, id)) return null;
    const row = checked(await database().from('contact_notes').insert({ workspace_id: id, contact_id: contactId,
      author_name: note.authorName, content: note.content }).select('*').single());
    return { id: row.id, contactId, authorName: row.author_name, content: row.content, createdAt: row.created_at };
  },
  async addTimelineEvent(contactId: string, event: Omit<ContactTimelineEvent, 'id' | 'contactId' | 'timestamp'>,
    workspaceId = DEFAULT_ID): Promise<ContactTimelineEvent> {
    const id = workspace(workspaceId);
    if (!await this.getById(contactId, id)) throw new Error('Contact not found');
    const types: Record<string, string> = { message_inbound: 'message_received', message_outbound: 'message_sent', automation_triggered: 'flow_triggered' };
    const result = { ...event, id: randomUUID(), contactId, timestamp: new Date().toISOString() };
    checked(await database().from('contact_activities').insert({ id: result.id, workspace_id: id, contact_id: contactId,
      activity_type: types[event.type] || event.type, title: event.title, description: event.description,
      metadata: event.metadata || {}, created_at: result.timestamp }));
    return result;
  },
  async getTimeline(contactId: string, workspaceId = DEFAULT_ID): Promise<ContactTimelineEvent[]> {
    const id = workspace(workspaceId);
    if (!await this.getById(contactId, id)) return [];
    const rows = checked(await database().from('contact_activities').select('*').eq('workspace_id', id)
      .eq('contact_id', contactId).order('created_at', { ascending: false }).limit(200)) || [];
    const types: Record<string, string> = { message_received: 'message_inbound', message_sent: 'message_outbound', flow_triggered: 'automation_triggered' };
    return rows.map(row => ({ id: row.id, contactId, type: types[row.activity_type] || row.activity_type,
      title: row.title, description: row.description, metadata: row.metadata, timestamp: row.created_at }));
  },
  async delete(id: string, workspaceId = DEFAULT_ID): Promise<boolean> {
    const rows = checked(await database().from('contacts').delete().eq('workspace_id', workspace(workspaceId)).eq('id', id).select('id'));
    return Boolean(rows?.length);
  },
  async count(workspaceId = DEFAULT_ID): Promise<number> {
    const result = await database().from('contacts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace(workspaceId));
    checked(result);
    return result.count || 0;
  },
};
