'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Globe,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const pillars = [
  {
    title: 'Direct Meta Cloud Infrastructure',
    desc: 'We connect directly to Meta WhatsApp Graph API v18.0. You own your phone numbers, your business account, and your data with zero third-party per-message markup fees.',
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
    title: 'Engineered for Marketers & Operators',
    desc: 'Building world-class customer journeys should not require a 6-month engineering backlog. Design bots, manage inboxes, and view order conversions in a unified, intuitive interface.',
    icon: Zap,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OUR ARCHITECTURE &amp; VALUES</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
          Modern infrastructure for high-converting customer conversations
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          We built Passion Fruit to replace bloated legacy WhatsApp tooling with a sleek, autonomous, developer-grade SaaS platform.
        </p>
      </section>

      {/* Corporate Philosophy */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="glass-card rounded-3xl p-8 sm:p-12 space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Why We Built Passion Fruit
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Traditional WhatsApp business software is notoriously clunky, slow, and expensive. Most legacy platforms impose arbitrary per-message surcharges on top of Meta&apos;s rates while keeping your data locked in opaque databases.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Passion Fruit was engineered from the ground up on modern Silicon Valley architecture: Next.js, resilient serverless webhook processing, and direct Meta Cloud API v18.0 connectivity. We give brands complete ownership of their WhatsApp operations with state-of-the-art UI and enterprise-grade security.
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
        <div className="bg-[#090A0F] rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-4 border border-zinc-800">
          <h3 className="text-2xl sm:text-3xl font-black">Experience Passion Fruit</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Create an account or sign in to your workspace to automate your store in minutes.
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
      </section>

      <PublicFooter />
    </div>
  );
}
