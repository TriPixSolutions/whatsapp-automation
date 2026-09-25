import {
  WorkflowDefinition,
  WorkflowExecutionLog,
  WorkflowSessionState,
  MessageDeliveryReceipt,
  MetaApiLog,
  WebhookLogItem,
  ButtonTestEvent,
  CarouselTestEvent,
  PlatformMessageType,
} from '@/types/automations';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Data persistence file path in local data folder
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'test_center_store.json');

interface TestCenterState {
  workflows: Record<string, WorkflowDefinition>;
  workflowSessions: Record<string, WorkflowSessionState>;
  executionLogs: WorkflowExecutionLog[];
  deliveryReceipts: MessageDeliveryReceipt[];
  metaLogs: MetaApiLog[];
  webhookLogs: WebhookLogItem[];
  buttonLogs: ButtonTestEvent[];
  carouselLogs: CarouselTestEvent[];
  sandboxRecipients: { phoneNumber: string; name: string; addedAt: string; verified: boolean }[];
  sandboxEnabled: boolean;
}

// Global in-memory singleton
const globalState: TestCenterState = {
  workflows: {},
  workflowSessions: {},
  executionLogs: [],
  deliveryReceipts: [],
  metaLogs: [],
  webhookLogs: [],
  buttonLogs: [],
  carouselLogs: [],
  sandboxRecipients: [
    { phoneNumber: '+919876543210', name: 'Primary Test Recipient', addedAt: new Date().toISOString(), verified: true },
    { phoneNumber: '+919800011122', name: 'Secondary QA SIM', addedAt: new Date().toISOString(), verified: true },
    { phoneNumber: '+15550192831', name: 'Meta Dev Sandbox Recipient', addedAt: new Date().toISOString(), verified: true },
  ],
  sandboxEnabled: false,
};

