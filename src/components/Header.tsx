'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Plus, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-20 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl sticky top-0 z-20 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Meta Cloud Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E6C687]" />
          <span>Meta WABA: 102938475610293</span>
        </div>

        {/* Action Button */}
        <Link
          href="/campaigns"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#E6C687] hover:to-[#C5A035] text-black text-xs font-semibold tracking-wide transition-all duration-200 shadow-gold-glow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </Link>
      </div>
    </header>
  );
}
