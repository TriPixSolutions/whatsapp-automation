'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bot,
  Inbox,
  Send,
  Users,
  Megaphone,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
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
      'Interactive button menus & multi-tier branching',
      'Dynamic variable extraction (name, order ID, phone)',
      'Intelligent keyword triggers (e.g., "pricing", "catalog", "help")',
      'Zero-code visual flowchart editor',
    ],
  },
  {
    title: 'Shared Multi-Agent Team Inbox',
    tag: 'Support & Sales',
    desc: 'Unify all inbound customer conversations into a single collaborative workspace. Assign chats to specific team members, collaborate with private notes, and speed up replies with AI.',
    icon: Inbox,
    highlights: [
      'Private internal team notes (invisible to customers)',
      'AI conversation summarization & quick reply suggestions',
      'Canned quick responses (/pricing, /booking, /support)',
      'Agent collision detection to prevent double messaging',
    ],
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
  },
  {
    title: 'Audience CRM & Tagging Directory',
    tag: 'Customer Data',
    desc: 'Manage customer phone registries, custom audience segments, and verified opt-in statuses. Import thousands of contacts via CSV in seconds.',
    icon: Users,
    highlights: [
      'Bulk CSV contact importer with column auto-mapping',
      'Custom tag segmentation (e.g. "vip", "lead", "buyer")',
      'Opt-in compliance records with timestamp audit logs',
      'International E.164 phone validation and formatting',
    ],
  },
  {
    title: 'Meta Click-to-WhatsApp (CTWA) Ad Tracker',
    tag: 'Advertising',
    desc: 'Connect your Instagram and Facebook ads directly to WhatsApp. Measure cost-per-conversation, track leads, and automatically engage prospects the moment they tap your ad.',
    icon: Megaphone,
    highlights: [
      'Direct ad attribution and conversion rate tracking',
      'Instant greeting and interactive questionnaire',
      'Lower acquisition costs compared to traditional landing pages',
      'Live ROAS and chat count analytics',
    ],
  },
  {
    title: 'WhatsApp Catalog & E-Commerce',
    tag: 'Commerce',
    desc: 'Showcase products directly inside WhatsApp chat. Let customers browse product collections, add items to a cart, and checkout seamlessly.',
    icon: ShoppingBag,
    highlights: [
      'Single & multi-product interactive catalog cards',
      'Shopify & WooCommerce automated cart recovery triggers',
      'Live inventory sync and product details',
      '1-tap checkout links',
    ],
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0D0F2D] flex flex-col font-sans">
      <PublicNav />

      {/* Header Banner */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-[#C4B5FD] text-xs font-bold text-[#7C3AED]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PRODUCTION-READY PRODUCT SUITE</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0D0F2D]">
          Engineered for Performance on WhatsApp
        </h1>
        <p className="text-base text-[#64748B] max-w-2xl mx-auto font-normal">
          Explore the tools built directly on the official Meta Cloud API to power your automated messaging, sales, and support.
        </p>
      </section>

      {/* Products Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((prod, i) => {
            const Icon = prod.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F4F6FB] text-[#7C3AED] border border-[#E2E8F0]">
                      {prod.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0D0F2D]">{prod.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                    {prod.desc}
                  </p>
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                    {prod.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#0D0F2D] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/auth/login"
                  className="pt-4 text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1.5"
                >
                  <span>Open Feature in Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
