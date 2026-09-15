'use client';

import React from 'react';
import { Clock, DollarSign, Zap, TrendingUp, CheckCircle } from 'lucide-react';

const benefits = [
  {
    title: '40+ Hours Saved Weekly',
    subtitle: 'Time Saved',
    desc: 'Eliminate repetitive typing for FAQs, tracking updates, and store directions. Free your team to focus on high-ticket deals.',
    icon: Clock,
    metric: '40+ hrs/wk',
  },
  {
    title: '60% Reduction in Support Costs',
    subtitle: 'Cost Reduced',
    desc: 'Resolve up to 75% of first-touch questions autonomously. Scale inquiry capacity without hiring additional shift workers.',
    icon: DollarSign,
    metric: '-60% overhead',
  },
  {
    title: 'Sub-3-Second Replies',
    subtitle: 'Faster Response',
    desc: 'Respond when purchase intent is highest. Never lose an eager customer to a faster-replying competitor.',
    icon: Zap,
    metric: '< 3 seconds',
  },
  {
    title: '3x Higher Lead-to-Sale Conversion',
    subtitle: 'Higher Conversion',
    desc: 'Guide prospects directly from greeting to checkout link inside the chat, eliminating cart drop-off.',
    icon: TrendingUp,
    metric: '3x conversion',
  },
];

export function HomeBenefits() {
  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
            Measurable Business ROI
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
            Why Modern Businesses Choose AI WhatsApp
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Real commercial results backed by automated customer conversion and instant responses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-indigo-500/50 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    {b.subtitle}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-700/60 text-emerald-400 border border-slate-600/40">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white mb-1">
                    {b.metric}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {b.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
