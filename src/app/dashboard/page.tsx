'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  Send,
  CheckCheck,
  Eye,
  TrendingUp,
  Sparkles,
  FlaskConical,
  Play,
  RotateCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [loadingFlow1, setLoadingFlow1] = useState(false);
  const [loadingFlow2, setLoadingFlow2] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'outbound' | 'inbound'>('all');

  // Interactive mockup state
  const [mockupState, setMockupState] = useState({
    bodyText: 'Something big is coming soon. Are you ready?',
    inboundText: 'Show me',
    showInbound: true,
  });

  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      recipient: '+971501234567 (Julian Vance)',
      direction: 'outbound',
      type: 'template',
      status: 'delivered',
      preview: 'Something big is coming soon. Are you ready?',
      time: '10 mins ago',
    },
    {
      id: 'm2',
      recipient: '+971501234567 (Julian Vance)',
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      preview: 'Show me',
      time: '9 mins ago',
    },
    {
      id: 'm3',
      recipient: '+971501234567 (Julian Vance)',
      direction: 'outbound',
      type: 'interactive',
      status: 'read',
      preview: 'Buttons: [Product Specs, Pricing, Talk to Agent]',
      time: '9 mins ago',
    },
    {
      id: 'm4',
      recipient: '+447700900123 (Lady Eleanor)',
      direction: 'outbound',
      type: 'template',
      status: 'delivered',
      preview: 'Something big is coming soon. Are you ready?',
      time: '25 mins ago',
    },
    {
      id: 'm5',
      recipient: '+14155552671 (Marcus Castile)',
      direction: 'outbound',
      type: 'template',
      status: 'delivered',
      preview: 'Something big is coming soon. Are you ready?',
      time: '42 mins ago',
    },
  ]);

  // Run Test Flow 1: Outbound Bulk Campaign
  const runTestFlow1 = async () => {
    setLoadingFlow1(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_flow_1' }),
      });
      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        setMockupState({
          bodyText: 'Something big is coming soon. Are you ready?',
          inboundText: 'Show me',
          showInbound: false,
        });

        // Prepend fresh messages
        setMessages((prev) => [
          {
            id: `flow1_${Date.now()}`,
            recipient: 'All 3 VIP Test Numbers',
            direction: 'outbound',
            type: 'template',
            status: 'delivered',
            preview: 'Something big is coming soon. Are you ready?',
            time: 'Just now',
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setLoadingFlow1(false);
    }
  };

  // Run Test Flow 2: Inbound "Show me" Interactive Automation
  const runTestFlow2 = async () => {
    setLoadingFlow2(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_flow_2',
          testPhone: '+971501234567',
        }),
      });
      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        setMockupState({
          bodyText: 'Something big is coming soon. Are you ready?',
          inboundText: 'Show me',
          showInbound: true,
        });

        setMessages((prev) => [
          {
            id: `flow2_out_${Date.now()}`,
            recipient: '+971501234567 (Julian Vance)',
            direction: 'outbound',
            type: 'interactive',
            status: 'sent',
            preview: '3 Buttons: [Product Specs, Pricing, Talk to Agent]',
            time: 'Just now',
          },
          {
            id: `flow2_in_${Date.now()}`,
            recipient: '+971501234567 (Julian Vance)',
            direction: 'inbound',
            type: 'text',
            status: 'delivered',
            preview: 'Show me',
            time: 'Just now',
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setLoadingFlow2(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'all') return true;
    return m.direction === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#07090E] pl-64 flex flex-col">
      <Sidebar />
      <Header
        title="Executive Performance & Broadcast Analytics"
        subtitle="Meta Cloud API v18.0 • Hostinger BullMQ Cluster • Real-time Delivery Ledger"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Messages Dispatched"
            value="14,820"
            trend="+18.4%"
            subtitle="vs. previous cycle"
            icon={Send}
            accent="gold"
          />
          <StatCard
            title="Meta Delivery Rate"
            value="98.6%"
            trend="+0.8%"
            subtitle="Industry avg: 92%"
            icon={CheckCheck}
            accent="emerald"
          />
          <StatCard
            title="Read & Engagement Rate"
            value="84.2%"
            trend="+4.1%"
            subtitle="High-ticket luxury benchmark"
            icon={Eye}
            accent="blue"
          />
          <StatCard
            title="Active Qualified Leads"
            value="432"
            trend="+27.5%"
            subtitle="VIP inquiries this week"
            icon={TrendingUp}
            accent="purple"
          />
        </div>

        {/* Test Scenario Lab (Blueprint Section 5) */}
        <section id="test-lab" className="rounded-2xl bg-[#0B0F17]/90 border border-[#D4AF37]/30 p-6 space-y-6 shadow-luxury-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#E6C687]" />
                  Interactive Test Scenario Lab (Verification Engine)
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Execute Test Flow 1 (Outbound Bulk Teaser) and Test Flow 2 (Inbound "Show me" 3-button interactive response)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={runTestFlow1}
                disabled={loadingFlow1 || loadingFlow2}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-gold-glow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loadingFlow1 ? 'Dispatching...' : 'Run Test Flow 1 (Outbound Bulk)'}</span>
              </button>

              <button
                onClick={runTestFlow2}
                disabled={loadingFlow1 || loadingFlow2}
                className="px-4 py-2 rounded-xl bg-[#111622] hover:bg-[#182030] border border-white/10 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RotateCw className={cn('w-3.5 h-3.5 text-cyan-400', loadingFlow2 && 'animate-spin')} />
                <span>{loadingFlow2 ? 'Triggering...' : 'Run Test Flow 2 (Inbound "Show me")'}</span>
              </button>
            </div>
          </div>

          {/* Test Scenario Details & Live Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Explanation & JSON Ledger */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#07090E] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#E6C687]">Test Flow 1</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">Outbound Bulk</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Dispatches template <code className="text-white font-mono">teaser_alert</code>: &quot;Something big is coming soon. Are you ready?&quot; with 50ms pacing. Verifies status logs show <strong className="text-emerald-400">&apos;delivered&apos;</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#07090E] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-300">Test Flow 2</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">Inbound Auto-Reply</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Simulates user reply <code className="text-white font-mono">&quot;Show me&quot;</code>. Webhook matches rule and instantly returns Meta Interactive Message with 3 Quick Reply buttons: <span className="text-white font-mono">[Product Specs, Pricing, Talk to Agent]</span>.
                  </p>
                </div>
              </div>

              {/* JSON Live Output Display */}
              <div className="rounded-xl bg-[#07090E] border border-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="font-mono text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Execution Result
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {testResult ? 'HTTP 200 OK' : 'Awaiting Test Trigger'}
                  </span>
                </div>

                <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48 p-2 leading-relaxed">
                  {testResult
                    ? JSON.stringify(testResult, null, 2)
                    : `// Click "Run Test Flow 1" or "Run Test Flow 2" above to execute\n{\n  "status": "ready",\n  "testContacts": 3,\n  "rateLimitDelayMs": 50,\n  "metaApiVersion": "v18.0"\n}`}
                </pre>
              </div>
            </div>

            {/* Right Col: Live WhatsApp Smartphone Simulation */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <span className="text-[11px] uppercase tracking-widest text-[#E6C687] font-semibold">
                  Live Meta Interactive Preview
                </span>
              </div>
              <PhoneMockup
                businessName="AURA Concierge"
                templateName="teaser_alert"
                bodyText={mockupState.bodyText}
                headerText="AURA Private Showcase"
                footerText="Confidential • By Private Invitation"
                showInboundReply={mockupState.showInbound}
                inboundText={mockupState.inboundText}
                onButtonClick={(btn) => {
                  alert(`Interactive button "${btn}" tapped! In production, this fires Meta webhook callback.`);
                }}
              />
            </div>
          </div>
        </section>

        {/* Live Messages & Delivery Ledger Table */}
        <section className="rounded-2xl bg-[#0B0F17]/90 border border-white/10 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Live Meta Message Delivery Ledger (messages_log)
              </h3>
              <p className="text-xs text-zinc-400">
                Audited stream of inbound triggers, template broadcasts, and delivery receipts
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-xl border border-white/5 text-xs">
              {(['all', 'outbound', 'inbound'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 rounded-lg capitalize transition-colors',
                    activeTab === tab
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#07090E]">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-[10px] uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="p-3.5">Recipient / Contact</th>
                  <th className="p-3.5">Direction</th>
                  <th className="p-3.5">Message Type</th>
                  <th className="p-3.5">Payload Snippet</th>
                  <th className="p-3.5">Delivery Status</th>
                  <th className="p-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 text-white font-sans font-medium">{msg.recipient}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider',
                          msg.direction === 'inbound'
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        )}
                      >
                        {msg.direction}
                      </span>
                    </td>
                    <td className="p-3.5 capitalize font-sans">{msg.type}</td>
                    <td className="p-3.5 text-zinc-400 font-sans max-w-xs truncate">{msg.preview}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-mono',
                          msg.status === 'delivered' || msg.status === 'read'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        )}
                      >
                        <CheckCheck className="w-3 h-3" />
                        {msg.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-zinc-500 font-sans">{msg.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
