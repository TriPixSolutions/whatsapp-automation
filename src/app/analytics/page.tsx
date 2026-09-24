'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  BarChart3,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Zap,
  Download,
  RefreshCw,
  Smartphone,
  Users,
  Percent,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.warn('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Strictly real metrics, defaulting cleanly to 0 if no events
  const metrics = data?.metrics || {
    connectedNumbers: 0,
    messagesSent: 0,
    delivered: 0,
    read: 0,
    replies: 0,
    conversions: 0,
    failedMessages: 0,
    deliveryRate: 0,
    readRate: 0,
    replyRate: 0,
    leadConversionRate: 0,
    automationPerformance: {
      activeAutomations: 0,
      totalExecutions: 0,
    },
    broadcastPerformance: {
      totalBroadcasts: 0,
      totalSent: 0,
      totalDelivered: 0,
      deliveryRate: 0,
    },
  };

  const handleExportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Connected Numbers', metrics.connectedNumbers],
      ['Messages Sent', metrics.messagesSent],
      ['Delivered', metrics.delivered],
      ['Read', metrics.read],
      ['Replies', metrics.replies],
      ['Conversions', metrics.conversions],
      ['Failed Messages', metrics.failedMessages],
      ['Delivery Rate', `${metrics.deliveryRate}%`],
      ['Read Rate', `${metrics.readRate}%`],
      ['Reply Rate', `${metrics.replyRate}%`],
      ['Lead Conversion Rate', `${metrics.leadConversionRate}%`],
      ['Active Automations', metrics.automationPerformance.activeAutomations],
      ['Automation Executions', metrics.automationPerformance.totalExecutions],
      ['Total Broadcasts', metrics.broadcastPerformance.totalBroadcasts],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsapp_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Analytics & Performance"
        subtitle="Meaningful conversion metrics, delivery tracking, and automation performance"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-24 md:pb-12">
        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Official Metrics</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Verified Real-time
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAnalytics}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 1. Core Meaningful Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Connected Numbers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Connected Numbers
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {metrics.connectedNumbers}
            </p>
            <span className="text-[10px] text-slate-500 block">Active WhatsApp Business Accounts</span>
          </div>

          {/* Messages Sent */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Messages Sent
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {metrics.messagesSent}
            </p>
            <span className="text-[10px] text-slate-500 block">Outbound messages dispatched</span>
          </div>

          {/* Delivered */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Delivered
            </span>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              {metrics.delivered}
            </p>
            <span className="text-[10px] text-emerald-800 block">
              {metrics.deliveryRate}% Delivery Rate
            </span>
          </div>

          {/* Read */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Read
            </span>
            <p className="text-2xl font-black text-blue-700 font-mono">
              {metrics.read}
            </p>
            <span className="text-[10px] text-blue-800 block">
              {metrics.readRate}% Read Rate
            </span>
          </div>

          {/* Replies */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Replies
            </span>
            <p className="text-2xl font-black text-purple-700 font-mono">
              {metrics.replies}
            </p>
            <span className="text-[10px] text-purple-800 block">
              {metrics.replyRate}% Reply Rate
            </span>
          </div>

          {/* Conversions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Conversions
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {metrics.conversions}
            </p>
            <span className="text-[10px] text-slate-500 block">Customers in Won Stage</span>
          </div>

          {/* Lead Conversion */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Lead Conversion
            </span>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              {metrics.leadConversionRate}%
            </p>
            <span className="text-[10px] text-slate-500 block">Pipeline conversion efficiency</span>
          </div>

          {/* Failed Messages */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Failed Messages
            </span>
            <p className="text-2xl font-black text-rose-700 font-mono">
              {metrics.failedMessages}
            </p>
            <span className="text-[10px] text-slate-500 block">Undeliverable or invalid numbers</span>
          </div>
        </div>

        {/* 2. Automation & Broadcast Performance Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Automation Performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Automation Performance</h3>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {metrics.automationPerformance.activeAutomations} Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Workflows
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {metrics.automationPerformance.activeAutomations}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Executions
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {metrics.automationPerformance.totalExecutions}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Automated responses handle customer inquiries instantly 24/7 without manual intervention.
            </p>
          </div>

          {/* Broadcast Performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Broadcast Performance</h3>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {metrics.broadcastPerformance.totalBroadcasts} Campaigns
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Sent</span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                  {metrics.broadcastPerformance.totalSent}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Delivered</span>
                <span className="text-lg font-bold font-mono text-emerald-800 mt-1 block">
                  {metrics.broadcastPerformance.totalDelivered}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Delivery Rate</span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                  {metrics.broadcastPerformance.deliveryRate}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Verified transmission tracking through Meta Cloud API webhooks.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
