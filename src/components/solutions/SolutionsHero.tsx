'use client';

import React from 'react';
import { Bot, Zap, ArrowRight, ShieldCheck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Cart Recovery', value: '+34%', desc: 'Automated WhatsApp checkout prompts' },
  { label: 'Broadcast Opens', value: '98%', desc: 'Meta-approved customer notifications' },
  { label: 'Reply Latency', value: '< 3s', desc: 'Instant 24/7 AI-guided answers' },
  { label: 'Compliance', value: '100%', desc: 'Official Meta Cloud API v18.0' },
];

export function SolutionsHero() {
  return (
    <section className="pt-32 pb-14 bg-gradient-to-b from-indigo-50/40 to-transparent border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Engineered for E-Commerce & High-Ticket Lead Gen</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-3xl mx-auto">
          Commercial Capabilities that Turn{' '}
          <span className="text-indigo-600">Chats into Revenue</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Every capability is built to eliminate customer hesitation, automate product discovery, and drive verified payments inside WhatsApp.
        </p>

        {/* Action Button */}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <span>Request Demo</span>
          </Link>
        </div>

        {/* Metric Bar */}
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
