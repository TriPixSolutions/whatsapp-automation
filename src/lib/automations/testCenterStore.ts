import {
  WorkflowDefinition,
  WorkflowExecutionLog,
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

// Seed default workflows if none exist
function seedDefaultWorkflows() {
  const defaultFlowId = 'wf_welcome_interactive';
  if (!globalState.workflows[defaultFlowId]) {
    globalState.workflows[defaultFlowId] = {
      id: defaultFlowId,
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: 'Interactive VIP Concierge & Catalog Flow',
      description: 'Triggered by greeting or lead form submission with buttons and carousel',
      triggerType: 'keyword',
      triggerKeyword: 'Hello',
      triggerMatchPattern: 'contains',
      isActive: true,
      debugModeEnabled: true,
      executionCount: 24,
      stats: {
        enteredCount: 24,
        completedCount: 22,
        droppedCount: 2,
        sentCount: 48,
        deliveredCount: 46,
        readCount: 42,
        clickedCount: 38,
        repliedCount: 29,
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'node_trigger',
          type: 'trigger',
          title: 'Incoming Keyword Trigger',
          description: 'Matches "Hello", "Hi", "Start", or "Pricing"',
          triggerType: 'keyword',
          triggerKeyword: 'Hello',
          config: {
            text: 'Hello',
          },
          position: { x: 100, y: 150 },
          nextNodeId: 'node_welcome_msg',
        },
        {
          id: 'node_welcome_msg',
          type: 'message',
          title: 'Welcome VIP Greeting',
          description: 'Instant personalized introduction message',
          messageType: 'text',
          config: {
            text: '🌟 Welcome to our Official WhatsApp Store! How can we assist you today?',
          },
          position: { x: 380, y: 150 },
          nextNodeId: 'node_button_menu',
        },
        {
          id: 'node_button_menu',
          type: 'button',
          title: 'Interactive Quick Reply Buttons',
          description: 'Presents 3 action buttons to customer',
          messageType: 'interactive_button',
          config: {
            bodyText: 'Please select an option below to get started immediately:',
            footerText: 'Official Verified Account',
            buttons: [
              { id: 'btn_catalog', title: 'Browse Catalog', type: 'reply' },
              { id: 'btn_pricing', title: 'Get Pricing Offer', type: 'reply' },
              { id: 'btn_agent', title: 'Talk to Expert', type: 'reply' },
            ],
          },
          position: { x: 660, y: 150 },
          nextNodeId: 'node_carousel_showcase',
        },
        {
          id: 'node_carousel_showcase',
          type: 'carousel',
          title: 'Product Carousel Showcase',
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
          position: { x: 940, y: 150 },
          nextNodeId: 'node_condition_tag',
        },
        {
          id: 'node_condition_tag',
          type: 'condition',
          title: 'Tag Customer as VIP Lead',
          description: 'Automatically labels contact with "vip_lead" tag',
          actionType: 'tag_contact',
          config: {
            tag: 'vip_lead',
          },
          position: { x: 1220, y: 150 },
          nextNodeId: 'node_end',
        },
        {
          id: 'node_end',
          type: 'end',
          title: 'Workflow Completed',
          description: 'Execution ends successfully. Awaiting customer reply.',
          config: {},
          position: { x: 1500, y: 150 },
        },
      ],
      edges: [
        { id: 'e_trigger_welcome', source: 'node_trigger', target: 'node_welcome_msg', animated: true },
        { id: 'e_welcome_button', source: 'node_welcome_msg', target: 'node_button_menu' },
        { id: 'e_button_carousel', source: 'node_button_menu', target: 'node_carousel_showcase' },
        { id: 'e_carousel_tag', source: 'node_carousel_showcase', target: 'node_condition_tag' },
        { id: 'e_tag_end', source: 'node_condition_tag', target: 'node_end' },
      ],
    };
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
function persistStore() {
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
