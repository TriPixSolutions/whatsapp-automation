'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Users,
  Send,
  Smartphone,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Automations', href: '/automations', icon: Bot },
    { name: 'Leads', href: '/contacts', icon: Users },
    { name: 'Broadcasts', href: '/campaigns', icon: Send },
    { name: 'WhatsApp', href: '/setup', icon: Smartphone },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 min-h-[48px] min-w-[56px]',
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-0.5">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
