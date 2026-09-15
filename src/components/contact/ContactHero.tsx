'use client';

import React from 'react';
import { MessageSquare, Clock, ShieldCheck, Headphones } from 'lucide-react';

const metrics = [
  { label: 'Response Time', value: '< 15 Mins', desc: 'Average sales team reply' },
  { label: 'Platform Support', value: '24/7/365', desc: 'Always available globally' },
  { label: 'Meta Guidance', value: '100% Free', desc: 'Assistance with verification' },
  { label: 'Customer Rating', value: '4.9 / 5.0', desc: 'Enterprise client satisfaction' },
];

export function ContactHero() {
  return (
    <section className="pt-32 pb-14 bg-gradient-to-b from-indigo-50/40 to-transparent border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-xs">
          <Headphones className="w-3.5 h-3.5 text-indigo-600" />
          <span>Talk to Sales & Support Specialists</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-3xl mx-auto">
          Let’s Discuss How to Accelerate Your{' '}
          <span className="text-indigo-600">WhatsApp Conversions</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Connect directly with our WhatsApp solution architects to design your AI sales journeys, integrate your e-commerce catalog, and expedite Meta verification.
        </p>

        {/* Visual Metric Pillars */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-left"
            >
              <div className="text-2xl font-black text-slate-950 tracking-tight">
                {m.value}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                {m.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {m.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
