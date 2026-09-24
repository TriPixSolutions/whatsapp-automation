import { getAdminClient } from '@/lib/supabase/server';
import { encryptToken, decryptToken, hashPassword, verifyPassword } from '@/lib/crypto';
import {
  WorkspaceSettings,
  Contact,
  Message,
  AutomationFlow,
  Campaign,
  UserRecord,
  UserRole,
  UserStatus,
  ActivityLogItem,
  AdminMetrics,
  DataDeletionRecord,
  IntegrationRecord,
  MessageStatus,
  Conversation,
} from './types';

export * from './types';
export { hashPassword, verifyPassword };

export const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Safe helper to execute Supabase mutations without throwing or breaking on PromiseLike signatures
 */
function safeSupabaseSync(task: () => Promise<any> | PromiseLike<any>, context?: string): void {
  try {
    const res = task();
    if (res && typeof res.then === 'function') {
      res.then(
        () => {},
        (err: any) => {
          if (context) {
            console.warn(`[Supabase Sync] ${context} warning:`, err?.message || err);
          }
        }
      );
    }
  } catch (err: any) {
    if (context) {
      console.warn(`[Supabase Sync] ${context} warning:`, err?.message || err);
    }
  }
}

// In-memory tenant fallback state for zero-latency local operations and sandbox testing
interface TenantState {
  settings: WorkspaceSettings;
  contacts: Map<string, Contact>;
  conversations: Map<string, Conversation>;
  messages: Message[];
  automations: Map<string, AutomationFlow>;
  campaigns: Map<string, Campaign>;
  users: Map<string, UserRecord>;
  activity: ActivityLogItem[];
  deletions: Map<string, DataDeletionRecord>;
  integrations: Map<string, IntegrationRecord>;
}

