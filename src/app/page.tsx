'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Globe,
  Lock,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export default function HomePage() {
  const valueProps = [
    {
      title: 'Official Meta Cloud API',
      desc: 'Direct integration with Meta WhatsApp Graph API v18.0. Zero third-party markups, 1,000 free conversations per month, and highest delivery reliability.',
      icon: Globe,
    },
    {
      title: 'No-Code Conversational Flows',
      desc: 'Build intelligent branching chatbots with interactive 3-button menus and list selectors to qualify leads 24/7 without developer dependencies.',
      icon: Bot,
    },
    {
      title: 'Collaborative Multi-Agent Inbox',
      desc: 'Equip your sales and support teams with a unified inbox featuring AI-powered reply suggestions, ticket assignment, and private internal team notes.',
      icon: MessageSquare,
    },
    {
      title: 'High-Volume Compliant Broadcasts',
      desc: 'Send personalized template announcements and product drops to opted-in audiences with built-in rate protection to ensure 100% phone number safety.',
      icon: Send,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0D0F2D] flex flex-col font-sans">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center relative overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute top-20 w-[600px] h-[350px] bg-gradient-to-r from-purple-200/50 via-indigo-100/40 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-[#C4B5FD] text-xs font-bold text-[#7C3AED] shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SAME ENERGY. BIGGER POSSIBILITIES. &bull; META CLOUD API v18.0</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#0D0F2D] leading-[1.12]">
            The Modern WhatsApp Automation Platform for{' '}
            <span className="gradient-text-purple">Scaling Businesses</span>
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed font-normal">
            Turn WhatsApp into your primary revenue and support engine. Send targeted broadcasts, build visual interactive chatbots, and empower your support team.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="gradient-button text-sm px-8 py-3.5 rounded-xl font-bold shadow-pf-btn hover:shadow-pf-hover flex items-center gap-2 text-white"
            >
              <span>Get Started with Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/solutions"
              className="px-6 py-3.5 bg-white border border-[#E2E8F0] text-[#0D0F2D] rounded-xl font-bold text-sm hover:bg-purple-50 hover:border-[#C4B5FD] transition-all shadow-sm"
            >
              Explore Solutions
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full relative z-10">
          {valueProps.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0D0F2D]">{item.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Architecture Banner */}
      <section className="py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-lg">
            <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider">
              Enterprise Grade Security
            </span>
            <h2 className="text-2xl font-black text-[#0D0F2D] tracking-tight">
              Direct Meta WhatsApp Cloud API Foundation
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              No middleman servers tampering with your customer records. Direct webhook delivery, end-to-end encrypted messaging, and compliant opt-in management.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-[#0D0F2D]">
            <div className="p-4 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>99.9% Delivery</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>Meta v18.0 API</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>GDPR / Opt-in Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Card */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-[#0D0F2D] rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-6 relative overflow-hidden border border-[#7C3AED]/30">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40 inline-block">
              Ready to automate your WhatsApp?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Start Engaging Customers Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Connect your Meta WhatsApp Business API in under 5 minutes with our guided onboarding.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="gradient-button text-xs px-8 py-3.5 rounded-xl font-bold shadow-pf-btn hover:shadow-pf-hover inline-flex items-center gap-2 text-white"
              >
                <span>Enter Workspace</span>
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
