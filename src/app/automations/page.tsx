'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { VisualAutomationCanvas } from '@/components/automations/VisualAutomationCanvas';
import { TestWorkflowModal } from '@/components/automations/TestWorkflowModal';
import { ExecutionLogsModal } from '@/components/automations/ExecutionLogsModal';
import {
  WorkflowDefinition,
  WorkflowExecutionLog,
  ExecutionTraceStep,
} from '@/types/automations';
import {
  Zap,
  Plus,
  ChevronDown,
  Layers,
  Sparkles,
  BarChart3,
  RefreshCw,
  FolderOpen,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Production Ready WhatsApp Funnel Preset 1: Complete VIP Sales & Catalog Funnel (3 Branches)
const DEFAULT_VIP_SALES_FUNNEL: WorkflowDefinition = {
  id: 'wf_welcome_interactive',
  workspaceId: 'default',
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
      type: 'trigger_keyword',
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
      type: 'whatsapp_message',
      title: 'Send Welcome Message',
      description: 'Instant personalized introduction message',
      config: {
        text: '🌟 Welcome to our Official WhatsApp Store! How can we assist you today?',
      },
      position: { x: 380, y: 300 },
      nextNodeId: 'node_button_menu',
    },
    {
      id: 'node_button_menu',
      type: 'whatsapp_button',
      title: 'Interactive Button Message',
      description: 'Presents 3 action buttons to customer and pauses execution',
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
      type: 'whatsapp_carousel',
      title: 'Show Product Carousel',
      description: 'Displays 3 interactive cards with product photos & CTAs',
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
      type: 'whatsapp_message',
      title: 'Send Pricing Information',
      description: 'Dispatches pricing tier details to customer',
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
      type: 'whatsapp_message',
      title: 'Send Expert Request Confirmation',
      description: 'Sends confirmation to customer that specialist was notified',
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
    // Branch 1: Browse Catalog
    { id: 'e_btn_catalog', source: 'node_button_menu', sourceHandle: 'btn_catalog', target: 'node_carousel_showcase', label: 'Browse Catalog' },
    { id: 'e_carousel_wait', source: 'node_carousel_showcase', target: 'node_wait_product' },
    { id: 'e_wait_tag', source: 'node_wait_product', target: 'node_condition_tag' },
    { id: 'e_tag_end', source: 'node_condition_tag', target: 'node_end_catalog' },
    // Branch 2: Get Pricing
    { id: 'e_btn_pricing', source: 'node_button_menu', sourceHandle: 'btn_pricing', target: 'node_pricing_info', label: 'Get Pricing' },
    { id: 'e_pricing_end', source: 'node_pricing_info', target: 'node_end_pricing' },
    // Branch 3: Talk To Expert
    { id: 'e_btn_agent', source: 'node_button_menu', sourceHandle: 'btn_agent', target: 'node_expert_request', label: 'Talk To Expert' },
    { id: 'e_expert_msg', source: 'node_expert_request', target: 'node_expert_msg' },
    { id: 'e_expert_end', source: 'node_expert_msg', target: 'node_end_expert' },
  ],
};

