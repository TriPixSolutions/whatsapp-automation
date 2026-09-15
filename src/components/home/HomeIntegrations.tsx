'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

const integrations = [
  {
    name: 'Meta WhatsApp Cloud API',
    desc: 'Official direct connection. Zero third-party markups and high throughput.',
    badge: 'Native v18.0',
  },
  {
    name: 'Google Gemini & OpenAI',
    desc: 'LLMs fine-tuned on your product catalog for contextual recommendations.',
    badge: 'AI Engine',
  },
  {
    name: 'Shopify & WooCommerce',
    desc: 'Live two-way sync for products, inventory levels, orders, and payment links.',
    badge: 'E-Commerce',
  },
  {
    name: 'Google Sheets & Webhooks',
    desc: 'Instantly append captured leads and triggers to your custom databases.',
    badge: 'Automated Sync',
  },
  {
    name: 'Stripe & Direct Payments',
    desc: 'Share verified payment links in chat and confirm checkout in real time.',
    badge: 'Payments',
  },
  {
    name: 'CRM & Lead Management',
    desc: 'Built-in customer profiles with full message history and behavioral tags.',
    badge: 'Built-In CRM',
  },
];

export function HomeIntegrations() {
  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Connected Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-3">
              Works Seamlessly with Your Existing Stack
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Zero code required. Connect your store, AI key, and WhatsApp in under 5 minutes.
            </p>
          </div>
          <Link
            href="/integrations"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0"
          >
            <span>View all 20+ integrations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.desc}
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Production
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
