'use client';

import React from 'react';
import { MessageSquare, Cpu, Sliders, Database, Send, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    name: 'Customer Message',
    desc: 'Buyer sends an inquiry via WhatsApp, website widget, or Instagram ad.',
    icon: MessageSquare,
  },
  {
    step: '02',
    name: 'AI Analysis',
    desc: 'Natural language engine understands buyer intent, language, and budget.',
    icon: Cpu,
  },
  {
    step: '03',
    name: 'Automation Rules',
    desc: 'Checks inventory, checks pricing, or triggers multi-agent routing.',
    icon: Sliders,
  },
  {
    step: '04',
    name: 'CRM Update',
    desc: 'Contact record, cart details, and interaction logs sync to database.',
    icon: Database,
  },
  {
    step: '05',
    name: 'WhatsApp Reply',
    desc: 'Instant personalized response with products, checkout link, or answers.',
    icon: Send,
  },
];

export function HomeWorkflow() {
  return (
    <section id="workflow" className="py-20 bg-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-3">
            From Incoming Chat to Closed Sale in 5 Seconds
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            An autonomous workflow that guarantees every prospective buyer receives an instant, intelligent reply.
          </p>
        </div>

        {/* 5-Step Visual Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-black text-indigo-600">
                      {s.step}
                    </span>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {s.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-slate-400">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
