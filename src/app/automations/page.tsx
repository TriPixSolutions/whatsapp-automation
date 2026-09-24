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

// Production Ready WhatsApp Funnel Preset 1: Complete VIP Sales & Catalog Funnel
const DEFAULT_VIP_SALES_FUNNEL: WorkflowDefinition = {
  id: 'wf_vip_sales_funnel',
  workspaceId: 'default',
  name: 'Complete VIP WhatsApp Sales Funnel',
  description: 'Multi-step visual funnel with catalog, interactive buttons, lead qualification, and CRM sync',
  triggerType: 'keyword',
  triggerKeyword: 'pricing',
  triggerMatchPattern: 'contains',
  isActive: true,
  debugModeEnabled: false,
  executionCount: 42,
  stats: {
    enteredCount: 42,
    completedCount: 39,
    droppedCount: 3,
    sentCount: 96,
    deliveredCount: 94,
    readCount: 88,
    clickedCount: 76,
    repliedCount: 52,
  },
  createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'node_trigger',
      type: 'trigger_keyword',
      title: 'Keyword Trigger',
      description: 'Matches "pricing", "quote", "catalog", or "buy"',
      config: {
        text: 'pricing, quote, catalog, buy',
      },
      position: { x: 80, y: 160 },
    },
    {
      id: 'node_welcome',
      type: 'whatsapp_message',
      title: 'Welcome VIP Greeting',
      description: 'Personalized greeting introducing official store catalog',
      config: {
        text: 'Hello! Welcome to our Official WhatsApp Store. Here are our active product pricing and featured collections. How can we assist you today?',
      },
      position: { x: 420, y: 160 },
    },
    {
      id: 'node_buttons',
      type: 'whatsapp_button',
      title: 'Interactive Choice Menu',
      description: 'Presents interactive quick reply buttons to buyer',
      config: {
        bodyText: 'Please select how you would like to proceed:',
        footerText: 'Official Verified Account',
        buttons: [
          { id: 'btn_catalog', title: 'Browse Catalog', type: 'reply' },
          { id: 'btn_specialist', title: 'Talk to Sales', type: 'reply' },
        ],
      },
      position: { x: 760, y: 160 },
    },
    {
      id: 'node_carousel',
      type: 'whatsapp_carousel',
      title: 'Product Carousel Showcase',
      description: 'Multi-card scrollable product cards with images & order CTAs',
      config: {
        bodyText: 'Explore our top trending catalog highlights:',
        cards: [
          {
            headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
            title: 'Runner Pro Sneakers',
            description: 'Ultra-light breathable performance shoes. $129',
            buttons: [{ id: 'card_btn_1', title: 'Order Sneakers' }],
          },
          {
            headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            title: 'Chronos Smart Watch',
            description: 'Titanium chassis with sapphire glass. $249',
            buttons: [{ id: 'card_btn_2', title: 'Order Watch' }],
          },
        ],
      },
      position: { x: 1100, y: 160 },
    },
    {
      id: 'node_condition',
      type: 'conditional_logic',
      title: 'Check Buyer Interest Level',
      description: 'Branch based on customer engagement with catalog',
      config: {
        conditionVariable: 'text',
        conditionOperator: 'contains',
        conditionValue: 'order',
      },
      position: { x: 1440, y: 160 },
    },
    {
      id: 'node_crm_qualified',
      type: 'crm_action',
      title: 'Advance to Qualified Lead',
      description: 'Labels contact as Qualified Lead in sales pipeline',
      config: {
        stage: 'qualified',
        notes: 'Buyer engaged with product carousel and requested quotation',
      },
      position: { x: 1780, y: 60 },
    },
    {
      id: 'node_fallback_support',
      type: 'whatsapp_message',
      title: 'Follow-up Concierge',
      description: 'Provides direct specialist contact channel',
      config: {
        text: 'No problem! Our sales team is available 24/7 if you have questions about custom sizing or corporate pricing.',
      },
      position: { x: 1780, y: 260 },
    },
  ],
  edges: [
    { id: 'e1', source: 'node_trigger', target: 'node_welcome', animated: true },
    { id: 'e2', source: 'node_welcome', target: 'node_buttons' },
    { id: 'e3', source: 'node_buttons', target: 'node_carousel' },
    { id: 'e4', source: 'node_carousel', target: 'node_condition' },
    { id: 'e5_yes', source: 'node_condition', sourceHandle: 'true', target: 'node_crm_qualified', label: 'Yes' },
    { id: 'e5_no', source: 'node_condition', sourceHandle: 'false', target: 'node_fallback_support', label: 'No' },
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
