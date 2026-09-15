'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight,
  Download,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface AnalyticsHeroProps {
  dateRange?: string;
  onExport?: () => void;
}

export function AnalyticsHero({ dateRange = 'Last 30 Days', onExport }: AnalyticsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0B0F19] to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-800">
      {/* Glow Effects */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Value & Positioning */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-indigo-200 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Revenue &amp; Conversation Performance</span>
            <span className="text-white/40">&bull;</span>
            <span className="text-emerald-300">Live Meta Telemetry</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            WhatsApp Sales Attribution &amp; Support Analytics
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
            Track real-time message delivery, lead conversion velocity, and AI resolution rates. Know exactly how much revenue your WhatsApp campaigns generate.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attributed Sales</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">$142,850</p>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +24.8% vs last mo
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Conversion Rate</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">28.4%</p>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +4.2% uplift
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Read Rate</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">96.2%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Industry avg: 22%</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Avg. Resolution</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">2m 14s</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">85% faster</p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-row sm:flex-col gap-2.5 shrink-0 justify-start sm:justify-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
            <span className="font-semibold">{dateRange}</span>
          </div>

          <button
            onClick={onExport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold shadow-md hover:bg-slate-100 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV Audit</span>
          </button>

          <Link
            href="/inbox"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white text-xs font-bold border border-indigo-400/30 transition-all backdrop-blur-md"
          >
            <span>Live Chat Stream</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200" />
          </Link>
        </div>
      </div>
    </section>
  );
}
