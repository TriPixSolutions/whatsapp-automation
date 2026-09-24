'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  FlaskConical,
  MousePointerClick,
  Layers,
  Save,
  TrendingUp,
  BarChart3,
  Bot,
  Copy,
  ChevronRight,
  Sliders,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowDefinition } from '@/types/automations';

// 4 Pre-built starter templates for zero-friction setup
const STARTER_TEMPLATES = [
  {
    id: 'tpl_welcome',
    name: 'Instant Welcome Greeting',
    description: 'Greets every new customer instantly with your introduction and 2 quick menu buttons.',
    icon: '👋',
    triggerKeyword: 'HI, HELLO, START, MENU',
    messageText: 'Hello! 👋 Welcome to our store. How can we help you today?',
    buttons: ['🛍️ View Catalogue', '💬 Talk to Human'],
    delay: 0,
    tag: 'new_lead',
  },
  {
    id: 'tpl_pricing',
    name: 'Price List & Catalogue Bot',
    description: 'Auto-replies when customers ask for prices, catalogue, or quotations.',
    icon: '💰',
    triggerKeyword: 'PRICE, CATALOGUE, MENU, COST',
    messageText: 'Here is our latest 2026 pricing and catalogue overview! Feel free to pick an option below:',
    buttons: ['📄 Download PDF', '⭐ Special Offers'],
    delay: 0,
    tag: 'pricing_inquired',
  },
  {
    id: 'tpl_away',
    name: 'After-Hours Away Responder',
    description: 'Informs customers that your team is currently offline and will reply first thing in the morning.',
    icon: '🌙',
    triggerKeyword: 'ANY_MESSAGE',
    messageText: 'Thank you for reaching out! Our team is currently offline. We will reply to your message tomorrow morning by 9:00 AM.',
    buttons: ['🕒 Office Hours', '❓ FAQs'],
    delay: 0,
    tag: 'after_hours',
  },
  {
    id: 'tpl_lead',
    name: 'VIP Lead Qualifier',
    description: 'Tags high-intent buyers and alerts your sales team immediately.',
    icon: '🎯',
    triggerKeyword: 'ORDER, BUY, BOOK, DEMO',
    messageText: 'Great! We would love to assist with your order. Please select what you are interested in:',
    buttons: ['📦 Bulk Order', '🚀 Schedule Demo'],
    delay: 0,
    tag: 'vip_buyer',
  },
];

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'analytics'>('builder');

  // Step-by-Step Form State (Step 1: Trigger -> Step 2: Message -> Step 3: Delay -> Step 4: Action/Status)
  const [flowName, setFlowName] = useState('Welcome Greeting & Auto-Reply');
  const [triggerType, setTriggerType] = useState<'keyword' | 'any'>('keyword');
  const [triggerKeyword, setTriggerKeyword] = useState('HI, HELLO, MENU, PRICE');
  const [replyText, setReplyText] = useState(
    'Hi there! 👋 Welcome to our WhatsApp service. How can we assist you today?'
  );
  const [buttons, setButtons] = useState<string[]>(['🛍️ View Catalogue', '💬 Talk to Agent']);
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [assignTag, setAssignTag] = useState('WhatsApp Lead');
  const [isActive, setIsActive] = useState(true);

  // Load Existing Workflows
  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/automations?format=dag');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWorkflows(data);
          const first = data[0];
          setActiveWorkflowId(first.id);
          setFlowName(first.name || 'Welcome Greeting');
          setTriggerKeyword(first.triggerKeyword || 'HELLO');
          setIsActive(first.isActive !== false);

          const messageNode = first.nodes?.find((n: any) => n.type === 'message' || n.type === 'button');
          if (messageNode?.config?.text) {
            setReplyText(messageNode.config.text);
          } else if (messageNode?.config?.bodyText) {
            setReplyText(messageNode.config.bodyText);
          }
          if (messageNode?.config?.buttons) {
            setButtons(messageNode.config.buttons.map((b: any) => b.title));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load automations:', err);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Apply a template into the builder
  const handleApplyTemplate = (tpl: (typeof STARTER_TEMPLATES)[0]) => {
    setFlowName(tpl.name);
    setTriggerKeyword(tpl.triggerKeyword);
    setTriggerType(tpl.triggerKeyword === 'ANY_MESSAGE' ? 'any' : 'keyword');
    setReplyText(tpl.messageText);
    setButtons([...tpl.buttons]);
    setDelaySeconds(tpl.delay);
    setAssignTag(tpl.tag);
    setIsActive(true);
  };

  // Button operations
  const handleAddButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, `Option ${buttons.length + 1}`]);
    }
  };

  const handleUpdateButton = (index: number, val: string) => {
    const updated = [...buttons];
    updated[index] = val;
    setButtons(updated);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  // Save Flow
  const handleSaveFlow = async () => {
    setIsSaving(true);
    try {
      const formattedButtons = buttons.map((title, idx) => ({
        id: `btn_${idx + 1}`,
        title,
      }));

      const nodes = [
        {
          id: 'node_trigger_1',
          type: 'trigger',
          title: 'Trigger',
          description: triggerType === 'any' ? 'Any incoming message' : `Keywords: ${triggerKeyword}`,
          triggerKeyword,
          nextNodeId: 'node_message_2',
        },
        {
          id: 'node_message_2',
          type: buttons.length > 0 ? 'button' : 'message',
          title: 'WhatsApp Reply',
          description: 'Automated response',
          config: {
            text: replyText,
            bodyText: replyText,
            buttons: formattedButtons,
            delayAmount: delaySeconds,
            delayUnit: 'seconds',
          },
          nextNodeId: 'node_action_3',
        },
        {
          id: 'node_action_3',
          type: 'condition',
          title: 'Apply Tag',
          description: `Tag customer with #${assignTag}`,
          config: {
            tag: assignTag,
          },
        },
      ];

      const payload = {
        id: activeWorkflowId || `wf_${Date.now()}`,
        name: flowName,
        triggerKeyword,
        isActive,
        nodes,
      };

      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Automations"
          subtitle="Create smart WhatsApp auto-replies and 24/7 lead responders in under 2 minutes"
        />

        {/* Top Control Bar */}
        <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Conversational Automation Studio</h2>
              <p className="text-[11px] text-slate-500">Step 1 (Trigger) → Step 2 (Message) → Step 3 (Delay) → Step 4 (Save)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/test-center"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
              <span>Test in Lab</span>
            </Link>

            <button
              type="button"
              onClick={handleSaveFlow}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved & Live! ✓' : 'Save & Turn ON'}</span>
            </button>
          </div>
        </div>

        {/* Ready-Made Starter Templates */}
        <div className="bg-slate-100/70 border-b border-slate-200/80 px-4 sm:px-6 py-2.5 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Starter Recipes:
            </span>
            {STARTER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer"
              >
                <span>{tpl.icon}</span>
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area: Left Builder (60%) + Right Phone Preview (40%) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: 4-Step Linear Flow Builder */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar pb-24 lg:pb-12">
            {/* Flow Name & Active Switch */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Automation Name</label>
                <input
                  type="text"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="e.g. VIP Welcome Greeting"
                  className="w-full text-sm font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 mt-0.5"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status:</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {isActive ? '🟢 Active' : '⚪ Paused'}
                </button>
              </div>
            </div>

            {/* STEP 1: TRIGGER */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center border border-amber-200">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">When Customer Sends a Message (Trigger)</h3>
                  <p className="text-[11px] text-slate-500">Choose when this automated flow should start</p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTriggerType('keyword')}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left',
                      triggerType === 'keyword'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    )}
                  >
                    Match Keywords (e.g. Price, Menu)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTriggerType('any');
                      setTriggerKeyword('ANY_MESSAGE');
                    }}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left',
                      triggerType === 'any'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    )}
                  >
                    Any Incoming Message (First-time)
                  </button>
                </div>

                {triggerType === 'keyword' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Trigger Keywords (separated by comma):
                    </label>
                    <input
                      type="text"
                      value={triggerKeyword}
                      onChange={(e) => setTriggerKeyword(e.target.value)}
                      placeholder="e.g. HI, HELLO, PRICE, CATALOGUE"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: MESSAGE & BUTTONS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Reply with WhatsApp Message</h3>
                  <p className="text-[11px] text-slate-500">The message your customer will immediately receive</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your WhatsApp greeting or answer here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  />
                </div>

                {/* Interactive Reply Buttons (Up to 3) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Quick Reply Buttons (Max 3)
                    </label>
                    {buttons.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddButton}
                        className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Button</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          value={btn}
                          onChange={(e) => handleUpdateButton(idx, e.target.value)}
                          placeholder="Button title (e.g. View Catalogue)"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: DELAY TIMER */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center border border-purple-200">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Wait Duration (Optional Delay)</h3>
                  <p className="text-[11px] text-slate-500">Send immediately or introduce natural human pause</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'Instant (0s)', val: 0 },
                  { label: '10 Seconds', val: 10 },
                  { label: '5 Minutes', val: 300 },
                  { label: '1 Hour', val: 3600 },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setDelaySeconds(d.val)}
                    className={cn(
                      'py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                      delaySeconds === d.val
                        ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 4: NEXT ACTION & TAG */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center border border-emerald-200">
                  4
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Tag Customer & Activate</h3>
                  <p className="text-[11px] text-slate-500">Automatically organize customers who triggered this flow</p>
                </div>
              </div>

              <div className="pt-1">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Assign Tag:
                </label>
                <input
                  type="text"
                  value={assignTag}
                  onChange={(e) => setAssignTag(e.target.value)}
                  placeholder="e.g. Interested, Hot Lead, Pricing Inquired"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Real-time WhatsApp Phone Mockup (Phase 7 Integration) */}
          <div className="w-full lg:w-[420px] bg-slate-100/90 border-t lg:border-t-0 lg:border-l border-slate-200/90 p-6 flex flex-col items-center justify-center shrink-0">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                📱 Live WhatsApp Phone Preview
              </span>
              <p className="text-[11px] text-slate-500">Updates instantly as you type</p>
            </div>

            <PhoneMockup
              businessName="WhatsApp Assistant"
              bodyText={replyText}
              messageType={buttons.length > 0 ? 'button' : 'text'}
              buttons={buttons.map((b, i) => ({ id: `btn_${i}`, title: b }))}
              showInboundReply={true}
              inboundText={triggerType === 'any' ? 'Hello' : triggerKeyword.split(',')[0].trim()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
