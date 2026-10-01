import { database, checked } from './client';
import { ContactsDB, normalizePhone } from './contacts';
import type { Message, MessageStatus } from './types';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id: string) => id === 'default' ? DEFAULT_ID : id;

function mapMessage(row: any): Message {
  return { id: row.id, workspaceId: row.workspace_id, workspace_id: row.workspace_id,
    conversationId: row.conversation_id, contactId: row.contact_id, contact_id: row.contact_id,
    metaMessageId: row.meta_message_id, meta_message_id: row.meta_message_id,
    phoneNumber: row.phone_number, phone_number: row.phone_number, direction: row.direction,
    type: row.type, status: row.status, content: row.content, payload: row.payload,
    mediaUrl: row.media_url, errorMessage: row.error_message, createdAt: row.created_at,
    created_at: row.created_at, updatedAt: row.updated_at };
}

export const MessagesDB = {
  async create(data: Partial<Message> & { phoneNumber: string; direction: Message['direction'] }, workspaceId = DEFAULT_ID): Promise<Message> {
    const id = workspace(workspaceId);
    const contactId = data.contactId || data.contact_id;
    if (contactId && !await ContactsDB.getById(contactId, id)) throw new Error('Contact not found in this workspace');
    const metaId = data.metaMessageId || data.meta_message_id || null;
    const row = {
      workspace_id: id, contact_id: contactId || null,
      phone_number: `+${normalizePhone(data.phoneNumber)}`, meta_message_id: metaId,
      direction: data.direction, type: data.type || 'text', status: data.status || 'pending',
      content: data.content || '', media_url: data.mediaUrl || data.media_url || null,
      payload: data.payload || {}, error_message: data.errorMessage || data.error_message || null,
      created_at: data.createdAt || new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const query = metaId ? database().from('messages').upsert(row, { onConflict: 'meta_message_id', ignoreDuplicates: true }) : database().from('messages').insert(row);
    const saved = checked(await query.select('*').maybeSingle());
    if (saved) return mapMessage(saved);
    const existing = metaId ? await this.getByMetaId(metaId, id) : null;
    if (!existing) throw new Error('Message could not be saved in this workspace');
    return existing;
  },
  async list(options: { workspaceId?: string; phoneNumber?: string; limit?: number } = {}): Promise<Message[]> {
    let query = database().from('messages').select('*').eq('workspace_id', workspace(options.workspaceId || DEFAULT_ID));
    if (options.phoneNumber) query = query.eq('phone_number', `+${normalizePhone(options.phoneNumber)}`);
    const rows = checked(await query.order('created_at', { ascending: false }).limit(Math.min(Math.max(options.limit || 100, 1), 10000))) || [];
    return rows.map(mapMessage);
  },
  async getByMetaId(metaMessageId: string, workspaceId = DEFAULT_ID): Promise<Message | null> {
    const row = checked(await database().from('messages').select('*').eq('workspace_id', workspace(workspaceId)).eq('meta_message_id', metaMessageId).maybeSingle());
    return row ? mapMessage(row) : null;
  },
  async updateStatus(metaMessageId: string, status: MessageStatus, errorMessage?: string, workspaceId = DEFAULT_ID): Promise<boolean> {
    const id = workspace(workspaceId);
    const rank: Record<MessageStatus, number> = { pending: 0, sent: 1, failed: 1, delivered: 2, read: 3 };
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.getByMetaId(metaMessageId, id);
      if (!current) return false;
      if (current.status === status || rank[status] < rank[current.status] || (current.status === 'failed' && status === 'sent')) return true;
      const changed = checked(await database().from('messages').update({ status, error_message: status === 'failed' ? errorMessage : null,
        updated_at: new Date().toISOString() }).eq('workspace_id', id).eq('id', current.id).eq('status', current.status).select('id'));
      if (!changed?.length) continue; // Another receipt won; re-read instead of overwriting its state.
      checked(await database().from('message_statuses').insert({ workspace_id: id, message_id: current.id,
        meta_message_id: metaMessageId, status, error_details: errorMessage ? { message: errorMessage } : null }));
      return true;
    }
    throw new Error('Message status changed concurrently; retry the receipt');
  },
  async getRecentConversations(workspaceId = DEFAULT_ID) {
    const rows = checked(await database().rpc('inbox_conversations', { p_workspace_id: workspace(workspaceId), p_limit: 100 })) || [];
    return rows.map((row: any) => ({ phoneNumber: row.phone_number, contactName: row.contact_name,
      lastMessage: row.last_message, lastTime: row.last_time, unreadCount: row.unread_count, status: row.status }));
  },
  async getStats(workspaceId = DEFAULT_ID) {
    const id = workspace(workspaceId);
    const count = async (statuses?: string[]) => {
      let query = database().from('messages').select('id', { count: 'exact', head: true }).eq('workspace_id', id).eq('direction', 'outbound');
      if (statuses) query = query.in('status', statuses);
      const result = await query; checked(result); return result.count || 0;
    };
    const [total, delivered, read, failed, conversations] = await Promise.all([count(), count(['delivered', 'read']), count(['read']), count(['failed']),
      database().from('conversations').select('id', { count: 'exact', head: true }).eq('workspace_id', id)]);
    checked(conversations);
    return { messagesSent: total, deliveredCount: delivered, readCount: read, failedCount: failed,
      deliveryRate: total ? `${Math.round(delivered / total * 100)}%` : '0%', activeChatsCount: conversations.count || 0 };
  },
};
