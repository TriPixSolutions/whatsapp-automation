'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Send, Sparkles, BookOpen } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-18 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md sticky top-0 z-20 px-8 py-4 flex items-center justify-between shadow-zap-sm">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-[#222222] flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#777777] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Wati AI Copilot Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200/70 text-xs text-fuchsia-700 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-500 fill-current" />
          <span>Wati AI Copilot Active</span>
        </div>

        {/* WhatsApp Setup Guide Link */}
        <Link
          href="/setup"
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-xs font-bold text-amber-900 transition-colors shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>Setup Guide</span>
        </Link>

        {/* Action Button */}
        <Link
          href="/campaigns"
          className="gradient-button text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm text-white"
        >
          <Send className="w-3.5 h-3.5" />
          <span>New Broadcast</span>
        </Link>
      </div>
    </header>
  );
}
