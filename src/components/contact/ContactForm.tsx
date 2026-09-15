'use client';

import React, { useState } from 'react';
import { Send, MessageCircle, CheckCircle2, Shield } from 'lucide-react';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    useCase: 'sales',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          {/* Left: Instant WhatsApp Channel */}
          <div className="md:col-span-2 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                Fastest Response
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                Chat Directly on WhatsApp
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Experience our platform firsthand. Message our live enterprise WhatsApp concierge for immediate answers.
              </p>
            </div>

            <a
              href="https://wa.me/18005550199?text=Hi%20Passion%20Fruit%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20AI%20WhatsApp%20Platform."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Launch WhatsApp Chat</span>
            </a>

            <div className="pt-4 border-t border-slate-200/80 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Immediate live agent routing</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Confidential business consultation</span>
              </div>
            </div>
          </div>

          {/* Right: Consultation Request Form */}
          <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Request Received!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Our solution architects will review your business use case and contact you within 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Request an Architecture Consultation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Store Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Company Inc."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Objective</label>
                  <select
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="sales">More Leads & Direct WhatsApp Sales</option>
                    <option value="support">24/7 AI Customer Support & Shared Team Inbox</option>
                    <option value="ecommerce">Shopify / WooCommerce Catalog & Cart Recovery</option>
                    <option value="broadcasts">High-Volume Broadcast Campaigns</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Consultation Request</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
