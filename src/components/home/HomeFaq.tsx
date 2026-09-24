'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Can I keep my existing WhatsApp business phone number?',
    a: 'Yes. You can onboard your existing number directly to the official Meta Cloud API, or register a new dedicated virtual number through Meta Business Manager.',
  },
  {
    q: 'Will my phone number get banned for sending bulk broadcasts?',
    a: 'No. Unlike unofficial scraping bots that trigger immediate bans, our platform connects directly to the official Meta Cloud API v18.0. All broadcasts use Meta-approved templates with 100% compliance.',
  },
  {
    q: 'How does the AI assistant know what to answer my customers?',
    a: 'You can upload your store catalog, pricing sheets, return policies, and FAQs. The AI uses this context to give accurate, brand-safe answers and suggest relevant products.',
  },
  {
    q: 'Can multiple team members reply from the same WhatsApp number simultaneously?',
    a: 'Yes! The Shared Team Inbox allows unlimited agents to respond from one official number, assign chats to specific reps, and leave private internal notes on customer profiles.',
  },
  {
    q: 'How does store synchronization work with Shopify and WooCommerce?',
    a: 'Simply connect your API keys in Settings. Products, prices, inventory availability, and customer orders synchronize automatically every 5 minutes.',
  },
  {
    q: 'Do I need coding skills to set up automated flows?',
    a: 'None at all. Our visual flow builder allows you to create interactive buttons, product menus, and keyword triggers in minutes with a simple drag-and-drop interface.',
  },
];

export function HomeFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight mt-3">
            Real Answers for Business Owners
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Everything you need to know about our official Meta Cloud WhatsApp sales infrastructure.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={f.q}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform text-slate-400 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                    {f.a}
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