// Seed default production-grade 3-branch workflow
export function buildProductionVipWorkflow(workspaceId = DEFAULT_WORKSPACE_ID): WorkflowDefinition {
  return {
    id: 'wf_welcome_interactive',
    workspaceId,
    name: 'Production VIP Concierge & Catalog Flow',
    description: 'Production-ready WhatsApp flow: Welcome -> 3 Interactive Buttons -> Catalog/Pricing/Human Agent branches',
    triggerType: 'keyword',
    triggerKeyword: 'hello',
    triggerMatchPattern: 'contains',
    isActive: true,
    debugModeEnabled: true,
    executionCount: 42,
    stats: {
      enteredCount: 42,
      completedCount: 38,
      droppedCount: 4,
      sentCount: 96,
      deliveredCount: 92,
      readCount: 88,
      clickedCount: 76,
      repliedCount: 58,
    },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node_trigger',
        type: 'trigger',
        title: 'Keyword Match: "hello"',
        description: 'Triggers on incoming "hello", "hi", or greeting',
        triggerType: 'keyword',
        triggerKeyword: 'hello',
        config: { text: 'hello' },
        position: { x: 80, y: 300 },
        nextNodeId: 'node_welcome_msg',
      },
      {
        id: 'node_welcome_msg',
        type: 'message',
        title: 'Send Welcome Message',
        description: 'Instant personalized introduction message',
        messageType: 'text',
        config: {
          text: '🌟 Welcome to our Official WhatsApp Store! How can we assist you today?',
        },
        position: { x: 380, y: 300 },
        nextNodeId: 'node_button_menu',
      },
      {
        id: 'node_button_menu',
        type: 'button',
        title: 'Interactive Button Message',
        description: 'Presents 3 action buttons to customer and pauses execution',
        messageType: 'interactive_button',
        config: {
          bodyText: 'Please select an option below to get started immediately:',
          footerText: 'Official Verified Account',
          buttons: [
            { id: 'btn_catalog', title: 'Browse Catalog', type: 'reply' },
            { id: 'btn_pricing', title: 'Get Pricing', type: 'reply' },
            { id: 'btn_agent', title: 'Talk To Expert', type: 'reply' },
          ],
        },
        position: { x: 680, y: 300 },
      },
      // Branch 1: Browse Catalog -> Product Carousel -> Wait Selection -> Add Tag: VIP -> Done
      {
        id: 'node_carousel_showcase',
        type: 'carousel',
        title: 'Show Product Carousel',
        description: 'Displays 3 interactive cards with product photos & CTAs',
        messageType: 'carousel',
        config: {
          bodyText: 'Explore our top trending items below:',
          cards: [
            {
              headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
              title: 'Runner Pro Sneakers',
              description: 'Ultra-light breathable performance shoes. $129',
              buttons: [{ id: 'buy_shoes', title: 'Order Shoes' }],
            },
            {
              headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
              title: 'Chronos Smart Watch',
              description: 'Titanium chassis, AMOLED sapphire glass. $249',
              buttons: [{ id: 'buy_watch', title: 'Order Watch' }],
            },
            {
              headerImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
              title: 'Aviator Sun Shades',
              description: 'Polarized UV400 classic gold frame. $79',
              buttons: [{ id: 'buy_glasses', title: 'Order Shades' }],
            },
          ],
        },
        position: { x: 1040, y: 120 },
        nextNodeId: 'node_wait_product',
      },
      {
        id: 'node_wait_product',
        type: 'wait_for_reply',
        title: 'Wait For Product Selection',
        description: 'Pauses workflow until customer selects product or taps card',
        config: { timeoutMinutes: 1440 },
        position: { x: 1360, y: 120 },
        nextNodeId: 'node_condition_tag',
      },
      {
        id: 'node_condition_tag',
        type: 'tag_management',
        title: 'Add Tag: VIP',
        description: 'Automatically labels contact with "VIP" tag',
        actionType: 'tag_contact',
        config: { action: 'add', tag: 'VIP' },
        position: { x: 1680, y: 120 },
        nextNodeId: 'node_end_catalog',
      },
      {
        id: 'node_end_catalog',
        type: 'end',
        title: 'Workflow Completed',
        description: 'Catalog browsing & VIP tagging flow completed',
        config: {},
        position: { x: 1980, y: 120 },
      },
      // Branch 2: Get Pricing -> Send Pricing Information -> Done
      {
        id: 'node_pricing_info',
        type: 'message',
        title: 'Send Pricing Information',
        description: 'Dispatches pricing tier details to customer',
        messageType: 'text',
        config: {
          text: '📊 *Exclusive WhatsApp Pricing Plans*:\n\n• *Starter*: $29/mo - 1,000 monthly contacts\n• *Growth*: $79/mo - 10,000 monthly contacts + Workflows\n• *Enterprise VIP*: $199/mo - Unlimited contacts & Dedicated Manager\n\nReply with your plan of interest or tap below!',
        },
        position: { x: 1040, y: 320 },
        nextNodeId: 'node_end_pricing',
      },
      {
        id: 'node_end_pricing',
        type: 'end',
        title: 'Workflow Completed',
        description: 'Pricing information dispatch completed',
        config: {},
        position: { x: 1360, y: 320 },
      },
      // Branch 3: Talk To Expert -> Create Human Agent Request -> Done
      {
        id: 'node_expert_request',
        type: 'crm_action',
        title: 'Create Human Agent Request',
        description: 'Escalates conversation to live specialist in CRM',
        config: {
          stage: 'negotiation',
          notes: 'Customer requested live human agent escalation from WhatsApp button menu.',
          priority: 'urgent',
        },
        position: { x: 1040, y: 500 },
        nextNodeId: 'node_end_expert',
      },
      {
        id: 'node_end_expert',
        type: 'end',
        title: 'Workflow Completed',
        description: 'Human agent request registered & ticket opened',
        config: {},
        position: { x: 1360, y: 500 },
      },
    ],
    edges: [
      { id: 'e_trigger_welcome', source: 'node_trigger', target: 'node_welcome_msg', animated: true },
      { id: 'e_welcome_button', source: 'node_welcome_msg', target: 'node_button_menu' },
      // Branch 1: Browse Catalog (support btn_catalog, btn-0, and label)
      { id: 'e_btn_catalog', source: 'node_button_menu', sourceHandle: 'btn_catalog', target: 'node_carousel_showcase', label: 'Browse Catalog' },
      { id: 'e_carousel_wait', source: 'node_carousel_showcase', target: 'node_wait_product' },
      { id: 'e_wait_tag', source: 'node_wait_product', target: 'node_condition_tag' },
      { id: 'e_tag_end', source: 'node_condition_tag', target: 'node_end_catalog' },
      // Branch 2: Get Pricing (support btn_pricing, btn-1, and label)
      { id: 'e_btn_pricing', source: 'node_button_menu', sourceHandle: 'btn_pricing', target: 'node_pricing_info', label: 'Get Pricing' },
      { id: 'e_pricing_end', source: 'node_pricing_info', target: 'node_end_pricing' },
      // Branch 3: Talk To Expert (support btn_agent, btn-2, and label)
      { id: 'e_btn_agent', source: 'node_button_menu', sourceHandle: 'btn_agent', target: 'node_expert_request', label: 'Talk To Expert' },
      { id: 'e_expert_end', source: 'node_expert_request', target: 'node_end_expert' },
    ],
  };
}

