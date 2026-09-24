'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { VisualAutomationCanvas } from '@/components/automations/VisualAutomationCanvas';
import { WorkflowAnalyticsBar } from '@/components/automations/WorkflowAnalyticsBar';
import { TestWorkflowModal } from '@/components/automations/TestWorkflowModal';
import { ExecutionLogsModal } from '@/components/automations/ExecutionLogsModal';
import {
  WorkflowDefinition,
  WorkflowExecutionLog,
  ExecutionTraceStep,
} from '@/types/automations';
import {
  Zap,
  Play,
  Save,
  Check,
  Plus,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Sliders,
  Terminal,
  Bug,
  AlertCircle,
  HelpCircle,
  BarChart3,
  RefreshCw,
  FolderOpen,
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
      position: { x: 80, y: 180 },
    },
    {
      id: 'node_welcome',
      type: 'whatsapp_message',
      title: 'Welcome VIP Greeting',
      description: 'Personalized greeting introducing official store catalog',
      config: {
        text: 'Hello! Welcome to our Official WhatsApp Store. Here are our active product pricing and featured collections. How can we assist you today?',
      },
      position: { x: 380, y: 180 },
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
      position: { x: 680, y: 180 },
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
          {
            headerImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
            title: 'Aviator Sun Shades',
            description: 'Polarized UV400 classic gold frame. $79',
            buttons: [{ id: 'card_btn_3', title: 'Order Shades' }],
          },
        ],
      },
      position: { x: 980, y: 180 },
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
      position: { x: 1280, y: 180 },
    },
    {
      id: 'node_crm_qualified',
      type: 'crm_action',
      title: 'Advance CRM to Qualified Lead',
      description: 'Labels contact as Qualified Lead in sales pipeline',
      config: {
        stage: 'qualified',
        notes: 'Buyer engaged with product carousel and requested quotation',
      },
      position: { x: 1580, y: 80 },
    },
    {
      id: 'node_sheets_sync',
      type: 'google_sheets',
      title: 'Log Lead in Google Sheets',
      description: 'Syncs lead phone, timestamp, and interested product',
      config: {
        sheetName: 'WhatsApp Sales Funnel Leads',
        operation: 'append_row',
      },
      position: { x: 1880, y: 80 },
    },
    {
      id: 'node_tag_buyer',
      type: 'tag_management',
      title: 'Tag Contact with #vip_buyer',
      description: 'Applies VIP buyer tag to contact profile in database',
      config: {
        action: 'add',
        tag: 'vip_buyer',
      },
      position: { x: 1580, y: 280 },
    },
    {
      id: 'node_wait_reply',
      type: 'wait_for_reply',
      title: 'Wait for Customer Response',
      description: 'Awaiting customer response with 30m timeout',
      config: {
        timeoutMinutes: 30,
      },
      position: { x: 1880, y: 280 },
    },
    {
      id: 'node_end',
      type: 'end',
      title: 'Funnel Completed',
      description: 'Sales qualification flow concludes successfully',
      config: {},
      position: { x: 2180, y: 180 },
    },
  ],
  edges: [
    { id: 'e1', source: 'node_trigger', target: 'node_welcome', animated: true },
    { id: 'e2', source: 'node_welcome', target: 'node_buttons' },
    { id: 'e3', source: 'node_buttons', target: 'node_carousel' },
    { id: 'e4', source: 'node_carousel', target: 'node_condition' },
    { id: 'e5_true', source: 'node_condition', sourceHandle: 'true', target: 'node_crm_qualified', label: 'True' },
    { id: 'e5_false', source: 'node_condition', sourceHandle: 'false', target: 'node_tag_buyer', label: 'False' },
    { id: 'e6_crm_sheets', source: 'node_crm_qualified', target: 'node_sheets_sync' },
    { id: 'e7_tag_wait', source: 'node_tag_buyer', target: 'node_wait_reply' },
    { id: 'e8_sheets_end', source: 'node_sheets_sync', target: 'node_end' },
    { id: 'e9_wait_end', source: 'node_wait_reply', target: 'node_end' },
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
      position: { x: 100, y: 180 },
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
      position: { x: 400, y: 180 },
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
      position: { x: 720, y: 180 },
    },
    {
      id: 'node_tech_action',
      type: 'tag_management',
      title: 'Tag Contact: #tech_support',
      description: 'Applies tech support tag to contact',
      config: { action: 'add', tag: 'tech_support' },
      position: { x: 1040, y: 60 },
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
      position: { x: 1040, y: 180 },
    },
    {
      id: 'node_human_escalate',
      type: 'crm_action',
      title: 'Escalate to Live Agent in CRM',
      description: 'Assigns priority agent in team inbox',
      config: { stage: 'negotiation', notes: 'Customer requested human agent escalation' },
      position: { x: 1040, y: 300 },
    },
    {
      id: 'node_support_end',
      type: 'end',
      title: 'Triage Concluded',
      description: 'Ticket successfully assigned',
      config: {},
      position: { x: 1360, y: 180 },
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
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([DEFAULT_VIP_SALES_FUNNEL, DEFAULT_SUPPORT_ROUTER_FUNNEL]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition>(DEFAULT_VIP_SALES_FUNNEL);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Testing & Execution State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [lastExecution, setLastExecution] = useState<WorkflowExecutionLog | null>(null);
  const [executionTrace, setExecutionTrace] = useState<ExecutionTraceStep[]>([]);

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

  // 2. Save current workflow to backend database
  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeWorkflow),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save workflow', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Create new blank workflow
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
          position: { x: 100, y: 180 },
        },
        {
          id: `node_msg_${Date.now() + 1}`,
          type: 'whatsapp_message',
          title: 'Welcome Message',
          description: 'Automated greeting message',
          config: { text: 'Hello! Thank you for contacting us. How may we assist you today?' },
          position: { x: 420, y: 180 },
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
  };

  // 4. Run Test Workflow simulation with live node-by-node illumination
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
          debugMode,
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
            // Brief visual illumination delay between nodes
            await new Promise((r) => setTimeout(r, 400));
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

  return (
    <div className="flex h-screen bg-[#0B0F19] text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Builder Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          title="Visual Automations Engine"
          subtitle="Design, simulate, and deploy interactive WhatsApp funnels visually"
        />

        {/* Visual Engine Top Bar */}
        <div className="bg-gray-950 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between gap-3 z-10">
          {/* Left: Workflow Selector & Name Editor */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Workflow Dropdown */}
            <div className="relative">
              <select
                value={activeWorkflow.id}
                onChange={(e) => {
                  const found = workflows.find((w) => w.id === e.target.value);
                  if (found) {
                    setActiveWorkflow(found);
                    setExecutionTrace([]);
                    setLastExecution(null);
                  }
                }}
                className="bg-gray-900 border border-gray-700/80 rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500/80 appearance-none cursor-pointer"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Editable Workflow Name */}
            <input
              type="text"
              value={activeWorkflow.name}
              onChange={(e) =>
                setActiveWorkflow({ ...activeWorkflow, name: e.target.value })
              }
              className="bg-transparent border-b border-dashed border-gray-700 hover:border-gray-500 focus:border-emerald-500 text-sm font-bold text-white focus:outline-none px-1 py-0.5 truncate max-w-[260px]"
            />

            {/* Active Switch */}
            <button
              onClick={() =>
                setActiveWorkflow({
                  ...activeWorkflow,
                  isActive: !activeWorkflow.isActive,
                })
              }
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5',
                activeWorkflow.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-900 text-gray-500 border-gray-800'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  activeWorkflow.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                )}
              />
              {activeWorkflow.isActive ? 'Active 24/7' : 'Paused'}
            </button>
          </div>

          {/* Right: Actions, Debug Mode, Run Test, Execution Logs, Save */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* New Workflow */}
            <button
              onClick={handleCreateNewWorkflow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Flow</span>
            </button>

            {/* Toggle Analytics Bar */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={cn(
                'p-1.5 border rounded-xl transition-all',
                showAnalytics
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              )}
              title="Toggle Workflow Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Debug Mode Toggle */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-xs font-mono transition-all',
                debugMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              )}
              title="Toggle Debug Inspector Mode"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug</span>
            </button>

            {/* Execution Logs Button */}
            <button
              onClick={() => setIsLogsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-xl text-xs font-semibold transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Logs</span>
            </button>

            {/* Run Test Workflow Button */}
            <button
              onClick={() => setIsTestModalOpen(true)}
              disabled={isExecutingTest}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {isExecutingTest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Running Test...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>Run Test</span>
                </>
              )}
            </button>

            {/* Save Workflow Button */}
            <button
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved Live</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workflow Analytics Bar (Collapsible) */}
        {showAnalytics && <WorkflowAnalyticsBar workflow={activeWorkflow} />}

        {/* Main Infinite Node Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <VisualAutomationCanvas
            workflow={activeWorkflow}
            onChangeWorkflow={setActiveWorkflow}
            executionTrace={executionTrace}
            isExecuting={isExecutingTest}
            debugMode={debugMode}
          />
        </div>
      </div>

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
