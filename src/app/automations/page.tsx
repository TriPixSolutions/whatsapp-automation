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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationFlow } from '@/types';

export default function AutomationsPage() {
  const [flows, setFlows] = useState<AutomationFlow[]>([
    {
      id: '00000000-0000-0000-0000-000000000031',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      trigger_keyword: 'Show me',
      action_type: 'buttons',
      action_payload: {
        header: 'ZapElite Showcase',
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
        body: 'Welcome to ZapElite. Please choose how you would like to proceed with our team:',
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
        title="Conversational Workflow Automation Builder"
        subtitle="Instant edge webhook triggers for interactive quick-replies and CRM routing"
      />

      <main className="p-8 space-y-8 flex-1">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#0066FF]" />
              Active Logic Triggers (automation_flows table)
            </h2>
            <p className="text-xs text-[#777777]">
              When a prospect replies with a trigger keyword, the system executes an instant Meta Cloud API response.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-button text-xs px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Logic Flow</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Flow Cards */}
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
                        Trigger Condition
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
                    <span>THEN SEND: Meta Interactive Message ({flow.action_type})</span>
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

          {/* Right Col: Live Interactive Smartphone Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-widest text-[#0066FF] font-bold font-mono">
                Live Trigger Simulation Preview
              </span>
            </div>
            <PhoneMockup
              businessName="ZapElite Concierge"
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

        {/* Modal: Create Logic Flow */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 shadow-2xl">
              <h3 className="text-base font-bold text-[#222222] border-b border-[#E5E7EB] pb-3">
                Create Conversational Automation Rule
              </h3>

              <form onSubmit={handleCreateFlow} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Trigger Keyword / Phrase</label>
                  <input
                    type="text"
                    required
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    placeholder="e.g. Show me or YES or Pricing"
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
                    Save Automation
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
