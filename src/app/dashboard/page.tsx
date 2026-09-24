'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Zap,
  Send,
  Users,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Plus,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // 1. Connection Health State
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'needs_attention'>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [qualityRating, setQualityRating] = useState('GREEN');

  // 2. Meaningful Metrics State (Strictly real data, zero dummy data)
  const [todayMessagesCount, setTodayMessagesCount] = useState(0);
  const [totalContactsCount, setTotalContactsCount] = useState(0);
  const [activeAutomationCount, setActiveAutomationCount] = useState(0);

  // 3. Broadcast Performance State
  const [latestBroadcast, setLatestBroadcast] = useState<{
    name: string;
    status: string;
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  } | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [connRes, autoRes, contactsRes, campRes, msgRes] = await Promise.all([
        fetch('/api/meta/connection').catch(() => null),
        fetch('/api/automations').catch(() => null),
        fetch('/api/contacts').catch(() => null),
        fetch('/api/campaigns/dispatch').catch(() => null),
        fetch('/api/messages').catch(() => null),
      ]);

      // 1. Connection
      if (connRes?.ok) {
        const connData = await connRes.json();
        if (connData.connectionStatus === 'connected') {
          setConnectionStatus('connected');
          setPhoneNumber(connData.phoneNumberHealth?.displayPhoneNumber || connData.credentials?.phoneNumberId || '');
          setBusinessName(connData.phoneNumberHealth?.verifiedName || 'WhatsApp Business');
          if (connData.phoneNumberHealth?.qualityRating) {
            setQualityRating(connData.phoneNumberHealth.qualityRating);
          }
        } else if (connData.connectionStatus === 'error') {
          setConnectionStatus('needs_attention');
        } else {
          setConnectionStatus('disconnected');
        }
      }

      // 2. Automations
      if (autoRes?.ok) {
        const autoData = await autoRes.json();
        if (Array.isArray(autoData)) {
          const active = autoData.filter((a: any) => a.isActive !== false);
          setActiveAutomationCount(active.length);
        }
      }

      // 3. Contacts
      if (contactsRes?.ok) {
        const contactsData = await contactsRes.json();
        if (Array.isArray(contactsData)) {
          setTotalContactsCount(contactsData.length);
        }
      }

      // 4. Messages Today
      if (msgRes?.ok) {
        const msgData = await msgRes.json();
        if (Array.isArray(msgData?.messages)) {
          const todayStr = new Date().toDateString();
          const todayMsgs = msgData.messages.filter((m: any) => {
            if (!m.createdAt) return false;
            return new Date(m.createdAt).toDateString() === todayStr;
          });
          setTodayMessagesCount(todayMsgs.length);
        }
      }

      // 5. Latest Broadcast
      if (campRes?.ok) {
        const campData = await campRes.json();
        if (Array.isArray(campData) && campData.length > 0) {
          const latest = campData[0];
          setLatestBroadcast({
            name: latest.name || latest.campaign_name || 'Broadcast',
            status: latest.status || 'completed',
            total: latest.total_recipients || latest.totalRecipients || 0,
            sent: latest.sent_count || latest.sentCount || 0,
            delivered: latest.delivered_count || latest.deliveredCount || 0,
            read: latest.read_count || latest.readCount || 0,
            failed: latest.failed_count || latest.failedCount || 0,
          });
        }
      }
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen bg-slate-50 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Dashboard"
        subtitle="Overview of your WhatsApp business communications and automation performance"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-24 md:pb-12">
        {/* Connection Health Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold',
                  connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                )}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {connectionStatus === 'connected' ? (businessName || 'WhatsApp Connected') : 'WhatsApp Not Connected'}
                  </h3>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                      connectionStatus === 'connected' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      connectionStatus === 'needs_attention' && 'bg-amber-50 text-amber-800 border-amber-200',
                      connectionStatus === 'disconnected' && 'bg-slate-100 text-slate-600 border-slate-200'
                    )}
                  >
                    {connectionStatus === 'connected' ? 'Active' : connectionStatus === 'needs_attention' ? 'Attention Needed' : 'Disconnected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {phoneNumber ? phoneNumber : 'Connect your official number to start messaging customers'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadDashboardData}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-slate-700')} />
                <span>Refresh</span>
              </button>
              <Link
                href="/setup"
                className={cn(
                  'text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5',
                  connectionStatus === 'connected'
                    ? 'border border-slate-200 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                <span>{connectionStatus === 'connected' ? 'Manage Connection' : 'Connect WhatsApp'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Start Experience: 4 Primary Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900">What would you like to do?</h3>
            <p className="text-xs text-slate-500">
              One-click access to core WhatsApp operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Card 1: Create Automation */}
            <Link
              href="/automations"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-900 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3 bg-slate-50/50"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Create Automation
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Automate welcome replies, follow-ups, and lead qualifications.
                </p>
              </div>
              <div className="flex items-center text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">
                <span>Configure Workflow</span>
                <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card 2: Send Broadcast */}
            <Link
              href="/campaigns"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-900 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3 bg-slate-50/50"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Send Broadcast
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Broadcast messages to segmented audiences and track delivery.
                </p>
              </div>
              <div className="flex items-center text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">
                <span>New Broadcast</span>
                <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card 3: Manage Leads */}
            <Link
              href="/leads"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-900 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3 bg-slate-50/50"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Manage Leads
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kanban pipeline for tracking buyer qualification and deals.
                </p>
              </div>
              <div className="flex items-center text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">
                <span>View Pipeline</span>
                <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card 4: Open Inbox */}
            <Link
              href="/inbox"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-900 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3 bg-slate-50/50"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Open Inbox
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Real-time multi-agent customer conversations and internal notes.
                </p>
              </div>
              <div className="flex items-center text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">
                <span>Open Live Inbox</span>
                <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Meaningful Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Metric 1: Messages Sent Today */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Messages Today</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Real-time
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 font-mono">{todayMessagesCount}</p>
              <p className="text-xs text-slate-500 mt-1">Inbound and outbound messages processed today</p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link href="/inbox" className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between">
                <span>View conversation log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Metric 2: Total Contacts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Contacts</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Directory
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 font-mono">{totalContactsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Saved phone contacts ready for messaging</p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link href="/contacts" className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between">
                <span>Manage contacts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Metric 3: Active Automations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Automations</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                24/7 Engine
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 font-mono">{activeAutomationCount}</p>
              <p className="text-xs text-slate-500 mt-1">Live workflows responding to customer keywords</p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link href="/automations" className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between">
                <span>Manage workflows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Broadcast Performance Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">Broadcast Performance</h3>
              <p className="text-xs text-slate-500">Delivery statistics for your latest announcement or campaign.</p>
            </div>
            <Link
              href="/campaigns"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All Campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {latestBroadcast ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-800">{latestBroadcast.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {latestBroadcast.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sent</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                    {latestBroadcast.sent}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Delivered</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                    {latestBroadcast.delivered}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Read</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                    {latestBroadcast.read}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Failed</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                    {latestBroadcast.failed}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
              <Send className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No broadcast campaigns sent yet</p>
              <p className="text-[11px] text-slate-400">Launch a broadcast to communicate with your customers at scale</p>
              <div className="pt-1">
                <Link
                  href="/campaigns"
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Broadcast</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
