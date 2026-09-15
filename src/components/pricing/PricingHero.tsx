'use client';

import React from 'react';
import { DollarSign, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const stats = [
  { label: 'Setup Fee', value: '$0', desc: 'No hidden onboarding charges' },
  { label: 'Free Trial', value: '14 Days', desc: 'Full enterprise feature access' },
  { label: 'Delivery Guarantee', value: '99.9%', desc: 'Official Meta Cloud SLA' },
  { label: 'Meta Markup', value: '0%', desc: 'Pay Meta directly at exact cost' },
];

export function PricingHero() {
  return (
    <section className="pt-32 pb-16 bg-gradient-to-b from-indigo-50/40 to-transparent border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Straightforward Commercial Pricing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-3xl mx-auto">
          Scale Your WhatsApp Sales with{' '}
          <span className="text-indigo-600">Zero Unnecessary Costs</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Every dollar invested returns measurable sales through faster customer responses, autonomous checkout guidance, and automated lead capture.
        </p>

        {/* Key Metrics Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-left"
            >
              <div className="text-2xl font-black text-slate-950 tracking-tight">
                {s.value}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                {s.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
