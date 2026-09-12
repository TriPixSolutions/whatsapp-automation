'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  GitFork,
  Plus,
  Zap,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  Sliders,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Bot,
  Layers,
  UserCheck,
  FileText,
  HelpCircle,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationFlow } from '@/types';

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<'visual_builder' | 'rules_list'>('visual_builder');

  const [flows, setFlows] = useState<AutomationFlow[]>([
    {
      id: '00000000-0000-0000-0000-000000000031',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      trigger_keyword: 'Show me',
      action_type: 'buttons',
      action_payload: {
        header: 'Passion Fruit Private Showcase',
        body: 'Something big is coming soon. Are you ready? Discover our confidential collection below:',
        footer: 'Official WhatsApp Verified',
        buttons: [
          { id: 'btn_specs', title: 'Product Specs' },
          { id: 'btn_pricing', title: 'Pricing' },
          { id: 'btn_agent', title: 'Talk to Agent' },
        ],
      },
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000032',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      trigger_keyword: 'YES',
      action_type: 'buttons',
      action_payload: {
        header: 'Priority Access Granted',
        body: 'Welcome to Passion Fruit. Please choose how you would like to proceed with our concierge team:',
        footer: 'Direct Line to Specialist',
        buttons: [
          { id: 'btn_call', title: 'Schedule Call' },
          { id: 'btn_catalog', title: 'Receive Lookbook' },
        ],
      },
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ]);

  const [activeNodeId, setActiveNodeId] = useState<string>('node_1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [triggerWord, setTriggerWord] = useState('');
  const [actionType, setActionType] = useState<'buttons' | 'text'>('buttons');
  const [headerText, setHeaderText] = useState('Private Selection');
  const [bodyText, setBodyText] = useState('Select an option below to proceed:');
  const [footerText, setFooterText] = useState('Official WhatsApp Business');
  const [button1, setButton1] = useState('Product Specs');
  const [button2, setButton2] = useState('Pricing');
  const [button3, setButton3] = useState('Talk to Agent');

  const [previewFlow, setPreviewFlow] = useState<AutomationFlow>(flows[0]);

  const handleCreateFlow = (e: React.FormEvent) => {
    e.preventDefault();
    const newFlow: AutomationFlow = {
      id: `flow_${Date.now()}`,
      workspace_id: '00000000-0000-0000-0000-000000000001',
      trigger_keyword: triggerWord,
      action_type: actionType,
      action_payload: {
        header: headerText,
        body: bodyText,
        footer: footerText,
        buttons:
          actionType === 'buttons'
            ? [
                { id: 'btn_1', title: button1 },
                { id: 'btn_2', title: button2 },
                { id: 'btn_3', title: button3 },
              ].filter((b) => b.title.trim().length > 0)
            : undefined,
      },
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setFlows([newFlow, ...flows]);
    setPreviewFlow(newFlow);
    setShowAddModal(false);
    setTriggerWord('');
  };

  const toggleActive = (id: string) => {
    setFlows(
      flows.map((f) => (f.id === id ? { ...f, is_active: !f.is_active } : f))
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pl-64 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="No-Code Chatbot & Automated Instant Replies"
        subtitle="Build visual automated conversation paths, interactive buttons, and instant customer replies"
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Top Controls: View Mode Switcher & Action Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('visual_builder')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
                activeTab === 'visual_builder'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Visual Flow Builder</span>
            </button>
            <button
              onClick={() => setActiveTab('rules_list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
                activeTab === 'rules_list'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Keyword Trigger Rules</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-button text-xs px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Node / Rule</span>
          </button>
        </div>

        {/* 1. VISUAL FLOW BUILDER MODE (Wati Signature Feature) */}
        {activeTab === 'visual_builder' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Flow Canvas */}
            <div className="xl:col-span-8 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-amber-400 flex items-center justify-center text-white shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Lead Qualification & Booking Flow (Active)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Triggered on CTWA Meta Ads and first inbound WhatsApp messages
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live on WhatsApp
                  </span>
                </div>

                {/* Connected Flow Diagram Nodes */}
                <div className="space-y-4 relative">
                  {/* Vertical Connection Line */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-400 via-fuchsia-400 to-emerald-400 -z-0" />

                  {/* Node 1: Inbound Trigger */}
                  <div
                    onClick={() => setActiveNodeId('node_1')}
                    className={cn(
                      'relative z-10 p-4 rounded-xl border transition-all cursor-pointer bg-white flex items-start gap-4',
                      activeNodeId === 'node_1'
                        ? 'border-[#0066FF] ring-2 ring-[#0066FF]/20 shadow-md'
                        : 'border-[#E5E7EB] hover:border-slate-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-[#0066FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Step 1 • Inbound Trigger
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Exact Match: &quot;Show me&quot;
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Customer Initiates Conversation</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Matches user response from Instagram/Facebook ad or organic message.
                      </p>
                    </div>
                  </div>

                  {/* Node 2: Interactive Decision (3 Quick Replies) */}
                  <div
                    onClick={() => setActiveNodeId('node_2')}
                    className={cn(
                      'relative z-10 p-4 rounded-xl border transition-all cursor-pointer bg-white flex items-start gap-4',
                      activeNodeId === 'node_2'
                        ? 'border-[#0066FF] ring-2 ring-[#0066FF]/20 shadow-md'
                        : 'border-[#E5E7EB] hover:border-slate-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600">
                          Step 2 • Interactive Decision
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-50 text-fuchsia-700">
                          Meta Interactive 3-Buttons
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Send Interactive Showcase Card</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        &quot;Something big is coming soon. Discover our confidential collection below:&quot;
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          [Product Specs]
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          [Pricing]
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          [Talk to Agent]
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Node 3: Condition Branch A (Self-Service) */}
                  <div
                    onClick={() => setActiveNodeId('node_3')}
                    className={cn(
                      'relative z-10 ml-8 p-4 rounded-xl border transition-all cursor-pointer bg-white flex items-start gap-4',
                      activeNodeId === 'node_3'
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                        : 'border-[#E5E7EB] hover:border-slate-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                          Branch A • IF &quot;Pricing&quot; OR &quot;Specs&quot;
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          Wati AI Auto-Reply
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Dispatch Digital Catalog PDF & Pricing</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sends dynamic PDF brochure and quotes starting tier of $25,000.
                      </p>
                    </div>
                  </div>

                  {/* Node 4: Condition Branch B (Human Agent Handoff) */}
                  <div
                    onClick={() => setActiveNodeId('node_4')}
                    className={cn(
                      'relative z-10 ml-8 p-4 rounded-xl border transition-all cursor-pointer bg-white flex items-start gap-4',
                      activeNodeId === 'node_4'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-[#E5E7EB] hover:border-slate-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          Branch B • IF &quot;Talk to Agent&quot;
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Live Agent Handoff
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">
                        Assign Chat to Sarah Jenkins in Shared Inbox
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sends confirmation to customer and notifies agent via desktop push notification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator */}
            <div className="xl:col-span-4 flex flex-col items-center justify-start space-y-3">
              <div className="text-center">
                <span className="text-[11px] uppercase tracking-widest text-[#0066FF] font-bold font-mono">
                  Live Phone Mockup Preview
                </span>
              </div>
              <PhoneMockup
                businessName="Passion Fruit Concierge"
                templateName="teaser_alert"
                bodyText="Something big is coming soon. Are you ready?"
                headerText={previewFlow.action_payload.header}
                footerText={previewFlow.action_payload.footer}
                buttons={previewFlow.action_payload.buttons}
                showInboundReply={true}
                inboundText={previewFlow.trigger_keyword}
                onButtonClick={(btn) => alert(`Customer pressed: "${btn}". Advancing to next flow branch!`)}
              />
            </div>
          </div>
        ) : (
          /* 2. RULES LIST MODE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  onClick={() => setPreviewFlow(flow)}
                  className={cn(
                    'p-6 rounded-2xl bg-white border transition-all cursor-pointer space-y-4 hover:shadow-md',
                    previewFlow.id === flow.id
                      ? 'border-[#0066FF] shadow-zap-md ring-2 ring-[#0066FF]/20'
                      : 'border-[#E5E7EB]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066FF]">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#777777]">
                          Trigger Keyword
                        </span>
                        <h4 className="text-sm font-bold text-[#222222] font-mono">
                          IF user replies &quot;<span className="text-[#0066FF]">{flow.trigger_keyword}</span>&quot;
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(flow.id);
                      }}
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors',
                        flow.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      )}
                    >
                      {flow.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#555555] font-mono">
                      <ArrowRight className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>THEN SEND: Meta Interactive ({flow.action_type})</span>
                    </div>

                    <p className="text-xs text-[#222222] font-sans font-medium">
                      &quot;{flow.action_payload.body}&quot;
                    </p>

                    {flow.action_payload.buttons && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {flow.action_payload.buttons.map((btn, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0066FF] shadow-sm"
                          >
                            [{btn.title}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3">
              <div className="text-center">
                <span className="text-[11px] uppercase tracking-widest text-[#0066FF] font-bold font-mono">
                  Live Trigger Simulation Preview
                </span>
              </div>
              <PhoneMockup
                businessName="Passion Fruit Concierge"
                templateName="teaser_alert"
                bodyText="Something big is coming soon. Are you ready?"
                headerText={previewFlow.action_payload.header}
                footerText={previewFlow.action_payload.footer}
                buttons={previewFlow.action_payload.buttons}
                showInboundReply={true}
                inboundText={previewFlow.trigger_keyword}
                onButtonClick={(btn) => alert(`Interactive button tapped: "${btn}"`)}
              />
            </div>
          </div>
        )}

        {/* Modal: Create Logic Flow */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 shadow-2xl">
              <h3 className="text-base font-bold text-[#222222] border-b border-[#E5E7EB] pb-3">
                Create Conversational Automation Node
              </h3>

              <form onSubmit={handleCreateFlow} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Trigger Keyword / Phrase</label>
                  <input
                    type="text"
                    required
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    placeholder="e.g. Show me or VIP or Catalog"
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                  >
                    <option value="buttons">Interactive Buttons (Up to 3 Quick Replies)</option>
                    <option value="text">Plain Text Message</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Card Header</label>
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Message Body</label>
                  <textarea
                    required
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                {actionType === 'buttons' && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] text-[#0066FF] font-bold uppercase tracking-wider">
                      Quick Reply Buttons (Max 3)
                    </span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={button1}
                        onChange={(e) => setButton1(e.target.value)}
                        placeholder="Button 1"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs text-[#222222]"
                      />
                      <input
                        type="text"
                        value={button2}
                        onChange={(e) => setButton2(e.target.value)}
                        placeholder="Button 2"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs text-[#222222]"
                      />
                      <input
                        type="text"
                        value={button3}
                        onChange={(e) => setButton3(e.target.value)}
                        placeholder="Button 3"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs text-[#222222]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-[#555555] text-xs font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl gradient-button text-white font-semibold text-xs uppercase tracking-wider shadow-sm"
                  >
                    Save Node
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