const memoryState: TenantState = {
  settings: {
    id: DEFAULT_WORKSPACE_ID,
    name: 'TriPix Solutions Workspace',
    wabaId: process.env.META_WABA_ID || '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
    accessToken: process.env.META_ACCESS_TOKEN || '',
    verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'tripix_verify_token_2026',
    webhookUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`
      : 'https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp',
    catalogId: process.env.META_CATALOG_ID || '',
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    adAccountId: process.env.META_AD_ACCOUNT_ID || '',
    adminUsername: 'Admin',
    adminPassword: '',
    customSubdomain: '',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  contacts: new Map(),
  conversations: new Map(),
  messages: [],
  automations: new Map(),
  campaigns: new Map(),
  users: new Map(),
  activity: [],
  deletions: new Map(),
  integrations: new Map(),
};

// Seed initial default super admin into memory
const defaultSuperAdmin: UserRecord = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@tripixsolutions.com',
  passwordHash: hashPassword('AdminPass2026!'),
  name: 'System Administrator',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  provider: 'email',
  role: 'super_admin',
  status: 'approved',
  company: 'TriPix Solutions',
  intendedUse: 'WhatsApp Cloud Automation & Multi-tenant SaaS',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
memoryState.users.set(defaultSuperAdmin.id, defaultSuperAdmin);
memoryState.users.set(defaultSuperAdmin.email, defaultSuperAdmin);

// Seed default automations into memory
const defaultFlow: AutomationFlow = {
  id: 'flow_welcome_001',
  name: 'Welcome Concierge Flow',
  triggerKeyword: 'hi',
  triggerType: 'keyword',
  actionType: 'buttons',
  actionPayload: {
    header: 'TriPix Solutions',
    body: 'Hello! Welcome to our automated WhatsApp concierge. How may we assist you today?',
    footer: 'Official WhatsApp Business Verified',
    buttons: [
      { id: 'btn_show_catalog', title: 'Browse Products' },
      { id: 'btn_vip_pricing', title: 'VIP Pricing' },
      { id: 'btn_agent_talk', title: 'Talk to Agent' },
    ],
  },
  isActive: true,
  executionCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
memoryState.automations.set(defaultFlow.id, defaultFlow);

// ==============================================================================
// 1. WORKSPACES & SETTINGS REPOSITORY
// ==============================================================================
export const SettingsDB = {
  get(workspaceId: string = DEFAULT_WORKSPACE_ID): WorkspaceSettings {
    const s = memoryState.settings;
    const rawToken = s.accessToken || process.env.META_ACCESS_TOKEN || '';
    const rawSecret = s.appSecret || process.env.META_APP_SECRET || '';
    return {
      ...s,
      wabaId: s.wabaId || process.env.META_WABA_ID || '',
      phoneNumberId: s.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '',
      accessToken: decryptToken(rawToken),
      appSecret: decryptToken(rawSecret),
      verifyToken: s.verifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN || 'tripix_verify_token_2026',
      appId: s.appId || process.env.META_APP_ID || '',
    };
  },

  update(partial: Partial<WorkspaceSettings>, workspaceId: string = DEFAULT_WORKSPACE_ID): WorkspaceSettings {
    const current = memoryState.settings;
    const encryptedToken = partial.accessToken ? encryptToken(partial.accessToken) : current.accessToken;
    const encryptedSecret = partial.appSecret ? encryptToken(partial.appSecret) : current.appSecret;

    const updated: WorkspaceSettings = {
      ...current,
      ...partial,
      accessToken: encryptedToken,
      appSecret: encryptedSecret,
      updatedAt: new Date().toISOString(),
    };

    memoryState.settings = updated;

    // Async persist to Supabase if available
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('workspaces').upsert({
          id: workspaceId,
          name: updated.name,
          updated_at: updated.updatedAt,
        });
        await supabase.from('meta_connections').upsert({
          workspace_id: workspaceId,
          waba_id: updated.wabaId || 'default_waba',
          access_token_encrypted: encryptedToken,
          webhook_verify_token: updated.verifyToken,
          app_id: updated.appId,
          app_secret_encrypted: encryptedSecret,
          catalog_id: updated.catalogId,
          ad_account_id: updated.adAccountId,
          status: 'connected',
          updated_at: updated.updatedAt,
        });
      }, 'Settings update');
    }

    return {
      ...updated,
      accessToken: decryptToken(updated.accessToken),
      appSecret: decryptToken(updated.appSecret || ''),
    };
  },
};

export const WorkspacesDB = {
  async getById(workspaceId: string) {
    const supabase = getAdminClient();
    if (supabase) {
      const { data } = await supabase.from('workspaces').select('*').eq('id', workspaceId).maybeSingle();
      if (data) return data;
    }
    return {
      id: workspaceId,
      name: memoryState.settings.name,
      subdomain: 'default',
    };
  },

  async list() {
    const supabase = getAdminClient();
    if (supabase) {
      const { data } = await supabase.from('workspaces').select('*');
      if (data && data.length > 0) return data;
    }
    return [
      {
        id: DEFAULT_WORKSPACE_ID,
        name: memoryState.settings.name,
        subdomain: 'default',
      },
    ];
  },
};

// ==============================================================================
// 2. CONTACTS REPOSITORY (Strict Tenant-Scoped)
// ==============================================================================
export const ContactsDB = {
  list(options: { workspaceId?: string; tag?: string; search?: string; limit?: number } = {}): Contact[] {
    const { workspaceId = DEFAULT_WORKSPACE_ID, tag, search, limit = 500 } = options;
    let list = Array.from(memoryState.contacts.values()).filter(
      (c) => (c.workspaceId || c.workspace_id) === workspaceId
    );

    if (tag && tag !== 'all') {
      list = list.filter((c) => c.tags.includes(tag.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.phoneNumber.includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q)
      );
    }

    return list.slice(0, limit);
  },

  getById(id: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Contact | null {
    const contact = memoryState.contacts.get(id);
    if (contact && (contact.workspaceId || contact.workspace_id) === workspaceId) {
      return contact;
    }
    return null;
  },

  getByPhone(phone: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Contact | null {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    for (const c of memoryState.contacts.values()) {
      if ((c.workspaceId || c.workspace_id) === workspaceId) {
        if (c.phoneNumber.replace(/[^0-9]/g, '') === cleanPhone) {
          return c;
        }
      }
    }
    return null;
  },

  upsert(contactData: Partial<Contact> & { phoneNumber: string }, workspaceId: string = DEFAULT_WORKSPACE_ID): Contact {
    const cleanPhone = contactData.phoneNumber.startsWith('+')
      ? contactData.phoneNumber
      : `+${contactData.phoneNumber.replace(/[^0-9]/g, '')}`;

    const existing = this.getByPhone(cleanPhone, workspaceId);
    const now = new Date().toISOString();

    const contact: Contact = {
      id: existing ? existing.id : `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      workspace_id: workspaceId,
      phoneNumber: cleanPhone,
      phone_number: cleanPhone,
      firstName: contactData.firstName || contactData.first_name || existing?.firstName || '',
      first_name: contactData.firstName || contactData.first_name || existing?.firstName || '',
      lastName: contactData.lastName || contactData.last_name || existing?.lastName || '',
      last_name: contactData.lastName || contactData.last_name || existing?.lastName || '',
      tags: contactData.tags || existing?.tags || ['vip'],
      optinStatus: contactData.optinStatus !== undefined ? contactData.optinStatus : existing?.optinStatus ?? true,
      optin_status: contactData.optinStatus !== undefined ? contactData.optinStatus : existing?.optinStatus ?? true,
      metadata: { ...(existing?.metadata || {}), ...(contactData.metadata || {}) },
      createdAt: existing ? existing.createdAt : now,
      created_at: existing ? existing.createdAt : now,
      updatedAt: now,
      updated_at: now,
    };

    memoryState.contacts.set(contact.id, contact);

    // Async persist to Supabase
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('contacts').upsert(
          {
            workspace_id: workspaceId,
            phone_number: cleanPhone,
            first_name: contact.firstName,
            last_name: contact.lastName,
            optin_status: contact.optinStatus,
            metadata: contact.metadata,
            updated_at: now,
          },
          { onConflict: 'workspace_id,phone_number' }
        );
      }, 'Contact upsert');
    }

    return contact;
  },

  delete(id: string, workspaceId: string = DEFAULT_WORKSPACE_ID): boolean {
    const deleted = memoryState.contacts.delete(id);
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('contacts').delete().eq('id', id).eq('workspace_id', workspaceId);
      }, 'Contact delete');
    }
    return deleted;
  },

  count(workspaceId: string = DEFAULT_WORKSPACE_ID): number {
    return this.list({ workspaceId }).length;
  },
};

