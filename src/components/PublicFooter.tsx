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
              Next-generation WhatsApp Business &amp; E-Commerce Automation infrastructure engineered for high-growth brands.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Direct Meta Cloud API v18.0 &bull; 99.9% Uptime SLA</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/solutions" className="hover:text-slate-950 transition-colors">Solutions</Link></li>
              <li><Link href="/products" className="hover:text-slate-950 transition-colors">Products</Link></li>
              <li><Link href="/integrations" className="hover:text-slate-950 transition-colors">Integrations</Link></li>
              <li><Link href="/about" className="hover:text-slate-950 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Platforms</h4>
            <ul className="space-y-2">
              <li><Link href="/integrations" className="hover:text-slate-950 transition-colors">Shopify App</Link></li>
              <li><Link href="/integrations" className="hover:text-slate-950 transition-colors">WooCommerce Plugin</Link></li>
              <li><Link href="/products" className="hover:text-slate-950 transition-colors">Multi-Agent Inbox</Link></li>
              <li><Link href="/products" className="hover:text-slate-950 transition-colors">Visual Flow Builder</Link></li>
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
            <Link href="/data-deletion" className="hover:text-slate-700 transition-colors">Data Deletion</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
