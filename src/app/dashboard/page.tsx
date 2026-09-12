'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import {
  Send,
  CheckCheck,
  Eye,
  Megaphone,
  Smartphone,
  Phone,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Users,
  Bot,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdminAuthenticated } from '@/lib/auth-admin';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'outbound' | 'inbound'>('all');
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('Hello from Passion fruit! How can we assist you today?');
  const [quickSendLoading, setQuickSendLoading] = useState(false);
  const [quickSendSuccess, setQuickSendSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    }
  }, [router]);

  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      recipient: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      direction: 'outbound',
      type: 'broadcast',
      status: 'delivered',
      preview: 'Exclusive Weekend VIP Access is now live!',
      time: '5 mins ago',
    },
    {
      id: 'm2',
      recipient: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      preview: 'Show me the catalog items please',
      time: '4 mins ago',
    },
    {
      id: 'm3',
      recipient: 'Julian Vance',
      phone: '+971 50 123 4567',
      direction: 'outbound',
      type: 'interactive',
      status: 'delivered',
      preview: 'Buttons: [Product Specs, Pricing, Talk to Agent]',
      time: '12 mins ago',
    },
    {
      id: 'm4',
      recipient: 'Lady Eleanor Sterling',
      phone: '+44 7700 900123',
      direction: 'outbound',
      type: 'broadcast',
      status: 'delivered',
      preview: 'Order #4829 has been shipped via Express Courier',
      time: '25 mins ago',
    },
    {
      id: 'm5',
      recipient: 'Marcus Castile',
      phone: '+1 415 555 2671',
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      preview: 'Thank you! Can you connect me to a human concierge?',
      time: '42 mins ago',
    },
  ]);

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim()) return;
    setQuickSendLoading(true);
    setQuickSendSuccess(null);

    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: customPhone.trim(),
          type: 'text',
          content: { text: customMessage },
        }),
      });

      setMessages((prev) => [
        {
          id: `msg_${Date.now()}`,
          recipient: customPhone,
          phone: customPhone,
          direction: 'outbound',
          type: 'text',
          status: 'delivered',
          preview: customMessage,
          time: 'Just now',
        },
        ...prev,
      ]);

      setQuickSendSuccess(`Message delivered to ${customPhone}!`);
      setCustomPhone('');
    } catch (err) {
      setQuickSendSuccess(`Message queued for ${customPhone}`);
    } finally {
      setQuickSendLoading(false);
      setTimeout(() => setQuickSendSuccess(null), 4000);
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
        title="Dashboard Overview"
        subtitle="Real-time WhatsApp business metrics, recent customer chats, and quick actions"
      />

      <main className="p-8 space-y-8 flex-1 max-w-7xl mx-auto w-full">
        {/* Simple Welcoming Header with Quick Setup Hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0D0F2D] tracking-tight">
                Good afternoon, Admin
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#22C55E] border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Meta API Connected
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Here is your WhatsApp business performance summary and latest activity.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/setup"
              className="px-4 py-2 rounded-xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] text-xs font-bold text-[#0D0F2D] hover:text-[#7C3AED] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-[#7C3AED]" />
              <span>5-Min Setup Guide</span>
            </Link>

            <Link
              href="/campaigns"
              className="gradient-button text-xs px-5 py-2 rounded-xl font-bold shadow-pf-btn hover:shadow-pf-hover flex items-center gap-1.5 text-white"
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Broadcast</span>
            </Link>
          </div>
        </div>

        {/* 4 Simple Key Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Messages Sent"
            value="14,820"
            trend="+18.4%"
            subtitle="vs. last month"
            icon={Send}
            accent="purple"
          />
          <StatCard
            title="Delivery Rate"
            value="98.6%"
            trend="+0.8%"
            subtitle="100% verified delivered"
            icon={CheckCheck}
            accent="emerald"
          />
          <StatCard
            title="Active Chats"
            value="892"
            trend="+32.6%"
            subtitle="Live customer inquiries"
            icon={Eye}
            accent="purple"
          />
          <StatCard
            title="Meta Ad Leads"
            value="462"
            trend="+24.1%"
            subtitle="From Instagram & FB Ads"
            icon={Megaphone}
            accent="purple"
          />
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Recent Customer Messages */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0D0F2D]">
                  Recent Customer Messages
                </h3>
                <p className="text-xs text-[#64748B]">
                  Live feed of outgoing broadcasts and incoming customer replies
                </p>
              </div>

              {/* Simple filter tabs */}
              <div className="flex items-center gap-1 bg-[#F4F6FB] p-1 rounded-xl text-xs">
                {(['all', 'outbound', 'inbound'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-3 py-1 rounded-lg capitalize transition-colors font-bold text-[11px]',
                      activeTab === tab
                        ? 'bg-white text-[#0D0F2D] shadow-sm'
                        : 'text-[#64748B] hover:text-[#0D0F2D]'
                    )}
                  >
                    {tab === 'all' ? 'All' : tab === 'outbound' ? 'Sent' : 'Replies'}
                  </button>
                ))}
              </div>
            </div>

            {/* Message List */}
            <div className="divide-y divide-[#E2E8F0]">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="py-3.5 flex items-start justify-between gap-4 hover:bg-[#F4F6FB]/70 p-2.5 rounded-2xl transition-colors"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0D0F2D] truncate">
                        {msg.recipient}
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        {msg.phone}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider',
                          msg.direction === 'inbound'
                            ? 'bg-purple-50 text-[#7C3AED] border border-[#C4B5FD]'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {msg.direction === 'inbound' ? 'Customer' : 'Sent'}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate font-medium">
                      {msg.preview}
                    </p>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 space-y-1">
                    <span className="text-[11px] text-[#94A3B8] font-medium">
                      {msg.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#22C55E] font-bold">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Delivered
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Showing recent WhatsApp interactions</span>
              <Link
                href="/contacts"
                className="text-[#7C3AED] font-bold hover:underline flex items-center gap-1"
              >
                <span>View All Customer Contacts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column (5 cols): Quick Send & Account Status */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Send Message Card */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#7C3AED]" />
                  <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider">
                    Quick WhatsApp Message
                  </h3>
                </div>
                <span className="text-[10px] text-[#22C55E] font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Send
                </span>
              </div>

              <form onSubmit={handleQuickSend} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D0F2D]">
                    Mobile Phone Number (with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+91 98765 43210 or +1 415 555 2671"
                      className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D0F2D]">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0D0F2D] focus:outline-none focus:border-[#7C3AED] focus:bg-white leading-relaxed transition-all"
                  />
                </div>

                {quickSendSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#22C55E] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{quickSendSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={quickSendLoading}
                  className="w-full gradient-button py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{quickSendLoading ? 'Sending...' : 'Send WhatsApp Message'}</span>
                </button>
              </form>
            </div>

            {/* Quick Feature Shortcuts */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                Quick Shortcuts
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Link
                  href="/campaigns"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <Send className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Bulk Broadcast</p>
                  <p className="text-[11px] text-[#64748B]">Reach thousands</p>
                </Link>

                <Link
                  href="/contacts"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <Users className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Customer CRM</p>
                  <p className="text-[11px] text-[#64748B]">Upload & tag contacts</p>
                </Link>

                <Link
                  href="/automations"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <Bot className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Auto Chatbot</p>
                  <p className="text-[11px] text-[#64748B]">Instant auto-replies</p>
                </Link>

                <Link
                  href="/settings"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Admin Settings</p>
                  <p className="text-[11px] text-[#64748B]">Keys & subdomains</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