function seedDefaultWorkflows() {
  const defaultFlow = buildProductionVipWorkflow(DEFAULT_WORKSPACE_ID);
  globalState.workflows[defaultFlow.id] = defaultFlow;
}

// Load from disk if exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.workflows) globalState.workflows = parsed.workflows;
    if (parsed.workflowSessions) globalState.workflowSessions = parsed.workflowSessions;
    if (parsed.executionLogs) globalState.executionLogs = parsed.executionLogs;
    if (parsed.deliveryReceipts) globalState.deliveryReceipts = parsed.deliveryReceipts;
    if (parsed.metaLogs) globalState.metaLogs = parsed.metaLogs;
    if (parsed.webhookLogs) globalState.webhookLogs = parsed.webhookLogs;
    if (parsed.buttonLogs) globalState.buttonLogs = parsed.buttonLogs;
    if (parsed.carouselLogs) globalState.carouselLogs = parsed.carouselLogs;
    if (parsed.sandboxRecipients) globalState.sandboxRecipients = parsed.sandboxRecipients;
    if (typeof parsed.sandboxEnabled === 'boolean') globalState.sandboxEnabled = parsed.sandboxEnabled;
  }
} catch {
  // non-blocking
}

seedDefaultWorkflows();

// Debounced save
let saveTimer: NodeJS.Timeout | null = null;
function persistStore(immediate = false) {
  if (immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(globalState, null, 2), 'utf8');
    } catch (e) {
      console.warn('[TestCenterStore] Immediate persistence warning:', e);
    }
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(globalState, null, 2), 'utf8');
    } catch (e) {
      console.warn('[TestCenterStore] Persistence warning:', e);
    }
  }, 1000);
}

function syncFromDisk() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.workflows) {
        globalState.workflows = { ...parsed.workflows, ...globalState.workflows };
      }
      if (parsed.workflowSessions) {
        globalState.workflowSessions = { ...parsed.workflowSessions, ...globalState.workflowSessions };
      }
    }
  } catch {
    // non-blocking
  }
}

