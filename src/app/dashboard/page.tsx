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
  ExternalLink,
  Plus,
  Inbox,
  Mail,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { getMetaCredentials } from '@/lib/meta';
import { clearClientAuthCookies } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { UserRecord } from '@/lib/db/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [showSignoutMenu, setShowSignoutMenu] = useState(false);
  const [messagesSent, setMessagesSent] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState('0.0%');
  const [activeChats, setActiveChats] = useState(0);
  const [adLeads, setAdLeads] = useState(0);

  // Real dynamic conversation state initialized to empty (zero fake/mock data)
  const [conversations, setConversations] = useState<any[]>([]);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [quickSendLoading, setQuickSendLoading] = useState(false);
  const [quickSendStatus, setQuickSendStatus] = useState<any>(null);

  const [metaConfigured, setMetaConfigured] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [msgRes, setRes, userRes] = await Promise.all([
          fetch('/api/messages'),
          fetch('/api/settings'),
          fetch('/api/auth/me'),
        ]);

        if (userRes.ok) {
          const uData = await userRes.json();
          if (uData.authenticated && uData.user) {
            setCurrentUser(uData.user);
          }
        }

        if (msgRes.ok) {
          const data = await msgRes.json();
          if (data.stats) {
            setMessagesSent(data.stats.messagesSent || 0);
            setDeliveryRate(data.stats.deliveryRate || '0.0%');
            setActiveChats(data.stats.activeChatsCount || 0);
          }
          if (data.conversations && data.conversations.length > 0) {
            const mapped = data.conversations.map((c: any) => ({
              id: c.phoneNumber,
              recipient: c.contactName || c.phoneNumber,
              preview: c.lastMessage,
              status: c.status,
              time: new Date(c.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));
            setConversations(mapped);
          }
        }

        if (setRes.ok) {
          const settings = await setRes.json();
          if (settings.phoneNumberId && settings.accessToken && !settings.accessToken.includes('SAMPLE_TOKEN')) {
            setMetaConfigured(true);
          }
        }
      } catch (e) {
        console.warn('Dashboard fetch error:', e);
      }
    };

    loadDashboardData();
  }, []);

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim() || !customMessage.trim()) return;

    setQuickSendLoading(true);
    setQuickSendStatus(null);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: customPhone.trim(),
          type: 'text',
          content: { text: customMessage.trim() },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessagesSent((prev) => prev + 1);
        setConversations((prev) => [
          {
            id: data.messageId || `msg_${Date.now()}`,
            recipient: customPhone,
            preview: customMessage,
            status: 'sent',
            time: 'Just now',
          },
          ...prev,
        ]);
        setQuickSendStatus({ success: true, message: `Message dispatched to ${customPhone}` });
        setCustomPhone('');
        setCustomMessage('');
      } else {
        setQuickSendStatus({
          success: false,
          message: data.error || 'Meta API returned an error. Verify credentials in Settings.',
        });
      }
    } catch (err: any) {
      setQuickSendStatus({
        success: false,
        message: err.message || 'Failed to connect to messaging endpoint.',
      });
    } finally {
      setQuickSendLoading(false);
      setTimeout(() => setQuickSendStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pl-60 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Overview"
        subtitle="Live WhatsApp Business performance and messaging activity"
      />

      <main className="p-8 space-y-8 flex-1 max-w-7xl mx-auto w-full">
        {/* User Identity & Connection Status Quick Card */}
        {(() => {
          const userName = currentUser?.name || 'Workspace Member';
          const userEmail = currentUser?.email || 'user@passionfruit.io';
          const userAvatar =
            currentUser?.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7C3AED&color=ffffff&bold=true&rounded=true&size=128`;
          const userInitial = (userName[0] || 'U').toUpperCase();

          const handleSignOut = () => {
            clearClientAuthCookies();
            router.push('/auth/login');
            router.refresh();
          };

          return (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white border border-[#E2E8F0] p-6 sm:p-7 rounded-3xl shadow-sm relative">
              <div className="flex items-center gap-4">
                {/* User Profile Picture Avatar */}
                <div className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSignoutMenu((prev) => !prev)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white ring-2 ring-purple-500/20 cursor-pointer hover:ring-purple-500/40 transition-all"
                    title="Click profile avatar for account & sign out options"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </button>
                  {/* Active Online Indicator */}
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs"
                    title="Online Session Active"
                  />
                </div>

                <div className="space-y-1.5 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0D0F2D] tracking-tight">
                      Welcome back, {userName}
                    </h2>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                        metaConfigured
                          ? 'bg-emerald-50 text-[#22C55E] border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          metaConfigured ? 'bg-[#22C55E] animate-pulse' : 'bg-amber-500'
                        )}
                      />
                      {metaConfigured ? 'Meta API Connected' : 'Setup Required'}
                    </span>
                  </div>

                  {/* User Email & Role Details */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100/90 border border-slate-200 px-2.5 py-0.5 rounded-lg text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {userEmail}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-[#7C3AED] font-bold text-[10px] uppercase tracking-wider border border-purple-200/60">
                      {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Workspace Member'}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      • Cloud API v18.0 Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                {/* Profile & Sign Out Dropdown on Dashboard */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSignoutMenu((prev) => !prev)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs',
                      showSignoutMenu
                        ? 'bg-purple-50 text-[#7C3AED] border-purple-300 ring-2 ring-purple-500/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    )}
                    title="Account Profile & Sign Out"
                  >
                    <div className="w-5 h-5 rounded-lg overflow-hidden bg-[#7C3AED] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {userAvatar ? (
                        <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <span>Profile &amp; Sign Out</span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-150',
                        showSignoutMenu && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* Dashboard Profile Dropdown Menu */}
                  {showSignoutMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 space-y-3 z-30 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
                          {userAvatar ? (
                            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{userInitial}</span>
                          )}
                        </div>
                        <div className="overflow-hidden space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{userEmail}</p>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-[#7C3AED] text-[9px] font-bold uppercase">
                            {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Workspace Member'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-700 font-medium pt-1">
                        {currentUser?.role === 'super_admin' && (
                          <Link
                            href="/super-admin-control"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#7C3AED] transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                            <span className="font-bold">Super Admin Control</span>
                          </Link>
                        )}
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Workspace Settings</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out of Passion Fruit</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/setup"
                  className="px-3.5 py-2 rounded-xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] text-xs font-bold text-[#0D0F2D] hover:text-[#7C3AED] transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                  <span className="hidden sm:inline">Setup Guide</span>
                </Link>

                <Link
                  href="/campaigns"
                  className="gradient-button text-xs px-4 py-2 rounded-xl font-bold shadow-2xs flex items-center gap-1.5 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>New Broadcast</span>
                </Link>
              </div>
            </div>
          );
        })()}

        {/* 4 Core Performance Metrics (Real Dynamic State) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Messages Sent"
            value={messagesSent}
            trend="+0.0%"
            subtitle="Total outbound"
            icon={Send}
            accent="purple"
          />
          <StatCard
            title="Delivery Rate"
            value={deliveryRate}
            trend="0.0%"
            subtitle="Confirmed receipts"
            icon={CheckCheck}
            accent="emerald"
          />
          <StatCard
            title="Active Chats"
            value={activeChats}
            trend="0"
            subtitle="Inbound conversations"
            icon={Eye}
            accent="purple"
          />
          <StatCard
            title="Ad Leads"
            value={adLeads}
            trend="0"
            subtitle="Meta CTWA conversions"
            icon={Megaphone}
            accent="purple"
          />
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Live Messages with Production Empty State */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0D0F2D]">
                  Customer Conversations
                </h3>
                <p className="text-xs text-[#64748B]">
                  Live feed of inbound and outbound customer WhatsApp interactions
                </p>
              </div>

              <Link
                href="/contacts"
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
              >
                <span>Manage Contacts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Empty State vs Real Conversations */}
            {conversations.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-[#0D0F2D]">
                    No conversations found
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Connect your Meta WhatsApp API in Settings or send your first broadcast to start customer chats.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/settings"
                    className="px-4 py-2 rounded-xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] text-xs font-bold text-[#0D0F2D] hover:text-[#7C3AED] transition-all"
                  >
                    Configure API Credentials
                  </Link>
                  <Link
                    href="/campaigns"
                    className="gradient-button text-xs px-4 py-2 rounded-xl font-bold text-white shadow-pf-btn"
                  >
                    Create Broadcast
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {conversations.map((msg) => (
                  <div
                    key={msg.id}
                    className="py-3 flex items-start justify-between gap-4 hover:bg-[#F4F6FB]/70 p-2 rounded-2xl transition-colors"
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="font-bold text-xs text-[#0D0F2D] truncate block">
                        {msg.recipient}
                      </span>
                      <p className="text-xs text-[#64748B] truncate font-medium">
                        {msg.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 text-[11px] text-[#94A3B8]">
                      <span>{msg.time}</span>
                      <span className="text-[#22C55E] font-bold">✓ Sent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Quick Sender & Shortcuts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Send Message Card */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#7C3AED]" />
                  <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider">
                    Quick WhatsApp Sender
                  </h3>
                </div>
                <span className="text-[10px] text-[#7C3AED] font-bold uppercase bg-purple-50 px-2 py-0.5 rounded-full border border-[#C4B5FD]">
                  Meta v18.0
                </span>
              </div>

              <form onSubmit={handleQuickSend} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D0F2D]">
                    Recipient Mobile Number (with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+14155552671 or +919876543210"
                      className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D0F2D]">
                    Message Text
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your message..."
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0D0F2D] focus:outline-none focus:border-[#7C3AED] focus:bg-white leading-relaxed transition-all"
                  />
                </div>

                {quickSendStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      quickSendStatus.success
                        ? 'bg-emerald-50 border border-emerald-200 text-[#22C55E]'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{quickSendStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={quickSendLoading}
                  className="w-full gradient-button py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{quickSendLoading ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                Workspace Tools
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Link
                  href="/campaigns"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <Send className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Broadcasts</p>
                  <p className="text-[11px] text-[#64748B]">Template messaging</p>
                </Link>

                <Link
                  href="/contacts"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <Users className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Contacts CRM</p>
                  <p className="text-[11px] text-[#64748B]">Directory & tags</p>
                </Link>

                <Link
                  href="/automations"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <Bot className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Flows</p>
                  <p className="text-[11px] text-[#64748B]">Chatbot logic</p>
                </Link>

                <Link
                  href="/settings"
                  className="p-3.5 rounded-2xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] transition-all space-y-1 group"
                >
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-[#0D0F2D]">Settings</p>
                  <p className="text-[11px] text-[#64748B]">API credentials</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
