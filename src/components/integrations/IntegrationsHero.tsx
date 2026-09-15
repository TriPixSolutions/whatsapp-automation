'use client';

import React from 'react';
import { Blocks, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Webhook Latency', value: '< 14ms', desc: 'Real-time event processing' },
  { label: 'Sync Accuracy', value: '100%', desc: 'Automated two-way data sync' },
  { label: 'Setup Time', value: '5 Mins', desc: 'Zero developer code needed' },
  { label: 'Security Standard', value: 'AES-256', desc: 'Encrypted token storage' },
];

export function IntegrationsHero() {
  return (
    <section className="pt-32 pb-14 bg-gradient-to-b from-indigo-50/40 to-transparent border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-xs">
          <Blocks className="w-3.5 h-3.5 text-indigo-600" />
          <span>Unified E-Commerce & CRM Ecosystem</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-3xl mx-auto">
          Connect Your Entire Commerce Stack to{' '}
          <span className="text-indigo-600">WhatsApp</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Sync product catalogs, track inventory, update customer records, and automate checkout links without touching a single line of backend code.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Connect Your Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <span>Request Custom API</span>
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
