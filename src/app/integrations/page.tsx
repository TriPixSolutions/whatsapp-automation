'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Zap,
  Layers,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

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
    name: 'HubSpot CRM',
    category: 'Sales & Marketing Sync',
    desc: 'Bidirectional sync of WhatsApp conversation transcripts, contact lifecycle score updates, and automated WhatsApp template triggers from HubSpot workflows.',
    status: 'Bi-Directional',
    latency: 'Real-time sync',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    iconEmoji: '🎯',
    isPrimary: false,
  },
  {
    name: 'Stripe & Online Payments',
    category: 'Payment Links & Invoicing',
    desc: 'Send 1-tap WhatsApp payment links for orders, subscriptions, and custom quotes with automated receipt delivery upon successful checkout.',
    status: 'Webhook Trigger',
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

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NATIVE ECOSYSTEM</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
          Connect your existing store and CRM in minutes
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          No complicated middleware. Connect Shopify, WooCommerce, and Meta Cloud API directly through guided 3-step setups.
        </p>
      </section>

      {/* Integrations Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item, i) => (
            <div
              key={i}
              className={`glass-card rounded-3xl p-7 flex flex-col justify-between space-y-5 ${
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

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">{item.latency}</span>
                <Link
                  href="/dashboard/integrations"
                  className="gradient-button text-[11px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 text-white shadow-2xs"
                >
                  <span>Connect</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-[#090A0F] rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-6 relative overflow-hidden border border-zinc-800">
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Looking for a custom webhook connection?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Our REST webhook endpoints ingest JSON payloads from any custom backend in real-time.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/signup"
                className="gradient-button text-xs px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 text-white shadow-lg"
              >
                <span>Access Developer Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