// Production Ready WhatsApp Funnel Preset 2: Support Ticket & Multi-Branch Router
const DEFAULT_SUPPORT_ROUTER_FUNNEL: WorkflowDefinition = {
  id: 'wf_support_triage',
  workspaceId: 'default',
  name: 'Support Ticket Triage & Router',
  description: 'Multi-branch support funnel routing inquiries to tech, billing, or human agents',
  triggerType: 'incoming_message',
  triggerKeyword: 'help',
  isActive: true,
  debugModeEnabled: false,
  executionCount: 18,
  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'node_trig_inbound',
      type: 'trigger_incoming',
      title: 'Any Inbound Message Trigger',
      description: 'Listens for customer support inquiries',
      config: {},
      position: { x: 100, y: 160 },
    },
    {
      id: 'node_support_menu',
      type: 'whatsapp_button',
      title: 'Support Department Menu',
      description: 'Presents 3 department options',
      config: {
        bodyText: 'Hello! How can our support team assist you today?',
        buttons: [
          { id: 'btn_tech', title: 'Tech Support' },
          { id: 'btn_billing', title: 'Billing & Invoices' },
          { id: 'btn_human', title: 'Speak to Human' },
        ],
      },
      position: { x: 440, y: 160 },
    },
    {
      id: 'node_router',
      type: 'multi_branch',
      title: 'Department Multi-Branch Router',
      description: 'Routes execution based on department selected',
      config: {
        conditionVariable: 'text',
        branches: [
          { id: 'tech', label: 'Tech Support', conditionValue: 'tech' },
          { id: 'billing', label: 'Billing', conditionValue: 'billing' },
          { id: 'human', label: 'Human Agent', conditionValue: 'human' },
        ],
      },
      position: { x: 780, y: 160 },
    },
    {
      id: 'node_tech_action',
      type: 'tag_management',
      title: 'Tag Contact: #tech_support',
      description: 'Applies tech support tag to contact',
      config: { action: 'add', tag: 'tech_support' },
      position: { x: 1120, y: 50 },
    },
    {
      id: 'node_billing_api',
      type: 'api_node',
      title: 'Fetch Billing Status via API',
      description: 'Queries internal billing server for customer invoices',
      config: {
        apiUrl: 'https://api.example.com/v1/invoices',
        apiMethod: 'GET',
      },
      position: { x: 1120, y: 160 },
    },
    {
      id: 'node_human_escalate',
      type: 'crm_action',
      title: 'Escalate to Live Agent in CRM',
      description: 'Assigns priority agent in team inbox',
      config: { stage: 'negotiation', notes: 'Customer requested human agent escalation' },
      position: { x: 1120, y: 280 },
    },
    {
      id: 'node_support_end',
      type: 'end',
      title: 'Triage Concluded',
      description: 'Ticket successfully assigned',
      config: {},
      position: { x: 1460, y: 160 },
    },
  ],
  edges: [
    { id: 'es1', source: 'node_trig_inbound', target: 'node_support_menu', animated: true },
    { id: 'es2', source: 'node_support_menu', target: 'node_router' },
    { id: 'es3_tech', source: 'node_router', sourceHandle: 'tech', target: 'node_tech_action' },
    { id: 'es3_billing', source: 'node_router', sourceHandle: 'billing', target: 'node_billing_api' },
    { id: 'es3_human', source: 'node_router', sourceHandle: 'human', target: 'node_human_escalate' },
    { id: 'es4_tech', source: 'node_tech_action', target: 'node_support_end' },
    { id: 'es4_billing', source: 'node_billing_api', target: 'node_support_end' },
    { id: 'es4_human', source: 'node_human_escalate', target: 'node_support_end' },
  ],
};

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([
    DEFAULT_VIP_SALES_FUNNEL,
    DEFAULT_SUPPORT_ROUTER_FUNNEL,
  ]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition>(DEFAULT_VIP_SALES_FUNNEL);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Testing & Execution State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [lastExecution, setLastExecution] = useState<WorkflowExecutionLog | null>(null);
  const [executionTrace, setExecutionTrace] = useState<ExecutionTraceStep[]>([]);

  // Debounced auto-save ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch real workflows on mount
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automations?format=dag');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWorkflows(data);
          setActiveWorkflow(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load workflows', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // 2. Save workflow to backend database
  const saveWorkflowToBackend = useCallback(async (wf: WorkflowDefinition) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wf),
      });

      if (res.ok) {
        setLastSavedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to save workflow', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // 3. Workflow change handler with auto-save
  const handleWorkflowChange = useCallback(
    (updated: WorkflowDefinition) => {
      setActiveWorkflow(updated);
      setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));

      // Debounce auto-save by 800ms
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveWorkflowToBackend(updated);
      }, 800);
    },
    [saveWorkflowToBackend]
  );

  // 4. Create new blank workflow
  const handleCreateNewWorkflow = () => {
    const newWf: WorkflowDefinition = {
      id: `wf_${Date.now()}`,
      workspaceId: 'default',
      name: 'New Custom Visual Funnel',
      description: 'Visual node-based automation flow',
      triggerType: 'keyword',
      triggerKeyword: 'start',
      isActive: true,
      executionCount: 0,
      nodes: [
        {
          id: `node_trig_${Date.now()}`,
          type: 'trigger_keyword',
          title: 'Keyword Trigger',
          description: 'Fires when customer sends matching keyword',
          config: { text: 'start, menu, help' },
          position: { x: 100, y: 160 },
        },
        {
          id: `node_msg_${Date.now() + 1}`,
          type: 'whatsapp_message',
          title: 'Welcome Message',
          description: 'Automated greeting message',
          config: { text: 'Hello! Thank you for contacting us. How may we assist you today?' },
          position: { x: 440, y: 160 },
        },
      ],
      edges: [
        {
          id: `e_${Date.now()}`,
          source: `node_trig_${Date.now()}`,
          target: `node_msg_${Date.now() + 1}`,
          animated: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkflows((prev) => [newWf, ...prev]);
    setActiveWorkflow(newWf);
    saveWorkflowToBackend(newWf);
  };

  // 5. Run Test Workflow simulation with live node-by-node illumination
  const handleRunTestWorkflow = async (payload: {
    phoneNumber: string;
    text: string;
    simulationType: string;
  }) => {
    setIsExecutingTest(true);
    try {
      const res = await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: activeWorkflow.id,
          phoneNumber: payload.phoneNumber,
          text: payload.text,
          simulationType: payload.simulationType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const execLog: WorkflowExecutionLog = data.activeExecution || data.executions?.[0];

        if (execLog) {
          setLastExecution(execLog);

          // Step-by-step visual animation across the canvas
          const steps = execLog.steps || [];
          for (let i = 0; i < steps.length; i++) {
            setExecutionTrace(steps.slice(0, i + 1));
            await new Promise((r) => setTimeout(r, 450));
          }
          setExecutionTrace(steps);
          return execLog;
        }
      }
      return null;
    } catch (err) {
      console.error('Test execution failed', err);
      return null;
    } finally {
      setIsExecutingTest(false);
    }
  };

  // Responsive Navigation Sidebar Collapse State
  const [isNavSidebarCollapsed, setIsNavSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed') === 'true';
      setIsNavSidebarCollapsed(saved);
    } catch {}

    const handleCollapse = (e: any) => {
      setIsNavSidebarCollapsed(Boolean(e.detail?.collapsed));
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };

    window.addEventListener('sidebar-collapse', handleCollapse);
    return () => window.removeEventListener('sidebar-collapse', handleCollapse);
  }, []);

  return (
    <div
      className={cn(
        'flex h-screen bg-slate-950 text-white overflow-hidden select-none transition-all duration-200 ease-in-out',
        isNavSidebarCollapsed ? 'pl-0 md:pl-[68px]' : 'pl-0 md:pl-60'
      )}
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Studio Area (16px gap from Navigation Sidebar) */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden p-3 lg:p-4">
        <VisualAutomationCanvas
          workflow={activeWorkflow}
          onChangeWorkflow={handleWorkflowChange}
          workflows={workflows}
          onSelectWorkflow={(id) => {
            const found = workflows.find((w) => w.id === id);
            if (found) {
              setActiveWorkflow(found);
              setExecutionTrace([]);
              setLastExecution(null);
            }
          }}
          onCreateWorkflow={handleCreateNewWorkflow}
          executionTrace={executionTrace}
          isExecuting={isExecutingTest}
          onRunTest={() => setIsTestModalOpen(true)}
          onOpenLogs={() => setIsLogsModalOpen(true)}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
        />
      </main>

      {/* Test Workflow Modal */}
      <TestWorkflowModal
        workflow={activeWorkflow}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onRunTest={handleRunTestWorkflow}
        isRunning={isExecutingTest}
        lastExecution={lastExecution}
      />

      {/* Execution Logs Modal */}
      <ExecutionLogsModal
        workflowId={activeWorkflow.id}
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
}
