'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Building2,
  Stethoscope,
  Megaphone,
  Headphones,
  Car,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const solutions = [
  {
    title: 'E-Commerce & DTC Brands',
    desc: 'Recover abandoned carts, send automated shipment tracking notifications, and enable 1-tap WhatsApp catalog checkout to drastically increase conversion rates.',
    icon: ShoppingBag,
    benefits: [
      'Automated Shopify & WooCommerce cart recovery triggers',
      'Real-time delivery & tracking updates',
      'Interactive catalog product showcases',
    ],
  },
  {
    title: 'Real Estate & Property Agencies',
    desc: 'Qualify prospective buyers instantly. Send brochure lookbooks, interactive location map pins, and schedule private viewing appointments 24/7.',
    icon: Building2,
    benefits: [
      'Instant lead qualification via interactive buttons',
      'Virtual tour video & PDF lookbook delivery',
      'Direct routing to dedicated property advisors',
    ],
  },
  {
    title: 'Healthcare & Private Clinics',
    desc: 'Automate appointment bookings, consultation reminders, and post-visit follow-up instructions with full patient privacy and zero missed slots.',
    icon: Stethoscope,
    benefits: [
      'Automated consultation reminder notifications',
      'Doctor & specialist schedule management',
      'Safe, compliant patient communication',
    ],
  },
  {
    title: 'Marketing Agencies & CTWA Ads',
    desc: 'Turn Instagram and Facebook Click-to-WhatsApp (CTWA) ads into high-converting conversations with automatic welcome flows and lead tagging.',
    icon: Megaphone,
    benefits: [
      'Direct ad attribution and ROAS tracking',
      'Instant AI auto-responder for incoming ad clicks',
      'Multi-client workspace support',
    ],
  },
  {
    title: 'Customer Support & Concierge',
    desc: 'Replace slow email support tickets with real-time WhatsApp resolution. Shared multi-agent inbox with collision detection and canned quick replies.',
    icon: Headphones,
    benefits: [
      'Multi-agent conversation assignment',
      'Private internal notes for team collaboration',
      'AI conversation summarization and reply suggestions',
    ],
  },
  {
    title: 'Automotive & Dealerships',
    desc: 'Book VIP test drives, send bespoke vehicle build specs, and notify high-intent car buyers about new inventory arrivals.',
    icon: Car,
    benefits: [
      'VIP test drive scheduling via automated bot',
      'Digital brochure & specification sheets',
      'Service appointment alerts & trade-in quotes',
    ],
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0D0F2D] flex flex-col font-sans">
      <PublicNav />

      {/* Header Banner */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-[#C4B5FD] text-xs font-bold text-[#7C3AED]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INDUSTRY TAILORED SOLUTIONS</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0D0F2D]">
          Built for Industries Where Every Conversation Counts
        </h1>
        <p className="text-base text-[#64748B] max-w-2xl mx-auto font-normal">
          From e-commerce cart recoveries to high-ticket luxury lead generation, discover how Passion fruit accelerates growth in your sector.
        </p>
      </section>

      {/* Solutions Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((sol, i) => {
            const Icon = sol.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0D0F2D]">{sol.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                    {sol.desc}
                  </p>
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                    {sol.benefits.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#0D0F2D] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/auth/login"
                  className="pt-4 text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1.5"
                >
                  <span>Launch Solution in Workspace</span>
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
