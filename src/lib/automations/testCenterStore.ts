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
import { WorkflowsDB, WorkflowSessionsDB, WorkflowExecutionsDB } from '@/lib/db/workflows';
import * as fs from 'fs';
import * as path from 'path';

// Data persistence file path in local data folder
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'test_center_store.json');
const normalizeWorkspace = (id: string) => id === 'default' ? DEFAULT_WORKSPACE_ID : id;

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
  sandboxRecipients: [],
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
    triggerKeyword: 'hello, hi, hey, start, menu',
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
        title: 'Keyword Match: "hello, hi, hey, start, menu"',
        description: 'Triggers on incoming "hello", "hi", "hey", "start", or greeting',
        triggerType: 'keyword',
        triggerKeyword: 'hello, hi, hey, start, menu',
        config: { text: 'hello, hi, hey, start, menu' },
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
      // Branch 3: Talk To Expert -> Create Human Agent Request -> Send Confirmation -> Done
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
        nextNodeId: 'node_expert_msg',
      },
      {
        id: 'node_expert_msg',
        type: 'message',
        title: 'Send Expert Request Confirmation',
        description: 'Sends confirmation to customer that specialist was notified',
        messageType: 'text',
        config: {
          text: '👨‍💼 *Live Specialist Alerted*\n\nYour request has been routed to our senior concierge team. An expert will respond directly in this chat shortly.\n\nThank you for reaching out!',
        },
        position: { x: 1360, y: 500 },
        nextNodeId: 'node_end_expert',
      },
      {
        id: 'node_end_expert',
        type: 'end',
        title: 'Workflow Completed',
        description: 'Human agent request registered & ticket opened',
        config: {},
        position: { x: 1680, y: 500 },
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
      { id: 'e_expert_msg', source: 'node_expert_request', target: 'node_expert_msg' },
      { id: 'e_expert_end', source: 'node_expert_msg', target: 'node_end_expert' },
    ],
  };
}

// Debounced save
let saveTimer: NodeJS.Timeout | null = null;
function persistStore(immediate = false) {
  if (immediate) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(`${STORE_FILE}.tmp`, JSON.stringify(globalState, null, 2), 'utf8');
      fs.renameSync(`${STORE_FILE}.tmp`, STORE_FILE);
    } catch (e) {
      throw new Error('Workflow state could not be persisted', { cause: e });
    }
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(`${STORE_FILE}.tmp`, JSON.stringify(globalState, null, 2), 'utf8');
      fs.renameSync(`${STORE_FILE}.tmp`, STORE_FILE);
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
        globalState.workflows = { ...globalState.workflows, ...parsed.workflows };
      }
      if (parsed.workflowSessions) {
        // Disk preserves scheduled sessions across process restarts.
        globalState.workflowSessions = parsed.workflowSessions;
      }
    }
  } catch {
    // non-blocking
  }
}

