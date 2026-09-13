'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bot,
  Inbox,
  Send,
  Users,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const products = [
  {
    title: 'No-Code Visual Chatbot Flow Builder',
    tag: 'Automations',
    desc: 'Design branching conversation journeys with interactive 3-button cards, list menus, and condition filters. Escalate seamlessly to human agents when complex questions arise.',
    icon: Bot,
    highlights: [
      'Interactive 3-button cards & multi-tier branch logic',
      'Dynamic variable extraction (name, order ID, phone number)',
      'Intelligent keyword triggers (e.g., "pricing", "catalog", "order")',
      'Zero developer dependency — edit & publish in seconds',
    ],
    preview: {
      type: 'chatbot',
      badge: 'Interactive Menu',
      title: 'Which product tier would you like to explore?',
      buttons: ['Starter Tier', 'Scale Tier', 'Custom Enterprise'],
    },
  },
  {
    title: 'Shared Multi-Agent Team Inbox',
    tag: 'Support & Sales',
    desc: 'Unify all inbound customer conversations into a single collaborative workspace. Assign chats to specific team members, collaborate with private notes, and speed up replies with AI.',
    icon: Inbox,
    highlights: [
      'Private internal team notes (invisible to customers)',
      'AI conversation summarization & quick reply suggestions',
      'Canned quick responses (/pricing, /shipping, /support)',
      'Real-time collision detection to prevent double messaging',
    ],
    preview: {
      type: 'inbox',
      badge: 'Team Collaboration',
      title: 'Alex (Support Lead) left an internal note:',
      note: 'Customer confirmed Shopify Order #10429. Approved for VIP priority shipping.',
    },
  },
  {
    title: 'High-Throughput Broadcast Engine',
    tag: 'Marketing',
    desc: 'Dispatch official Meta-approved template broadcasts to thousands of opted-in customers simultaneously with built-in safe rate limiting and real-time delivery telemetry.',
    icon: Send,
    highlights: [
      'Meta-approved marketing, utility, and auth templates',
      'Dynamic personalized variables ({{1}}, {{2}}, {{3}})',
      '100% compliant rate protection to prevent number blocking',
      'Live delivery receipts: Sent, Delivered, and Read',
    ],
    preview: {
      type: 'broadcast',
      badge: 'Meta Template v18.0',
      title: 'VIP Summer Collection Launch Broadcast',
      status: 'Dispatched to 4,850 recipients &bull; 99.4% Delivered',
    },
  },
  {
    title: 'Audience CRM & E-Commerce Directory',
    tag: 'Data & Sync',
    desc: 'Synchronize customer profiles, order histories, and cart events across Shopify, WooCommerce, and Meta WhatsApp into an unified, search-ready customer directory.',
    icon: Users,
    highlights: [
      'Automatic phone number formatting for 1-tap WhatsApp chat',
      'Real-time customer lifetime spend & order counts',
      'Tag-based segmentation (VIP, Abandoned Cart, Wholesale)',
      'Instant CSV import & export capabilities',
    ],
    preview: {
      type: 'crm',
      badge: 'Synced Customer Profile',
      title: 'Alex Chen &bull; +1 (415) 555-2671',
      details: 'Total Spent: $1,420.00 &bull; 4 Orders &bull; Tags: [VIP, Shopify]',
    },
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CORE PLATFORM MODULES</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
          Everything built natively on Meta Cloud API
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Explore the four integrated modules that power high-conversion WhatsApp conversations for growing businesses.
        </p>
      </section>

      {/* Product Modules List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        {products.map((item, i) => {
          const Icon = item.icon;
          const isEven = i % 2 === 1;

          return (
            <div
              key={i}
              className={`glass-card rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                isEven ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Info Column */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>

                <ul className="space-y-2.5 pt-2">
                  {item.highlights.map((h, hi) => (
                    <li key={hi} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link
                    href="/auth/signup"
                    className="gradient-button text-xs px-5 py-2.5 rounded-xl font-semibold inline-flex items-center gap-1.5 text-white"
                  >
                    <span>Test In Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Preview UI Column */}
              <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-6 text-white border border-zinc-800 shadow-xl space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">{item.preview.badge}</span>
                  <span className="text-[9px] text-zinc-500">Live Component</span>
                </div>

                <div className="space-y-3">
                  <p className="text-zinc-200 font-sans text-xs font-semibold">{item.preview.title}</p>

                  {item.preview.buttons && (
                    <div className="space-y-2 pt-1">
                      {item.preview.buttons.map((btn, bi) => (
                        <div
                          key={bi}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-sans text-xs text-indigo-300 font-medium"
                        >
                          {btn}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.preview.note && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-[11px] font-sans">
                      {item.preview.note}
                    </div>
                  )}

                  {item.preview.status && (
                    <p className="text-[11px] text-emerald-400 font-sans">{item.preview.status}</p>
                  )}

                  {item.preview.details && (
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-sans">
                      {item.preview.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-[#090A0F] rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-6 relative overflow-hidden border border-zinc-800">
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to explore all platform features?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Start building your first interactive WhatsApp flow in under 5 minutes.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/signup"
                className="gradient-button text-xs px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 text-white shadow-lg"
              >
                <span>Get Started Free</span>
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
