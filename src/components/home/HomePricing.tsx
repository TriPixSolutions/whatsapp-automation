'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    desc: 'Perfect for local service businesses and boutique stores starting with WhatsApp.',
    features: [
      '1 Official WhatsApp Business Number',
      'Up to 1,000 Active Contacts',
      'AI FAQ & Business Hours Auto-Reply',
      '2 Shared Team Inbox Seats',
      'Basic Contact CRM & Tagging',
      'Standard Email Support',
    ],
    cta: 'Start 14-Day Free Trial',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$129',
    period: '/month',
    desc: 'For high-growth e-commerce and sales teams turning chats into revenue.',
    features: [
      '1 Official WhatsApp Business Number',
      'Up to 10,000 Active Contacts',
      'Autonomous AI Sales Assistant',
      'Unlimited Broadcast Campaigns',
      '5 Shared Team Inbox Seats',
      'Shopify & WooCommerce Real-Time Sync',
      'In-Chat Checkout & Payment Links',
      'Priority Support (< 1 hr SLA)',
    ],
    cta: 'Get Started with Growth',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/month',
    desc: 'For established brands requiring custom AI fine-tuning and high message volume.',
    features: [
      'Multi-Number WABA Support',
      '50,000+ Active Contacts',
      'Custom LLM Fine-Tuned on Your Catalog',
      'Unlimited Team Seats & Routing Rules',
      'Dedicated Meta WABA Verification',
      'Custom Webhooks & REST API Access',
      '99.9% Uptime SLA & Dedicated Account Manager',
    ],
    cta: 'Contact Enterprise Sales',
    popular: false,
  },
];

export function HomePricing() {
  return (
    <section id="pricing" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-3">
            Invest in Revenue Growth, Not Hidden Fees
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            All plans include official Meta Cloud API connection with 0% markup on Meta conversation rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`p-8 rounded-2xl flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-slate-900 text-white shadow-xl shadow-indigo-500/10 border-2 border-indigo-500 relative'
                  : 'bg-slate-50 border border-slate-200 text-slate-900'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-500 text-[10px] font-black uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{p.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-4xl font-black tracking-tight">{p.price}</span>
                  <span className={`text-xs ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>{p.period}</span>
                </div>
                <p className={`text-xs leading-relaxed mb-6 ${p.popular ? 'text-slate-400' : 'text-slate-600'}`}>
                  {p.desc}
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-200/20 mb-8">
                  {p.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={p.popular ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/auth/signup"
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  p.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300'
                }`}
              >
                <span>{p.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