export const TestCenterStore = {
  // WORKFLOWS
  listWorkflows(workspaceId = DEFAULT_WORKSPACE_ID): WorkflowDefinition[] {
    return Object.values(globalState.workflows).filter(
      (w) =>
        w.workspaceId === workspaceId ||
        (w.workspaceId === 'default' && workspaceId === DEFAULT_WORKSPACE_ID) ||
        (w.workspaceId === DEFAULT_WORKSPACE_ID && workspaceId === 'default')
    );
  },

  getWorkflow(id: string): WorkflowDefinition | null {
    if (!globalState.workflows[id]) {
      syncFromDisk();
    }
    return globalState.workflows[id] || null;
  },

  saveWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
    workflow.updatedAt = new Date().toISOString();
    globalState.workflows[workflow.id] = workflow;
    persistStore();
    return workflow;
  },

  deleteWorkflow(id: string): boolean {
    if (globalState.workflows[id]) {
      delete globalState.workflows[id];
      persistStore();
      return true;
    }
    return false;
  },

  duplicateWorkflow(id: string): WorkflowDefinition | null {
    const original = globalState.workflows[id];
    if (!original) return null;
    const newId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const copy: WorkflowDefinition = JSON.parse(JSON.stringify(original));
    copy.id = newId;
    copy.name = `${original.name} (Copy)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.executionCount = 0;
    if (copy.stats) {
      copy.stats = {
        enteredCount: 0,
        completedCount: 0,
        droppedCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        clickedCount: 0,
        repliedCount: 0,
      };
    }
    globalState.workflows[newId] = copy;
    persistStore();
    return copy;
  },

  createWorkflowVersion(id: string): WorkflowDefinition | null {
    const current = globalState.workflows[id];
    if (!current) return null;
    const versionNum = ((current as any).version || 1) + 1;
    (current as any).version = versionNum;
    current.updatedAt = new Date().toISOString();
    persistStore();
    return current;
  },

  // EXECUTION LOGS
  recordExecutionLog(log: WorkflowExecutionLog): WorkflowExecutionLog {
    globalState.executionLogs.unshift(log);
    if (globalState.executionLogs.length > 500) {
      globalState.executionLogs = globalState.executionLogs.slice(0, 500);
    }
    persistStore();
    return log;
  },

  updateExecutionStep(executionId: string, stepId: string, partial: any) {
    const exec = globalState.executionLogs.find((l) => l.executionId === executionId || l.id === executionId);
    if (exec) {
      const step = exec.steps.find((s) => s.nodeId === stepId);
      if (step) {
        Object.assign(step, partial);
        persistStore();
      }
    }
  },

  getExecutionLogs(filters?: { workflowId?: string; phoneNumber?: string; limit?: number }): WorkflowExecutionLog[] {
    let result = [...globalState.executionLogs];
    if (filters?.workflowId) {
      result = result.filter((l) => l.workflowId === filters.workflowId);
    }
    if (filters?.phoneNumber) {
      const clean = filters.phoneNumber.replace(/[^0-9]/g, '');
      result = result.filter((l) => l.phoneNumber.replace(/[^0-9]/g, '').includes(clean));
    }
    const limit = filters?.limit || 50;
    return result.slice(0, limit);
  },

  // DELIVERY RECEIPTS
  recordDeliveryReceipt(receipt: MessageDeliveryReceipt): MessageDeliveryReceipt {
    const existingIndex = globalState.deliveryReceipts.findIndex(
      (r) => r.metaMessageId === receipt.metaMessageId
    );
    if (existingIndex >= 0) {
      globalState.deliveryReceipts[existingIndex] = {
        ...globalState.deliveryReceipts[existingIndex],
        ...receipt,
      };
    } else {
      globalState.deliveryReceipts.unshift(receipt);
      if (globalState.deliveryReceipts.length > 500) {
        globalState.deliveryReceipts = globalState.deliveryReceipts.slice(0, 500);
      }
    }
    persistStore();
    return receipt;
  },

  updateDeliveryStatus(metaMessageId: string, status: 'delivered' | 'read' | 'failed', errorMsg?: string) {
    const now = new Date().toISOString();
    const receipt = globalState.deliveryReceipts.find((r) => r.metaMessageId === metaMessageId);
    if (receipt) {
      receipt.status = status;
      if (status === 'delivered') receipt.deliveredAt = now;
      if (status === 'read') receipt.readAt = now;
      if (status === 'failed') {
        receipt.failedAt = now;
        receipt.errorMessage = errorMsg || receipt.errorMessage;
      }
      persistStore();
    }
  },

  getDeliveryReceipts(limit = 100): MessageDeliveryReceipt[] {
    return globalState.deliveryReceipts.slice(0, limit);
  },
  listDeliveryReceipts(limit = 100): MessageDeliveryReceipt[] {
    return globalState.deliveryReceipts.slice(0, limit);
  },

  // META API LOGS
  recordMetaLog(log: MetaApiLog): MetaApiLog {
    globalState.metaLogs.unshift(log);
    if (globalState.metaLogs.length > 500) {
      globalState.metaLogs = globalState.metaLogs.slice(0, 500);
    }
    persistStore();
    return log;
  },

  getMetaLogs(limit = 100): MetaApiLog[] {
    return globalState.metaLogs.slice(0, limit);
  },
  listMetaLogs(limit = 100): MetaApiLog[] {
    return globalState.metaLogs.slice(0, limit);
  },

  // WEBHOOK LOGS
  recordWebhookLog(log: WebhookLogItem): WebhookLogItem {
    globalState.webhookLogs.unshift(log);
    if (globalState.webhookLogs.length > 500) {
      globalState.webhookLogs = globalState.webhookLogs.slice(0, 500);
    }
    persistStore();
    return log;
  },

  getWebhookLogs(limit = 100): WebhookLogItem[] {
    return globalState.webhookLogs.slice(0, limit);
  },
  listWebhookLogs(limit = 100): WebhookLogItem[] {
    return globalState.webhookLogs.slice(0, limit);
  },
  listExecutionLogs(filters?: { workflowId?: string; phoneNumber?: string; limit?: number }): WorkflowExecutionLog[] {
    return this.getExecutionLogs(filters);
  },

  getExecutionLog(executionId: string): WorkflowExecutionLog | null {
    return globalState.executionLogs.find((l) => l.executionId === executionId || l.id === executionId) || null;
  },

  updateExecutionLog(log: WorkflowExecutionLog): WorkflowExecutionLog {
    const idx = globalState.executionLogs.findIndex((l) => l.executionId === log.executionId || l.id === log.id);
    if (idx !== -1) {
      globalState.executionLogs[idx] = log;
    } else {
      globalState.executionLogs.unshift(log);
    }
    persistStore();
    return log;
  },

  // WORKFLOW SESSION MANAGEMENT (Waiting / Paused State)
  saveSession(session: WorkflowSessionState): WorkflowSessionState {
    const cleanPhone = `+${session.phoneNumber.replace(/[^0-9]/g, '')}`;
    const wsId = session.workspaceId || DEFAULT_WORKSPACE_ID;
    const key = `${wsId}:${cleanPhone}`;
    globalState.workflowSessions[key] = {
      ...session,
      workspaceId: wsId,
      phoneNumber: cleanPhone,
    };
    persistStore(true);
    return globalState.workflowSessions[key];
  },

  getActiveSession(phoneNumber: string, workspaceId = DEFAULT_WORKSPACE_ID): WorkflowSessionState | null {
    const cleanPhone = `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    const key = `${workspaceId}:${cleanPhone}`;
    let session = globalState.workflowSessions[key];

    // If not in memory, sync from disk
    if (!session) {
      syncFromDisk();
      session = globalState.workflowSessions[key];
    }

    // Fallback search by clean phone across any matching session
    if (!session) {
      for (const [k, s] of Object.entries(globalState.workflowSessions)) {
        const sPhone = `+${s.phoneNumber.replace(/[^0-9]/g, '')}`;
        if (sPhone === cleanPhone) {
          session = s;
          break;
        }
      }
    }

    if (!session) return null;

    // Check expiration (24h default)
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      delete globalState.workflowSessions[key];
      persistStore(true);
      return null;
    }
    return session;
  },

  clearSession(phoneNumber: string, workspaceId = DEFAULT_WORKSPACE_ID): boolean {
    const cleanPhone = `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    let cleared = false;
    for (const [key, session] of Object.entries(globalState.workflowSessions)) {
      const sPhone = `+${session.phoneNumber.replace(/[^0-9]/g, '')}`;
      if (sPhone === cleanPhone && (session.workspaceId === workspaceId || workspaceId === DEFAULT_WORKSPACE_ID || session.workspaceId === 'default' || !workspaceId)) {
        delete globalState.workflowSessions[key];
        cleared = true;
      }
    }
    if (cleared) persistStore(true);
    return cleared;
  },

  listActiveSessions(workspaceId = DEFAULT_WORKSPACE_ID): WorkflowSessionState[] {
    const now = Date.now();
    return Object.values(globalState.workflowSessions).filter(
      (s) =>
        (s.workspaceId === workspaceId || workspaceId === DEFAULT_WORKSPACE_ID || s.workspaceId === 'default') &&
        (!s.expiresAt || new Date(s.expiresAt).getTime() > now)
    );
  },

  // BUTTON TESTING LAB
  recordButtonEvent(event: ButtonTestEvent): ButtonTestEvent {
    globalState.buttonLogs.unshift(event);
    if (globalState.buttonLogs.length > 200) {
      globalState.buttonLogs = globalState.buttonLogs.slice(0, 200);
    }
    persistStore();
    return event;
  },

  getButtonLogs(limit = 50): ButtonTestEvent[] {
    return globalState.buttonLogs.slice(0, limit);
  },

  // CAROUSEL TESTING LAB
  recordCarouselEvent(event: CarouselTestEvent): CarouselTestEvent {
    globalState.carouselLogs.unshift(event);
    if (globalState.carouselLogs.length > 200) {
      globalState.carouselLogs = globalState.carouselLogs.slice(0, 200);
    }
    persistStore();
    return event;
  },

  getCarouselLogs(limit = 50): CarouselTestEvent[] {
    return globalState.carouselLogs.slice(0, limit);
  },

  // SANDBOX RECIPIENTS
  getSandboxSettings() {
    return {
      enabled: globalState.sandboxEnabled,
      recipients: globalState.sandboxRecipients,
    };
  },

  setSandboxEnabled(enabled: boolean) {
    globalState.sandboxEnabled = enabled;
    persistStore();
  },

  addSandboxRecipient(phoneNumber: string, name: string) {
    const clean = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    if (!globalState.sandboxRecipients.some((r) => r.phoneNumber === clean)) {
      globalState.sandboxRecipients.push({
        phoneNumber: clean,
        name: name || 'Test Recipient',
        addedAt: new Date().toISOString(),
        verified: true,
      });
      persistStore();
    }
    return globalState.sandboxRecipients;
  },

  removeSandboxRecipient(phoneNumber: string) {
    const clean = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    globalState.sandboxRecipients = globalState.sandboxRecipients.filter(
      (r) => r.phoneNumber !== clean
    );
    persistStore();
    return globalState.sandboxRecipients;
  },

  clearAllLogs() {
    globalState.executionLogs = [];
    globalState.deliveryReceipts = [];
    globalState.metaLogs = [];
    globalState.webhookLogs = [];
    globalState.buttonLogs = [];
    globalState.carouselLogs = [];
    persistStore();
  },
};
