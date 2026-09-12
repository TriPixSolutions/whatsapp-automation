'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Send,
  Bot,
  Settings,
  FlaskConical,
  Inbox,
  Megaphone,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Team Inbox', href: '/dashboard#team-inbox', icon: Inbox, badge: 'AI Copilot' },
  { name: 'No-Code Chatbot', href: '/automations', icon: Bot, badge: 'Flows' },
  { name: 'Bulk Broadcasts', href: '/campaigns', icon: Send },
  { name: 'Audience CRM', href: '/contacts', icon: Users },
  { name: 'CTWA Ads Tracker', href: '/dashboard#ctwa', icon: Megaphone, badge: 'Meta' },
  { name: 'Test Scenario Lab', href: '/dashboard#test-lab', icon: FlaskConical },
  { name: 'API & Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#E5E7EB] flex flex-col justify-between p-5 select-none fixed left-0 top-0 z-30 shadow-sm">
      {/* Top Brand Identity */}
      <div>
        <Link href="/" className="block px-1 py-2 mb-5 border-b border-[#E5E7EB] pb-4 group">
          <PassionFruitLogo size="sm" showSubtitle={true} />
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
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#00A3FF] text-white shadow-zap-btn'
                    : 'text-[#555555] hover:text-[#222222] hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-[#777777] group-hover:text-[#0066FF]'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200/60'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Meta API Status */}
      <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#777777]">Meta Cloud API</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v18.0 Active
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
            <span>BullMQ 50ms Pacing</span>
            <span className="text-fuchsia-600 font-bold">Wati AI On</span>
          </div>
        </div>

        {/* Workspace Account */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            PF
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#222222] truncate">Passion Fruit Agency</p>
            <p className="text-[10px] text-[#777777] truncate">pkrishal462@gmail.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
