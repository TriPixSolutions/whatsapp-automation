'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Send,
  GitFork,
  Settings,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Audience & Contacts', href: '/contacts', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Send },
  { name: 'Automations', href: '/automations', icon: GitFork },
  { name: 'Test Scenario Lab', href: '/dashboard#test-lab', icon: FlaskConical },
  { name: 'API & Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#07090E] border-r border-white/10 flex flex-col justify-between p-5 select-none fixed left-0 top-0 z-30">
      {/* Top Brand Identity */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-white/5 pb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#AA820A] to-[#07090E] p-[1px] shadow-gold-glow flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#E6C687]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-widest text-sm uppercase">AURA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 tracking-wider">WhatsApp Cloud SaaS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 group relative',
                  isActive
                    ? 'bg-white/10 text-white shadow-luxury-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#D4AF37]" />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-[#E6C687]' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Meta API Status */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="bg-[#0B0F17] border border-white/5 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400">Meta Cloud API</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v18.0 Connected
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 truncate font-mono">
            Hostinger BullMQ Active
          </div>
        </div>

        {/* Agency Profile */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-200 flex items-center justify-center text-black font-bold text-xs">
            AV
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">Apex Luxury Concierge</p>
            <p className="text-[10px] text-zinc-400 truncate">Tier-1 High-Ticket Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
