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
  Sparkles,
  FlaskConical,
  Inbox,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Team Inbox', href: '/dashboard#team-inbox', icon: Inbox },
  { name: 'Audience & Contacts', href: '/contacts', icon: Users },
  { name: 'Bulk Campaigns', href: '/campaigns', icon: Send },
  { name: 'Workflows & Rules', href: '/automations', icon: GitFork },
  { name: 'Test Scenario Lab', href: '/dashboard#test-lab', icon: FlaskConical },
  { name: 'API & Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#E5E7EB] flex flex-col justify-between p-5 select-none fixed left-0 top-0 z-30 shadow-sm">
      {/* Top Brand Identity */}
      <div>
        <Link href="/" className="flex items-center gap-2.5 px-2 py-3 mb-6 border-b border-[#E5E7EB] pb-5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] flex items-center justify-center text-white shadow-zap-btn group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#222222] tracking-tight text-base">ZapElite</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-[#0066FF] font-bold border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-[#777777]">Meta WhatsApp SaaS</p>
          </div>
        </Link>

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
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group relative',
                  isActive
                    ? 'bg-[#0066FF] text-white shadow-zap-btn'
                    : 'text-[#555555] hover:text-[#222222] hover:bg-slate-50'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-white' : 'text-[#777777] group-hover:text-[#0066FF]'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Meta API Status */}
      <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#777777]">Meta Cloud API</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v18.0 Connected
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            BullMQ Queue Active
          </div>
        </div>

        {/* Workspace Account */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] flex items-center justify-center text-white font-bold text-xs">
            ZE
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#222222] truncate">ZapElite Enterprise</p>
            <p className="text-[10px] text-[#777777] truncate">pkrishal462@gmail.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
