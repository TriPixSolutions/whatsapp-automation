'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Clock,
  Bot,
  Send,
  Users,
  Smartphone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeroProps {
  metaConfigured: boolean;
  activeChats: number;
}

export function DashboardHero({ metaConfigured, activeChats }: DashboardHeroProps) {
  const quickActions = [
    {
      title: 'Visual Automation',
      desc: 'Send image, wait 1h, send pricing',
      icon: Zap,
      href: '/automations',
      badge: 'Flows',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Follow-Up Sequence',
      desc: 'Automatic 10m, 1h, 24h reminders',
      icon: Clock,
      href: '/automations',
      badge: 'Auto-cancel',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Chatbot Builder',
      desc: 'Yes/No interactive buttons & menus',
      icon: Bot,
      href: '/automations',
      badge: 'No-Code',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Priority Leads',
      desc: 'Hot buyer intent & price inquiries',
      icon: Users,
      href: '/contacts',
      badge: 'Hot CRM',
      color: 'text-rose-600 bg-rose-50',
    },
    {
      title: 'Send Broadcast',
      desc: '4-step wizard to message customers',
      icon: Send,
      href: '/campaigns',
      badge: 'Broadcast',
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Connect WhatsApp',
      desc: metaConfigured ? 'Active & Verified' : 'Connect in 2 minutes',
      icon: Smartphone,
      href: '/setup',
      badge: metaConfigured ? 'Connected' : 'Action Needed',
      color: metaConfigured ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 bg-slate-100',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      {/* Top Welcome Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                metaConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              )}
            />
            <span>
              {metaConfigured ? 'WhatsApp Business Active' : 'WhatsApp Needs Connection'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-normal text-slate-500">{activeChats} Active Chats Today</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            WhatsApp Growth &amp; Automation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
            Automatically reply to leads, trigger follow-ups, and convert customers in minutes with zero coding.
          </p>
        </div>

        {/* 1-Tap Quick Action */}
        <div className="flex items-center gap-2">
          <Link
            href="/campaigns"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs min-h-[44px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch Broadcast</span>
          </Link>
        </div>
      </div>

      {/* 6 Clean Minimal Action Cards (Max 3 Clicks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              href={action.href}
              className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all flex items-start gap-3.5 group shadow-2xs"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                  action.color
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {action.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600">
                    {action.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {action.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
