'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Bot,
  Users,
  Flame,
  Send,
  ArrowRight,
  RefreshCw,
  Zap,
  TrendingUp,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // 1. Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'needs_attention'>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');

  // 2. Active Automation State
  const [activeAutomation, setActiveAutomation] = useState<{
    name: string;
    isActive: boolean;
    stepCount: number;
    executionCount: number;
  }>({
    name: 'Meta Lead Follow-Up Sequence',
    isActive: true,
    stepCount: 8,
    executionCount: 0,
  });

  // 3. Today's Leads State
  const [todayLeadsCount, setTodayLeadsCount] = useState(0);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  // 4. Priority Leads State
  const [priorityLeadsCount, setPriorityLeadsCount] = useState(0);

  // 5. Broadcast Status State
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
      const [connRes, autoRes, leadsRes, campRes] = await Promise.all([
        fetch('/api/meta/connection').catch(() => null),
        fetch('/api/automations').catch(() => null),
        fetch('/api/leads').catch(() => null),
        fetch('/api/campaigns/dispatch').catch(() => null),
      ]);

      // 1. Connection
      if (connRes?.ok) {
        const connData = await connRes.json();
        if (connData.connectionStatus === 'connected') {
          setConnectionStatus('connected');
          setPhoneNumber(connData.phoneNumberHealth?.displayPhoneNumber || connData.credentials?.phoneNumberId || '');
          setBusinessName(connData.phoneNumberHealth?.verifiedName || 'WhatsApp Business');
        } else if (connData.connectionStatus === 'error') {
          setConnectionStatus('needs_attention');
        } else {
          setConnectionStatus('disconnected');
        }
      }

      // 2. Automations
      if (autoRes?.ok) {
        const autoData = await autoRes.json();
        if (Array.isArray(autoData) && autoData.length > 0) {
          const first = autoData[0];
          setActiveAutomation({
            name: first.name || 'Meta Lead Follow-Up Sequence',
            isActive: first.isActive ?? true,
            stepCount: first.actionPayload?.blocks?.length || 8,
            executionCount: first.executionCount || 0,
          });
        }
      }

      // 3 & 4. Today's Leads & Priority Leads
      if (leadsRes?.ok) {
        const leadsData = await leadsRes.json();
        const all = leadsData.leads || [];
        setTotalLeadsCount(leadsData.totalCount || all.length);
        setPriorityLeadsCount(leadsData.priorityCount || all.filter((l: any) => l.isPriority).length);

        // Compute today's leads
        const todayStr = new Date().toDateString();
        const todayCount = all.filter((l: any) => {
          if (!l.createdAt) return false;
          return new Date(l.createdAt).toDateString() === todayStr;
        }).length;
        setTodayLeadsCount(todayCount || all.length);
      }

      // 5. Broadcast Status
      if (campRes?.ok) {
        const campData = await campRes.json();
        if (Array.isArray(campData) && campData.length > 0) {
          const latest = campData[0];
          setLatestBroadcast({
            name: latest.name || latest.campaign_name || 'Broadcast Campaign',
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
    <div className="min-h-screen bg-slate-50/60 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Dashboard"
        subtitle="Live overview of your 3 core WhatsApp automation modules"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Quick Refresh Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Real-Time System Overview
          </p>
          <button
            type="button"
            onClick={loadDashboardData}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-emerald-600')} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 5 Core Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* CARD 1: Connection Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border',
                    connectionStatus === 'connected' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    connectionStatus === 'needs_attention' && 'bg-amber-50 text-amber-800 border-amber-200',
                    connectionStatus === 'disconnected' && 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'needs_attention' && 'Needs Attention'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection Status</h3>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {connectionStatus === 'connected' ? (businessName || 'WhatsApp Cloud API') : 'Meta WhatsApp Disconnected'}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {phoneNumber ? phoneNumber : 'Official Meta WABA API'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/setup"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-between group"
              >
                <span>{connectionStatus === 'connected' ? 'View Connection Details' : 'Connect WhatsApp Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* CARD 2: Active Automation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border',
                    activeAutomation.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {activeAutomation.isActive ? 'Active' : 'Paused'}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Automation</h3>
                <p className="text-base font-bold text-slate-900 mt-1 truncate">
                  {activeAutomation.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                  <span>{activeAutomation.stepCount} Sequence Steps</span>
                  <span>•</span>
                  <span>{activeAutomation.executionCount} Executions</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/automations"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center justify-between group"
              >
                <span>Manage Follow-Up Sequence</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* CARD 3: Today's Leads */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  New Inquiries
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Today&apos;s Leads</h3>
                <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
                  {todayLeadsCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total captured leads: <strong className="text-slate-800">{totalLeadsCount}</strong>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/leads"
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center justify-between group"
              >
                <span>View All Inbound Leads</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* CARD 4: Priority Leads */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Hot Buyers
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority Leads</h3>
                <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
                  {priorityLeadsCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detected buyer intent (Price, Order, Stock)
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/leads"
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center justify-between group"
              >
                <span>Open Priority Leads Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* CARD 5: Broadcast Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border',
                    latestBroadcast?.status === 'processing'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  )}
                >
                  {latestBroadcast ? (latestBroadcast.status === 'processing' ? 'Processing' : 'Completed') : 'Ready'}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Broadcast Status</h3>
                <p className="text-base font-bold text-slate-900 mt-1 truncate">
                  {latestBroadcast ? latestBroadcast.name : 'No broadcasts sent yet'}
                </p>

                {/* Real Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 pt-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sent</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {latestBroadcast?.sent || 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl text-center border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Delivered</span>
                    <span className="text-xs font-bold text-emerald-900 font-mono">
                      {latestBroadcast?.delivered || 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-xl text-center border border-blue-100">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block">Read</span>
                    <span className="text-xs font-bold text-blue-900 font-mono">
                      {latestBroadcast?.read || 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-rose-50/60 rounded-xl text-center border border-rose-100">
                    <span className="text-[10px] text-rose-700 uppercase font-bold block">Failed</span>
                    <span className="text-xs font-bold text-rose-900 font-mono">
                      {latestBroadcast?.failed || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/campaigns"
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center justify-between group"
              >
                <span>Launch WhatsApp Broadcast</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
