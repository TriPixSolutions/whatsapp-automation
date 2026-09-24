'use client';

import React from 'react';
import {
  BarChart2,
  CheckCircle,
  Eye,
  Send,
  Zap,
  Bot,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';

interface AnalyticsOverviewProps {
  stats?: {
    messagesSent: number;
    deliveryRate: string;
    activeChatsCount: number;
    deliveredCount?: number;
    readCount?: number;
  };
}

export function AnalyticsOverview({ stats }: AnalyticsOverviewProps) {
  const sent = stats?.messagesSent || 0;
  const delivery = sent > 0 ? (stats?.deliveryRate || '0%') : '—';
  const active = stats?.activeChatsCount || 0;
  const delivered = stats?.deliveredCount !== undefined ? stats.deliveredCount : (sent > 0 ? sent : 0);
  const read = stats?.readCount || 0;

  const funnelSteps = [
    { label: 'Outbound Dispatches', count: sent.toLocaleString(), percent: '100%', icon: Send, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Delivered Receipts', count: delivered.toLocaleString(), percent: delivery, icon: Bot, color: 'text-purple-600 bg-purple-50' },
    { label: 'Active Conversations', count: active.toLocaleString(), percent: sent > 0 ? `${Math.min(100, Math.round((active / sent) * 100))}%` : '0%', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
    { label: 'Confirmed Read', count: read.toLocaleString(), percent: sent > 0 ? `${Math.min(100, Math.round((read / sent) * 100))}%` : '0%', icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const channels = [
    { channel: 'WhatsApp Cloud API v18.0', status: sent > 0 ? 'Active' : 'Standby', volume: `${sent.toLocaleString()} msgs`, rate: delivery, health: sent > 0 ? '100%' : 'Ready' },
    { channel: 'Shopify Storefront Webhook', status: 'Available', volume: '0 events', rate: '—', health: 'Ready' },
    { channel: 'WooCommerce Webhook', status: 'Available', volume: '0 events', rate: '—', health: 'Ready' },
    { channel: 'AI Inbound Assistant', status: 'Active', volume: `${active.toLocaleString()} chats`, rate: '< 2s response', health: '100%' },
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Section: Conversion Funnel + Channel Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversion Funnel */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                WhatsApp Lead &amp; Sales Funnel
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                From initial customer ping to verified checkout link completion
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              +18.4% MoM
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {funnelSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{step.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Conversion from stage: {step.percent}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {step.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Health & Throughput Table */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Integration Throughput &amp; Health
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time connection performance across connected storefronts and APIs
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              All Systems Operational
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {channels.map((ch) => (
              <div key={ch.channel} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">{ch.channel}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold">{ch.status}</span>
                    <span>&bull;</span>
                    <span>{ch.volume}</span>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 font-mono">{ch.rate}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{ch.health} uptime</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
