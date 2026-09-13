'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Building2,
  Stethoscope,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const solutions = [
  {
    title: 'E-Commerce & DTC Brands',
    tag: 'Shopify & WooCommerce',
    desc: 'Recover abandoned carts, send automated shipment tracking notifications, and enable 1-tap WhatsApp catalog checkout to drastically boost customer lifetime value.',
    icon: ShoppingBag,
    stat: '3.4x Higher ROI',
    statLabel: 'vs traditional email remarketing',
    benefits: [
      'Automated Shopify & WooCommerce cart recovery triggers',
      'Real-time shipment delivery & tracking notifications',
      'Instant WhatsApp catalog product showcases',
      'Zero-code setup via official webhooks',
    ],
  },
  {
    title: 'Click-to-WhatsApp (CTWA) Ad Acceleration',
    tag: 'Meta Ads & Instagram',
    desc: 'Turn Facebook & Instagram ad clicks into instant, qualified WhatsApp conversations with automatic lead tagging, welcome sequences, and ROAS attribution.',
    icon: Megaphone,
    stat: '68% Lower CPA',
    statLabel: 'compared to landing page drop-offs',
    benefits: [
      'Immediate sub-second auto-responder for incoming ad clicks',
      'Ad campaign source tagging & attribution reporting',
      'Automated qualifying questionnaires with interactive buttons',
      'Direct routing to high-performing sales reps',
    ],
  },
  {
    title: 'High-Ticket Real Estate & Property',
    tag: 'Concierge & VIP',
    desc: 'Qualify prospective buyers instantly. Deliver interactive PDF brochures, video tours, and schedule private showroom viewings with automated agent assignment.',
    icon: Building2,
    stat: '24/7 Availability',
    statLabel: 'Zero missed buyer inquiries',
    benefits: [
      'Instant lead qualification via interactive 3-button flows',
      'Virtual brochure & high-res lookbook distribution',
      'Private internal team notes for seamless agent handoff',
      'Automated appointment calendar reminders',
    ],
  },
  {
    title: 'Healthcare, Wellness & Clinics',
    tag: 'Appointments & Care',
    desc: 'Automate appointment confirmations, pre-consultation questionnaires, and post-treatment follow-up instructions with full patient privacy and zero missed slots.',
    icon: Stethoscope,
    stat: '45% Less No-Shows',
    statLabel: 'via automated WhatsApp reminders',
    benefits: [
      'Automated 24h and 2h consultation reminder notifications',
      'Doctor & specialist schedule management',
      'Safe, compliant patient communication',
      'Instant cancellation and reschedule handling',
    ],
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TAILORED INDUSTRY SOLUTIONS</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
          Engineered for brands where conversations drive revenue
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Whether you sell DTC products on Shopify or close high-ticket property contracts, discover how Passion Fruit automates your key conversion milestones.
        </p>
      </section>

      {/* Solutions Bento Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="glass-card rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>

                  <div className="pt-2 pb-2 border-y border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-slate-950 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span>{item.stat}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{item.statLabel}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-2">
                    {item.benefits.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group"
                  >
                    <span>Deploy this solution</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-[#090A0F] rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-6 relative overflow-hidden border border-zinc-800">
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to automate your industry workflow?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Experience the power of native E-commerce webhooks and official Meta Cloud API v18.0.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/signup"
                className="gradient-button text-xs px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 text-white shadow-lg"
              >
                <span>Get Started Now</span>
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
