'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Send,
  Bot,
  Settings,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';
import { clearClientAuthCookie } from '@/lib/auth';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Broadcasts', href: '/campaigns', icon: Send },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Flows', href: '/automations', icon: Bot },
  { name: 'Setup', href: '/setup', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearClientAuthCookie();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-4 select-none fixed left-0 top-0 z-30">
      {/* Top Brand Identity */}
      <div className="space-y-6">
        <Link href="/dashboard" className="block px-2 pt-2">
          <PassionFruitLogo size="sm" showSubtitle={false} />
        </Link>

        {/* Minimal Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors',
                  isActive
                    ? 'bg-purple-50 text-[#7C3AED] font-bold'
                    : 'text-[#64748B] hover:text-[#0D0F2D] hover:bg-[#F4F6FB]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8]'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Minimal User Session & Logout */}
      <div className="pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#0D0F2D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              U1
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#0D0F2D] truncate">User 1</p>
              <p className="text-[10px] text-[#94A3B8] truncate">Production</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of workspace"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
