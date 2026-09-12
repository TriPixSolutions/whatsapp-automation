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
  Zap,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const integrations = [
  {
    name: 'Meta WhatsApp Cloud API',
    category: 'Core Infrastructure',
    desc: 'Official direct connection to Meta Graph API v18.0+. High-volume template messaging, media payloads, and bidirectional webhook streams.',
    status: 'Official Native',
    badgeColor: 'bg-emerald-50 text-[#22C55E] border-emerald-200',
  },
  {
    name: 'Shopify & Shopify Plus',
    category: 'E-Commerce',
    desc: 'Automatically recover abandoned checkout carts, send order confirmation messages, and dispatch tracking links directly to customer WhatsApp numbers.',
    status: 'Native Webhooks',
    badgeColor: 'bg-purple-50 text-[#7C3AED] border-[#C4B5FD]',
  },
  {
    name: 'HubSpot CRM',
    category: 'Sales & Marketing',
    desc: 'Two-way sync of WhatsApp conversation transcripts, contact lead score updates, and automated WhatsApp template triggers from HubSpot workflows.',
    status: 'Bi-Directional',
    badgeColor: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    name: 'WooCommerce',
    category: 'E-Commerce',
    desc: 'Instantly notify WordPress & WooCommerce shoppers of order status changes, dispatch PDF invoices, and re-engage lapsed buyers.',
    status: 'REST API',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    name: 'Zoho CRM',
    category: 'Lead Management',
    desc: 'Automatically create leads and deals in Zoho CRM when new customers message your WhatsApp Business number. Sync chat logs to deals.',
    status: 'Cloud Sync',
    badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  {
    name: 'Salesforce Sales Cloud',
    category: 'Enterprise CRM',
    desc: 'Enterprise routing and contact enrichment. Ensure your sales reps have the complete WhatsApp conversation context inside Salesforce.',
    status: 'Enterprise',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    name: 'Stripe & Online Payments',
    category: 'Billing',
    desc: 'Send 1-tap WhatsApp payment links for orders, subscriptions, and custom invoices with automated receipt delivery upon successful payment.',
    status: 'Live Webhooks',
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
  {
    name: 'Google Sheets',
    category: 'Data Export',
    desc: 'Export audience directories and import customer phone lists continuously. Automatically log every incoming lead to a live spreadsheet.',
    status: 'Auto Sync',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Custom Webhooks & REST API',
    category: 'Developer API',
    desc: 'Full programmatic access. Trigger WhatsApp messages from your own backend using simple JSON REST payloads and receive live delivery webhooks.',
    status: 'REST v18.0',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0D0F2D] flex flex-col font-sans">
      <PublicNav />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-[#C4B5FD] text-xs font-bold text-[#7C3AED]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CONNECTED ECOSYSTEM</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0D0F2D]">
          Connect WhatsApp to Your Existing Stack
        </h1>
        <p className="text-base text-[#64748B] max-w-2xl mx-auto font-normal">
          Seamlessly integrate your CRMs, e-commerce stores, and payment gateways with official Meta WhatsApp Cloud API webhooks.
        </p>
      </section>

      {/* Integrations Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-[#E2E8F0] p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    {item.category}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0D0F2D]">{item.name}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[11px] text-[#94A3B8] font-medium">Instant Setup</span>
                <Link
                  href="/auth/login"
                  className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
                >
                  <span>Connect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
