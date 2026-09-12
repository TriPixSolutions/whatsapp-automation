'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';
import { clearClientAuthCookie } from '@/lib/auth';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Broadcasts', href: '/campaigns', icon: Send },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Flows', href: '/automations', icon: Bot },
  { name: 'Setup', href: '/setup', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (e) {}
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
  const displayAvatar =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7C3AED&color=ffffff&bold=true&rounded=true&size=128`;
  const initial = (displayName[0] || 'U').toUpperCase();

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

      {/* Footer / User Session & Logout */}
      <div className="pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-inner">
              {!imgError && displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#0D0F2D] truncate" title={displayName}>
                {displayName}
              </p>
              <p className="text-[10px] text-[#94A3B8] font-mono truncate" title={displayEmail}>
                {displayEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of workspace"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
