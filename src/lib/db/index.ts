import { ContactsDB } from './contacts';
import { database, checked } from './client';
import { getAdminClient } from '@/lib/supabase/server';
import { encryptToken, decryptToken, hashPassword, verifyPassword } from '@/lib/crypto';
import {
  WorkspaceSettings,
  Contact,
  Message,
  AutomationFlow,
  UserRecord,
  UserRole,
  UserStatus,
  ActivityLogItem,
  AdminMetrics,
  DataDeletionRecord,
  IntegrationRecord,
  MessageStatus,
  Conversation,
  ConversationState,
  Company,
  ContactNote,
  ContactTimelineEvent,
  MetaTemplateItem,
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
  automations: Map<string, AutomationFlow>;
  activity: ActivityLogItem[];
  deletions: Map<string, DataDeletionRecord>;
  integrations: Map<string, IntegrationRecord>;
  companies: Map<string, Company>;
  timeline: Map<string, ContactTimelineEvent[]>;
  templates: Map<string, MetaTemplateItem>;
}

const memoryState: TenantState = {
  automations: new Map(),
  activity: [],
  deletions: new Map(),
  integrations: new Map(),
  companies: new Map(),
  timeline: new Map(),
  templates: new Map(),
};

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

// Seed initial default Meta templates
const defaultTemplates: MetaTemplateItem[] = [
  {
    id: 'tmpl_teaser_alert',
    name: 'teaser_alert',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Hello {{1}}! We have an exclusive VIP update regarding your inquiry. Reply to speak with our specialist.',
    header: 'VIP Notification',
    footer: 'Reply STOP to unsubscribe',
    buttons: [
      { id: 'btn_1', type: 'QUICK_REPLY', text: 'View VIP Update' },
      { id: 'btn_2', type: 'QUICK_REPLY', text: 'Chat with Specialist' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_welcome_lead',
    name: 'welcome_lead',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Hello {{1}}! Thank you for contacting TriPix Solutions. Here is our official product catalog and pricing sheet.',
    header: 'Welcome to TriPix',
    footer: 'Official WhatsApp Business',
    buttons: [
      { id: 'btn_cat', type: 'QUICK_REPLY', text: 'Browse Catalog' },
      { id: 'btn_price', type: 'QUICK_REPLY', text: 'Pricing Sheet' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_followup_reminder',
    name: 'followup_reminder',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Quick reminder: Your reserved 10% coupon code expires tonight. Would you like free doorstep delivery on your order?',
    header: 'Special Offer Expiring',
    footer: 'Valid today only',
    buttons: [
      { id: 'btn_claim', type: 'QUICK_REPLY', text: 'Claim 10% Off' },
      { id: 'btn_help', type: 'QUICK_REPLY', text: 'Need Assistance' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_vip_offer',
    name: 'vip_offer',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Exclusive 15% VIP Flash Sale for our valued customers today only. Use promo code VIP15 to claim.',
    header: 'Exclusive Flash Sale',
    footer: 'TriPix Concierge',
    buttons: [
      { id: 'btn_vip', type: 'QUICK_REPLY', text: 'Apply VIP15' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_order_confirmation',
    name: 'order_confirmation',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Thank you for your order #{{1}}! Your order of {{2}} has been confirmed and is being prepared for dispatch.',
    header: 'Order Confirmed',
    footer: 'Track your order anytime',
    buttons: [
      { id: 'btn_track', type: 'URL', text: 'Track Order', url: 'https://tripixsolutions.com/orders' },
    ],
    updatedAt: new Date().toISOString(),
  },
];
for (const tmpl of defaultTemplates) {
  memoryState.templates.set(tmpl.name, tmpl);
}

// ==============================================================================
// 1. WORKSPACES & SETTINGS REPOSITORY
// ==============================================================================
export { SettingsDB } from './settings';

export const WorkspacesDB = {
  async getById(workspaceId: string) {
    return checked(await database().from('workspaces').select('*').eq('id', workspaceId).maybeSingle());
  },
  async list() {
    return checked(await database().from('workspaces').select('*'));
  },
};

// ==============================================================================
// 2. CONTACTS REPOSITORY (Strict Tenant-Scoped)
// ==============================================================================
export { ContactsDB } from './contacts';

// ==============================================================================
// 2b. COMPANIES REPOSITORY
// ==============================================================================
export const CompaniesDB = {
  list(workspaceId: string = DEFAULT_WORKSPACE_ID): Company[] {
    return Array.from(memoryState.companies.values()).filter((c) => c.workspaceId === workspaceId);
  },

  getById(id: string): Company | null {
    return memoryState.companies.get(id) || null;
  },

  upsert(companyData: Partial<Company> & { name: string }, workspaceId: string = DEFAULT_WORKSPACE_ID): Company {
    const now = new Date().toISOString();
    const existing = companyData.id ? memoryState.companies.get(companyData.id) : null;
    const company: Company = {
      id: existing ? existing.id : `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      name: companyData.name,
      domain: companyData.domain || existing?.domain,
      industry: companyData.industry || existing?.industry,
      phone: companyData.phone || existing?.phone,
      contactCount: companyData.contactCount !== undefined ? companyData.contactCount : existing?.contactCount || 0,
      dealValue: companyData.dealValue !== undefined ? companyData.dealValue : existing?.dealValue || 0,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    memoryState.companies.set(company.id, company);
    return company;
  },

  delete(id: string): boolean {
    return memoryState.companies.delete(id);
  },
};

// ==============================================================================
// 2c. TEMPLATES REPOSITORY
// ==============================================================================
export const TemplatesDB = {
  list(): MetaTemplateItem[] {
    return Array.from(memoryState.templates.values());
  },

  getByName(name: string): MetaTemplateItem | null {
    return memoryState.templates.get(name) || null;
  },

  upsert(template: MetaTemplateItem): MetaTemplateItem {
    memoryState.templates.set(template.name, template);
    return template;
  },
};

// ==============================================================================
// 3. MESSAGES & CONVERSATIONS REPOSITORY
// ==============================================================================
export { MessagesDB } from './messages';
export { ConversationsDB } from './conversations';
export { WorkflowsDB } from './workflows';
export { WebhookEventsDB } from './webhookEvents';
export { CampaignsDB } from './campaigns';
export { ScheduledJobsDB } from './scheduledJobs';

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
    const existing = this.getById(id, workspaceId);
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
    if (!this.getById(id, workspaceId)) return false;
    const deleted = memoryState.automations.delete(id);
    const supabase = getAdminClient();
    if (supabase) {
      safeSupabaseSync(async () => {
        await supabase.from('automations').delete().eq('id', id).eq('workspace_id', workspaceId);
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
// ==============================================================================
// 6. USERS REPOSITORY (RBAC, Multi-Tenant Authentication)
// ==============================================================================
export { UsersDB } from './users';

// ==============================================================================
// 7. WEBHOOK EVENTS REPOSITORY (Deduplication)
// ==============================================================================
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

// ==============================================================================
// 10. WORKFLOW SESSIONS REPOSITORY (Active Waiting State & User Context)
// ==============================================================================
export { WorkflowSessionsDB } from './workflows';

// ==============================================================================
// 11. WORKFLOW EXECUTIONS REPOSITORY (History, Traces & Observability)
// ==============================================================================
export { WorkflowExecutionsDB } from './workflows';
