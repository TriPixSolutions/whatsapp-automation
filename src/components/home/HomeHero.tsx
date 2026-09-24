'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Play, Sparkles, ShieldCheck } from 'lucide-react';

export function HomeHero() {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/15 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI WhatsApp Sales & Support Platform</span>
        </div>

        {/* Strong Business Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.12]">
          Turn WhatsApp Conversations into{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700">
            Paying Customers 24/7
          </span>
        </h1>

        {/* One-Sentence Plain English Explanation */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The AI sales and customer support platform that captures leads, answers buyer questions in seconds, and closes deals directly inside WhatsApp without adding headcount.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:gap-3"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/#pricing"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-2xs flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-slate-500" />
            <span>Explore Plans &amp; Demo</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Official Meta Cloud API
          </span>
        </div>
      </div>
    </section>
  );
}
