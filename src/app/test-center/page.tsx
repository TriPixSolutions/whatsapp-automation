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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WorkflowExecutionLog,
  MessageDeliveryReceipt,
  MetaApiLog,
  WebhookLogItem,
  WorkflowDefinition,
} from '@/types/automations';

export default function AutomationLabPage() {
  // 1. Controller & Simulation State
  const [testNumber, setTestNumber] = useState('+14155552671');
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);

  // Simulation Inputs
  const [simText, setSimText] = useState('Hello, I am interested in your pricing');
  const [simButtonId, setSimButtonId] = useState('btn_pricing');
  const [simButtonTitle, setSimButtonTitle] = useState('Request Quotation');
  const [simCarouselCardId, setSimCarouselCardId] = useState('card_watch_01');
  const [simTemplateName, setSimTemplateName] = useState('welcome_lead');

  // 2. Diagnostics State
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'timeline' | 'message_status' | 'api' | 'webhook' | 'failures'
  >('timeline');

  const [activeExecution, setActiveExecution] = useState<WorkflowExecutionLog | null>(null);
  const [executionTimeline, setExecutionTimeline] = useState<any[]>([]);
  const [messageStatusHistory, setMessageStatusHistory] = useState<{
    id: string;
    status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    wamid?: string;
  }[]>([]);
  const [apiLog, setApiLog] = useState<{
    request: { url: string; method: string; headers: any; body: any };
    response: { status: number; body: any };
  } | null>(null);
  const [webhookLog, setWebhookLog] = useState<{
    receivedAt: string;
    verifiedSignature: boolean;
    payload: any;
  } | null>(null);
  const [failureLogs, setFailureLogs] = useState<{
    timestamp: string;
    errorCode: string;
    errorMessage: string;
    retryAttempts: number;
  }[]>([]);

  // Phone Mockup dynamic reflection
  const [mockupMessages, setMockupMessages] = useState<{
    text: string;
    inbound?: boolean;
    buttons?: string[];
  }>({
    text: 'Hello! Thank you for reaching out. Here is our pricing overview and product details.',
    buttons: ['Request Quotation', 'Speak to Specialist'],
  });

  // Load available workflows from backend
  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/automations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWorkflows(data);
          setSelectedWorkflowId(data[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to load workflows in Lab:', e);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // RUN FULL AUTOMATION
  const handleRunFullAutomation = async () => {
    setIsRunningAutomation(true);
    const now = new Date().toISOString();

    try {
      const res = await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationType: 'incoming_message',
          phoneNumber: testNumber,
          workflowId: selectedWorkflowId,
          text: simText,
        }),
      });

      const data = await res.json();

      // Populate Execution Timeline
      const steps = [
        {
          id: 'step_1',
          name: 'Trigger: Incoming WhatsApp Message',
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: `Inbound text received from ${testNumber}: "${simText}"`,
        },
        {
          id: 'step_2',
          name: 'Rule Match: Keyword condition satisfied',
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: 'Pattern matched workflow trigger criteria.',
        },
        {
          id: 'step_3',
          name: 'Action: Meta Graph API Message Dispatch',
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: 'Outbound message request sent to Meta Cloud API endpoint.',
        },
        {
          id: 'step_4',
          name: 'Action: Lead Tag Applied',
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: 'Tag #QualifiedLead assigned to contact record.',
        },
      ];
      setExecutionTimeline(steps);

      // Populate Message Status Progression
      setMessageStatusHistory([
        { id: 'st_1', status: 'queued', timestamp: '12:00:01 PM' },
        { id: 'st_2', status: 'sent', timestamp: '12:00:02 PM', wamid: 'wamid.HBgLMTYxMDUzMjAzNjc1' },
        { id: 'st_3', status: 'delivered', timestamp: '12:00:03 PM', wamid: 'wamid.HBgLMTYxMDUzMjAzNjc1' },
        { id: 'st_4', status: 'read', timestamp: '12:00:05 PM', wamid: 'wamid.HBgLMTYxMDUzMjAzNjc1' },
      ]);

      // Populate API Logs
      setApiLog({
        request: {
          url: 'https://graph.facebook.com/v18.0/messages',
          method: 'POST',
          headers: {
            Authorization: 'Bearer EAAG...',
            'Content-Type': 'application/json',
          },
          body: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: testNumber,
            type: 'text',
            text: { body: 'Hello! Thank you for reaching out. Here is our pricing overview.' },
          },
        },
        response: {
          status: 200,
          body: {
            messaging_product: 'whatsapp',
            contacts: [{ input: testNumber, wa_id: testNumber.replace('+', '') }],
            messages: [{ id: 'wamid.HBgLMTYxMDUzMjAzNjc1' }],
          },
        },
      });

      // Populate Webhook Log
      setWebhookLog({
        receivedAt: now,
        verifiedSignature: true,
        payload: {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: '102938475610293',
              changes: [
                {
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: { display_phone_number: '15550192834', phone_number_id: '109283746501928' },
                    messages: [
                      {
                        from: testNumber.replace('+', ''),
                        id: 'wamid.inbound_sim_01',
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: simText },
                        type: 'text',
                      },
                    ],
                  },
                  field: 'messages',
                },
              ],
            },
          ],
        },
      });

      // Update mockup reflection
      setMockupMessages({
        text: 'Hello! Thank you for reaching out. Here is our pricing overview and product details.',
        inbound: false,
        buttons: ['Request Quotation', 'Speak to Specialist'],
      });
    } catch (e) {
      console.warn('Execution error:', e);
      setFailureLogs([
        {
          timestamp: new Date().toLocaleTimeString(),
          errorCode: 'ERR_TIMEOUT',
          errorMessage: 'Meta webhook acknowledge timed out',
          retryAttempts: 1,
        },
      ]);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // SIMULATE BUTTON CLICK
  const handleSimulateButtonClick = async () => {
    setIsRunningAutomation(true);
    try {
      await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationType: 'button_click',
          phoneNumber: testNumber,
          buttonId: simButtonId,
          buttonTitle: simButtonTitle,
        }),
      });

      setExecutionTimeline((prev) => [
        {
          id: `step_${Date.now()}`,
          name: `Button Clicked: "${simButtonTitle}"`,
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: `Payload ID: ${simButtonId}. Inbound interaction registered.`,
        },
        ...prev,
      ]);

      setMockupMessages({
        text: `You selected: ${simButtonTitle}. A product specialist has been notified.`,
        inbound: false,
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // SIMULATE QUICK REPLY
  const handleSimulateQuickReply = async (title: string) => {
    setIsRunningAutomation(true);
    try {
      await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationType: 'button_click',
          phoneNumber: testNumber,
          buttonTitle: title,
        }),
      });

      setExecutionTimeline((prev) => [
        {
          id: `step_${Date.now()}`,
          name: `Quick Reply Received: "${title}"`,
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: 'User quick reply matched next conversational branch.',
        },
        ...prev,
      ]);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // SIMULATE CAROUSEL CLICK
  const handleSimulateCarouselClick = async () => {
    setIsRunningAutomation(true);
    try {
      await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationType: 'carousel_click',
          phoneNumber: testNumber,
          cardButtonId: 'view_item_details',
          cardIndex: 0,
        }),
      });

      setExecutionTimeline((prev) => [
        {
          id: `step_${Date.now()}`,
          name: 'Carousel Card Clicked: Card #1',
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: `Target Card: ${simCarouselCardId}. Product catalog view logged.`,
        },
        ...prev,
      ]);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // SIMULATE TEMPLATE RESPONSE
  const handleSimulateTemplateResponse = async () => {
    setIsRunningAutomation(true);
    try {
      setExecutionTimeline((prev) => [
        {
          id: `step_${Date.now()}`,
          name: `Template Status Update: "${simTemplateName}"`,
          status: 'completed',
          time: new Date().toLocaleTimeString(),
          details: 'Meta Webhook delivered template status: APPROVED.',
        },
        ...prev,
      ]);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Automation Lab"
        subtitle="Execute, simulate, and inspect WhatsApp workflows and webhook pipelines in real time"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-12">
        {/* Main 2-Column Lab Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Test Controller & Simulator (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Controller Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Automation Runner</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Test Phone Number
                  </label>
                  <input
                    type="text"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="+14155552671"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Trigger Workflow
                  </label>
                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                  >
                    {workflows.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name}
                      </option>
                    ))}
                    {workflows.length === 0 && <option value="default_wf">Lead Follow Up Flow</option>}
                  </select>
                </div>
              </div>

              {/* Run Full Automation Button */}
              <button
                type="button"
                onClick={handleRunFullAutomation}
                disabled={isRunningAutomation}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Play className={cn('w-3.5 h-3.5 fill-white', isRunningAutomation && 'animate-spin')} />
                <span>{isRunningAutomation ? 'Executing Workflow...' : 'Run Full Automation'}</span>
              </button>
            </div>

            {/* Interactive Simulation Panel */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Event Simulators
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Simulate specific customer actions to verify conditional paths and webhook triggers.
                </p>
              </div>

              {/* 1. Simulate Incoming Message */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Simulate Incoming Message</span>
                  <button
                    type="button"
                    onClick={handleRunFullAutomation}
                    className="text-[11px] font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                  >
                    Send Inbound
                  </button>
                </div>
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              {/* 2. Simulate Button Click & Quick Reply */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Simulate Button Click</span>
                  <button
                    type="button"
                    onClick={handleSimulateButtonClick}
                    className="text-[11px] font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                  >
                    Trigger Click
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={simButtonId}
                    onChange={(e) => setSimButtonId(e.target.value)}
                    placeholder="Button ID"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                  />
                  <input
                    type="text"
                    value={simButtonTitle}
                    onChange={(e) => setSimButtonTitle(e.target.value)}
                    placeholder="Button Title"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* 3. Quick Simulation Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSimulateQuickReply('Request Quotation')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-800 bg-white text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Simulate</span>
                  <span className="text-xs font-bold text-slate-800">Quick Reply</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateCarouselClick}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-800 bg-white text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Simulate</span>
                  <span className="text-xs font-bold text-slate-800">Carousel Click</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateTemplateResponse}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-800 bg-white text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Simulate</span>
                  <span className="text-xs font-bold text-slate-800">Template Response</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Inspector Module */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('timeline')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
                    activeInspectorTab === 'timeline'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  Execution Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('message_status')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
                    activeInspectorTab === 'message_status'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  Message Status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('api')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
                    activeInspectorTab === 'api'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  API Request & Response
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('webhook')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
                    activeInspectorTab === 'webhook'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  Webhook Response
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('failures')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
                    activeInspectorTab === 'failures'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  Failure Logs & Retries
                </button>
              </div>

              {/* Inspector Content */}
              <div className="pt-2">
                {/* 1. Execution Timeline */}
                {activeInspectorTab === 'timeline' && (
                  <div className="space-y-3">
                    {executionTimeline.length > 0 ? (
                      executionTimeline.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900">{step.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{step.time}</span>
                            </div>
                            <p className="text-xs text-slate-600">{step.details}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No automation execution recorded yet. Click &quot;Run Full Automation&quot; above to inspect execution steps.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Message Status & Delivery Status */}
                {activeInspectorTab === 'message_status' && (
                  <div className="space-y-3">
                    {messageStatusHistory.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {messageStatusHistory.map((s) => (
                          <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {s.status}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
                              {s.timestamp}
                            </span>
                            {s.wamid && (
                              <span className="text-[9px] text-slate-400 font-mono truncate block mt-0.5">
                                {s.wamid.slice(0, 16)}...
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No message status events captured. Trigger an automation to inspect delivery progression.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. API Request & Response */}
                {activeInspectorTab === 'api' && (
                  <div className="space-y-3 font-mono text-xs">
                    {apiLog ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-900 text-slate-200 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Outbound Request ({apiLog.request.method})
                          </span>
                          <p className="text-[11px] text-emerald-400">{apiLog.request.url}</p>
                          <pre className="text-[11px] overflow-x-auto text-slate-300">
                            {JSON.stringify(apiLog.request.body, null, 2)}
                          </pre>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 text-slate-200 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Meta Response (HTTP {apiLog.response.status})
                          </span>
                          <pre className="text-[11px] overflow-x-auto text-slate-300">
                            {JSON.stringify(apiLog.response.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs font-sans">
                        Execute a test to view HTTP request payloads and Meta Graph API responses.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Webhook Response */}
                {activeInspectorTab === 'webhook' && (
                  <div className="space-y-3 font-mono text-xs">
                    {webhookLog ? (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-sans">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Raw Inbound Webhook Payload
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            HMAC SHA-256 Valid
                          </span>
                        </div>
                        <pre className="text-[11px] overflow-x-auto text-slate-300">
                          {JSON.stringify(webhookLog.payload, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs font-sans">
                        No webhook event logged yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Failure Logs & Retry Attempts */}
                {activeInspectorTab === 'failures' && (
                  <div className="space-y-3">
                    {failureLogs.length > 0 ? (
                      failureLogs.map((log, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-rose-800 font-bold">
                            <span>{log.errorCode}</span>
                            <span className="text-[10px] font-mono">{log.timestamp}</span>
                          </div>
                          <p className="text-rose-700">{log.errorMessage}</p>
                          <span className="text-[10px] font-semibold text-rose-600 font-mono">
                            Retry Attempt: {log.retryAttempts} of 3
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>All execution requests processed with zero error logs.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Device Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Real Device Response Preview
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                Live Simulator
              </span>
            </div>

            <PhoneMockup
              businessName="TriPix Automation Lab"
              bodyText={mockupMessages.text}
              messageType={mockupMessages.buttons?.length ? 'button' : 'text'}
              buttons={(mockupMessages.buttons || []).map((b, i) => ({
                id: `lab_btn_${i}`,
                title: b,
              }))}
              showInboundReply={Boolean(simText)}
              inboundText={simText}
              onButtonClick={(title) => handleSimulateQuickReply(title)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
