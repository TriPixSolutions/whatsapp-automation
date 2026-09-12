'use client';

import React from 'react';
import Link from 'next/link';
import PassionFruitLogo from './PassionFruitLogo';

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] pt-16 pb-12 text-[#64748B] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-3">
            <PassionFruitLogo size="sm" showSubtitle={true} />
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed pt-2">
              The clean, modern, and scalable WhatsApp Business automation platform built on official Meta Cloud API v18.0+.
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              Official Meta Tech Provider Compliant.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">Pages</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-[#7C3AED] transition-colors">Home</Link></li>
              <li><Link href="/solutions" className="hover:text-[#7C3AED] transition-colors">Solutions</Link></li>
              <li><Link href="/products" className="hover:text-[#7C3AED] transition-colors">Products</Link></li>
              <li><Link href="/integrations" className="hover:text-[#7C3AED] transition-colors">Integrations</Link></li>
              <li><Link href="/about" className="hover:text-[#7C3AED] transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">Features</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="hover:text-[#7C3AED] transition-colors">Shared Team Inbox</Link></li>
              <li><Link href="/products" className="hover:text-[#7C3AED] transition-colors">No-Code Chatbot Flows</Link></li>
              <li><Link href="/products" className="hover:text-[#7C3AED] transition-colors">Bulk Broadcast Engine</Link></li>
              <li><Link href="/products" className="hover:text-[#7C3AED] transition-colors">Meta CTWA Ad Tracking</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">Console</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/login" className="hover:text-[#7C3AED] transition-colors font-bold text-[#7C3AED]">Sign In (User 1)</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#7C3AED] transition-colors">Production Dashboard</Link></li>
              <li><span className="text-[11px] text-emerald-600 font-mono font-bold">API v18.0 Active</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#94A3B8]">
          <p>© {new Date().getFullYear()} Passion fruit. Clean, Modern, Scalable. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Meta API Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
