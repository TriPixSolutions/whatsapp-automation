'use client';

import React from 'react';
import { MessageSquare, Bot, ShoppingCart, Zap, TrendingUp, Check } from 'lucide-react';

export function HomePreview() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-900 p-2 sm:p-4 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Top Browser / App Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[11px] text-slate-400">Live AI Sales Session • +1 (800) 555-0199</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Agent Active
          </span>
        </div>

        {/* Mock Live Conversation Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-left">
          {/* Incoming Customer Message */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-white">Shopper Inquiry</span>
              <span>10:42 AM</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              "Hi! Do you have the Merino Wool Trench Coat in Size M? Can I buy it right now?"
            </p>
            <div className="pt-2 border-t border-slate-700/40 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
              <Zap className="w-3 h-3" /> High Intent Detected (98%)
            </div>
          </div>

          {/* AI Instant Processing */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-indigo-300">
              <span className="font-semibold flex items-center gap-1 text-white">
                <Bot className="w-3.5 h-3.5 text-indigo-400" /> AI Sales Engine
              </span>
              <span className="font-mono text-[10px] text-indigo-300">0.8s latency</span>
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              "Yes! We have 3 units remaining in Size M ($320). Tap below for instant one-click WhatsApp checkout."
            </p>
            <div className="pt-2 border-t border-indigo-500/20 flex items-center gap-2 text-[10px] text-indigo-300">
              <ShoppingCart className="w-3 h-3 text-indigo-400" /> Auto-Generated Stripe Payment Link
            </div>
          </div>

          {/* Business Result Card */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-emerald-300">
              <span className="font-semibold flex items-center gap-1 text-white">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Conversion Closed
              </span>
              <span className="text-emerald-400 font-bold">$320.00</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Customer confirmed payment in WhatsApp. Inventory synchronized with Shopify & CRM lead marked as Won.
            </p>
            <div className="pt-2 border-t border-emerald-500/20 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <Check className="w-3.5 h-3.5" /> 0 human staff intervention required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
