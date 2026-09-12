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
        header: 'AURA Private Showcase',
        body: 'Something big is coming soon. Are you ready? Discover our confidential collection below:',
        footer: 'Confidential • By Private Invitation',
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
        body: 'Welcome to the AURA Vault. Please choose how you would like to proceed with our senior curator:',
        footer: 'Direct Line to Concierge',
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
  const [footerText, setFooterText] = useState('Confidential & Private');
  const [button1, setButton1] = useState('Reserve Spot');
  const [button2, setButton2] = useState('Speak with Director');
  const [button3, setButton3] = useState('Request Dossier');

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
    <div className="min-h-screen bg-[#07090E] pl-64 flex flex-col">
      <Sidebar />
      <Header
        title="Rule-Based Conversational Automations"
        subtitle="Instant edge webhook triggers for interactive quick-replies and high-ticket routing"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Top Action */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#E6C687]" />
              Active Logic Triggers (automation_flows table)
            </h2>
            <p className="text-xs text-zinc-400">
              When a prospect replies with a trigger keyword, the system executes an instant Meta Cloud API response.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black text-xs font-semibold uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Logic Flow</span>
          </button>
        </div>

        {/* Builder Layout & Phone Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Flow Cards */}
          <div className="lg:col-span-7 space-y-4">
            {flows.map((flow) => (
              <div
                key={flow.id}
                onClick={() => setPreviewFlow(flow)}
                className={cn(
                  'p-6 rounded-2xl bg-[#0B0F17]/90 border transition-all cursor-pointer space-y-4 hover:border-white/20',
                  previewFlow.id === flow.id
                    ? 'border-[#D4AF37] shadow-gold-glow'
                    : 'border-white/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#E6C687]">
                      <Zap className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                        Trigger Condition
                      </span>
                      <h4 className="text-sm font-bold text-white font-mono">
                        IF user replies &quot;<span className="text-[#E6C687]">{flow.trigger_keyword}</span>&quot;
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(flow.id);
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors',
                        flow.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      )}
                    >
                      {flow.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>

                {/* Visual Action Flow Card */}
                <div className="p-4 rounded-xl bg-[#07090E] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>THEN SEND: Meta Interactive Message ({flow.action_type})</span>
                  </div>

                  <p className="text-xs text-zinc-300 font-sans italic">
                    &quot;{flow.action_payload.body}&quot;
                  </p>

                  {/* Buttons Render */}
                  {flow.action_payload.buttons && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {flow.action_payload.buttons.map((btn, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-emerald-400"
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
              <span className="text-[11px] uppercase tracking-widest text-[#E6C687] font-semibold">
                Live Trigger Simulation Preview
              </span>
            </div>
            <PhoneMockup
              businessName="AURA Concierge"
              templateName="teaser_alert"
              bodyText="Something big is coming soon. Are you ready?"
              headerText={previewFlow.action_payload.header}
              footerText={previewFlow.action_payload.footer}
              buttons={previewFlow.action_payload.buttons}
              showInboundReply={true}
              inboundText={previewFlow.trigger_keyword}
              onButtonClick={(btn) => alert(`Prospect clicked button "${btn}"!`)}
            />
          </div>
        </div>

        {/* Modal: Create Logic Flow */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0B0F17] border border-white/10 rounded-2xl p-6 space-y-5 shadow-luxury-lg">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-3">
                Create Automation Logic Rule
              </h3>

              <form onSubmit={handleCreateFlow} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Trigger Keyword / Phrase</label>
                  <input
                    type="text"
                    required
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    placeholder="e.g. Show me or YES or Pricing"
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="buttons">Interactive Buttons (Up to 3 Quick Replies)</option>
                    <option value="text">Plain Text Message</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Card Header</label>
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Message Body</label>
                  <textarea
                    required
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={2}
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {actionType === 'buttons' && (
                  <div className="space-y-2 p-3 bg-[#07090E] rounded-xl border border-white/5">
                    <span className="text-[11px] text-[#E6C687] font-semibold uppercase tracking-wider">
                      Quick Reply Buttons (Max 3)
                    </span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={button1}
                        onChange={(e) => setButton1(e.target.value)}
                        placeholder="Button 1"
                        className="w-full bg-[#111622] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={button2}
                        onChange={(e) => setButton2(e.target.value)}
                        placeholder="Button 2"
                        className="w-full bg-[#111622] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={button3}
                        onChange={(e) => setButton3(e.target.value)}
                        placeholder="Button 3"
                        className="w-full bg-[#111622] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 text-xs font-medium hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow"
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
