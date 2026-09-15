'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Send,
  Bot,
  Settings,
  BookOpen,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const navSections: { label?: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'Live' },
      { name: 'Team Inbox', href: '/inbox', icon: MessageSquare, badge: 'Live' },
    ],
  },
  {
    label: 'Automation & Sales',
    items: [
      { name: 'Store Integrations', href: '/dashboard/integrations', icon: ShoppingBag, badge: 'Shopify/Woo' },
      { name: 'Chatbot Flows', href: '/automations', icon: Bot },
      { name: 'Broadcasts', href: '/campaigns', icon: Send },
      { name: 'Customer CRM', href: '/contacts', icon: Users },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'API Setup Guide', href: '/setup', icon: BookOpen },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-4">
      {navSections.map((sec, si) => (
        <div key={si} className="space-y-1">
          {!collapsed && sec.label && (
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {sec.label}
            </div>
          )}
          {sec.items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex items-center rounded-xl text-xs font-semibold tracking-normal transition-all duration-150 relative group',
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
                  )}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.2 rounded-md font-mono',
                          isActive
                            ? 'bg-indigo-200/60 text-indigo-800'
                            : 'bg-slate-100 text-slate-500'
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
        </div>
      ))}
    </nav>
  );
}
