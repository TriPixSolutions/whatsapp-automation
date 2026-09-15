'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ArrowUpRight,
  Send,
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface DashboardHeroProps {
  metaConfigured: boolean;
  activeChats: number;
}

export function DashboardHero({ metaConfigured, activeChats }: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-800">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Value & Positioning */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-indigo-200 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Sales &amp; Support Command Center</span>
            <span className="text-white/40">&bull;</span>
            <span className="text-emerald-300">
              {metaConfigured ? 'Meta Cloud API v18.0 Connected' : 'Meta Cloud API Ready'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Turn WhatsApp Conversations into Paying Customers 24/7
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
            Autonomous AI qualifies leads, recommends catalog products, and answers questions in under 3 seconds. Jump into high-intent chats whenever your team is ready.
          </p>

          {/* Micro badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Avg. Response: &lt; 2.8s</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeChats} Active Threads</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Anti-Ban Protection</span>
            </div>
          </div>
        </div>

        {/* Right Instant Action Panel */}
        <div className="flex flex-row sm:flex-col lg:flex-col gap-2.5 shrink-0 justify-start sm:justify-center">
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold shadow-md hover:bg-slate-100 transition-all group"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            <span>Launch Broadcast</span>
          </Link>

          <Link
            href="/inbox"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white text-xs font-bold border border-indigo-400/30 transition-all backdrop-blur-md"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-200" />
            <span>Open Shared Inbox</span>
          </Link>

          <Link
            href="/dashboard/integrations"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
            <span>Sync Store Catalog</span>
            <ArrowUpRight className="w-3 h-3 text-white/50" />
          </Link>
        </div>
      </div>
    </section>
  );
}
