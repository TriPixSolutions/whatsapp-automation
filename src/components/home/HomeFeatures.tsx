'use client';

import React from 'react';
import { Bot, MessageSquare, Filter, Users, Send, BarChart3, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Instant Auto Replies',
    desc: 'Answer pricing, shipping, and store hours 24/7. Never let a high-intent shopper wait until morning.',
    icon: MessageSquare,
    tag: '24/7 Availability',
  },
  {
    title: 'AI Sales Assistant',
    desc: 'Trained on your product catalog and FAQs to recommend items, handle objections, and share payment links.',
    icon: Bot,
    tag: 'Autonomous Closing',
  },
  {
    title: 'Smart Lead Qualification',
    desc: 'Automatically asks budget, timeline, and location, filtering hot buyers before alerting your sales team.',
    icon: Filter,
    tag: 'Zero Wasted Time',
  },
  {
    title: 'Shared Team Inbox',
    desc: 'One official WhatsApp business number shared across multiple agents with private notes and assignment rules.',
    icon: Users,
    tag: 'Collaborative Support',
  },
  {
    title: 'High-Converting Broadcasts',
    desc: 'Send product drops, seasonal promotions, and cart recovery alerts with 98% open rates and 0% ban risk.',
    icon: Send,
    tag: 'Meta-Approved Delivery',
  },
  {
    title: 'Revenue Analytics',
    desc: 'Track sales generated, customer response latency, agent workload, and chat conversion funnels in real time.',
    icon: BarChart3,
    tag: 'Actionable Insights',
  },
];

export function HomeFeatures() {
  return (
    <section id="features" className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
            Engineered for Growth
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-3">
            Everything You Need to Scale Sales and Support on WhatsApp
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            Replace chaotic phone chat groups and lost leads with a unified, automated commercial sales engine.
          </p>
        </div>

        {/* Infographic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 group relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Explore Features CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/solutions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>Explore full platform capabilities and live demos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
