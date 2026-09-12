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
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import PassionFruitLogo from '@/components/PassionFruitLogo';

export default function AboutPage() {
  const values = [
    {
      title: 'Direct Meta Cloud Infrastructure',
      desc: 'We integrate directly with Meta WhatsApp Graph API v18.0. You own your data, your Phone Number ID, and your WhatsApp Business Account without middleman platform fees or lock-in.',
      icon: Globe,
    },
    {
      title: 'Clean & Scalable Architecture',
      desc: 'Built with Next.js App Router, modern Tailwind CSS, and resilient serverless webhook processing engineered to handle millions of messages with rock-solid uptime.',
      icon: Zap,
    },
    {
      title: 'No-Code Accessibility for All Teams',
      desc: 'We believe building interactive WhatsApp experiences should not require weeks of engineering. Sales, marketing, and support teams can build and test bots visually in minutes.',
      icon: HeartHandshake,
    },
    {
      title: 'Zero Tolerance for Phone Bans',
      desc: 'Every broadcast and automation flow adheres strictly to Meta WhatsApp Business policies with automated rate protection and verified opt-in tracking.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0D0F2D] flex flex-col font-sans">
      <PublicNav />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-[#C4B5FD] text-xs font-bold text-[#7C3AED]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OUR MISSION & ARCHITECTURE</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0D0F2D]">
          Same Energy. Bigger Possibilities.
        </h1>
        <p className="text-base text-[#64748B] max-w-2xl mx-auto font-normal">
          Empowering modern businesses to deliver responsive, human-like customer journeys through the world&apos;s most personal communication channel: WhatsApp.
        </p>
      </section>

      {/* Story & Philosophy Section */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 sm:p-12 shadow-sm space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#0D0F2D] tracking-tight">
              Why We Built Passion fruit
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed font-normal">
              Traditional WhatsApp solutions are cluttered, complex, and filled with arbitrary markups on Meta&apos;s free conversations. We set out to build a clean, minimalist SaaS platform that gives businesses direct access to official Meta WhatsApp Cloud API capabilities with zero fluff.
            </p>
            <p className="text-sm text-[#64748B] leading-relaxed font-normal">
              Whether you are an e-commerce retailer recovering thousands in abandoned carts, an agency managing luxury brand inquiries, or a support team resolving queries in real time, Passion fruit provides the modern tooling your business deserves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E2E8F0]">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0D0F2D]">{v.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ready to start */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="bg-[#0D0F2D] rounded-3xl p-10 text-white shadow-xl space-y-4 border border-[#7C3AED]/30">
          <h3 className="text-2xl font-black">Experience the Platform</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Log in with your authorized credentials to access your WhatsApp workspace.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="gradient-button text-xs px-8 py-3 rounded-xl font-bold shadow-pf-btn hover:shadow-pf-hover inline-flex items-center gap-2 text-white"
            >
              <span>Sign In to Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