// ==============================================================================
// 3. MESSAGES & CONVERSATIONS REPOSITORY
// ==============================================================================
export const MessagesDB = {
  create(data: Partial<Message> & { phoneNumber: string; direction: Message['direction'] }, workspaceId: string = DEFAULT_WORKSPACE_ID): Message {
    const cleanPhone = data.phoneNumber.startsWith('+')
      ? data.phoneNumber
      : `+${data.phoneNumber.replace(/[^0-9]/g, '')}`;

    const now = new Date().toISOString();
    const message: Message = {
      id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      workspace_id: workspaceId,
      metaMessageId: data.metaMessageId || data.meta_message_id || `wamid.local_${Date.now()}`,
      meta_message_id: data.metaMessageId || data.meta_message_id || `wamid.local_${Date.now()}`,
      phoneNumber: cleanPhone,
      phone_number: cleanPhone,
      contactId: data.contactId || data.contact_id,
      contact_id: data.contactId || data.contact_id,
      direction: data.direction,
      type: data.type || 'text',
      status: data.status || 'pending',
      content: data.content || '',
      mediaUrl: data.mediaUrl || data.media_url,
      media_url: data.mediaUrl || data.media_url,
      payload: data.payload,
      errorMessage: data.errorMessage || data.error_message,
      error_message: data.errorMessage || data.error_message,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
    };

    memoryState.messages.unshift(message);

    // Keep memory message buffer sane on low-resource VPS
    if (memoryState.messages.length > 2000) {
      memoryState.messages = memoryState.messages.slice(0, 2000);
    }

    // Async persist to Supabase
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('messages').insert({
          workspace_id: workspaceId,
          contact_id: message.contactId,
          phone_number: cleanPhone,
          meta_message_id: message.metaMessageId,
          direction: message.direction,
          type: message.type,
          status: message.status,
          content: message.content,
          media_url: message.mediaUrl,
          payload: message.payload,
          error_message: message.errorMessage,
          created_at: now,
        });
      }, 'Message insert');
    }

    return message;
  },

  list(options: { workspaceId?: string; phoneNumber?: string; limit?: number } = {}): Message[] {
    const { workspaceId = DEFAULT_WORKSPACE_ID, phoneNumber, limit = 100 } = options;
    let list = memoryState.messages.filter(
      (m) => (m.workspaceId || m.workspace_id) === workspaceId
    );

    if (phoneNumber) {
      const clean = phoneNumber.replace(/[^0-9]/g, '');
      list = list.filter((m) => m.phoneNumber.replace(/[^0-9]/g, '') === clean);
    }

    return list.slice(0, limit);
  },

  getByMetaId(metaMessageId: string): Message | null {
    return memoryState.messages.find((m) => m.metaMessageId === metaMessageId) || null;
  },

  updateStatus(metaMessageId: string, status: MessageStatus, errorMessage?: string): boolean {
    const msg = this.getByMetaId(metaMessageId);
    if (msg) {
      msg.status = status;
      if (errorMessage) msg.errorMessage = errorMessage;
      msg.updatedAt = new Date().toISOString();
    }

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase
          .from('messages')
          .update({ status, error_message: errorMessage, updated_at: new Date().toISOString() })
          .eq('meta_message_id', metaMessageId);

        await supabase.from('message_statuses').insert({
          workspace_id: msg?.workspaceId || DEFAULT_WORKSPACE_ID,
          meta_message_id: metaMessageId,
          status,
          error_details: errorMessage ? { message: errorMessage } : null,
        });
      }, 'Message status update');
    }

    return Boolean(msg);
  },

  getRecentConversations(workspaceId: string = DEFAULT_WORKSPACE_ID) {
    const conversationsMap = new Map<string, {
      phoneNumber: string;
      contactName?: string;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
      status: MessageStatus;
    }>();

    for (const msg of memoryState.messages) {
      const phone = msg.phoneNumber;
      if (!conversationsMap.has(phone)) {
        const contact = ContactsDB.getByPhone(phone, workspaceId);
        const name = contact ? `${contact.firstName} ${contact.lastName}`.trim() : phone;
        conversationsMap.set(phone, {
          phoneNumber: phone,
          contactName: name || phone,
          lastMessage: msg.content,
          lastTime: msg.createdAt,
          unreadCount: msg.direction === 'inbound' && msg.status !== 'read' ? 1 : 0,
          status: msg.status,
        });
      }
    }

    return Array.from(conversationsMap.values());
  },

  getStats(workspaceId: string = DEFAULT_WORKSPACE_ID) {
    const wsMessages = memoryState.messages.filter(
      (m) => !m.workspaceId || m.workspaceId === workspaceId
    );
    const total = wsMessages.length;
    const delivered = wsMessages.filter((m) => ['delivered', 'read'].includes(m.status)).length;
    const read = wsMessages.filter((m) => m.status === 'read').length;
    const failed = wsMessages.filter((m) => m.status === 'failed').length;
    const activeChatsCount = new Set(wsMessages.map((m) => m.phoneNumber)).size;

    const rate = total > 0 ? `${Math.round((delivered / total) * 100)}%` : '0%';

    return {
      messagesSent: total,
      deliveredCount: delivered,
      readCount: read,
      failedCount: failed,
      deliveryRate: rate,
      activeChatsCount,
    };
  },
};

