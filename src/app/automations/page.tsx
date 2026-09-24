'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  Bot,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  ArrowDown,
  Clock,
  ArrowUp,
  Image as ImageIcon,
  FileText,
  Video,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Smartphone,
  Send,
  RefreshCw,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepType =
  | 'trigger'
  | 'message'
  | 'image'
  | 'document'
  | 'video'
  | 'template'
  | 'delay'
  | 'end';

export interface AutomationStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  text?: string;
  mediaUrl?: string;
  caption?: string;
  fileName?: string;
  templateName?: string;
  delayAmount?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  phoneNumber: string;
  stepName: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled';
  details: string;
}

const DEFAULT_WORKFLOW: AutomationStep[] = [
  {
    id: 'step_1',
    type: 'trigger',
    title: 'Meta Lead Arrives',
    description: 'Triggered automatically when a lead form is submitted on Facebook or Instagram',
  },
  {
    id: 'step_2',
    type: 'image',
    title: 'Send Welcome Image',
    description: 'Instant greeting with high-resolution visual catalog image',
    mediaUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    caption: 'Hello! Welcome to our store. Here is our exclusive featured collection! 🌟',
  },
  {
    id: 'step_3',
    type: 'delay',
    title: 'Wait 1 Hour',
    description: 'Allow customer time to view welcome image',
    delayAmount: 1,
    delayUnit: 'hours',
  },
  {
    id: 'step_4',
    type: 'message',
    title: 'Send Product Details',
    description: 'Detailed benefits, warranty, and available stock specifications',
    text: 'Here are the key specifications and details regarding the item you viewed. We provide free doorstep delivery and 1-year warranty.',
  },
  {
    id: 'step_5',
    type: 'delay',
    title: 'Wait 2 Hours',
    description: 'Give customer time to consider details',
    delayAmount: 2,
    delayUnit: 'hours',
  },
  {
    id: 'step_6',
    type: 'message',
    title: 'Send Pricing & Offer',
    description: 'Transparent pricing with limited-time 10% WhatsApp voucher',
    text: 'Exclusive WhatsApp Offer: Complete your order today for 10% off using promo code SAVE10. Would you like us to reserve one for you?',
  },
  {
    id: 'step_7',
    type: 'delay',
    title: 'Wait 5 Hours',
    description: 'Final nurture reminder window',
    delayAmount: 5,
    delayUnit: 'hours',
  },
  {
    id: 'step_8',
    type: 'message',
    title: 'Send Reminder',
    description: 'Gentle final nudge before closing inquiry',
    text: 'Quick reminder: Your 10% discount expires tonight! Let us know if you have any questions or reply to talk to our specialist.',
  },
  {
    id: 'step_9',
    type: 'end',
    title: 'End Sequence',
    description: 'Sequence completed. Awaiting inbound customer reply or priority escalation.',
  },
];

