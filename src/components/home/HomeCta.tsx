'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function HomeCta() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-10 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-500/10">
          {/* Ambient light glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

          <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-300 bg-white/10 px-3 py-1 rounded-full border border-white/15 mb-4">
            Get Started in 5 Minutes
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Accelerate Your WhatsApp Sales?
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Stop losing buyers to slow manual replies. Activate your 24/7 AI sales & support agent today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:gap-3"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Speak with an Specialist</span>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free 14-day access
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Official Meta Verified
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
