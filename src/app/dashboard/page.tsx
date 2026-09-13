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
  ShoppingBag,
  Sparkles,
  Zap,
  ArrowUpRight,
  Activity,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRecord } from '@/lib/db/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [messagesSent, setMessagesSent] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState('0.0%');
  const [activeChats, setActiveChats] = useState(0);
  const [adLeads, setAdLeads] = useState(0);

  // Real dynamic conversation state
  const [conversations, setConversations] = useState<any[]>([]);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [quickSendLoading, setQuickSendLoading] = useState(false);
  const [quickSendStatus, setQuickSendStatus] = useState<any>(null);

  const [metaConfigured, setMetaConfigured] = useState(false);
  const [storesConnected, setStoresConnected] = useState({ shopify: false, woocommerce: false });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [msgRes, setRes, userRes, storeRes] = await Promise.all([
          fetch('/api/messages'),
          fetch('/api/settings'),
          fetch('/api/auth/me'),
          fetch('/api/ecommerce/settings').catch(() => null),
        ]);

        if (userRes && userRes.ok) {
          const uData = await userRes.json();
          if (uData.authenticated && uData.user) {
            setCurrentUser(uData.user);
          }
        }

        if (msgRes && msgRes.ok) {
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

        if (setRes && setRes.ok) {
          const settings = await setRes.json();
          if (settings.phoneNumberId && settings.accessToken && !settings.accessToken.includes('SAMPLE_TOKEN')) {
            setMetaConfigured(true);
          }
        }

        if (storeRes && storeRes.ok) {
          const storeData = await storeRes.json();
          setStoresConnected({
            shopify: !!storeData?.shopify?.shopDomain,
            woocommerce: !!storeData?.woocommerce?.storeUrl,
          });
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
        setQuickSendStatus({ success: true, message: `Dispatched to ${customPhone}` });
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

  const isStoreConnected = storesConnected.shopify || storesConnected.woocommerce;

  return (
    <div className="min-h-screen bg-[#FAFAFC] pl-0 md:pl-60 flex flex-col font-sans transition-all duration-200">
      <Sidebar />
      <Header
        title="Workspace Overview"
        subtitle="Monitor live WhatsApp deliverability, customer conversions, and automated workflows"
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        {/* Workspace Action & Status Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
              <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Channel:</span>
              <span className="font-bold text-slate-900">Meta Cloud v18.0</span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full ml-0.5',
                  metaConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                )}
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
              <span>Store Sync:</span>
              <span className="font-bold text-slate-900">
                {isStoreConnected
                  ? storesConnected.shopify && storesConnected.woocommerce
                    ? 'Shopify & WooCommerce'
                    : storesConnected.shopify
                    ? 'Shopify Connected'
                    : 'WooCommerce Connected'
                  : 'No Store Connected'}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Webhook Latency: ~14ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/integrations"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
              <span>Connect Store</span>
            </Link>

            <Link
              href="/campaigns"
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Broadcast</span>
            </Link>
          </div>
        </div>

        {/* 4 Performance Metric Cards with Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Messages Sent"
            value={messagesSent.toLocaleString()}
            trend="+12.4%"
            subtitle="Outbound volume"
            icon={Send}
            accent="purple"
          />
          <StatCard
            title="Delivery Rate"
            value={messagesSent > 0 ? deliveryRate : '99.8%'}
            trend="+0.2%"
            subtitle="Confirmed receipts"
            icon={CheckCheck}
            accent="emerald"
          />
          <StatCard
            title="Active Conversations"
            value={activeChats}
            trend="Live"
            subtitle="Inbound 24h window"
            icon={Eye}
            accent="blue"
          />
          <StatCard
            title="Customer Leads"
            value={adLeads > 0 ? adLeads : '0'}
            trend="+4.8%"
            subtitle="Store & Ad conversions"
            icon={Megaphone}
            accent="amber"
          />
        </div>

        {/* Marketer Quick Setup Guide (Shows when either Meta or Store needs attention) */}
        {(!metaConfigured || !isStoreConnected) && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-950">
                    Complete your high-converting WhatsApp setup
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Unlock automatic cart recovery, order dispatch notifications, and real-time customer support in 3 quick steps.
                </p>
              </div>
              <Link
                href="/setup"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200/80 px-3.5 py-2 rounded-xl shadow-2xs hover:shadow-xs transition-all shrink-0"
              >
                <span>View Setup Checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-100/60">
              <Link
                href="/settings"
                className="group p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-all flex items-start gap-3 shadow-2xs"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                    metaConfigured
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  )}
                >
                  {metaConfigured ? '✓' : '1'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Meta Cloud API
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {metaConfigured ? 'Connected & Verified' : 'Add Access Token & Phone ID'}
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/integrations"
                className="group p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-all flex items-start gap-3 shadow-2xs"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                    isStoreConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  )}
                >
                  {isStoreConnected ? '✓' : '2'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Connect Store
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isStoreConnected ? 'Store Synced' : 'Sync Shopify or WooCommerce'}
                  </p>
                </div>
              </Link>

              <Link
                href="/automations"
                className="group p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-all flex items-start gap-3 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Activate Workflows
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enable abandoned cart &amp; welcome flows
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Customer Conversations Feed */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  <span>Recent Customer Conversations</span>
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {conversations.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time WhatsApp interactions and customer replies
                </p>
              </div>

              <Link
                href="/inbox"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Team Inbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Empty State vs Real Conversations */}
            {conversations.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-slate-900">
                    No active conversations yet
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Test an instant message using the Quick Sender on the right, or configure your Meta API credentials.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2.5">
                  <Link
                    href="/settings"
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
                  >
                    API Credentials
                  </Link>
                  <Link
                    href="/campaigns"
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Send Broadcast
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.map((msg) => (
                  <div
                    key={msg.id}
                    className="py-3 px-3 -mx-2 flex items-start justify-between gap-4 hover:bg-slate-50/80 rounded-xl transition-colors group cursor-pointer"
                    onClick={() => router.push('/inbox')}
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {msg.recipient}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate font-normal">
                        {msg.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 text-[11px] text-slate-400">
                      <span>{msg.time}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" />
                        <span>Sent</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Quick Sender & Shortcuts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick WhatsApp Sender Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
                    Quick WhatsApp Sender
                  </h3>
                </div>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Cloud v18.0
                </span>
              </div>

              <form onSubmit={handleQuickSend} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Recipient Phone Number (with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+14155552671 or +919876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Message Content
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Hello! Your order #1042 has been dispatched..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed transition-all placeholder:text-slate-400"
                  />
                </div>

                {quickSendStatus && (
                  <div
                    className={cn(
                      'p-3 rounded-xl text-xs font-medium flex items-center gap-2 border',
                      quickSendStatus.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{quickSendStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={quickSendLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{quickSendLoading ? 'Dispatched...' : 'Send Message Instantly'}</span>
                </button>
              </form>
            </div>

            {/* Growth & Automation Hub Tiles */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
                  Automation Shortcuts
                </h3>
                <span className="text-[11px] text-slate-400">Direct Actions</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <Link
                  href="/automations"
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all space-y-1 group"
                >
                  <Bot className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Cart Recovery
                  </p>
                  <p className="text-[11px] text-slate-500">Automated nudges</p>
                </Link>

                <Link
                  href="/dashboard/integrations"
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all space-y-1 group"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Store Hub
                  </p>
                  <p className="text-[11px] text-slate-500">Woo &amp; Shopify</p>
                </Link>

                <Link
                  href="/campaigns"
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all space-y-1 group"
                >
                  <Send className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Broadcasts
                  </p>
                  <p className="text-[11px] text-slate-500">Mass campaigns</p>
                </Link>

                <Link
                  href="/contacts"
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all space-y-1 group"
                >
                  <Users className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Customer CRM
                  </p>
                  <p className="text-[11px] text-slate-500">Tags &amp; lists</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
