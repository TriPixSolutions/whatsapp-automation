'use client';

import React, { useState } from 'react';
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
  ShoppingBag,
  TrendingUp,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'cart' | 'chat' | 'broadcast'>('cart');

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />

      {/* ─── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden bg-dot-pattern">
        {/* Ambient Top Glow */}
        <div className="absolute top-16 w-[700px] h-[360px] bg-gradient-to-b from-indigo-200/40 via-purple-100/30 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs text-[11px] font-semibold text-slate-700 backdrop-blur-md mb-6 hover:border-slate-300 transition-colors">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
          </span>
          <span className="font-bold text-slate-900">Next-Gen SaaS</span>
          <span className="text-slate-300">•</span>
          <span>Official Meta Cloud API v18.0 &amp; E-Commerce Automation</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 max-w-5xl leading-[1.08] mb-6">
          The Autonomous WhatsApp &amp; E-Commerce{' '}
          <span className="gradient-text-purple">Revenue Engine</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Recover abandoned carts on Shopify &amp; WooCommerce, qualify inbound leads with no-code visual chatbots, and collaborate inside a lightning-fast multi-agent team inbox.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-16">
          <Link
            href="/auth/signup"
            className="gradient-button text-sm px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 text-white shadow-md group"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3.5 bg-white border border-slate-200/90 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-2"
          >
            <span>Live Workspace Console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* ─── GLOWING DASHBOARD MOCKUP / TELEMETRY HERO ILLUSTATION ───────────────── */}
        <div className="w-full max-w-5xl relative z-10">
          <div className="rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-200/80 via-slate-100 to-white/40 border border-slate-200/80 shadow-2xl backdrop-blur-xl">
            <div className="bg-[#090A0F] rounded-2xl border border-zinc-800/80 p-4 sm:p-6 text-left text-white overflow-hidden shadow-2xl">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-zinc-500 font-mono text-[11px] ml-2">console.passionfruit.io &bull; Active Workspace</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud API v18.0 Live Handshake</span>
                </div>
              </div>

              {/* Top Sparkline Metric Cards inside Mockup */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Recovered Cart GMV</span>
                  <div className="text-lg sm:text-xl font-bold text-white tracking-tight">$42,850.00</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>+28.4% this month</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Delivery Success SLA</span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-400 tracking-tight">99.82%</div>
                  <div className="text-[10px] text-zinc-400">Zero phone bans</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Active Conversations</span>
                  <div className="text-lg sm:text-xl font-bold text-white tracking-tight">1,420 chats</div>
                  <div className="text-[10px] text-indigo-300 font-semibold">Wati Copilot responding</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Avg Response Latency</span>
                  <div className="text-lg sm:text-xl font-bold text-indigo-400 tracking-tight">1.2s</div>
                  <div className="text-[10px] text-zinc-400">Sub-second webhook trigger</div>
                </div>
              </div>

              {/* Interactive Mock Chat & Webhook Flow Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left: Webhook Event Log */}
                <div className="md:col-span-5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 p-3.5 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Live Webhook Events</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">STREAMING</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 flex items-start gap-2">
                      <span className="text-indigo-400">⚡</span>
                      <div>
                        <span className="text-white font-semibold">orders/create</span>
                        <p className="text-zinc-400 text-[10px]">Shopify Order #10429 &bull; $149.00</p>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 flex items-start gap-2">
                      <span className="text-amber-400">🛒</span>
                      <div>
                        <span className="text-white font-semibold">checkouts/abandoned</span>
                        <p className="text-zinc-400 text-[10px]">WooCommerce #9921 &bull; Auto-triggered</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: WhatsApp Message Simulation */}
                <div className="md:col-span-7 bg-[#0b141a] rounded-xl border border-zinc-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                        PF
                      </div>
                      <span className="text-xs font-bold text-white">Passion Fruit Official Store</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">Verified</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">11:42 AM</span>
                  </div>

                  <div className="bg-[#202c33] text-zinc-100 rounded-2xl rounded-tl-none p-3.5 text-xs max-w-sm space-y-2 border border-zinc-700/40">
                    <p className="font-semibold text-emerald-400 text-[11px]">🎉 Your Order #10429 is Confirmed!</p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Hey Alex, thanks for shopping with us! We&apos;ve reserved your order and tracking will be updated live here.
                    </p>
                    <div className="pt-1 flex flex-col gap-1.5">
                      <div className="p-2 rounded-lg bg-zinc-800/80 text-[10px] font-bold text-center text-indigo-300 border border-zinc-700/60">
                        📦 Track Shipment Live
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-800/80 text-[10px] font-bold text-center text-zinc-200 border border-zinc-700/60">
                        💬 Speak to Live Concierge
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / STATS BAR ─────────────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">98%</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Average Open Rate vs 20% Email</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">&lt; 1.2s</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Direct Webhook Processing Latency</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">3.4x</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Higher Conversion on Cart Recovery</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">Zero</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Middleman Server Markup Fees</p>
          </div>
        </div>
      </section>

      {/* ─── BENTO-BOX FEATURE GRID ────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 inline-block">
            Architected for Growth
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Everything your brand needs on WhatsApp
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminate duct-taped integrations. Passion Fruit unifies marketing broadcasts, automated support, and e-commerce recovery into one seamless command center.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: 1-Click E-Commerce Cart Recovery (Large) */}
          <div className="md:col-span-8 glass-card rounded-3xl p-8 sm:p-10 space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3 max-w-lg">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Native Shopify &amp; WooCommerce Cart Recovery
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Trigger automated WhatsApp messages the second a shopper leaves your checkout. Include instant 1-tap recovery links, dynamic discount coupons, and live inventory reminders.
              </p>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">Instant Webhooks</span>
                <span className="text-[11px] text-slate-500">Auto-configured in under 60 seconds</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">Encrypted Keys</span>
                <span className="text-[11px] text-slate-500">AES-256-GCM security at rest</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">Order Status Sync</span>
                <span className="text-[11px] text-slate-500">Live Customers, Orders &amp; Products</span>
              </div>
            </div>
          </div>

          {/* Card 2: Visual Chatbot Builder */}
          <div className="md:col-span-4 glass-card rounded-3xl p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">
                No-Code Flow Builder
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Design branching conversation journeys with interactive 3-button cards and list selectors. Qualify leads 24/7 with zero code.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-700">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Trigger Rule</div>
              <p className="font-semibold text-indigo-700 mt-0.5">Keyword: &quot;Pricing&quot; → 3-Button Card</p>
            </div>
          </div>

          {/* Card 3: Multi-Agent Shared Inbox */}
          <div className="md:col-span-5 glass-card rounded-3xl p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">
                Collaborative Team Inbox
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Equip your sales and support agents with a single shared workspace. Assign chats, leave private internal notes, and avoid agent collision.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Collision detection &bull; No double replies</span>
            </div>
          </div>

          {/* Card 4: Compliant Broadcast Engine (Large) */}
          <div className="md:col-span-7 glass-card rounded-3xl p-8 sm:p-10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3 max-w-lg">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                High-Volume Broadcast Engine
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Send Meta-approved template broadcasts with personalized variables. Built-in rate limiting guarantees 100% compliance with WhatsApp Business policies and protects your phone number tier.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Live Read Receipts</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Safe Rate Limiter</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Tag-Based Audience Filtering</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-[#090A0F] rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-6 relative overflow-hidden border border-zinc-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 inline-block">
              5-Minute Guided Setup
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Transform your customer conversion today
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Sign in with your email or start a free trial. Zero middleman markups, 1,000 free monthly conversations, and enterprise reliability.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/signup"
                className="gradient-button text-xs px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 text-white shadow-lg group"
              >
                <span>Create Workspace Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
