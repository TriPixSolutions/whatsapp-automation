'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { PhoneMockup } from '@/components/PhoneMockup';
import { LiveTeamInbox } from '@/components/LiveTeamInbox';
import {
  Send,
  CheckCheck,
  Eye,
  TrendingUp,
  Sparkles,
  FlaskConical,
  Play,
  RotateCw,
  Globe,
  Users,
  Inbox,
  BarChart3,
  Bot,
  Zap,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Megaphone,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [loadingFlow1, setLoadingFlow1] = useState(false);
  const [loadingFlow2, setLoadingFlow2] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'outbound' | 'inbound'>('all');

  const [mockupState, setMockupState] = useState({
    bodyText: 'Something big is coming soon. Are you ready?',
    inboundText: 'Show me',
    showInbound: true,
  });

  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      recipient: '+971 50 123 4567 (Julian Vance)',
      direction: 'outbound',
      type: 'template',
      status: 'delivered',
      preview: 'Something big is coming soon. Are you ready?',
      time: '10 mins ago',
    },
    {
      id: 'm2',
      recipient: '+971 50 123 4567 (Julian Vance)',
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      preview: 'Show me',
      time: '9 mins ago',
    },
    {
      id: 'm3',
      recipient: '+971 50 123 4567 (Julian Vance)',
      direction: 'outbound',
      type: 'interactive',
      status: 'read',
      preview: 'Buttons: [Product Specs, Pricing, Talk to Agent]',
      time: '9 mins ago',
    },
    {
      id: 'm4',
      recipient: '+44 7700 900123 (Lady Eleanor)',
      direction: 'outbound',
      type: 'template',
      status: 'delivered',
      preview: 'Something big is coming soon. Are you ready?',
      time: '25 mins ago',
    },
    {
      id: 'm5',
      recipient: '+1 415 555 2671 (Marcus Castile)',
      direction: 'outbound',
      type: 'template',
      status: 'delivered',
      preview: 'Something big is coming soon. Are you ready?',
      time: '42 mins ago',
    },
  ]);

  const capabilities = [
    { name: 'Integrations', icon: Globe, href: '/settings' },
    { name: 'Audience CRM', icon: Users, href: '/contacts' },
    { name: 'Team Inbox', icon: Inbox, href: '#team-inbox' },
    { name: 'CTWA Ads', icon: Megaphone, href: '#ctwa' },
    { name: 'Bulk Broadcast', icon: Send, href: '/campaigns' },
    { name: 'Live Chat', icon: MessageSquare, href: '#team-inbox' },
    { name: 'No-Code Bot', icon: Bot, href: '/automations' },
    { name: 'Wati AI', icon: Sparkles, href: '#team-inbox' },
  ];

  const ctwaCampaigns = [
    {
      name: 'Summer Villa Drop #4021',
      platform: 'Instagram Reels & Stories',
      spend: '$640.00',
      chatsStarted: 462,
      costPerChat: '$1.38',
      conversionRate: '24.1%',
      status: 'active',
    },
    {
      name: 'Haute Horlogerie Private Preview',
      platform: 'Facebook Feed & Messenger',
      spend: '$420.00',
      chatsStarted: 298,
      costPerChat: '$1.41',
      conversionRate: '19.8%',
      status: 'active',
    },
    {
      name: 'VIP Client Concierge Re-engagement',
      platform: 'Instagram Feed Direct',
      spend: '$180.00',
      chatsStarted: 132,
      costPerChat: '$1.36',
      conversionRate: '28.5%',
      status: 'active',
    },
  ];

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
            recipient: '+971 50 123 4567 (Julian Vance)',
            direction: 'outbound',
            type: 'interactive',
            status: 'sent',
            preview: '3 Buttons: [Product Specs, Pricing, Talk to Agent]',
            time: 'Just now',
          },
          {
            id: `flow2_in_${Date.now()}`,
            recipient: '+971 50 123 4567 (Julian Vance)',
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
    <div className="min-h-screen bg-[#FAFAFA] pl-64 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Passion Fruit Executive Broadcast & Operations Console"
        subtitle="Meta Cloud API v18.0 • Wati AI Conversational Copilot • Hostinger BullMQ Pacing"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* 1. Passion Fruit 8-Capability Launcher */}
        <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-zap-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#777777]">
              Passion Fruit Core Capability Launchpad
            </span>
            <span className="text-xs font-semibold text-[#0066FF] font-mono">
              Meta WhatsApp Business Cloud Verified
            </span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 justify-items-center">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <Link
                  key={i}
                  href={cap.href}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-slate-50 border-2 border-white p-2.5 rounded-xl transition-all duration-200 group-hover:bg-blue-50 group-hover:shadow-md group-hover:scale-105 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#0066FF] group-hover:text-fuchsia-600 transition-colors" />
                  </div>
                  <p className="font-semibold text-[#555555] group-hover:text-[#222222] text-[11px] text-center transition-colors">
                    {cap.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 2. KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Messages Dispatched"
            value="14,820"
            trend="+18.4%"
            subtitle="vs. previous cycle"
            icon={Send}
            accent="blue"
          />
          <StatCard
            title="Meta Delivery Rate"
            value="98.6%"
            trend="+0.8%"
            subtitle="Industry benchmark: 92%"
            icon={CheckCheck}
            accent="emerald"
          />
          <StatCard
            title="Read & Engagement Rate"
            value="84.2%"
            trend="+4.1%"
            subtitle="High-ticket engagement"
            icon={Eye}
            accent="purple"
          />
          <StatCard
            title="CTWA Ad Leads Captured"
            value="892"
            trend="+32.6%"
            subtitle="Instagram & FB Click-to-WhatsApp"
            icon={Megaphone}
            accent="amber"
          />
        </div>

        {/* 3. Live Team Inbox with Wati AI Copilot */}
        <section id="team-inbox" className="space-y-3">
          <LiveTeamInbox />
        </section>

        {/* 4. Click-to-WhatsApp Ads (CTWA) Meta Ads Tracker (Wati Feature) */}
        <section id="ctwa" className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-5 shadow-zap-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Click-to-WhatsApp Ads (CTWA) Meta Lead Tracker
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Track and auto-engage prospects who click your Instagram & Facebook ads directly into WhatsApp.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Avg Cost / Chat: $1.39
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3.5">Meta Ad Campaign</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Ad Spend</th>
                  <th className="p-3.5">Chats Started</th>
                  <th className="p-3.5">Cost / Conversation</th>
                  <th className="p-3.5">Conversion</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                {ctwaCampaigns.map((ad, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-sans font-bold text-slate-900">{ad.name}</td>
                    <td className="p-3.5 font-sans text-purple-700 font-medium">{ad.platform}</td>
                    <td className="p-3.5">{ad.spend}</td>
                    <td className="p-3.5 font-bold text-emerald-600">+{ad.chatsStarted}</td>
                    <td className="p-3.5">{ad.costPerChat}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{ad.conversionRate}</td>
                    <td className="p-3.5 text-right">
                      <Link
                        href="/automations"
                        className="text-[10px] font-sans font-semibold text-[#0066FF] hover:underline flex items-center justify-end gap-1"
                      >
                        Edit Bot Flow <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Test Scenario Lab (Verification Engine) */}
        <section id="test-lab" className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-6 shadow-zap-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-[#0066FF]" />
                  Interactive Test Scenario Lab (Verification Engine)
                </h2>
              </div>
              <p className="text-xs text-[#555555]">
                Execute Test Flow 1 (Outbound Bulk Teaser) and Test Flow 2 (Inbound &quot;Show me&quot; 3-button interactive response)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={runTestFlow1}
                disabled={loadingFlow1 || loadingFlow2}
                className="gradient-button text-xs px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loadingFlow1 ? 'Dispatching...' : 'Run Test Flow 1 (Outbound Bulk)'}</span>
              </button>

              <button
                onClick={runTestFlow2}
                disabled={loadingFlow1 || loadingFlow2}
                className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#222222] font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <RotateCw className={cn('w-3.5 h-3.5 text-[#0066FF]', loadingFlow2 && 'animate-spin')} />
                <span>{loadingFlow2 ? 'Triggering...' : 'Run Test Flow 2 (Inbound "Show me")'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1.5">
                  <span className="text-xs font-bold text-[#0066FF] uppercase">Test Flow 1</span>
                  <p className="text-xs text-[#555555] leading-relaxed">
                    Sends template <code className="text-[#222222] font-bold font-mono">teaser_alert</code>: &quot;Something big is coming soon. Are you ready?&quot; with 50ms pacing. Status logs show <strong className="text-emerald-600">&apos;delivered&apos;</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1.5">
                  <span className="text-xs font-bold text-fuchsia-600 uppercase">Test Flow 2</span>
                  <p className="text-xs text-[#555555] leading-relaxed">
                    User replies <code className="text-[#222222] font-bold font-mono">&quot;Show me&quot;</code>. Webhook fires Meta Interactive Message with 3 Quick Reply buttons: <span className="text-[#222222] font-semibold">[Product Specs, Pricing, Talk to Agent]</span>.
                  </p>
                </div>
              </div>

              {/* JSON Live Output Display */}
              <div className="rounded-xl bg-[#0b2947] text-white p-4 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="font-mono text-cyan-300 flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Execution Result
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {testResult ? 'HTTP 200 OK' : 'Ready'}
                  </span>
                </div>

                <pre className="text-[11px] font-mono text-zinc-200 overflow-x-auto max-h-48 p-2 leading-relaxed">
                  {testResult
                    ? JSON.stringify(testResult, null, 2)
                    : `// Click "Run Test Flow 1" or "Run Test Flow 2" above to verify\n{\n  "status": "ready",\n  "testContacts": 3,\n  "rateLimitDelayMs": 50,\n  "metaApiVersion": "v18.0"\n}`}
                </pre>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <span className="text-[11px] uppercase tracking-wider text-[#0066FF] font-bold font-mono">
                  Live Meta Interactive Device Simulation
                </span>
              </div>
              <PhoneMockup
                businessName="Passion Fruit Concierge"
                templateName="teaser_alert"
                bodyText={mockupState.bodyText}
                headerText="Passion Fruit Private Showcase"
                footerText="Official WhatsApp Business"
                showInboundReply={mockupState.showInbound}
                inboundText={mockupState.inboundText}
                onButtonClick={(btn) => alert(`Interactive button "${btn}" tapped!`)}
              />
            </div>
          </div>
        </section>

        {/* 6. Live Message Delivery Ledger Table */}
        <section className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-5 shadow-zap-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
                Live Meta Message Delivery Ledger (messages_log)
              </h3>
              <p className="text-xs text-[#777777]">
                Audited stream of inbound triggers, template broadcasts, and delivery receipts
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {(['all', 'outbound', 'inbound'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 rounded-lg capitalize transition-colors font-medium',
                    activeTab === tab
                      ? 'bg-white text-[#222222] shadow-sm'
                      : 'text-[#777777] hover:text-[#222222]'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs text-[#555555]">
              <thead className="bg-slate-50 text-[10px] uppercase text-[#777777] tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3.5">Recipient / Contact</th>
                  <th className="p-3.5">Direction</th>
                  <th className="p-3.5">Message Type</th>
                  <th className="p-3.5">Payload Snippet</th>
                  <th className="p-3.5">Delivery Status</th>
                  <th className="p-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 text-[#222222] font-sans font-semibold">{msg.recipient}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-semibold',
                          msg.direction === 'inbound'
                            ? 'bg-blue-50 text-[#0066FF] border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        )}
                      >
                        {msg.direction}
                      </span>
                    </td>
                    <td className="p-3.5 capitalize font-sans">{msg.type}</td>
                    <td className="p-3.5 text-[#555555] font-sans max-w-xs truncate">{msg.preview}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold',
                          msg.status === 'delivered' || msg.status === 'read'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        )}
                      >
                        <CheckCheck className="w-3 h-3" />
                        {msg.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-[#777777] font-sans">{msg.time}</td>
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
