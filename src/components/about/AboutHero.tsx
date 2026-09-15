'use client';

import React from 'react';
import { ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Meta Infrastructure', value: 'Cloud v18.0', desc: 'Direct WhatsApp Graph connection' },
  { label: 'Data Encryption', value: 'AES-256-GCM', desc: 'Enterprise security standards' },
  { label: 'Platform Markups', value: '0%', desc: 'No per-message surcharges' },
  { label: 'System Uptime', value: '99.9%', desc: 'High-availability architecture' },
];

export function AboutHero() {
  return (
    <section className="pt-32 pb-14 bg-gradient-to-b from-indigo-50/40 to-transparent border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-xs">
          <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
          <span>Our Mission & Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-3xl mx-auto">
          Empowering Modern Businesses to{' '}
          <span className="text-indigo-600">Sell & Support Smarter</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We build enterprise WhatsApp Cloud infrastructure that eliminates communication bottlenecks, accelerates buyer conversions, and guarantees complete data ownership.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <span>Contact Team</span>
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