// ==============================================================================
// 3b. CONVERSATIONS REPOSITORY (24-Hour Policy Window & State Tracking)
// ==============================================================================
export const ConversationsDB = {
  get(identifier: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Conversation | null {
    const cleanPhone = identifier.replace(/[^0-9]/g, '');
    for (const conv of memoryState.conversations.values()) {
      if (conv.workspace_id === workspaceId) {
        if (conv.contact_id === identifier || conv.phone_number.replace(/[^0-9]/g, '') === cleanPhone) {
          return conv;
        }
      }
    }
    return null;
  },

  list(workspaceId: string = DEFAULT_WORKSPACE_ID): Conversation[] {
    return Array.from(memoryState.conversations.values())
      .filter((c) => c.workspace_id === workspaceId)
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  },

  isWindowOpen(identifier: string, workspaceId: string = DEFAULT_WORKSPACE_ID): boolean {
    const conv = this.get(identifier, workspaceId);
    if (conv && conv.window_expires_at) {
      const expires = new Date(conv.window_expires_at).getTime();
      return !isNaN(expires) && expires > Date.now();
    }
    // Fallback: check latest inbound message from MessagesDB
    const cleanPhone = identifier.replace(/[^0-9]/g, '');
    const recentMessages = MessagesDB.list({ workspaceId, phoneNumber: cleanPhone, limit: 10 });
    const lastInbound = recentMessages.find((m) => m.direction === 'inbound');
    if (lastInbound && lastInbound.createdAt) {
      return new Date(lastInbound.createdAt).getTime() + 24 * 60 * 60 * 1000 > Date.now();
    }
    return false;
  },

  recordInbound(phoneNumber: string, contactId: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Conversation {
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    const now = new Date().toISOString();
    const windowExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const existing = this.get(cleanPhone, workspaceId);

    const conv: Conversation = {
      id: existing ? existing.id : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspace_id: workspaceId,
      contact_id: contactId,
      phone_number: cleanPhone,
      last_inbound_at: now,
      last_outbound_at: existing?.last_outbound_at || null,
      window_expires_at: windowExpiry,
      state: 'open',
      unread_count: (existing?.unread_count || 0) + 1,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    memoryState.conversations.set(conv.id, conv);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('conversations').upsert(
          {
            workspace_id: workspaceId,
            contact_id: contactId,
            phone_number: cleanPhone,
            last_inbound_at: now,
            window_expires_at: windowExpiry,
            state: 'open',
            unread_count: conv.unread_count,
            updated_at: now,
          },
          { onConflict: 'workspace_id,contact_id' }
        );
      }, 'Conversation recordInbound');
    }

    return conv;
  },

  recordOutbound(phoneNumber: string, contactId: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Conversation {
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    const now = new Date().toISOString();
    const existing = this.get(cleanPhone, workspaceId);

    const windowOpen = existing?.window_expires_at
      ? new Date(existing.window_expires_at).getTime() > Date.now()
      : false;

    const conv: Conversation = {
      id: existing ? existing.id : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspace_id: workspaceId,
      contact_id: contactId,
      phone_number: cleanPhone,
      last_inbound_at: existing?.last_inbound_at || null,
      last_outbound_at: now,
      window_expires_at: existing?.window_expires_at || null,
      state: windowOpen ? 'open' : 'closed',
      unread_count: existing?.unread_count || 0,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    memoryState.conversations.set(conv.id, conv);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('conversations').upsert(
          {
            workspace_id: workspaceId,
            contact_id: contactId,
            phone_number: cleanPhone,
            last_outbound_at: now,
            state: conv.state,
            updated_at: now,
          },
          { onConflict: 'workspace_id,contact_id' }
        );
      }, 'Conversation recordOutbound');
    }

    return conv;
  },

  markRead(phoneNumber: string, workspaceId: string = DEFAULT_WORKSPACE_ID): boolean {
    const conv = this.get(phoneNumber, workspaceId);
    if (conv) {
      conv.unread_count = 0;
      conv.updated_at = new Date().toISOString();

      const supabase = getAdminClient();
      if (supabase) {
        safeSupabaseSync(async () => {
          await supabase
            .from('conversations')
            .update({ unread_count: 0, updated_at: new Date().toISOString() })
            .eq('id', conv.id);
        }, 'Conversation markRead');
      }
      return true;
    }
    return false;
  },
};

