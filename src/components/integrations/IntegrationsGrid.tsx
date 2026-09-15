'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const integrations = [
  {
    name: 'Shopify & Shopify Plus',
    category: 'E-Commerce Automation',
    desc: 'Recover abandoned carts, send real-time order confirmations, and dispatch dynamic shipment tracking links directly to customer WhatsApp numbers.',
    status: 'Native Integration',
    latency: '< 450ms webhook response',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconEmoji: '🛍️',
    isPrimary: true,
  },
  {
    name: 'WooCommerce & WordPress',
    category: 'E-Commerce Automation',
    desc: 'Automate WordPress order notifications, dispatch PDF invoice links, and trigger customer re-engagement campaigns using secure REST API keys.',
    status: 'Native Integration',
    latency: '< 550ms webhook response',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconEmoji: '🛒',
    isPrimary: true,
  },
  {
    name: 'Meta WhatsApp Cloud API v18.0',
    category: 'Core Messaging Pipeline',
    desc: 'Direct infrastructure link to Meta Graph API. Send pre-approved utility and marketing templates with zero middleman per-message markups.',
    status: 'Official Partner',
    latency: 'Sub-second delivery',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconEmoji: '💬',
    isPrimary: true,
  },
  {
    name: 'HubSpot & CRM Sync',
    category: 'Sales & Marketing Pipeline',
    desc: 'Bidirectional sync of WhatsApp conversation transcripts, contact lifecycle score updates, and automated WhatsApp template triggers.',
    status: 'Bi-Directional',
    latency: 'Real-time sync',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    iconEmoji: '🎯',
    isPrimary: false,
  },
  {
    name: 'Stripe & Direct Invoicing',
    category: 'Payments & Checkout',
    desc: 'Send 1-tap WhatsApp payment links for orders, subscriptions, and custom quotes with automated receipt delivery upon successful checkout.',
    status: 'Instant Webhook',
    latency: 'Instant confirmation',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    iconEmoji: '💳',
    isPrimary: false,
  },
  {
    name: 'Custom REST API & Webhooks',
    category: 'Developer Platform',
    desc: 'Full programmatic access. Trigger WhatsApp messages from your proprietary backend using standard JSON REST payloads with HMAC-SHA256 signature verification.',
    status: 'REST API v18.0',
    latency: 'Unlimited scale',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    iconEmoji: '⚡',
    isPrimary: false,
  },
];

export function IntegrationsGrid() {
  return (
    <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item, i) => (
          <div
            key={i}
            className={`rounded-3xl bg-white border border-slate-200/80 p-7 flex flex-col justify-between space-y-5 shadow-xs ${
              item.isPrimary ? 'ring-1 ring-indigo-500/30' : ''
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2.5 rounded-2xl bg-slate-100 border border-slate-200/80">
                  {item.iconEmoji}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {item.category}
                </span>
                <h3 className="text-lg font-bold text-slate-950 tracking-tight">{item.name}</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">{item.latency}</span>
              <Link
                href="/dashboard/integrations"
                className="text-[11px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
              >
                <span>Connect</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
