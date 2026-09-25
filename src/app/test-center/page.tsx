'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Code2,
  Webhook,
  Smartphone,
  Eye,
  EyeOff,
  MousePointerClick,
  Sliders,
  ShieldCheck,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Activity,
  Zap,
  Repeat,
  FileText,
  Terminal,
  Settings,
  ShieldAlert,
  Database,
  Sparkles,
  ChevronRight,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WorkflowExecutionLog,
  MessageDeliveryReceipt,
  MetaApiLog,
  WebhookLogItem,
  WorkflowDefinition,
} from '@/types/automations';

export default function WhatsAppTestCenterPage() {
  // Mode Switch: TEST MODE (Meta test recipient numbers) vs PRODUCTION MODE (Connected live WhatsApp Business numbers)
  const [isTestMode, setIsTestMode] = useState(true);

  // Configuration Fields
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [verifyToken, setVerifyToken] = useState('tripix_verify_token_2026');
  const [testRecipient, setTestRecipient] = useState('+919876543210');
  const [showToken, setShowToken] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Connection & Webhook Status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [webhookStatus, setWebhookStatus] = useState<'active' | 'error' | 'checking'>('checking');
  const [latencyMs, setLatencyMs] = useState<number>(45);

  // Workflows & Sample Test Workflows
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('wf_welcome_interactive');

  // Active Action Tab (1-8)
  const [activeActionTab, setActiveActionTab] = useState<
    | 'send_text'
    | 'send_button'
    | 'send_carousel'
    | 'send_template'
    | 'trigger_workflow'
    | 'trigger_keyword'
    | 'trigger_button'
    | 'trigger_carousel'
  >('trigger_workflow');

  // Action Input Parameters
  const [testMessageText, setTestMessageText] = useState('Hello! This is an automated WhatsApp Test Center message.');
  const [testButtonText, setTestButtonText] = useState('Please select an option below:');
  const [testButtons, setTestButtons] = useState([
    { id: 'btn_catalog', title: 'Browse Catalog' },
    { id: 'btn_pricing', title: 'Get Pricing' },
    { id: 'btn_agent', title: 'Talk To Expert' },
  ]);
  const [testKeyword, setTestKeyword] = useState('hello');
  const [testClickedButtonId, setTestClickedButtonId] = useState('btn_catalog');
  const [testClickedButtonTitle, setTestClickedButtonTitle] = useState('Browse Catalog');
  const [testCardIndex, setTestCardIndex] = useState(0);
  const [testCardButtonId, setTestCardButtonId] = useState('buy_shoes');
  const [testTemplateName, setTestTemplateName] = useState('teaser_alert');

  // Execution & Diagnostics State
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<WorkflowExecutionLog | null>(null);
  const [executionResultStatus, setExecutionResultStatus] = useState<'PASS' | 'FAIL' | null>(null);
  const [executionErrorReason, setExecutionErrorReason] = useState<string | null>(null);
  const [failedNodeName, setFailedNodeName] = useState<string | null>(null);

  // Webhook Debugger Logs
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [webhookFilter, setWebhookFilter] = useState<'all' | 'text' | 'button' | 'carousel' | 'status'>('all');
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<WebhookLogItem | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Phone Mockup messages
  const [mockupMessages, setMockupMessages] = useState<any[]>([
    {
      id: 'm1',
      sender: 'agent',
      content: '🌟 Welcome to our Official WhatsApp Store! How can we assist you today?',
      timestamp: 'Just now',
      status: 'read',
      type: 'button',
      buttons: [
        { id: 'btn_catalog', title: 'Browse Catalog' },
        { id: 'btn_pricing', title: 'Get Pricing' },
        { id: 'btn_agent', title: 'Talk To Expert' },
      ],
    },
  ]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Load Settings & Configuration
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken || '');
        setWabaId(data.wabaId || '');
        setPhoneNumberId(data.phoneNumberId || '');
        setVerifyToken(data.verifyToken || 'tripix_verify_token_2026');
      }
    } catch {
      // non-blocking
    }
  }, []);

  // 2. Validate Meta Connection Status
  const checkConnectionStatus = useCallback(async () => {
    setConnectionStatus('checking');
    setWebhookStatus('checking');
    const start = Date.now();

    try {
      const res = await fetch('/api/test-center/meta-validate');
      const data = await res.json();
      setLatencyMs(Date.now() - start);

      if (res.ok && data.valid) {
        setConnectionStatus('connected');
        setWebhookStatus('active');
      } else {
        setConnectionStatus(data.hasCredentials ? 'connected' : 'disconnected');
        setWebhookStatus(data.webhookActive ? 'active' : 'error');
      }
    } catch {
      setConnectionStatus('disconnected');
      setWebhookStatus('error');
    }
  }, []);

  // 3. Load Workflows
  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/automations?format=dag');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWorkflows(data);
          setSelectedWorkflowId(data[0].id);
        }
      }
    } catch {
      // non-blocking
    }
  }, []);

  // 4. Fetch Webhook Debugger Logs
  const fetchWebhookLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/test-center/logs?type=webhooks&limit=50');
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.webhookLogs || []);
        if (data.webhookLogs?.length > 0 && !selectedWebhookLog) {
          setSelectedWebhookLog(data.webhookLogs[0]);
        }
      }
    } catch {
      // non-blocking
    }
  }, [selectedWebhookLog]);

  useEffect(() => {
    loadSettings();
    checkConnectionStatus();
    loadWorkflows();
    fetchWebhookLogs();
  }, [loadSettings, checkConnectionStatus, loadWorkflows, fetchWebhookLogs]);

  // Save Test Configuration
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          wabaId,
          phoneNumberId,
          verifyToken,
        }),
      });
      if (res.ok) {
        showToast('Test configuration saved successfully!');
        checkConnectionStatus();
      } else {
        showToast('Failed to save configuration', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error saving settings', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Select Sample Test Workflow
  const handleSelectSampleWorkflow = (sampleId: string) => {
    setSelectedWorkflowId(sampleId);
    showToast(`Loaded sample test workflow: ${sampleId}`);
  };

  // Run Test Actions
  const handleExecuteTestAction = async (actionType: string) => {
    setIsExecuting(true);
    setExecutionResultStatus(null);
    setExecutionErrorReason(null);
    setFailedNodeName(null);

    const startTime = Date.now();

    try {
      let endpoint = '/api/test-center/simulate-trigger';
      let payload: any = {
        phoneNumber: testRecipient,
        workflowId: selectedWorkflowId,
        isSandbox: isTestMode,
      };

      switch (actionType) {
        case 'send_text':
          endpoint = '/api/test-center/send-test';
          payload = { type: 'text', phoneNumber: testRecipient, text: testMessageText };
          break;

        case 'send_button':
          endpoint = '/api/test-center/send-test';
          payload = { type: 'button', phoneNumber: testRecipient, text: testButtonText, buttons: testButtons };
          break;

        case 'send_carousel':
          endpoint = '/api/test-center/send-test';
          payload = { type: 'carousel', phoneNumber: testRecipient, text: 'Product Showcase Carousel' };
          break;

        case 'send_template':
          endpoint = '/api/test-center/send-test';
          payload = { type: 'template', phoneNumber: testRecipient, templateName: testTemplateName };
          break;

        case 'trigger_workflow':
          payload.simulationType = 'manual_trigger';
          break;

        case 'trigger_keyword':
          payload.simulationType = 'keyword_trigger';
          payload.text = testKeyword;
          break;

        case 'trigger_button':
          payload.simulationType = 'button_click';
          payload.buttonId = testClickedButtonId;
          payload.buttonTitle = testClickedButtonTitle;
          break;

        case 'trigger_carousel':
          payload.simulationType = 'carousel_click';
          payload.cardIndex = testCardIndex;
          payload.cardButtonId = testCardButtonId;
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;

      if (res.ok && (data.success || data.executions?.length > 0)) {
        const exec = data.activeExecution || data.executions?.[0] || {
          id: `exec_${Date.now()}`,
          workflowId: selectedWorkflowId,
          workflowName: workflows.find((w) => w.id === selectedWorkflowId)?.name || 'Test Flow',
          phoneNumber: testRecipient,
          status: 'completed',
          totalDurationMs: elapsed,
          steps: [
            {
              nodeId: 'node_test_send',
              nodeTitle: `Dispatched ${actionType}`,
              status: 'completed',
              durationMs: elapsed,
              outputResult: data,
            },
          ],
        };

        setLastExecution(exec);
        setExecutionResultStatus('PASS');
        showToast(`Action "${actionType}" executed successfully (${elapsed}ms)!`);

        // Update phone mockup
        if (actionType === 'send_text' || actionType === 'trigger_keyword') {
          setMockupMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now()}`,
              sender: actionType.startsWith('send') ? 'agent' : 'user',
              content: testMessageText || testKeyword,
              timestamp: 'Just now',
              status: 'delivered',
            },
          ]);
        }
      } else {
        setExecutionResultStatus('FAIL');
        setExecutionErrorReason(data.error || 'Test action failed without valid response');
        setFailedNodeName(data.failedNode || 'Execution Gateway');
        showToast(data.error || 'Execution failed', 'error');
      }

      fetchWebhookLogs();
    } catch (err: any) {
      setExecutionResultStatus('FAIL');
      setExecutionErrorReason(err.message || 'Network dispatch failure');
      showToast(err.message || 'Execution error', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Filtered Webhook Debugger Logs
  const filteredWebhookLogs = webhookLogs.filter((log) => {
    if (webhookFilter === 'all') return true;
    if (webhookFilter === 'text') return log.eventType === 'messages' || log.direction === 'incoming';
    if (webhookFilter === 'button') return log.eventType?.includes('button') || log.payload?.type === 'interactive';
    if (webhookFilter === 'carousel') return log.eventType?.includes('carousel');
    if (webhookFilter === 'status') return log.eventType === 'statuses';
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="WhatsApp Test Center"
          subtitle="Meta WhatsApp Cloud API Test Mode & Automation Engine Testing Environment"
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Toast Notification */}
          {toast && (
            <div
              className={cn(
                'p-4 rounded-2xl border flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-150',
                toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-red-900 text-white border-red-800'
              )}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                <span className="text-xs font-bold">{toast.message}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOP BANNER: MODE SWITCH & LIVE STATUS */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <FlaskConical className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    WhatsApp Test Center
                  </h2>
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1',
                      isTestMode
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {isTestMode ? 'Test Mode Active' : 'Production Mode Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isTestMode
                    ? 'Isolated sandbox: Dispatches to test recipient numbers only, saving traces and logs separately.'
                    : 'Live environment: Connected to official WhatsApp Business accounts with live customer routing.'}
                </p>
              </div>
            </div>

            {/* Mode Switch Toggle Button */}
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-stretch sm:self-auto justify-between sm:justify-start">
              <button
                onClick={() => setIsTestMode(true)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5',
                  isTestMode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Mode</span>
              </button>

              <button
                onClick={() => setIsTestMode(false)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5',
                  !isTestMode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Production Mode</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: TEST CONFIGURATION & CONNECTION STATUS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Configuration Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-900">Meta Test Configuration</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={checkConnectionStatus}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Refresh connection status"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Access Token */}
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Meta Access Token
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                    <Code2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAG..."
                      className="text-xs font-mono font-medium text-slate-800 bg-transparent outline-none w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Business Account ID */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Business Account ID (WABA ID)
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                    <Database className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="109283719283719"
                      className="text-xs font-mono font-medium text-slate-800 bg-transparent outline-none w-full"
                    />
                  </div>
                </div>

                {/* Phone Number ID */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Phone Number ID
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="104928192847192"
                      className="text-xs font-mono font-medium text-slate-800 bg-transparent outline-none w-full"
                    />
                  </div>
                </div>

                {/* Webhook Verify Token */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Webhook Verify Token
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                    <Webhook className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value)}
                      placeholder="tripix_verify_token_2026"
                      className="text-xs font-mono font-medium text-slate-800 bg-transparent outline-none w-full"
                    />
                  </div>
                </div>

                {/* Test Recipient Number */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Test Recipient Number (E.164)
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      placeholder="+919876543210"
                      className="text-xs font-mono font-bold text-slate-900 bg-transparent outline-none w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status Telemetry Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Connection Status</span>
                </h3>

                <div className="space-y-2.5">
                  {/* API Connection */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-700">Meta Cloud API</div>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1',
                        connectionStatus === 'connected'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {/* Webhook Status */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-700">Webhook Listener</div>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1',
                        webhookStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {webhookStatus === 'active' ? 'Webhook Active' : 'Webhook Error'}
                    </span>
                  </div>

                  {/* Latency & Mode */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Gateway Latency</span>
                    <span className="font-mono font-bold text-slate-800">{latencyMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Sample Test Workflows Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Sample Test Workflows
                </span>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <button
                    onClick={() => handleSelectSampleWorkflow('wf_welcome_interactive')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-800 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>1. Keyword Match Test</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelectSampleWorkflow('wf_support_router')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-800 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>2. Button Routing Test</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelectSampleWorkflow('wf_carousel_demo')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-800 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>3. Carousel Test</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelectSampleWorkflow('wf_lead_crm')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-800 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>4. CRM Test</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelectSampleWorkflow('wf_complete_demo')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-800 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>5. Complete WhatsApp Demo Flow</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: TEST FEATURES CONSOLE (8 ACTIONS) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">WhatsApp Test Action Console</h3>
                <p className="text-xs text-slate-500">
                  Execute 8 distinct test actions across simulated triggers and outbound message dispatches
                </p>
              </div>

              {/* Action Tabs Selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'trigger_workflow', label: '5. Workflow Test' },
                  { id: 'trigger_keyword', label: '6. Keyword Test' },
                  { id: 'trigger_button', label: '7. Button Click' },
                  { id: 'trigger_carousel', label: '8. Carousel Click' },
                  { id: 'send_text', label: '1. Send Message' },
                  { id: 'send_button', label: '2. Send Buttons' },
                  { id: 'send_carousel', label: '3. Send Carousel' },
                  { id: 'send_template', label: '4. Send Template' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveActionTab(t.id as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs',
                      activeActionTab === t.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Details & Execution Trigger */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Parameter Editor */}
              <div className="md:col-span-8 space-y-4">
                {activeActionTab === 'trigger_workflow' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Workflow to Test
                    </label>
                    <select
                      value={selectedWorkflowId}
                      onChange={(e) => setSelectedWorkflowId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                    >
                      {workflows.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.triggerType}: "{w.triggerKeyword}")
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Executes full visual DAG traversal for recipient <b>{testRecipient}</b> in {isTestMode ? 'Test Sandbox Mode' : 'Live Production Mode'}.
                    </p>
                  </div>
                )}

                {activeActionTab === 'trigger_keyword' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Inbound Trigger Keyword
                    </label>
                    <input
                      type="text"
                      value={testKeyword}
                      onChange={(e) => setTestKeyword(e.target.value)}
                      placeholder="hello, pricing, catalog"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                    <p className="text-[11px] text-slate-500">
                      Simulates incoming WhatsApp customer message matching workflow trigger rules.
                    </p>
                  </div>
                )}

                {activeActionTab === 'trigger_button' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Button Payload ID
                      </label>
                      <input
                        type="text"
                        value={testClickedButtonId}
                        onChange={(e) => setTestClickedButtonId(e.target.value)}
                        placeholder="btn_catalog"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Button Title Text
                      </label>
                      <input
                        type="text"
                        value={testClickedButtonTitle}
                        onChange={(e) => setTestClickedButtonTitle(e.target.value)}
                        placeholder="Browse Catalog"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeActionTab === 'trigger_carousel' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Card Index (0-based)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={testCardIndex}
                        onChange={(e) => setTestCardIndex(parseInt(e.target.value, 10))}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Card Button ID
                      </label>
                      <input
                        type="text"
                        value={testCardButtonId}
                        onChange={(e) => setTestCardButtonId(e.target.value)}
                        placeholder="buy_shoes"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeActionTab === 'send_text' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Outbound Text Message Content
                    </label>
                    <textarea
                      rows={3}
                      value={testMessageText}
                      onChange={(e) => setTestMessageText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>
                )}

                {activeActionTab === 'send_button' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Button Message Header / Body
                    </label>
                    <input
                      type="text"
                      value={testButtonText}
                      onChange={(e) => setTestButtonText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      {testButtons.map((btn) => (
                        <span
                          key={btn.id}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"
                        >
                          🔘 {btn.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeActionTab === 'send_carousel' && (
                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-purple-600" />
                      <span>Product Showcase 3-Card Carousel</span>
                    </div>
                    <p className="text-[11px] text-purple-700">
                      Dispatches Runner Pro Sneakers, Chronos Smart Watch, and Aviator Shades with interactive Order CTA buttons.
                    </p>
                  </div>
                )}

                {activeActionTab === 'send_template' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Approved Meta Template Name
                    </label>
                    <input
                      type="text"
                      value={testTemplateName}
                      onChange={(e) => setTestTemplateName(e.target.value)}
                      placeholder="teaser_alert, order_confirmation"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Execution Action Button */}
              <div className="md:col-span-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-700">Target Recipient:</div>
                <div className="text-xs font-mono font-bold text-slate-900 bg-white p-2 rounded-lg border border-slate-200">
                  {testRecipient}
                </div>

                <button
                  onClick={() => handleExecuteTestAction(activeActionTab)}
                  disabled={isExecuting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isExecuting ? 'Executing...' : 'Run Test Action'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: TEST RESULTS & WORKFLOW EXECUTION TRACE */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Execution Trace & Milestone Status */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-black text-slate-900">Workflow Execution Trace</h3>
                </div>

                {/* PASS / FAIL Result Pill */}
                {executionResultStatus && (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs',
                        executionResultStatus === 'PASS'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      )}
                    >
                      {executionResultStatus === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>TEST {executionResultStatus}</span>
                    </span>
                    {lastExecution?.totalDurationMs !== undefined && (
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {lastExecution.totalDurationMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Execution Error Banner (if FAIL) */}
              {executionResultStatus === 'FAIL' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Failed Node: {failedNodeName || 'Trigger Gate'}</span>
                  </div>
                  <p className="text-[11px] text-rose-700">{executionErrorReason}</p>
                </div>
              )}

              {/* Milestone Step Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { name: 'Trigger Received', active: Boolean(lastExecution) },
                  { name: 'Trigger Matched', active: Boolean(lastExecution && lastExecution.status !== 'failed') },
                  { name: 'Workflow Started', active: Boolean(lastExecution) },
                  { name: 'Node Executed', active: Boolean(lastExecution?.steps && lastExecution.steps.length > 0) },
                  { name: 'Session Created', active: Boolean(lastExecution?.waitingFor) },
                  { name: 'Session Found', active: Boolean(lastExecution?.resumedAt) },
                  { name: 'Workflow Resumed', active: Boolean(lastExecution?.resumedAt) },
                  { name: 'Workflow Completed', active: lastExecution?.status === 'completed' },
                ].map((milestone, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-colors',
                      milestone.active
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border-slate-200/70 text-slate-400'
                    )}
                  >
                    <span>{milestone.name}</span>
                    {milestone.active ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                ))}
              </div>

              {/* Step By Step Traversal Logs */}
              {lastExecution?.steps && lastExecution.steps.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Step Telemetry Logs ({lastExecution.steps.length} Steps)
                  </span>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {lastExecution.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-md bg-slate-200 flex items-center justify-center text-[10px] font-black">
                              {sIdx + 1}
                            </span>
                            {step.nodeTitle || step.nodeId}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {step.status}
                          </span>
                        </div>
                        {step.outputResult && (
                          <div className="p-2 rounded-lg bg-white border border-slate-100 text-[11px] font-mono text-slate-600 overflow-x-auto">
                            <pre>{JSON.stringify(step.outputResult, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Run any test action above to generate live execution traces.
                </div>
              )}
            </div>

            {/* Right: Real-Time WhatsApp Phone Simulator */}
            <div className="lg:col-span-5 flex justify-center">
              <PhoneMockup
                businessName={isTestMode ? 'TriPix Test Sandbox' : 'TriPix Verified Account'}
                templateName={selectedWorkflowId}
                bodyText={mockupMessages[mockupMessages.length - 1]?.content}
                messageType="button"
                buttons={testButtons}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: WEBHOOK DEBUGGER (RAW JSON PAYLOADS) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-emerald-600" />
                  <span>Webhook Debugger & Raw Payload Inspector</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Inspect incoming Meta Webhook events, button reply taps, and status delivery receipts
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'text', label: 'Text Messages' },
                  { id: 'button', label: 'Button Replies' },
                  { id: 'carousel', label: 'Carousel Taps' },
                  { id: 'status', label: 'Status Updates' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setWebhookFilter(f.id as any)}
                    className={cn(
                      'px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer',
                      webhookFilter === f.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Webhook Log Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Event Feed List */}
              <div className="lg:col-span-5 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {filteredWebhookLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No webhook events recorded yet.
                  </div>
                ) : (
                  filteredWebhookLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedWebhookLog(log)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all cursor-pointer space-y-1',
                        selectedWebhookLog?.id === log.id
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{log.eventType}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {JSON.stringify(log.payload)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Raw JSON Payload Inspector */}
              <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-4 text-emerald-400 font-mono text-xs flex flex-col justify-between overflow-hidden shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>RAW PAYLOAD INSPECTOR ({selectedWebhookLog?.id || 'none'})</span>
                  {selectedWebhookLog && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedWebhookLog.payload, null, 2));
                        setCopiedLogId(selectedWebhookLog.id);
                        setTimeout(() => setCopiedLogId(null), 2000);
                      }}
                      className="text-white hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLogId === selectedWebhookLog.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedLogId === selectedWebhookLog.id ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 max-h-80 overflow-y-auto custom-scrollbar pt-2">
                  <pre className="text-[11px] leading-relaxed">
                    {selectedWebhookLog
                      ? JSON.stringify(selectedWebhookLog.payload, null, 2)
                      : '// Select a webhook event on the left to inspect raw payload.'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