// ==============================================================================
// 4. AUTOMATIONS REPOSITORY
// ==============================================================================
export const AutomationsDB = {
  list(workspaceId: string = DEFAULT_WORKSPACE_ID): AutomationFlow[] {
    return Array.from(memoryState.automations.values()).filter(
      (a) => (a.workspaceId || a.workspace_id) === workspaceId
    );
  },

  getById(id: string, workspaceId: string = DEFAULT_WORKSPACE_ID): AutomationFlow | null {
    const flow = memoryState.automations.get(id);
    if (flow && (flow.workspaceId || flow.workspace_id) === workspaceId) {
      return flow;
    }
    return null;
  },

  findMatch(keyword: string, workspaceId: string = DEFAULT_WORKSPACE_ID): AutomationFlow | null {
    const cleanKeyword = keyword.trim().toLowerCase();
    for (const flow of memoryState.automations.values()) {
      if (!flow.isActive) continue;
      if ((flow.workspaceId || flow.workspace_id) !== workspaceId) continue;
      const trigger = flow.triggerKeyword.toLowerCase();
      if (flow.triggerType === 'exact_match' && trigger === cleanKeyword) {
        return flow;
      }
      if (cleanKeyword.includes(trigger) || trigger.includes(cleanKeyword)) {
        return flow;
      }
    }
    return null;
  },

  create(flowData: Partial<AutomationFlow> & { triggerKeyword: string; actionPayload: any }, workspaceId: string = DEFAULT_WORKSPACE_ID): AutomationFlow {
    const now = new Date().toISOString();
    const id = flowData.id || `flow_${Date.now()}`;
    const flow: AutomationFlow = {
      id,
      workspaceId,
      workspace_id: workspaceId,
      name: flowData.name || `Flow: ${flowData.triggerKeyword}`,
      triggerKeyword: flowData.triggerKeyword,
      trigger_keyword: flowData.triggerKeyword,
      triggerType: flowData.triggerType || 'keyword',
      actionType: flowData.actionType || 'buttons',
      actionPayload: flowData.actionPayload,
      isActive: flowData.isActive !== undefined ? flowData.isActive : true,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    memoryState.automations.set(id, flow);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('automations').insert({
          id,
          workspace_id: workspaceId,
          name: flow.name,
          trigger_type: flow.triggerType,
          trigger_value: flow.triggerKeyword,
          is_active: flow.isActive,
          created_at: now,
        });
      }, 'Automation insert');
    }

    return flow;
  },

  update(id: string, partial: Partial<AutomationFlow>, workspaceId: string = DEFAULT_WORKSPACE_ID): AutomationFlow | null {
    const existing = memoryState.automations.get(id);
    if (!existing) return null;

    const updated: AutomationFlow = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    memoryState.automations.set(id, updated);
    return updated;
  },

  delete(id: string, workspaceId: string = DEFAULT_WORKSPACE_ID): boolean {
    const deleted = memoryState.automations.delete(id);
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('automations').delete().eq('id', id);
      }, 'Automation delete');
    }
    return deleted;
  },

  incrementExecution(id: string): void {
    const flow = memoryState.automations.get(id);
    if (flow) {
      flow.executionCount = (flow.executionCount || 0) + 1;
      flow.updatedAt = new Date().toISOString();
    }
  },
};

