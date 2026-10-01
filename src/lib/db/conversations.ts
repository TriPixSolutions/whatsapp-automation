import { randomUUID } from 'crypto';
import { database, checked } from './client';
import { normalizePhone } from './contacts';
import type { Conversation, ConversationState } from './types';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id: string) => id === 'default' ? DEFAULT_ID : id;

export const ConversationsDB = {
  async get(identifier: string, workspaceId = DEFAULT_ID): Promise<Conversation | null> {
    let query = database().from('conversations').select('*').eq('workspace_id', workspace(workspaceId));
    query = /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(identifier) ? query.eq('contact_id', identifier) : query.eq('phone_number', `+${normalizePhone(identifier)}`);
    return checked(await query.maybeSingle());
  },
  async list(workspaceId = DEFAULT_ID): Promise<Conversation[]> {
    return checked(await database().from('conversations').select('*').eq('workspace_id', workspace(workspaceId))
      .order('updated_at', { ascending: false }).limit(1000)) || [];
  },
  async isWindowOpen(identifier: string, workspaceId = DEFAULT_ID): Promise<boolean> {
    const conversation = await this.get(identifier, workspaceId);
    const inboundAt = conversation?.last_inbound_at ? new Date(conversation.last_inbound_at).getTime() : NaN;
    return Number.isFinite(inboundAt) && inboundAt <= Date.now() && inboundAt + 86400000 > Date.now();
  },
  async recordInbound(phoneNumber: string, contactId: string, workspaceId = DEFAULT_ID,
    eventId: string = randomUUID(), receivedAt = new Date().toISOString()): Promise<Conversation> {
    const rows = checked(await database().rpc('record_conversation_event', { p_workspace_id: workspace(workspaceId),
      p_contact_id: contactId, p_phone_number: `+${normalizePhone(phoneNumber)}`, p_direction: 'inbound',
      p_event_id: eventId, p_occurred_at: receivedAt }));
    if (!rows?.[0]) throw new Error('Conversation event could not be saved');
    return rows[0];
  },
  async recordOutbound(phoneNumber: string, contactId: string, workspaceId = DEFAULT_ID, eventId: string = randomUUID()): Promise<Conversation> {
    const rows = checked(await database().rpc('record_conversation_event', { p_workspace_id: workspace(workspaceId),
      p_contact_id: contactId, p_phone_number: `+${normalizePhone(phoneNumber)}`, p_direction: 'outbound',
      p_event_id: eventId, p_occurred_at: new Date().toISOString() }));
    if (!rows?.[0]) throw new Error('Conversation event could not be saved');
    return rows[0];
  },
  async markRead(identifier: string, workspaceId = DEFAULT_ID): Promise<boolean> {
    const conversation = await this.get(identifier, workspaceId);
    if (!conversation) return false;
    checked(await database().from('conversations').update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversation.id).eq('workspace_id', workspace(workspaceId)));
    return true;
  },
  async updateState(identifier: string, state: ConversationState, workspaceId = DEFAULT_ID): Promise<Conversation | null> {
    const conversation = await this.get(identifier, workspaceId);
    if (!conversation) return null;
    return checked(await database().from('conversations').update({ state, updated_at: new Date().toISOString() })
      .eq('id', conversation.id).eq('workspace_id', workspace(workspaceId)).select('*').maybeSingle());
  },
  async assignAgent(identifier: string, agentId: string, workspaceId = DEFAULT_ID): Promise<Conversation | null> {
    const id = workspace(workspaceId);
    const member = checked(await database().from('workspace_members').select('user_id').eq('workspace_id', id).eq('user_id', agentId).eq('is_active', true).maybeSingle());
    if (!member) throw new Error('Agent does not belong to this workspace');
    const conversation = await this.get(identifier, id);
    if (!conversation) return null;
    return checked(await database().from('conversations').update({ assigned_agent_id: agentId, updated_at: new Date().toISOString() })
      .eq('id', conversation.id).eq('workspace_id', id).select('*').maybeSingle());
  },
};