export default function AutomationsPage() {
  const [steps, setSteps] = useState<AutomationStep[]>(DEFAULT_WORKFLOW);
  const [selectedStepId, setSelectedStepId] = useState<string>('step_2');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Testing dispatch
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Execution logs
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch saved flow and execution logs from backend
  const loadFlowAndLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const [flowRes, msgRes] = await Promise.all([
        fetch('/api/automations').catch(() => null),
        fetch('/api/messages').catch(() => null),
      ]);

      if (flowRes?.ok) {
        const flows = await flowRes.json();
        if (Array.isArray(flows) && flows.length > 0) {
          const first = flows[0];
          const payloadBlocks = first.actionPayload?.blocks;
          if (Array.isArray(payloadBlocks) && payloadBlocks.length >= 2) {
            setSteps(payloadBlocks);
            setSelectedStepId(payloadBlocks[1]?.id || payloadBlocks[0]?.id);
          }
        }
      }

      if (msgRes?.ok) {
        const msgData = await msgRes.json();
        const rawMessages = msgData.messages || [];
        const mappedLogs: ExecutionLog[] = rawMessages.slice(0, 15).map((m: any) => ({
          id: m.id,
          timestamp: m.createdAt || new Date().toISOString(),
          phoneNumber: m.phoneNumber,
          stepName: m.type === 'image' ? 'Welcome Image' : (m.content?.substring(0, 24) || 'Follow-Up Step'),
          status: m.status || 'delivered',
          details: m.content || `[${m.type.toUpperCase()}]`,
        }));
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.warn('Error loading automation data:', e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadFlowAndLogs();
  }, [loadFlowAndLogs]);

  // Validation function
  const validateWorkflow = (): boolean => {
    const errors: string[] = [];
    steps.forEach((step, idx) => {
      if (step.type === 'message' && (!step.text || !step.text.trim())) {
        errors.push(`Step ${idx + 1} (${step.title}): Message text cannot be empty.`);
      }
      if (step.type === 'image' && (!step.mediaUrl || !step.mediaUrl.trim())) {
        errors.push(`Step ${idx + 1} (${step.title}): Image URL cannot be empty.`);
      }
      if (step.type === 'delay') {
        if (!step.delayAmount || step.delayAmount <= 0) {
          errors.push(`Step ${idx + 1} (${step.title}): Delay duration must be greater than 0.`);
        }
      }
      if (step.type === 'template' && (!step.templateName || !step.templateName.trim())) {
        errors.push(`Step ${idx + 1} (${step.title}): Template name is required.`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Save workflow to backend
  const handleSaveWorkflow = async () => {
    if (!validateWorkflow()) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        name: 'Meta Lead Follow-Up Sequence',
        triggerKeyword: 'lead_inbound',
        triggerType: 'keyword',
        actionType: 'buttons',
        actionPayload: {
          blocks: steps,
        },
      };

      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save workflow.');
      }
    } catch (e: any) {
      alert(e.message || 'Error communicating with server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder steps (drag & drop / up & down)
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index <= 1) ||
      (direction === 'down' && index >= steps.length - 2)
    ) {
      return; // Do not move trigger (0) or end (last)
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...steps];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSteps(copy);
  };

  // Add a new step
  const handleAddStep = (type: StepType) => {
    const newId = `step_${Date.now()}`;
    const titles: Record<StepType, string> = {
      trigger: 'Trigger',
      message: 'Send WhatsApp Message',
      image: 'Send Image',
      document: 'Send Document',
      video: 'Send Video',
      template: 'Send Template',
      delay: 'Wait Delay',
      end: 'End',
    };

    const newStep: AutomationStep = {
      id: newId,
      type,
      title: titles[type],
      description: `Step action for ${type}`,
      text: type === 'message' ? 'Hello! Here is an update.' : undefined,
      mediaUrl: type === 'image' ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800' : undefined,
      delayAmount: type === 'delay' ? 2 : undefined,
      delayUnit: type === 'delay' ? 'hours' : undefined,
      templateName: type === 'template' ? 'welcome_lead' : undefined,
    };

    // Insert right before the last 'end' step
    const updated = [...steps.slice(0, -1), newStep, steps[steps.length - 1]];
    setSteps(updated);
    setSelectedStepId(newId);
  };

  // Delete a step
  const handleDeleteStep = (id: string) => {
    if (steps.length <= 3) return;
    setSteps(steps.filter((s) => s.id !== id));
    if (selectedStepId === id) {
      setSelectedStepId(steps[1]?.id || steps[0]?.id);
    }
  };

  // Execute a real diagnostic test run
  const handleTestRunFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhoneNumber }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Test flow executed successfully! Message dispatched to your phone.',
        });
        loadFlowAndLogs();
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to trigger test flow.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error triggering test execution.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Meta Lead Follow-Up Automation"
          subtitle="Automatically nurture new Meta Leads with multi-step WhatsApp messages and timed delays"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Control Bar: Save & Actions */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">Follow-Up Workflow Builder</h2>
                <p className="text-xs text-slate-500">
                  {steps.length} sequential steps • Minutes, Hours &amp; Days delay scheduler
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSaveWorkflow}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer min-h-[42px]"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Workflow Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving Workflow...' : 'Save & Activate Workflow'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Errors Box if any */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Workflow Validation Issues:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 pt-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Main 3-Column Layout: Flowchart + Step Settings + Real-Time Phone Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: Workflow Steps Canvas (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sequence Steps
                </h3>

                {/* Add Step Quick Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddStep('delay')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Delay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddStep('message')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddStep('image')}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Image</span>
                  </button>
                </div>
              </div>

              {/* Vertical Step Flow */}
              <div className="space-y-3 pt-1">
                {steps.map((step, idx) => {
                  const isSelected = selectedStepId === step.id;
                  const isTrigger = step.type === 'trigger';
                  const isEnd = step.type === 'end';
                  const isDelay = step.type === 'delay';

                  return (
                    <React.Fragment key={step.id}>
                      <div
                        onClick={() => setSelectedStepId(step.id)}
                        className={cn(
                          'p-4 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3.5',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                        )}
                      >
                        {/* Step Type Icon Badge */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-2xs',
                            isTrigger && 'bg-amber-100 text-amber-800',
                            step.type === 'message' && 'bg-emerald-100 text-emerald-800',
                            step.type === 'image' && 'bg-purple-100 text-purple-800',
                            step.type === 'document' && 'bg-blue-100 text-blue-800',
                            step.type === 'video' && 'bg-rose-100 text-rose-800',
                            step.type === 'template' && 'bg-indigo-100 text-indigo-800',
                            isDelay && 'bg-blue-100 text-blue-800',
                            isEnd && 'bg-slate-200 text-slate-800'
                          )}
                        >
                          {isTrigger && '⚡'}
                          {step.type === 'message' && '💬'}
                          {step.type === 'image' && '🖼️'}
                          {step.type === 'document' && '📄'}
                          {step.type === 'video' && '🎥'}
                          {step.type === 'template' && '📋'}
                          {isDelay && '⏱️'}
                          {isEnd && '🏁'}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {step.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                              {step.type}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {step.text || step.caption || step.description}
                          </p>

                          {isDelay && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200/60 font-mono">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>
                                Wait {step.delayAmount} {step.delayUnit}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Move & Delete Actions */}
                        {!isTrigger && !isEnd && (
                          <div className="flex flex-col gap-1 items-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStep(idx, 'up');
                              }}
                              disabled={idx <= 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStep(idx, 'down');
                              }}
                              disabled={idx >= steps.length - 2}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStep(step.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Visual Flow Connector */}
                      {idx < steps.length - 1 && (
                        <div className="flex justify-center py-0.5">
                          <div className="w-0.5 h-4 bg-slate-200 flex items-center justify-center">
                            <ArrowDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: Step Editor & Delay Selector (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Step Editor Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Edit Selected Step</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {selectedStep?.type}
                  </span>
                </div>

                {selectedStep ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Step Title
                      </label>
                      <input
                        type="text"
                        value={selectedStep.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSteps((prev) =>
                            prev.map((s) => (s.id === selectedStep.id ? { ...s, title: val } : s))
                          );
                        }}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    {/* Delay Selector (Minutes, Hours, Days) */}
                    {selectedStep.type === 'delay' && (
                      <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div>
                          <label className="text-xs font-bold text-blue-900 block mb-1">
                            Delay Duration
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={selectedStep.delayAmount || 1}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setSteps((prev) =>
                                prev.map((s) =>
                                  s.id === selectedStep.id
                                    ? { ...s, delayAmount: val, title: `Wait ${val} ${s.delayUnit || 'hours'}` }
                                    : s
                                )
                              );
                            }}
                            className="w-full text-xs px-3.5 py-2 bg-white border border-blue-200 rounded-xl font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-blue-900 block mb-1">
                            Time Unit
                          </label>
                          <select
                            value={selectedStep.delayUnit || 'hours'}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setSteps((prev) =>
                                prev.map((s) =>
                                  s.id === selectedStep.id
                                    ? { ...s, delayUnit: val, title: `Wait ${s.delayAmount || 1} ${val}` }
                                    : s
                                )
                              );
                            }}
                            className="w-full text-xs px-3.5 py-2 bg-white border border-blue-200 rounded-xl font-bold cursor-pointer"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Message Text Area */}
                    {(selectedStep.type === 'message' || selectedStep.type === 'template') && (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          WhatsApp Message Body
                        </label>
                        <textarea
                          rows={4}
                          value={selectedStep.text || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSteps((prev) =>
                              prev.map((s) => (s.id === selectedStep.id ? { ...s, text: val } : s))
                            );
                          }}
                          placeholder="Type the message to send to the lead..."
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>
                    )}

                    {/* Image URL & Caption */}
                    {selectedStep.type === 'image' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Image URL
                          </label>
                          <input
                            type="text"
                            value={selectedStep.mediaUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSteps((prev) =>
                                prev.map((s) => (s.id === selectedStep.id ? { ...s, mediaUrl: val } : s))
                              );
                            }}
                            className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Image Caption
                          </label>
                          <input
                            type="text"
                            value={selectedStep.caption || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSteps((prev) =>
                                prev.map((s) => (s.id === selectedStep.id ? { ...s, caption: val } : s))
                              );
                            }}
                            className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    {/* Document / Video */}
                    {(selectedStep.type === 'document' || selectedStep.type === 'video') && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Media File URL
                          </label>
                          <input
                            type="text"
                            value={selectedStep.mediaUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSteps((prev) =>
                                prev.map((s) => (s.id === selectedStep.id ? { ...s, mediaUrl: val } : s))
                              );
                            }}
                            className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select a step on the left to configure.</p>
                )}
              </div>

              {/* Real-Time Live WhatsApp Device Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Real-Time Device Preview
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Live Preview
                  </span>
                </div>

                <PhoneMockup
                  businessName="TriPix Solutions"
                  bodyText={selectedStep?.text || selectedStep?.caption || selectedStep?.description || 'WhatsApp Message'}
                  mediaUrl={selectedStep?.type === 'image' ? selectedStep.mediaUrl : undefined}
                  className="scale-90 origin-top"
                />
              </div>

              {/* Test Run Sequence Form */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Test Sequence Execution
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Send a live test run of this automation flow to your WhatsApp phone.
                </p>

                <form onSubmit={handleTestRunFlow} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="+15551234567"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer min-h-[38px]"
                  >
                    {isTesting ? 'Sending...' : 'Test Run'}
                  </button>
                </form>

                {testResult && (
                  <div
                    className={cn(
                      'p-3 rounded-xl text-xs flex items-center gap-2',
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    )}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Execution Logs & History Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Execution Logs &amp; Delivery Status</h3>
                <p className="text-xs text-slate-500">
                  Real-time delivery receipts for automated follow-up messages
                </p>
              </div>
              <button
                type="button"
                onClick={loadFlowAndLogs}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Refresh logs"
              >
                <RefreshCw className={cn('w-4 h-4', loadingLogs && 'animate-spin text-emerald-600')} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No automated executions recorded yet. Once a lead arrives or a test run is initiated, logs will display here.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.stepName}</span>
                        <span className="text-[11px] font-mono text-slate-500">({log.phoneNumber})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-md">{log.details}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          log.status === 'delivered' && 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                          log.status === 'read' && 'bg-blue-50 text-blue-800 border border-blue-200',
                          log.status === 'sent' && 'bg-slate-100 text-slate-700',
                          log.status === 'failed' && 'bg-rose-50 text-rose-800 border border-rose-200'
                        )}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