// ==============================================================================
// 5. CAMPAIGNS REPOSITORY
// ==============================================================================
export const CampaignsDB = {
  list(workspaceId: string = DEFAULT_WORKSPACE_ID): Campaign[] {
    return Array.from(memoryState.campaigns.values()).filter(
      (c) => (c.workspaceId || c.workspace_id) === workspaceId
    );
  },

  getById(id: string, workspaceId: string = DEFAULT_WORKSPACE_ID): Campaign | null {
    const camp = memoryState.campaigns.get(id);
    if (camp && (camp.workspaceId || camp.workspace_id) === workspaceId) {
      return camp;
    }
    return null;
  },

  create(campaignData: Partial<Campaign> & { name: string; templateName: string }, workspaceId: string = DEFAULT_WORKSPACE_ID): Campaign {
    const now = new Date().toISOString();
    const id = campaignData.id || `camp_${Date.now()}`;
    const campaign: Campaign = {
      id,
      workspaceId,
      workspace_id: workspaceId,
      name: campaignData.name,
      campaign_name: campaignData.name,
      templateName: campaignData.templateName,
      template_name: campaignData.templateName,
      targetTag: campaignData.targetTag || 'all',
      target_tag: campaignData.targetTag || 'all',
      status: campaignData.status || 'pending',
      totalRecipients: campaignData.totalRecipients || 0,
      total_recipients: campaignData.totalRecipients || 0,
      sentCount: campaignData.sentCount || 0,
      sent_count: campaignData.sentCount || 0,
      deliveredCount: campaignData.deliveredCount || 0,
      delivered_count: campaignData.deliveredCount || 0,
      readCount: campaignData.readCount || 0,
      read_count: campaignData.readCount || 0,
      repliedCount: campaignData.repliedCount || 0,
      failedCount: campaignData.failedCount || 0,
      failed_count: campaignData.failedCount || 0,
      variables: campaignData.variables,
      scheduledAt: campaignData.scheduledAt,
      createdAt: now,
      created_at: now,
    };

    memoryState.campaigns.set(id, campaign);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('campaigns').insert({
          id,
          workspace_id: workspaceId,
          name: campaign.name,
          template_name: campaign.templateName,
          target_tag: campaign.targetTag,
          status: campaign.status,
          total_recipients: campaign.totalRecipients,
          sent_count: campaign.sentCount,
          failed_count: campaign.failedCount,
          variables: campaign.variables,
          created_at: now,
        });
      }, 'Campaign insert');
    }

    return campaign;
  },

  update(id: string, partial: Partial<Campaign>, workspaceId: string = DEFAULT_WORKSPACE_ID): Campaign | null {
    const existing = memoryState.campaigns.get(id);
    if (!existing) return null;

    const updated: Campaign = {
      ...existing,
      ...partial,
    };

    memoryState.campaigns.set(id, updated);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase
          .from('campaigns')
          .update({
            status: updated.status,
            sent_count: updated.sentCount,
            delivered_count: updated.deliveredCount,
            read_count: updated.readCount,
            failed_count: updated.failedCount,
            completed_at: updated.completedAt,
          })
          .eq('id', id);
      }, 'Campaign update');
    }

    return updated;
  },
};