function seedDefaultWorkflows() {
  const defaultFlow = buildProductionVipWorkflow(DEFAULT_WORKSPACE_ID);
  const existing = globalState.workflows[defaultFlow.id];
  if (!existing || existing.nodes.length !== defaultFlow.nodes.length || (existing.edges?.length || 0) !== (defaultFlow.edges?.length || 0)) {
    globalState.workflows[defaultFlow.id] = defaultFlow;
    persistStore(true);
  }
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

export const TestCenterStore = {
  // WORKFLOWS
  async listWorkflows(workspaceId = DEFAULT_WORKSPACE_ID): Promise<WorkflowDefinition[]> {
    return WorkflowsDB.list(workspaceId);
  },

  async getWorkflow(id: string, workspaceId: string): Promise<WorkflowDefinition | null> {
    return WorkflowsDB.get(id, workspaceId);
  },

  async saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    return WorkflowsDB.save(workflow);
  },

  async deleteWorkflow(id: string, workspaceId: string): Promise<boolean> {
    return WorkflowsDB.delete(id, workspaceId);
  },

  async duplicateWorkflow(id: string, workspaceId: string): Promise<WorkflowDefinition | null> {
    const original = await WorkflowsDB.get(id, workspaceId);
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
    return WorkflowsDB.save(copy);
  },

  async createWorkflowVersion(id: string, workspaceId: string): Promise<WorkflowDefinition | null> {
    const current = await WorkflowsDB.get(id, workspaceId);
    if (!current) return null;
    const versionNum = ((current as any).version || 1) + 1;
    (current as any).version = versionNum;
    current.updatedAt = new Date().toISOString();
    return WorkflowsDB.save(current);
  },

  // EXECUTION LOGS
  async recordExecutionLog(log: WorkflowExecutionLog): Promise<WorkflowExecutionLog> {
    return WorkflowExecutionsDB.save(log);
  },

  async updateExecutionStep(executionId: string, stepId: string, partial: any, workspaceId: string) {
    const exec = await WorkflowExecutionsDB.get(executionId, workspaceId);
    if (exec) {
      const step = exec.steps.find((s) => s.nodeId === stepId);
      if (step) {
        Object.assign(step, partial);
        await WorkflowExecutionsDB.save(exec);
      }
    }
  },

  async getExecutionLogs(filters: { workspaceId: string; workflowId?: string; phoneNumber?: string; limit?: number }): Promise<WorkflowExecutionLog[]> {
    return WorkflowExecutionsDB.list(filters);
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

  getDeliveryReceipts(workspaceId: string, limit = 100): MessageDeliveryReceipt[] {
    return globalState.deliveryReceipts.filter(item => item.workspaceId === workspaceId).slice(0, limit);
  },
  listDeliveryReceipts(workspaceId: string, limit = 100): MessageDeliveryReceipt[] {
    return this.getDeliveryReceipts(workspaceId, limit);
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

  getMetaLogs(workspaceId: string, limit = 100): MetaApiLog[] {
    return globalState.metaLogs.filter(item => item.workspaceId === workspaceId).slice(0, limit);
  },
  listMetaLogs(workspaceId: string, limit = 100): MetaApiLog[] {
    return this.getMetaLogs(workspaceId, limit);
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

  getWebhookLogs(workspaceId: string, limit = 100): WebhookLogItem[] {
    return globalState.webhookLogs.filter(item => item.workspaceId === workspaceId).slice(0, limit);
  },
  listWebhookLogs(workspaceId: string, limit = 100): WebhookLogItem[] {
    return this.getWebhookLogs(workspaceId, limit);
  },
  async listExecutionLogs(filters: { workspaceId: string; workflowId?: string; phoneNumber?: string; limit?: number }): Promise<WorkflowExecutionLog[]> {
    return this.getExecutionLogs(filters);
  },

  async getExecutionLog(executionId: string, workspaceId: string): Promise<WorkflowExecutionLog | null> {
    return WorkflowExecutionsDB.get(executionId, workspaceId);
  },

  async updateExecutionLog(log: WorkflowExecutionLog): Promise<WorkflowExecutionLog> {
    return WorkflowExecutionsDB.save(log);
  },

  // WORKFLOW SESSION MANAGEMENT (Waiting / Paused State)
  async saveSession(session: WorkflowSessionState): Promise<WorkflowSessionState> {
    return WorkflowSessionsDB.save(session);
  },

  async getActiveSession(phoneNumber: string, workspaceId = DEFAULT_WORKSPACE_ID, simulation = false): Promise<WorkflowSessionState | null> {
    return WorkflowSessionsDB.get(phoneNumber, workspaceId, simulation);
  },

  async clearSession(phoneNumber: string, workspaceId = DEFAULT_WORKSPACE_ID, expectedId?: string, simulation = false): Promise<boolean> {
    return WorkflowSessionsDB.delete(phoneNumber, workspaceId, expectedId, simulation);
  },

  async listActiveSessions(workspaceId = DEFAULT_WORKSPACE_ID): Promise<WorkflowSessionState[]> {
    return WorkflowSessionsDB.list(workspaceId);
  },

  async claimDueDelaySessions(limit = 10) {
    return WorkflowSessionsDB.claimDueDelays(limit);
  },

  async releaseSessionClaim(sessionId: string, claimToken: string): Promise<void> {
    return WorkflowSessionsDB.releaseClaim(sessionId, claimToken);
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

  getButtonLogs(limit = 50, workspaceId?: string): ButtonTestEvent[] {
    return globalState.buttonLogs
      .filter(event => !workspaceId || event.workspaceId === workspaceId)
      .slice(0, limit);
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

  getCarouselLogs(limit = 50, workspaceId?: string): CarouselTestEvent[] {
    return globalState.carouselLogs
      .filter(event => !workspaceId || event.workspaceId === workspaceId)
      .slice(0, limit);
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
