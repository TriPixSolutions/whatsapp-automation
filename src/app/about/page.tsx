'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, Globe, Lock, ArrowRight } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { AboutHero } from '@/components/about/AboutHero';

const pillars = [
  {
    title: 'Direct Meta Cloud Infrastructure',
    desc: 'We connect directly to Meta WhatsApp Graph API v18.0. You own your phone numbers, your business account, and your customer data with zero third-party per-message markup fees.',
    icon: Globe,
  },
  {
    title: 'Zero Tolerance for Phone Number Bans',
    desc: 'Every broadcast, drip sequence, and automated flow runs through built-in rate limiters and verified opt-in checkers to ensure 100% compliance with WhatsApp Business policies.',
    icon: ShieldCheck,
  },
  {
    title: 'AES-256-GCM Encryption at Rest',
    desc: 'Customer phone numbers, Shopify tokens, WooCommerce keys, and conversation records are strictly encrypted at rest with industry-standard AES-256-GCM authenticated ciphers.',
    icon: Lock,
  },
  {
    title: 'Engineered for Real Commercial Sales',
    desc: 'Building world-class customer journeys should not require a 6-month engineering backlog. Design bots, manage inboxes, and view order conversions in a unified, intuitive interface.',
    icon: Zap,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />

      <AboutHero />

      {/* Corporate Philosophy */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-10 shadow-xs">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Why We Built This Platform
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Traditional WhatsApp business software is notoriously clunky, slow, and expensive. Most legacy platforms impose arbitrary per-message surcharges on top of Meta&apos;s rates while keeping your data locked in opaque databases.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Our platform was engineered on direct Meta Cloud API v18.0 connectivity, intelligent AI intent routing, and instantaneous e-commerce catalog sync to help you close more sales and delight customers 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {pillars.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="bg-slate-900 rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-4 border border-slate-800">
          <h3 className="text-2xl sm:text-3xl font-black">Experience the AI WhatsApp Platform</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Create an account or sign in to your workspace to automate your sales operations in minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/signup"
              className="px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-xs"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