// ==============================================================================
// 6. USERS REPOSITORY (RBAC, Multi-Tenant Authentication)
// ==============================================================================
export const UsersDB = {
  getById(id: string): UserRecord | null {
    return memoryState.users.get(id) || null;
  },

  getByEmail(email: string): UserRecord | null {
    const clean = email.toLowerCase().trim();
    for (const u of memoryState.users.values()) {
      if (u.email.toLowerCase() === clean) return u;
    }
    return null;
  },

  verifyCredentials(email: string, passwordPlain: string): UserRecord | null {
    const user = this.getByEmail(email);
    if (!user || !user.passwordHash) return null;

    if (verifyPassword(passwordPlain, user.passwordHash)) {
      return user;
    }
    return null;
  },

  create(userData: Partial<UserRecord> & { email: string; password?: string }): UserRecord {
    const now = new Date().toISOString();
    const id = userData.id || `usr_${Date.now()}`;
    const passwordHash = userData.password ? hashPassword(userData.password) : userData.passwordHash;

    const user: UserRecord = {
      id,
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      password_hash: passwordHash,
      name: userData.name || userData.email.split('@')[0],
      avatarUrl: userData.avatarUrl || userData.avatar_url,
      avatar_url: userData.avatarUrl || userData.avatar_url,
      provider: userData.provider || 'email',
      role: userData.role || 'employee',
      status: userData.status || 'approved',
      company: userData.company,
      intendedUse: userData.intendedUse || userData.intended_use,
      intended_use: userData.intendedUse || userData.intended_use,
      requestedAt: userData.requestedAt || now,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
    };

    memoryState.users.set(id, user);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('users').insert({
          id,
          email: user.email,
          password_hash: passwordHash,
          name: user.name,
          avatar_url: user.avatarUrl,
          role: user.role,
          status: user.status,
          company: user.company,
          intended_use: user.intendedUse,
          created_at: now,
        });
        await supabase.from('workspace_members').insert({
          workspace_id: DEFAULT_WORKSPACE_ID,
          user_id: id,
          role: user.role === 'super_admin' ? 'owner' : (user.role as any) || 'employee',
        });
      }, 'User insert');
    }

    return user;
  },

  getAll(): UserRecord[] {
    return Array.from(memoryState.users.values());
  },

  requestAccess(id: string, details?: { company?: string; intendedUse?: string }): UserRecord | null {
    const user = this.getById(id);
    if (!user) return null;
    user.status = 'pending_approval';
    if (details?.company) user.company = details.company;
    if (details?.intendedUse) user.intendedUse = details.intendedUse;
    user.requestedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    return user;
  },

  approveUser(id: string, approvedBy: string = 'Super Admin'): UserRecord | null {
    const user = this.getById(id);
    if (!user) return null;
    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    user.approvedBy = approvedBy;
    user.updatedAt = new Date().toISOString();
    return user;
  },

  rejectUser(id: string): UserRecord | null {
    const user = this.getById(id);
    if (!user) return null;
    user.status = 'rejected';
    user.updatedAt = new Date().toISOString();
    return user;
  },

  updateRole(id: string, role: UserRole): UserRecord | null {
    const user = this.getById(id);
    if (!user) return null;
    user.role = role;
    user.updatedAt = new Date().toISOString();
    return user;
  },

  revokeAccess(id: string): UserRecord | null {
    const user = this.getById(id);
    if (!user || user.role === 'super_admin') return null;
    user.status = 'rejected';
    user.updatedAt = new Date().toISOString();
    return user;
  },

  deleteUser(id: string): boolean {
    const user = this.getById(id);
    if (!user || user.role === 'super_admin') return false;
    return memoryState.users.delete(id);
  },

  getAdminMetrics(): AdminMetrics {
    const all = this.getAll();
    const approved = all.filter((u) => u.status === 'approved').length;
    const pending = all.filter((u) => u.status === 'pending_approval').length;
    const messagesCount = MessagesDB.list().length;

    return {
      totalApprovedUsers: approved,
      totalPendingRequests: pending,
      totalMessagesSent: messagesCount,
      totalMetaAdsSpend: Math.round(messagesCount * 0.045 * 100) / 100,
      totalContacts: ContactsDB.count(),
      totalCampaigns: CampaignsDB.list().length,
      totalAutomations: AutomationsDB.list().length,
      recentActivity: memoryState.activity.slice(0, 10),
    };
  },
};

