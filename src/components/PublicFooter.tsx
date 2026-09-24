'use client';

import React from 'react';
import Link from 'next/link';
import PassionFruitLogo from './PassionFruitLogo';

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-3">
            <PassionFruitLogo size="sm" showSubtitle={true} />
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed pt-2">
              Next-generation WhatsApp Lead Follow-Up &amp; Broadcast Automation infrastructure engineered for high-growth businesses.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Direct Meta Cloud API v18.0 &bull; 99.9% Uptime SLA</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/#features" className="hover:text-slate-950 transition-colors">Features</Link></li>
              <li><Link href="/#workflow" className="hover:text-slate-950 transition-colors">How It Works</Link></li>
              <li><Link href="/#pricing" className="hover:text-slate-950 transition-colors">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-slate-950 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Modules</h4>
            <ul className="space-y-2">
              <li><Link href="/automations" className="hover:text-slate-950 transition-colors">Lead Follow-Up Flows</Link></li>
              <li><Link href="/campaigns" className="hover:text-slate-950 transition-colors">Broadcast Marketing</Link></li>
              <li><Link href="/leads" className="hover:text-slate-950 transition-colors">Priority Leads</Link></li>
              <li><Link href="/setup" className="hover:text-slate-950 transition-colors">Meta WABA Setup</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Access</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/login" className="hover:text-indigo-600 transition-colors font-semibold text-indigo-600">Console Sign In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-slate-950 transition-colors">Start Free Trial</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-950 transition-colors">Workspace</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Passion Fruit Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-slate-700 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
