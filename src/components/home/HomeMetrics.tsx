'use client';

import React from 'react';
import { MessageSquareText, UserCheck, Clock, Award } from 'lucide-react';

const metrics = [
  {
    label: 'Messages Automated',
    value: '2,400,000+',
    detail: 'Customer inquiries handled 24/7 without manual staff delays',
    icon: MessageSquareText,
    accent: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    label: 'Leads Captured',
    value: '185,000+',
    detail: 'High-intent prospects verified & synced to CRM directly from chat',
    icon: UserCheck,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    label: 'Response Time Saved',
    value: '85%',
    detail: 'Average customer reply latency drops from 4 hours to under 3 seconds',
    icon: Clock,
    accent: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    label: 'Customer Satisfaction',
    value: '99.4%',
    detail: 'Accurate product answers, instant checkouts, and zero hold times',
    icon: Award,
    accent: 'text-amber-600 bg-amber-50 border-amber-100',
  },
];

export function HomeMetrics() {
  return (
    <section className="border-y border-slate-200/80 bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {m.label}
                  </span>
                  <div className={`p-2 rounded-xl border ${m.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 tracking-tight">
                  {m.value}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {m.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