// ==============================================================================
// 7. WEBHOOK EVENTS REPOSITORY (Deduplication)
// ==============================================================================
const seenMetaEvents = new Set<string>();

export const WebhookEventsDB = {
  isDuplicate(metaEventId: string): boolean {
    if (!metaEventId) return false;
    if (seenMetaEvents.has(metaEventId)) return true;
    seenMetaEvents.add(metaEventId);
    if (seenMetaEvents.size > 10000) {
      // Keep memory bound on VPS
      const iter = seenMetaEvents.values();
      for (let i = 0; i < 2000; i++) seenMetaEvents.delete(iter.next().value!);
    }
    return false;
  },

  async record(metaEventId: string, eventType: string, payload: any, workspaceId: string = DEFAULT_WORKSPACE_ID) {
    seenMetaEvents.add(metaEventId);
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('webhook_events').insert({
          workspace_id: workspaceId,
          meta_event_id: metaEventId,
          event_type: eventType,
          payload,
          status: 'processed',
        });
      }, 'Webhook events record');
    }
  },
};

// ==============================================================================
// 8. DATA DELETIONS REPOSITORY (Meta Compliance)
// ==============================================================================
export const DataDeletionDB = {
  create(data: { userId?: string; email?: string; details: string }): DataDeletionRecord {
    const confirmationCode = `del_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const record: DataDeletionRecord = {
      id: `dd_${Date.now()}`,
      confirmationCode,
      userId: data.userId,
      email: data.email,
      status: 'completed',
      details: data.details,
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    memoryState.deletions.set(confirmationCode, record);

    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('data_deletions').insert({
          confirmation_code: confirmationCode,
          user_id: data.userId,
          email: data.email,
          status: 'completed',
          details: data.details,
        });
      }, 'Data deletion record');
    }

    return record;
  },

  getByCode(code: string): DataDeletionRecord | null {
    return memoryState.deletions.get(code) || null;
  },
};

// ==============================================================================
// 9. INTEGRATIONS REPOSITORY (E-Commerce Store Connections)
// ==============================================================================
export const IntegrationsDB = {
  get(userId: string, platform: 'shopify' | 'woocommerce'): IntegrationRecord | null {
    return memoryState.integrations.get(`${userId}_${platform}`) || null;
  },

  save(data: Omit<IntegrationRecord, 'id' | 'connectedAt' | 'updatedAt'>): IntegrationRecord {
    const now = new Date().toISOString();
    const key = `${data.userId}_${data.platform}`;
    const existing = memoryState.integrations.get(key);

    const record: IntegrationRecord = {
      id: existing ? existing.id : `int_${Date.now()}`,
      ...data,
      connectedAt: existing ? existing.connectedAt : now,
      updatedAt: now,
    };

    memoryState.integrations.set(key, record);
    return record;
  },

  delete(userId: string, platform: 'shopify' | 'woocommerce'): boolean {
    return memoryState.integrations.delete(`${userId}_${platform}`);
  },
};
