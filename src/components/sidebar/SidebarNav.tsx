'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Contact,
  Users,
  Zap,
  Send,
  FileText,
  FlaskConical,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Contacts', href: '/contacts', icon: Contact },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Broadcasts', href: '/campaigns', icon: Send },
  { name: 'Automation Lab', href: '/test-center', icon: FlaskConical },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 pt-1 overflow-y-auto max-h-[calc(100vh-140px)] pr-0.5 custom-scrollbar">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            title={collapsed ? item.name : undefined}
            className={cn(
              'flex items-center rounded-xl text-xs font-semibold tracking-normal transition-all duration-150 relative group',
              collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5',
              isActive
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
              )}
            />
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between overflow-hidden">
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono tracking-wider',
                      isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
