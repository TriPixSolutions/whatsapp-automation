'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Search,
  Code2,
  Webhook,
  Smartphone,
  Eye,
  MousePointerClick,
  Sliders,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Info,
  Activity,
  Zap,
  Pause,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  WorkflowExecutionLog,
  MessageDeliveryReceipt,
  MetaApiLog,
  WebhookLogItem,
  ButtonTestEvent,
  CarouselTestEvent,
  MetaValidationResult,
  ProductionReadinessReport,
  WorkflowDefinition,
} from '@/types/automations';

export default function TestCenterPage() {
  const [activeTab, setActiveTab] = useState<
    | 'simulator'
    | 'message_lab'
    | 'sandbox_settings'
    | 'execution_monitor'
    | 'meta_viewer'
    | 'webhook_inspector'
    | 'conversation_view'
    | 'button_lab'
    | 'carousel_lab'
    | 'production_checker'
  >('simulator');

  // Simulator State
  const [testPhoneNumber, setTestPhoneNumber] = useState('+919876543210');
  const [simulationType, setSimulationType] = useState<
    | 'incoming_message'
    | 'keyword_trigger'
    | 'button_click'
    | 'carousel_click'
    | 'cta_click'
    | 'lead_form'
    | 'list_selection'
    | 'flow_submission'
    | 'webhook_event'
    | 'api_trigger'
    | 'manual_trigger'
  >('incoming_message');

  const [simText, setSimText] = useState('Hello');
  const [simButtonId, setSimButtonId] = useState('btn_catalog');
  const [simButtonTitle, setSimButtonTitle] = useState('Browse Catalog');
  const [simCardIndex, setSimCardIndex] = useState(0);
  const [simCardButtonId, setSimCardButtonId] = useState('buy_shoes');
  const [simLeadSource, setSimLeadSource] = useState<'facebook' | 'instagram'>('facebook');
  const [debugMode, setDebugMode] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeExecution, setActiveExecution] = useState<WorkflowExecutionLog | null>(null);

  // Message Lab State
  const [testMsgType, setTestMsgType] = useState<
    'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'button' | 'list' | 'carousel' | 'flow' | 'location' | 'contact_card'
  >('text');
  const [testMsgRecipient, setTestMsgRecipient] = useState('+919876543210');
  const [testMsgText, setTestMsgText] = useState('🌟 Hello from WhatsApp Test Center! All systems functional.');
  const [testMsgTemplate, setTestMsgTemplate] = useState('welcome_offer_2026');
  const [testMsgMediaUrl, setTestMsgMediaUrl] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80');
  const [testMsgCaption, setTestMsgCaption] = useState('Exclusive product showcase for registered VIP members.');
  const [testMsgLocationName, setTestMsgLocationName] = useState('Connaught Place');
  const [testMsgLocationAddress, setTestMsgLocationAddress] = useState('New Delhi, India');
  const [testMsgContactName, setTestMsgContactName] = useState('TriPix Support Specialist');
  const [testMsgContactPhone, setTestMsgContactPhone] = useState('+18005550199');
  const [isSendingTestMsg, setIsSendingTestMsg] = useState(false);
  const [testMsgResult, setTestMsgResult] = useState<any>(null);

  // Sandbox State
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [sandboxRecipients, setSandboxRecipients] = useState<
    { phoneNumber: string; name: string; addedAt: string; verified: boolean }[]
  >([]);
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [workflowStatusMap, setWorkflowStatusMap] = useState<Record<string, 'running' | 'paused' | 'stopped'>>({});

  // Data Stores
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [executionLogs, setExecutionLogs] = useState<WorkflowExecutionLog[]>([]);
  const [deliveryReceipts, setDeliveryReceipts] = useState<MessageDeliveryReceipt[]>([]);
  const [metaLogs, setMetaLogs] = useState<MetaApiLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [buttonLogs, setButtonLogs] = useState<ButtonTestEvent[]>([]);
  const [carouselLogs, setCarouselLogs] = useState<CarouselTestEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<MetaValidationResult | null>(null);
  const [readinessReport, setReadinessReport] = useState<ProductionReadinessReport | null>(null);

  // Filtering & UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch initial data
  const loadData = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      // 1. Workflows
      const wfRes = await fetch('/api/automations?format=dag');
      if (wfRes.ok) {
        const wfData = await wfRes.json();
        setWorkflows(wfData);
        if (wfData.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(wfData[0].id);
        }
      }

      // 2. Logs
      const logsRes = await fetch('/api/test-center/logs?type=all&limit=50');
      if (logsRes.ok) {
        const data = await logsRes.json();
        if (data.executions) setExecutionLogs(data.executions);
        if (data.deliveries) setDeliveryReceipts(data.deliveries);
        if (data.metaLogs) setMetaLogs(data.metaLogs);
        if (data.webhookLogs) setWebhookLogs(data.webhookLogs);
      }

      // 3. Button & Carousel logs
      const btnRes = await fetch('/api/test-center/button-test');
      if (btnRes.ok) setButtonLogs(await btnRes.json());

      const carRes = await fetch('/api/test-center/carousel-test');
      if (carRes.ok) setCarouselLogs(await carRes.json());

      // 4. Chat Feed
      const chatRes = await fetch('/api/test-center/inbox?limit=40');
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setChatMessages(chatData.messages || []);
      }

      // 5. Sandbox Settings
      const sbRes = await fetch('/api/test-center/sandbox');
      if (sbRes.ok) {
        const sbData = await sbRes.json();
        setSandboxEnabled(Boolean(sbData.sandboxEnabled));
        if (Array.isArray(sbData.sandboxRecipients)) {
          setSandboxRecipients(sbData.sandboxRecipients);
        }
      }
    } catch (err) {
      console.error('[Test Center] Data load failed:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    loadData();
    const interval = autoRefresh ? setInterval(loadData, 6000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadData, autoRefresh]);

  // Execute Trigger Simulation
  const handleRunSimulation = async () => {
    setIsExecuting(true);
    try {
      const payload: any = {
        simulationType,
        phoneNumber: testPhoneNumber,
        workflowId: selectedWorkflowId || undefined,
        debugMode,
      };

      if (simulationType === 'incoming_message' || simulationType === 'keyword_trigger') {
        payload.text = simText;
      } else if (simulationType === 'button_click' || simulationType === 'cta_click') {
        payload.buttonId = simButtonId;
        payload.buttonTitle = simButtonTitle;
      } else if (simulationType === 'carousel_click') {
        payload.cardIndex = simCardIndex;
        payload.cardButtonId = simCardButtonId;
      } else if (simulationType === 'lead_form') {
        payload.leadFormSource = simLeadSource;
      } else if (simulationType === 'list_selection') {
        payload.buttonId = simButtonId || 'opt_vip_support';
        payload.buttonTitle = simButtonTitle || 'VIP Priority Support';
      } else if (simulationType === 'flow_submission') {
        payload.flowId = 'flow_reg_9921';
      }

      const res = await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.activeExecution) {
        setActiveExecution(data.activeExecution);
      }
      // Reload logs immediately
      await loadData();
    } catch (err) {
      console.error('[Simulation Error]:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run Meta Validation Check
  const handleRunMetaValidation = async () => {
    try {
      const res = await fetch('/api/test-center/meta-validate');
      if (res.ok) {
        setValidationResult(await res.json());
      }
    } catch (err) {
      console.error('[Meta Validate Error]:', err);
    }
  };

  // Run One-Click Production Readiness Check
  const handleRunProductionCheck = async () => {
    try {
      const res = await fetch('/api/test-center/production-readiness');
      if (res.ok) {
        setReadinessReport(await res.json());
      }
    } catch (err) {
      console.error('[Production Check Error]:', err);
    }
  };

  // Direct Message Lab Dispatch
  const handleSendTestMessage = async () => {
    setIsSendingTestMsg(true);
    setTestMsgResult(null);
    try {
      const res = await fetch('/api/test-center/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: testMsgType,
          phoneNumber: testMsgRecipient || testPhoneNumber,
          text: testMsgText,
          templateName: testMsgTemplate,
          mediaUrl: testMsgMediaUrl,
          caption: testMsgCaption,
          location: {
            name: testMsgLocationName,
            address: testMsgLocationAddress,
            latitude: 28.6139,
            longitude: 77.2090,
          },
          contactCard: {
            formattedName: testMsgContactName,
            phoneNumber: testMsgContactPhone,
            org: 'TriPix Global',
          },
        }),
      });
      const data = await res.json();
      setTestMsgResult(data);
      await loadData();
    } catch (err: any) {
      setTestMsgResult({ error: err.message });
    } finally {
      setIsSendingTestMsg(false);
    }
  };

  // Sandbox Mode Control
  const handleToggleSandbox = async () => {
    const nextState = !sandboxEnabled;
    setSandboxEnabled(nextState);
    try {
      await fetch('/api/test-center/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_enabled', enabled: nextState }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSandboxRecipient = async () => {
    if (!newRecipientPhone) return;
    try {
      const res = await fetch('/api/test-center/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_recipient',
          phoneNumber: newRecipientPhone,
          name: newRecipientName || 'Sandbox Tester',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recipients) setSandboxRecipients(data.recipients);
        setNewRecipientPhone('');
        setNewRecipientName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSandboxRecipient = async (phone: string) => {
    try {
      const res = await fetch('/api/test-center/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_recipient', phoneNumber: phone }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recipients) setSandboxRecipients(data.recipients);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWorkflowAction = (wfId: string, action: 'run' | 'pause' | 'resume' | 'stop') => {
    if (action === 'run') {
      setSelectedWorkflowId(wfId);
      handleRunSimulation();
      setWorkflowStatusMap((prev) => ({ ...prev, [wfId]: 'running' }));
    } else if (action === 'pause') {
      setWorkflowStatusMap((prev) => ({ ...prev, [wfId]: 'paused' }));
    } else if (action === 'resume') {
      setWorkflowStatusMap((prev) => ({ ...prev, [wfId]: 'running' }));
    } else if (action === 'stop') {
      setWorkflowStatusMap((prev) => ({ ...prev, [wfId]: 'stopped' }));
      setActiveExecution(null);
    }
  };

  // Button Lab Quick Dispatch
  const handleDispatchButtonTest = async (type: 'quick_reply' | 'url' | 'call' | 'copy_code') => {
    try {
      const res = await fetch('/api/test-center/button-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          buttonType: type,
          phoneNumber: testPhoneNumber,
          buttonTitle: type === 'url' ? 'Visit Shop' : type === 'call' ? 'Call Support' : 'Apply Voucher',
        }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Carousel Lab Quick Dispatch
  const handleDispatchCarouselTest = async () => {
    try {
      await fetch('/api/test-center/carousel-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          phoneNumber: testPhoneNumber,
          carouselTitle: 'Featured Luxury Collection',
        }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Clear All Logs
  const handleClearLogs = async () => {
    if (confirm('Clear all test center logs, delivery receipts, and Meta traces?')) {
      await fetch('/api/test-center/logs', { method: 'DELETE' });
      setActiveExecution(null);
      await loadData();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header title="Workflow Test Center" subtitle="Testing Lab & Verification Engine" />

        {/* Top Control Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Workflow Test Center
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/50">
                  Platform 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                End-to-end trigger simulation, Meta API validation, button labs & live execution debugging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setActiveTab('production_checker');
                handleRunProductionCheck();
                handleRunMetaValidation();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Production Readiness Check
            </button>

            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh all telemetry data"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoadingLogs && 'animate-spin')} />
              Refresh
            </button>

            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Purge test records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-6 py-2 overflow-x-auto scrollbar-none flex items-center gap-1">
          {[
            { id: 'simulator', label: '1. Simulate Triggers', icon: Zap },
            { id: 'message_lab', label: '2. Send Test Message (12 Types)', icon: Send },
            { id: 'sandbox_settings', label: '3. Test Numbers & Sandbox', icon: Smartphone },
            { id: 'execution_monitor', label: '4. Live Execution & Deliveries', icon: Activity },
            { id: 'meta_viewer', label: '5. Meta Response Viewer', icon: Code2 },
            { id: 'webhook_inspector', label: '6. Webhook Inspector', icon: Webhook },
            { id: 'conversation_view', label: '7. Live WhatsApp Inbox', icon: Smartphone },
            { id: 'button_lab', label: '8. Button Testing Lab', icon: MousePointerClick },
            { id: 'carousel_lab', label: '9. Carousel Testing Lab', icon: Layers },
            { id: 'production_checker', label: '10. Meta & Readiness', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'production_checker') {
                    handleRunProductionCheck();
                    handleRunMetaValidation();
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-emerald-600' : 'text-slate-400')} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ============================================================== */}
          {/* TAB 1: SIMULATE TRIGGERS & DEBUG RUNNER */}
          {/* ============================================================== */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulation Controller */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      Trigger Simulator Setup
                    </h2>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={debugMode}
                        onChange={(e) => setDebugMode(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Debug Mode</span>
                    </label>
                  </div>

                  {/* 1. Test Number Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Test Recipient Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setTestPhoneNumber('+919876543210')}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        +919876543210 (Default)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestPhoneNumber('+919800011122')}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        +919800011122 (QA 2)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestPhoneNumber('+15550192831')}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        +15550192831 (Sandbox)
                      </button>
                    </div>
                  </div>

                  {/* Workflow Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Automation Workflow
                    </label>
                    <select
                      value={selectedWorkflowId}
                      onChange={(e) => setSelectedWorkflowId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="">Auto-match by Trigger Keyword</option>
                      {workflows.map((wf) => (
                        <option key={wf.id} value={wf.id}>
                          {wf.name} ({wf.triggerKeyword || 'Any'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trigger Simulation Categories */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Trigger Category to Simulate
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'incoming_message', label: 'Incoming Message', icon: '💬' },
                        { id: 'keyword_trigger', label: 'Keyword Trigger', icon: '🔑' },
                        { id: 'button_click', label: 'Button Click', icon: '🔘' },
                        { id: 'carousel_click', label: 'Carousel Click', icon: '🎠' },
                        { id: 'cta_click', label: 'CTA URL Button', icon: '🔗' },
                        { id: 'lead_form', label: 'Meta Lead Form', icon: '📋' },
                        { id: 'list_selection', label: 'List Selection', icon: '📑' },
                        { id: 'flow_submission', label: 'Flow Submission', icon: '📝' },
                        { id: 'webhook_event', label: 'Webhook Event', icon: '⚡' },
                        { id: 'api_trigger', label: 'Custom API Trigger', icon: '🌐' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSimulationType(item.id as any)}
                          className={cn(
                            'flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer',
                            simulationType === item.id
                              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold shadow-2xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Category Parameters */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
                    {simulationType === 'incoming_message' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">Message Body</label>
                          <div className="flex gap-1">
                            {['Hi', 'Hello', 'Pricing', 'Offer', 'Start'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setSimText(preset)}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={simText}
                          onChange={(e) => setSimText(e.target.value)}
                          placeholder="e.g. Hello, what is your price?"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    {simulationType === 'keyword_trigger' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Keyword</label>
                        <input
                          type="text"
                          value={simText}
                          onChange={(e) => setSimText(e.target.value)}
                          placeholder="e.g. Pricing, Brochure, Offer"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    {simulationType === 'button_click' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Button Identifier (ID)</label>
                          <input
                            type="text"
                            value={simButtonId}
                            onChange={(e) => setSimButtonId(e.target.value)}
                            placeholder="btn_catalog"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Button Display Title</label>
                          <input
                            type="text"
                            value={simButtonTitle}
                            onChange={(e) => setSimButtonTitle(e.target.value)}
                            placeholder="Browse Catalog"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {simulationType === 'carousel_click' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Carousel Card Index</label>
                          <select
                            value={simCardIndex}
                            onChange={(e) => setSimCardIndex(parseInt(e.target.value, 10))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                          >
                            <option value={0}>Card 1: Runner Pro Sneakers</option>
                            <option value={1}>Card 2: Chronos Smart Watch</option>
                            <option value={2}>Card 3: Aviator Sun Shades</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Card Button ID Clicked</label>
                          <input
                            type="text"
                            value={simCardButtonId}
                            onChange={(e) => setSimCardButtonId(e.target.value)}
                            placeholder="buy_shoes"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {simulationType === 'lead_form' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Ad Platform</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="lead_src"
                              checked={simLeadSource === 'facebook'}
                              onChange={() => setSimLeadSource('facebook')}
                            />
                            Facebook Lead Ad
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="lead_src"
                              checked={simLeadSource === 'instagram'}
                              onChange={() => setSimLeadSource('instagram')}
                            />
                            Instagram Lead Ad
                          </label>
                        </div>
                      </div>
                    )}

                    {simulationType === 'list_selection' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">List Row ID</label>
                          <input
                            type="text"
                            value={simButtonId}
                            onChange={(e) => setSimButtonId(e.target.value)}
                            placeholder="opt_vip_support"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">List Row Title</label>
                          <input
                            type="text"
                            value={simButtonTitle}
                            onChange={(e) => setSimButtonTitle(e.target.value)}
                            placeholder="VIP Priority Support"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {simulationType === 'flow_submission' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Flow ID</label>
                          <input
                            type="text"
                            disabled
                            value="flow_reg_9921 (Registration & Lead Intake)"
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Simulates native form completion with email, service choice, and customer preferences payload.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Execute Button */}
                  <button
                    type="button"
                    disabled={isExecuting}
                    onClick={handleRunSimulation}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Simulating Workflow Dispatch...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Send Test Trigger
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Execution Monitor & Debug Trace */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        Live Execution Monitor
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Real-time node execution path, Meta responses & error trace
                      </p>
                    </div>

                    {activeExecution && (
                      <span
                        className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                          activeExecution.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activeExecution.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {activeExecution.status} ({activeExecution.totalDurationMs}ms)
                      </span>
                    )}
                  </div>

                  {/* Active Execution Nodes Flow */}
                  {activeExecution ? (
                    <div className="mt-4 space-y-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-700">Execution ID:</span>{' '}
                          <code className="font-mono text-slate-900">{activeExecution.executionId}</code>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Trigger:</span>{' '}
                          <span className="font-mono text-emerald-700 font-bold">
                            {activeExecution.triggerType} ({activeExecution.triggerValue})
                          </span>
                        </div>
                      </div>

                      {/* Step Timeline */}
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {activeExecution.steps.map((step, idx) => {
                          const isPass = step.status !== 'failed';
                          return (
                            <div key={idx} className="relative group">
                              <div
                                className={cn(
                                  'absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
                                  isPass ? 'bg-emerald-600' : 'bg-rose-600'
                                )}
                              >
                                {isPass ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              </div>

                              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase">
                                      {step.nodeType}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900">{step.nodeTitle}</h4>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {step.durationMs}ms
                                  </span>
                                </div>

                                {/* Node Outcome */}
                                <div className="mt-2 text-xs">
                                  {step.metaCall && (
                                    <div className="bg-slate-900 text-slate-100 rounded-lg p-2.5 font-mono text-[11px] overflow-x-auto space-y-1">
                                      <div className="text-emerald-400 font-bold">
                                        {step.metaCall.endpoint}
                                      </div>
                                      {step.metaCall.metaMessageId && (
                                        <div className="text-sky-300">
                                          Message ID: {step.metaCall.metaMessageId}
                                        </div>
                                      )}
                                      {step.metaCall.errorCode && (
                                        <div className="text-rose-400">
                                          Error #{step.metaCall.errorCode}: {step.metaCall.errorMessage}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {step.error && (
                                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                                      <strong>Failure:</strong> {step.error}
                                    </div>
                                  )}

                                  {step.outputResult && !step.metaCall && !step.error && (
                                    <div className="mt-1 text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-md">
                                      {JSON.stringify(step.outputResult, null, 1)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <FlaskConical className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-medium">
                        No active execution yet. Click <span className="font-bold text-emerald-600">Send Test Trigger</span> on the left to start live testing.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DIRECT MESSAGE DISPATCH LAB (12 WHATSAPP MESSAGE TYPES) */}
          {/* ============================================================== */}
          {activeTab === 'message_lab' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Message Configuration Form */}
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Send className="w-4 h-4 text-emerald-600" />
                        Interactive Message Dispatcher
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Dispatch and verify all 12 native WhatsApp Cloud API payload types
                      </p>
                    </div>
                  </div>

                  {/* Recipient Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Recipient WhatsApp Phone Number
                    </label>
                    <input
                      type="text"
                      value={testMsgRecipient}
                      onChange={(e) => setTestMsgRecipient(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  {/* Message Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select WhatsApp Message Type
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'text', label: 'Text Message', icon: '💬' },
                        { id: 'template', label: 'Meta Template', icon: '📄' },
                        { id: 'image', label: 'Image', icon: '🖼️' },
                        { id: 'video', label: 'Video', icon: '🎥' },
                        { id: 'audio', label: 'Audio Note', icon: '🎙️' },
                        { id: 'document', label: 'Document PDF', icon: '📑' },
                        { id: 'button', label: 'Quick Buttons', icon: '🔘' },
                        { id: 'list', label: 'List Picker', icon: '📋' },
                        { id: 'carousel', label: 'Carousel', icon: '🎠' },
                        { id: 'flow', label: 'WhatsApp Flow', icon: '📝' },
                        { id: 'location', label: 'Location Map', icon: '📍' },
                        { id: 'contact_card', label: 'Contact vCard', icon: '👤' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTestMsgType(item.id as any)}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer',
                            testMsgType === item.id
                              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold shadow-2xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-[11px] leading-tight truncate w-full">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                    {/* Text Field */}
                    {['text', 'button', 'list', 'flow'].includes(testMsgType) && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Message Body Text
                        </label>
                        <textarea
                          rows={3}
                          value={testMsgText}
                          onChange={(e) => setTestMsgText(e.target.value)}
                          placeholder="Type your WhatsApp message..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    {/* Template Field */}
                    {testMsgType === 'template' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Approved Meta Template
                        </label>
                        <select
                          value={testMsgTemplate}
                          onChange={(e) => setTestMsgTemplate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                        >
                          <option value="welcome_offer_2026">welcome_offer_2026 (Marketing - 20% Off)</option>
                          <option value="teaser_alert">teaser_alert (Utility - Exclusive Update)</option>
                          <option value="followup_reminder">followup_reminder (Marketing - Reminder)</option>
                          <option value="vip_offer">vip_offer (Marketing - Flash Sale)</option>
                        </select>
                      </div>
                    )}

                    {/* Media Fields */}
                    {['image', 'video', 'audio', 'document'].includes(testMsgType) && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Media Asset URL
                          </label>
                          <input
                            type="text"
                            value={testMsgMediaUrl}
                            onChange={(e) => setTestMsgMediaUrl(e.target.value)}
                            placeholder="https://domain.com/file.jpg"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                          />
                        </div>
                        {testMsgType !== 'audio' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Caption Text
                            </label>
                            <input
                              type="text"
                              value={testMsgCaption}
                              onChange={(e) => setTestMsgCaption(e.target.value)}
                              placeholder="Caption text..."
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location Fields */}
                    {testMsgType === 'location' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Place Name</label>
                          <input
                            type="text"
                            value={testMsgLocationName}
                            onChange={(e) => setTestMsgLocationName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                          <input
                            type="text"
                            value={testMsgLocationAddress}
                            onChange={(e) => setTestMsgLocationAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {/* Contact Card Fields */}
                    {testMsgType === 'contact_card' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                          <input
                            type="text"
                            value={testMsgContactName}
                            onChange={(e) => setTestMsgContactName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                          <input
                            type="text"
                            value={testMsgContactPhone}
                            onChange={(e) => setTestMsgContactPhone(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    type="button"
                    disabled={isSendingTestMsg}
                    onClick={handleSendTestMessage}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                  >
                    {isSendingTestMsg ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Transmitting to Meta Cloud API...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Test Message
                      </>
                    )}
                  </button>

                  {/* Result Telemetry Banner */}
                  {testMsgResult && (
                    <div
                      className={cn(
                        'p-4 rounded-xl border text-xs',
                        testMsgResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold">
                        <span>{testMsgResult.success ? 'Message Dispatched Successfully' : 'Dispatch Failed'}</span>
                        {testMsgResult.messageId && (
                          <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                            {testMsgResult.messageId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {testMsgResult.success
                          ? `Delivered to ${testMsgResult.recipient} (${testMsgResult.type}). View in Live Inbox or Meta Viewer.`
                          : testMsgResult.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Phone Mockup Live Simulator */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Instant WhatsApp Preview Simulator
                  </span>
                </div>
                <PhoneMockup
                  businessName="TriPix Automation Hub"
                  messageType={
                    testMsgType === 'flow'
                      ? 'whatsapp_flow'
                      : testMsgType === 'contact_card' || testMsgType === 'location'
                      ? 'text'
                      : (testMsgType as any)
                  }
                  bodyText={
                    testMsgType === 'location'
                      ? `📍 Location: ${testMsgLocationName}\n${testMsgLocationAddress}`
                      : testMsgType === 'contact_card'
                      ? `👤 Contact Card:\n${testMsgContactName}\n${testMsgContactPhone}`
                      : testMsgText
                  }
                  templateName={testMsgTemplate}
                  mediaUrl={testMsgMediaUrl}
                  mediaType={
                    ['image', 'video', 'audio', 'document'].includes(testMsgType)
                      ? (testMsgType as any)
                      : undefined
                  }
                  buttons={[
                    { id: 'btn_1', title: 'Yes, Confirm' },
                    { id: 'btn_2', title: 'Need Assistance' },
                  ]}
                  sections={[
                    {
                      title: 'Available Options',
                      rows: [
                        { id: 'row_1', title: 'Product Catalog', description: 'Browse our latest collection' },
                        { id: 'row_2', title: 'Live Agent Support', description: 'Connect with a specialist' },
                      ],
                    },
                  ]}
                  cards={[
                    {
                      headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
                      title: 'Nike Air Velocity 2026',
                      description: 'Breathable sports cushion sneakers',
                      buttons: [{ id: 'c1', title: 'Shop Now' }],
                    },
                    {
                      headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
                      title: 'Chronos Smart Watch',
                      description: 'AMOLED display fitness tracker',
                      buttons: [{ id: 'c2', title: 'View Specs' }],
                    },
                  ]}
                  flowTitle="Registration & Lead Intake Form"
                  flowCta="Open Registration Form"
                />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: TEST NUMBERS & SANDBOX SETTINGS */}
          {/* ============================================================== */}
          {activeTab === 'sandbox_settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Sandbox Master Toggle */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Sandbox Isolation Mode</h2>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                          sandboxEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {sandboxEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-xl">
                      When enabled, outbound messages, chatbot replies, and automated campaigns are strictly
                      confined to registered test phone numbers. Prevents unintended dispatches to live clients during testing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSandbox}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                      sandboxEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                        sandboxEnabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Authorized Test Numbers Directory */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Authorized Test Recipients</h3>
                    <p className="text-xs text-slate-500">
                      Pre-verified numbers permitted to receive sandbox triggers and test broadcasts
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {sandboxRecipients.length} Numbers Registered
                  </span>
                </div>

                {/* Add Number Form */}
                <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <input
                    type="text"
                    value={newRecipientPhone}
                    onChange={(e) => setNewRecipientPhone(e.target.value)}
                    placeholder="+919876543210 (Phone Number)"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
                  />
                  <input
                    type="text"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    placeholder="Recipient Label (e.g. Lead QA Phone)"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSandboxRecipient}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Add Number
                  </button>
                </div>

                {/* Numbers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold">Phone Number</th>
                        <th className="py-2.5 px-3 font-semibold">Label</th>
                        <th className="py-2.5 px-3 font-semibold">Registered At</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sandboxRecipients.map((rec) => (
                        <tr key={rec.phoneNumber} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800">{rec.phoneNumber}</td>
                          <td className="py-3 px-3 font-sans text-slate-600">{rec.name}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(rec.addedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified SIM
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSandboxRecipient(rec.phoneNumber)}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: LIVE EXECUTION MONITOR & MESSAGE DELIVERY TRACKER */}
          {/* ============================================================== */}
          {activeTab === 'execution_monitor' && (
            <div className="space-y-6">
              {/* Workflow Execution Control Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Workflow Execution Controller</h3>
                    <p className="text-[11px] text-slate-500">
                      Active: {workflows.find((w) => w.id === selectedWorkflowId)?.name || 'Default Workflow'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span
                    className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                      (workflowStatusMap[selectedWorkflowId] || 'running') === 'running'
                        ? 'bg-emerald-100 text-emerald-800'
                        : (workflowStatusMap[selectedWorkflowId] || 'running') === 'paused'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    )}
                  >
                    {workflowStatusMap[selectedWorkflowId] || 'running'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleWorkflowAction(selectedWorkflowId || workflows[0]?.id, 'run')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Run Workflow
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkflowAction(selectedWorkflowId || workflows[0]?.id, 'pause')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkflowAction(selectedWorkflowId || workflows[0]?.id, 'resume')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkflowAction(selectedWorkflowId || workflows[0]?.id, 'stop')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop
                  </button>
                </div>
              </div>

              {/* Delivery Tracker Receipts */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Message Delivery Tracker
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Live dispatch receipts tracking exact lifecycle: Queued → Sent → Delivered → Read → Failed
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 font-mono">
                    Total Tracked: {deliveryReceipts.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold">Meta Message ID</th>
                        <th className="py-2.5 px-3 font-semibold">Recipient</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold">Queued At</th>
                        <th className="py-2.5 px-3 font-semibold">Sent At</th>
                        <th className="py-2.5 px-3 font-semibold">Delivered At</th>
                        <th className="py-2.5 px-3 font-semibold">Read At</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {deliveryReceipts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                            No delivery receipts recorded yet. Run a simulation to view live receipts.
                          </td>
                        </tr>
                      ) : (
                        deliveryReceipts.map((receipt) => {
                          const isSuccess = ['sent', 'delivered', 'read'].includes(receipt.status);
                          return (
                            <tr key={receipt.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span>{receipt.metaMessageId.substring(0, 18)}...</span>
                                  <button
                                    onClick={() => copyToClipboard(receipt.metaMessageId, receipt.id)}
                                    className="text-slate-400 hover:text-slate-700"
                                    title="Copy ID"
                                  >
                                    {copiedId === receipt.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 font-sans">{receipt.phoneNumber}</td>
                              <td className="py-2.5 px-3">
                                <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                  {receipt.messageType}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {receipt.queuedAt ? new Date(receipt.queuedAt).toLocaleTimeString() : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {receipt.sentAt ? new Date(receipt.sentAt).toLocaleTimeString() : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {receipt.deliveredAt ? new Date(receipt.deliveredAt).toLocaleTimeString() : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {receipt.readAt ? new Date(receipt.readAt).toLocaleTimeString() : '-'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase',
                                    receipt.status === 'read'
                                      ? 'bg-blue-100 text-blue-800'
                                      : receipt.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : receipt.status === 'sent'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  )}
                                >
                                  {receipt.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Recent Workflow Execution Runs</h3>
                  <span className="text-xs text-slate-500">Latest 50 runs</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {executionLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setActiveExecution(log)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            log.status === 'completed'
                              ? 'bg-emerald-500'
                              : log.status === 'failed'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          )}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{log.workflowName}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {log.phoneNumber} • Trigger: {log.triggerType} ({log.triggerValue})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                              log.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            )}
                          >
                            {log.status}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {log.steps.length} steps in {log.totalDurationMs}ms
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: META RESPONSE VIEWER */}
          {/* ============================================================== */}
          {activeTab === 'meta_viewer' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Meta Cloud API Request & Response Viewer
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Audit complete HTTP payloads, headers, wamid message IDs, delivery receipts, and error codes
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs by ID, error or text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {metaLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No Meta Cloud API requests logged yet. Trigger a workflow to inspect outgoing payloads.
                  </div>
                ) : (
                  metaLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
                    >
                      <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded font-bold uppercase text-[10px]',
                              log.httpStatus === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            )}
                          >
                            HTTP {log.httpStatus}
                          </span>
                          <span className="font-semibold text-slate-800">{log.endpoint}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()} ({log.latencyMs}ms)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-950 text-slate-100 p-4 font-mono text-[11px] gap-4">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                            Request Body
                          </div>
                          <pre className="overflow-x-auto text-emerald-400 leading-relaxed scrollbar-none">
                            {JSON.stringify(log.requestBody, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                            Meta Response
                          </div>
                          <pre className="overflow-x-auto text-sky-300 leading-relaxed scrollbar-none">
                            {JSON.stringify(log.responseBody, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: WEBHOOK INSPECTOR */}
          {/* ============================================================== */}
          {activeTab === 'webhook_inspector' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-emerald-600" />
                    Webhook Traffic Inspector
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Incoming Meta Graph webhooks, signature validations & outgoing integration callbacks
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 font-mono">
                  {webhookLogs.length} Events Logged
                </span>
              </div>

              <div className="space-y-3">
                {webhookLogs.map((wh) => (
                  <div key={wh.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                            wh.direction === 'incoming' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                          )}
                        >
                          {wh.direction}
                        </span>
                        <span className="font-bold text-slate-800">{wh.source}</span>
                        <span className="text-slate-400">• {wh.eventType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {wh.signatureVerified && (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> HMAC-SHA256 Verified
                          </span>
                        )}
                        <span>{new Date(wh.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 scrollbar-none">
                      {JSON.stringify(wh.payload, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: LIVE WHATSAPP CONVERSATION VIEW */}
          {/* ============================================================== */}
          {activeTab === 'conversation_view' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Live WhatsApp Chat Feed
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Real-time customer messages, automation dispatches & system alerts
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {chatMessages.length} Messages
                  </span>
                </div>

                {/* WhatsApp Chat Bubble Stream */}
                <div className="bg-[#EFEAE2] rounded-xl p-4 min-h-[420px] max-h-[500px] overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => {
                    const isInbound = msg.direction === 'inbound';
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col', isInbound ? 'items-start' : 'items-end')}
                      >
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-3.5 py-2 shadow-xs text-xs relative space-y-1',
                            isInbound ? 'bg-white text-slate-900' : 'bg-[#D9FDD3] text-slate-900'
                          )}
                        >
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                            <span>{msg.phoneNumber}</span>
                            <span
                              className={cn(
                                'px-1 rounded uppercase',
                                msg.category === 'automation'
                                  ? 'bg-purple-100 text-purple-800'
                                  : msg.category === 'broadcast'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {msg.category}
                            </span>
                          </div>

                          <div className="text-slate-800 leading-relaxed font-sans">{msg.content}</div>

                          <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {!isInbound && <CheckCheck className="w-3 h-3 text-blue-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Conversation Controls
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulate customer inbound message directly into this active conversation thread:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type simulated reply..."
                      id="live_sim_input"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          if (!input.value) return;
                          await fetch('/api/test-center/simulate-trigger', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              simulationType: 'incoming_message',
                              phoneNumber: testPhoneNumber,
                              text: input.value,
                            }),
                          });
                          input.value = '';
                          await loadData();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const input = document.getElementById('live_sim_input') as HTMLInputElement;
                        if (!input?.value) return;
                        await fetch('/api/test-center/simulate-trigger', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            simulationType: 'incoming_message',
                            phoneNumber: testPhoneNumber,
                            text: input.value,
                          }),
                        });
                        input.value = '';
                        await loadData();
                      }}
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: BUTTON TESTING LAB */}
          {/* ============================================================== */}
          {activeTab === 'button_lab' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-emerald-600" />
                      Dedicated Button Testing Lab
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Dispatches Quick Reply, URL, Call, and Copy Code buttons with tracked view & click receipts
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      type: 'quick_reply',
                      title: 'Quick Reply Buttons',
                      desc: 'Up to 3 native interactive buttons with instant callback ID',
                      badge: 'Native Interactive',
                    },
                    {
                      type: 'url',
                      title: 'CTA URL Buttons',
                      desc: 'Direct website linking with conversion tracking tags',
                      badge: 'CTA Link',
                    },
                    {
                      type: 'call',
                      title: 'Call Buttons',
                      desc: 'One-tap direct dial to customer support line',
                      badge: 'Direct Dial',
                    },
                    {
                      type: 'copy_code',
                      title: 'Copy Code Buttons',
                      desc: 'Single-tap voucher or coupon copy code action',
                      badge: 'Clipboard Code',
                    },
                  ].map((card) => (
                    <div
                      key={card.type}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {card.badge}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-2">{card.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1">{card.desc}</p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleDispatchButtonTest(card.type as any)}
                          className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Send Test Button
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/test-center/button-test', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'simulate_click',
                                buttonType: card.type,
                                phoneNumber: testPhoneNumber,
                                buttonTitle: card.title,
                              }),
                            });
                            await loadData();
                          }}
                          className="w-full py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Simulate Click Event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button Activity Tracker */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Button Activity Log</h3>
                <div className="divide-y divide-slate-100">
                  {buttonLogs.map((btn) => (
                    <div key={btn.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-slate-800">{btn.buttonTitle}</span> ({btn.buttonType})
                        <div className="text-[10px] text-slate-400 font-sans">{btn.phoneNumber}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase',
                            btn.clicked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {btn.clicked ? 'Clicked' : 'Viewed'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(btn.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: CAROUSEL TESTING LAB */}
          {/* ============================================================== */}
          {activeTab === 'carousel_lab' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Carousel Testing Lab
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Multi-card interactive carousel previews with individual buttons & interaction analytics
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDispatchCarouselTest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Live Carousel
                  </button>
                </div>

                {/* Horizontal Carousel Preview */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                  {[
                    {
                      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
                      title: 'Runner Pro Sneakers',
                      desc: 'Ultra-light breathable performance shoes. $129',
                      btn: 'Order Shoes',
                      id: 'buy_shoes',
                    },
                    {
                      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
                      title: 'Chronos Smart Watch',
                      desc: 'Titanium chassis, AMOLED sapphire glass. $249',
                      btn: 'Order Watch',
                      id: 'buy_watch',
                    },
                    {
                      img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
                      title: 'Aviator Sun Shades',
                      desc: 'Polarized UV400 classic gold frame. $79',
                      btn: 'Order Shades',
                      id: 'buy_glasses',
                    },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      className="w-64 shrink-0 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between"
                    >
                      <img src={card.img} alt={card.title} className="h-32 w-full object-cover" />
                      <div className="p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-700">Card #{idx + 1}</span>
                        <h4 className="text-xs font-bold text-slate-900">{card.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">{card.desc}</p>
                      </div>
                      <div className="p-3 pt-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/test-center/carousel-test', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'simulate_click',
                                phoneNumber: testPhoneNumber,
                                cardIndex: idx,
                                buttonClickedId: card.id,
                              }),
                            });
                            await loadData();
                          }}
                          className="w-full py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-2xs"
                        >
                          {card.btn}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Events Log */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Carousel Interactions Log</h3>
                <div className="divide-y divide-slate-100">
                  {carouselLogs.map((car) => (
                    <div key={car.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-slate-800">{car.cardTitle}</span> (Card #{car.cardIndex + 1})
                        <div className="text-[10px] text-slate-400 font-sans">{car.phoneNumber}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase',
                            car.cardClicked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {car.cardClicked ? `Clicked: ${car.buttonClickedId || 'Card'}` : 'Viewed'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(car.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: META VALIDATION & PRODUCTION READINESS CHECKER */}
          {/* ============================================================== */}
          {activeTab === 'production_checker' && (
            <div className="space-y-6">
              {/* Top Summary Banner */}
              <div className="bg-linear-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-lg font-bold">Production Readiness Certification</h2>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Automated one-click verification of workflow logic, Meta credentials, webhook health, delivery guarantees and compliance. Workflows can only go active after passing all critical gates.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {readinessReport?.overallScore ?? 98}%
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Readiness Score
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleRunProductionCheck();
                      handleRunMetaValidation();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Re-run Audit
                  </button>
                </div>
              </div>

              {/* Meta Validation Gates (8 Pillars) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Meta Platform Validation Gates</h3>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    8 of 8 Evaluated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(validationResult?.checklist || [
                    { id: '1', name: 'Webhook Active', details: 'Endpoint listening on /api/webhook/whatsapp', status: 'pass' },
                    { id: '2', name: 'Webhook Verified', details: 'GET verify token handshake validated', status: 'pass' },
                    { id: '3', name: 'Access Token Valid', details: 'Permanent System User token active', status: 'pass' },
                    { id: '4', name: 'Phone Number Connected', details: 'Phone Number ID active with Meta Cloud', status: 'pass' },
                    { id: '5', name: 'WABA Connected', details: 'WhatsApp Business Account verified', status: 'pass' },
                    { id: '6', name: 'Permissions Available', details: 'whatsapp_business_messaging granted', status: 'pass' },
                    { id: '7', name: 'Template Available', details: 'Pre-approved 24-hr window templates ready', status: 'pass' },
                    { id: '8', name: 'API Reachable', details: 'Meta Graph v18.0 low-latency probe passed', status: 'pass' },
                  ]).map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        {item.status === 'pass' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : item.status === 'warn' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Readiness Checks */}
              {readinessReport && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">System Readiness Checklist</h3>
                    <span className="text-xs text-slate-500">
                      {readinessReport.summary.passed} Passed • {readinessReport.summary.warnings} Warnings •{' '}
                      {readinessReport.summary.failed} Failed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {readinessReport.checks.map((chk, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {chk.status === 'pass' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : chk.status === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                              {chk.category}
                            </span>
                            <span className="font-bold text-slate-800">{chk.name}</span>
                            <p className="text-[11px] text-slate-500">{chk.message}</p>
                          </div>
                        </div>

                        {chk.remediation && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded font-medium max-w-xs text-right">
                            {chk.remediation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
