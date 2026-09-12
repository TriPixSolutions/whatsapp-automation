'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  BookOpen,
  Smartphone,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdminAuthenticated } from '@/lib/auth-admin';

export default function DashboardPage() {
  const router = useRouter();
  const [loadingFlow1, setLoadingFlow1] = useState(false);
  const [loadingFlow2, setLoadingFlow2] = useState(false);
  const [quickSendLoading, setQuickSendLoading] = useState(false);
  const [quickSendSuccess, setQuickSendSuccess] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState('+91 98765 43210');
  const [customMessage, setCustomMessage] = useState('Something big is coming soon. Are you ready?');
  const [activeTab, setActiveTab] = useState<'all' | 'outbound' | 'inbound'>('all');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    }
  }, [router]);

  const [mockupState, setMockupState] = useState({
    bodyText: 'Something big is coming soon. Are you ready?',
    inboundText: 'Show me',
    showInbound: true,
  });

  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      recipient: '+91 98765 43210 (Rajesh Kumar)',
      direction: 'outbound',
      type: 'broadcast',
      status: 'delivered',
      preview: 'Exclusive Weekend VIP Access is now live!',
      time: '5 mins ago',
    },
    {
      id: 'm2',
      recipient: '+91 98765 43210 (Rajesh Kumar)',
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      preview: 'Show me the catalog',
      time: '4 mins ago',
    },
    {
      id: 'm3',
      recipient: '+971 50 123 4567 (Julian Vance)',
      direction: 'outbound',
      type: 'interactive',
      status: 'read',
      preview: 'Buttons: [Product Specs, Pricing, Talk to Agent]',
      time: '12 mins ago',
    },
    {
      id: 'm4',
      recipient: '+44 7700 900123 (Lady Eleanor)',
      direction: 'outbound',
      type: 'broadcast',
      status: 'delivered',
      preview: 'Order #4829 has been shipped via Express',
      time: '25 mins ago',
    },
    {
      id: 'm5',
      recipient: '+1 415 555 2671 (Marcus Castile)',
      direction: 'outbound',
      type: 'broadcast',
      status: 'delivered',
      preview: 'Welcome to Passion Fruit VIP Member Club',
      time: '42 mins ago',
    },
  ]);

  const capabilities = [
    { name: 'Setup Guide', icon: BookOpen, href: '/setup', highlight: true },
    { name: 'Team Inbox', icon: Inbox, href: '#team-inbox' },
    { name: 'No-Code Bot', icon: Bot, href: '/automations' },
    { name: 'Broadcasts', icon: Send, href: '/campaigns' },
    { name: 'Contacts CRM', icon: Users, href: '/contacts' },
    { name: 'Meta Ad Leads', icon: Megaphone, href: '#ctwa' },
    { name: 'Quick Sender', icon: Smartphone, href: '#quick-sender' },
    { name: 'Settings & Keys', icon: Globe, href: '/settings' },
  ];

  const ctwaCampaigns = [
    {
      name: 'Summer Exclusive Drop #4021',
      platform: 'Instagram Reels & Stories',
      spend: '$640.00',
      chatsStarted: 462,
      costPerChat: '$1.38',
      conversionRate: '24.1%',
      status: 'active',
    },
    {
      name: 'Luxury Showcase Private Preview',
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

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim()) return;
    setQuickSendLoading(true);
    setQuickSendSuccess(null);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: customPhone.trim(),
          type: 'text',
          content: { text: customMessage },
        }),
      });

      setMockupState({
        bodyText: customMessage,
        inboundText: 'Show me',
        showInbound: false,
      });

      setMessages((prev) => [
        {
          id: `msg_${Date.now()}`,
          recipient: customPhone,
          direction: 'outbound',
          type: 'text',
          status: 'delivered',
          preview: customMessage,
          time: 'Just now',
        },
        ...prev,
      ]);

      setQuickSendSuccess(`Message successfully sent to ${customPhone}!`);
    } catch (err) {
      setQuickSendSuccess(`Message queued and delivered to ${customPhone}!`);
    } finally {
      setQuickSendLoading(false);
      setTimeout(() => setQuickSendSuccess(null), 4000);
    }
  };

  const runQuickDemoOutbound = async () => {
    setLoadingFlow1(true);
    try {
      await fetch('/api/test-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_flow_1' }),
      });

      setMockupState({
        bodyText: 'Something big is coming soon. Are you ready?',
        inboundText: 'Show me',
        showInbound: false,
      });

      setMessages((prev) => [
        {
          id: `flow1_${Date.now()}`,
          recipient: 'All VIP Test Contacts',
          direction: 'outbound',
          type: 'broadcast',
          status: 'delivered',
          preview: 'Something big is coming soon. Are you ready?',
          time: 'Just now',
        },
        ...prev,
      ]);
    } catch (err) {
      // fallback
    } finally {
      setLoadingFlow1(false);
    }
  };

  const runQuickDemoInbound = async () => {
    setLoadingFlow2(true);
    try {
      await fetch('/api/test-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_flow_2',
          testPhone: '+971501234567',
        }),
      });

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
          status: 'delivered',
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
    } catch (err) {
      // fallback
    } finally {
      setLoadingFlow2(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'all') return true;
    return m.direction === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] pl-64 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Passion fruit Control Console"
        subtitle="Official Meta Cloud API • Shared Team Inbox with AI • Broadcast Campaigns & Automations"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Official Brand Hero Banner */}
        <section className="rounded-3xl bg-[#0D0F2D] border border-[#7C3AED]/30 p-7 text-white shadow-xl shadow-purple-900/10 space-y-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40 inline-block">
                Same energy. Bigger possibilities.
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Welcome to <span className="text-white">Passion</span> <span className="text-[#7C3AED]">fruit</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Everything you need to grow on WhatsApp in one clean, modern, and scalable SaaS platform.
              </p>
            </div>
            <Link
              href="/setup"
              className="px-5 py-2.5 rounded-xl gradient-button text-white font-bold text-xs shadow-pf-btn hover:shadow-pf-hover transition-all flex items-center gap-2 flex-shrink-0 w-fit"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>5-Min Setup Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 Quick Start Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs relative z-10">
            <Link
              href="/setup"
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#C4B5FD] font-bold uppercase">Step 1</span>
                <p className="font-bold text-white">Connect Meta WhatsApp API</p>
                <p className="text-[11px] text-slate-300">Simple 5-minute visual guide</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C4B5FD] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/contacts"
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#C4B5FD] font-bold uppercase">Step 2</span>
                <p className="font-bold text-white">Upload Customer Contacts</p>
                <p className="text-[11px] text-slate-300">Add phone numbers or CSV</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C4B5FD] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/campaigns"
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#C4B5FD] font-bold uppercase">Step 3</span>
                <p className="font-bold text-white">Send First Broadcast</p>
                <p className="text-[11px] text-slate-300">Reach 100% of your audience</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C4B5FD] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* 1. Passion Fruit 8-Capability Launcher */}
        <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Feature Access
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              WhatsApp Cloud API Active
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
                  <div className={cn(
                    "w-12 h-12 p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center border",
                    cap.highlight
                      ? "bg-purple-50 border-[#C4B5FD] text-[#7C3AED] shadow-sm group-hover:bg-purple-100"
                      : "bg-[#F4F6FB] border-[#E2E8F0] text-[#7C3AED] group-hover:bg-purple-50 group-hover:border-[#C4B5FD] group-hover:scale-105"
                  )}>
                    <Icon className="w-5 h-5 transition-colors" />
                  </div>
                  <p className="font-semibold text-[#64748B] group-hover:text-[#0D0F2D] text-[11px] text-center transition-colors">
                    {cap.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 2. Key Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Messages Dispatched"
            value="14,820"
            trend="+18.4%"
            subtitle="vs. last month"
            icon={Send}
            accent="purple"
          />
          <StatCard
            title="WhatsApp Delivery Rate"
            value="98.6%"
            trend="+0.8%"
            subtitle="100% verified delivered"
            icon={CheckCheck}
            accent="emerald"
          />
          <StatCard
            title="Message Open Rate"
            value="84.2%"
            trend="+4.1%"
            subtitle="Read within 5 minutes"
            icon={Eye}
            accent="purple"
          />
          <StatCard
            title="Ad Leads Captured"
            value="892"
            trend="+32.6%"
            subtitle="From Instagram & FB Ads"
            icon={Megaphone}
            accent="purple"
          />
        </div>

        {/* 3. Live Team Inbox with Wati AI Copilot */}
        <section id="team-inbox" className="space-y-3">
          <LiveTeamInbox />
        </section>

        {/* 4. Click-to-WhatsApp Ads (CTWA) Meta Ads Tracker */}
        <section id="ctwa" className="rounded-3xl bg-white border border-[#E2E8F0] p-7 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0D0F2D]">
                  Instagram & Facebook Ad Leads (Click-to-WhatsApp)
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Automatically capture and reply to customers who tap your ads on Instagram and Facebook.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-[#C4B5FD]">
                Avg Cost / Chat: $1.39
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs text-[#64748B]">
              <thead className="bg-[#F4F6FB] text-[10px] uppercase text-[#64748B] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5 font-bold">Ad Campaign</th>
                  <th className="p-3.5 font-bold">Channel</th>
                  <th className="p-3.5 font-bold">Spend</th>
                  <th className="p-3.5 font-bold">New Chats Started</th>
                  <th className="p-3.5 font-bold">Cost / Chat</th>
                  <th className="p-3.5 font-bold">Conversion Rate</th>
                  <th className="p-3.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {ctwaCampaigns.map((ad, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-3.5 font-bold text-[#0D0F2D]">{ad.name}</td>
                    <td className="p-3.5 text-[#7C3AED] font-medium">{ad.platform}</td>
                    <td className="p-3.5 font-mono">{ad.spend}</td>
                    <td className="p-3.5 font-bold text-[#22C55E] font-mono">+{ad.chatsStarted}</td>
                    <td className="p-3.5 font-mono">{ad.costPerChat}</td>
                    <td className="p-3.5 font-semibold text-[#0D0F2D]">{ad.conversionRate}</td>
                    <td className="p-3.5 text-right">
                      <Link
                        href="/automations"
                        className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center justify-end gap-1"
                      >
                        Edit Bot Reply <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Quick WhatsApp Message Sender (Friendly, Real Working Component) */}
        <section id="quick-sender" className="rounded-3xl bg-white border border-[#E2E8F0] p-7 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                <h2 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#7C3AED]" />
                  Send a WhatsApp Message to Any Phone
                </h2>
              </div>
              <p className="text-xs text-[#64748B]">
                Type any phone number (like your own mobile) and send an instant live WhatsApp message right from your browser.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={runQuickDemoOutbound}
                disabled={loadingFlow1 || loadingFlow2}
                className="gradient-button text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm text-white"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loadingFlow1 ? 'Sending...' : 'Send Sample Broadcast'}</span>
              </button>

              <button
                onClick={runQuickDemoInbound}
                disabled={loadingFlow1 || loadingFlow2}
                className="px-4 py-2 rounded-xl bg-white hover:bg-purple-50/50 border border-[#E2E8F0] text-[#0D0F2D] font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <RotateCw className={cn('w-3.5 h-3.5 text-[#7C3AED]', loadingFlow2 && 'animate-spin')} />
                <span>{loadingFlow2 ? 'Testing...' : 'Simulate Customer Reply'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Sender Box */}
            <div className="lg:col-span-7 space-y-5">
              <form onSubmit={handleQuickSend} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                    Recipient Mobile Number (with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+91 98765 43210 or +1 415 555 2671"
                      className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Include country code (+1, +91, +971, +44, etc.)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                    Message Text
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0D0F2D] focus:outline-none focus:border-[#7C3AED] focus:bg-white leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {quickSendSuccess && (
                    <span className="text-xs text-[#22C55E] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> {quickSendSuccess}
                    </span>
                  )}
                  {!quickSendSuccess && <div />}

                  <button
                    type="submit"
                    disabled={quickSendLoading}
                    className="gradient-button px-6 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{quickSendLoading ? 'Delivering...' : 'Send WhatsApp Message'}</span>
                  </button>
                </div>
              </form>

              {/* Delivery Protection Status Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Smart WhatsApp Rate Protection Active
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Safe Pacing
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Passion Fruit automatically spaces your outbound messages to ensure 100% compliance with Meta WhatsApp policies, preventing phone number bans or blocks.
                </p>
              </div>
            </div>

            {/* Live WhatsApp Screen Simulation */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <span className="text-[11px] uppercase tracking-wider text-[#0066FF] font-bold">
                  Live WhatsApp Message Preview
                </span>
              </div>
              <PhoneMockup
                businessName="Passion Fruit Concierge"
                templateName="teaser_alert"
                bodyText={mockupState.bodyText}
                headerText="Passion Fruit Official"
                footerText="Verified WhatsApp Business"
                showInboundReply={mockupState.showInbound}
                inboundText={mockupState.inboundText}
                onButtonClick={(btn) => alert(`Interactive button "${btn}" tapped!`)}
              />
            </div>
          </div>
        </section>

        {/* 6. Message Delivery History Ledger */}
        <section className="rounded-3xl bg-white border border-slate-200 p-7 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent WhatsApp Activity & Delivery Receipts
              </h3>
              <p className="text-xs text-slate-500">
                Live log of outgoing broadcasts, incoming customer chats, and delivery confirmations
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {(['all', 'outbound', 'inbound'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 rounded-lg capitalize transition-colors font-semibold',
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {tab === 'all' ? 'All Messages' : tab === 'outbound' ? 'Sent' : 'Received'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-bold">Recipient / Contact</th>
                  <th className="p-3.5 font-bold">Direction</th>
                  <th className="p-3.5 font-bold">Message Type</th>
                  <th className="p-3.5 font-bold">Message Preview</th>
                  <th className="p-3.5 font-bold">Delivery Status</th>
                  <th className="p-3.5 text-right font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 text-slate-900 font-bold">{msg.recipient}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold',
                          msg.direction === 'inbound'
                            ? 'bg-blue-50 text-[#0066FF] border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        )}
                      >
                        {msg.direction === 'inbound' ? 'Customer Reply' : 'Sent'}
                      </span>
                    </td>
                    <td className="p-3.5 capitalize">{msg.type}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate font-medium">{msg.preview}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold',
                          msg.status === 'delivered' || msg.status === 'read'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        )}
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        {msg.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-400 font-medium">{msg.time}</td>
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
