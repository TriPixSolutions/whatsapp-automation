'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Send,
  Bot,
  Settings,
  BookOpen,
  LogOut,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';
import { clearClientAuthCookie } from '@/lib/auth';
import { getUserAvatarUrl, getUserInitials } from '@/lib/avatar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navSections: { label?: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Team Inbox', href: '/inbox', icon: MessageSquare, badge: 'Live' },
    ],
  },
  {
    label: 'Automation & Growth',
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (e) {
        // silent
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    clearClientAuthCookie();
    router.push('/auth/login');
    router.refresh();
  };

  const displayName = user?.name || 'Workspace Member';
  const displayEmail = user?.email || 'user@passionfruit.io';
  const avatarUrl = getUserAvatarUrl(user?.email, user?.name);
  const initials = getUserInitials(user?.name, user?.email);

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between select-none fixed left-0 top-0 z-30 transition-all duration-250 ease-in-out shadow-xs',
        collapsed ? 'w-[68px] p-2.5' : 'w-60 p-4'
      )}
    >
      {/* Top Header & Navigation */}
      <div className="space-y-6">
        {/* Brand & Collapse Toggle */}
        <div className="flex items-center justify-between px-1 pt-1">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            {collapsed ? (
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white text-base font-black shadow-sm shrink-0">
                🍇
              </div>
            ) : (
              <PassionFruitLogo size="sm" showSubtitle={false} />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
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
      </div>

      {/* Footer Profile (Gravatar & Initials) */}
      <div className="pt-3 border-t border-slate-100">
        <div
          className={cn(
            'flex items-center rounded-2xl bg-slate-50/80 border border-slate-100 transition-colors',
            collapsed ? 'justify-center p-1.5' : 'justify-between px-2.5 py-2'
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Gravatar / UI-Avatar Profile Image */}
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
              {!imgError && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {!collapsed && (
              <div className="overflow-hidden space-y-0.5">
                <p className="text-xs font-bold text-slate-900 truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate" title={displayEmail}>
                  {displayEmail}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign out of workspace"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
