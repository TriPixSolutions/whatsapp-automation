'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearClientAuthCookie } from '@/lib/auth';
import { getUserAvatarUrl, getUserInitials } from '@/lib/avatar';

export function SidebarProfile({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
    <div className="pt-3 border-t border-slate-100">
      <div
        className={cn(
          'flex items-center rounded-2xl bg-slate-50/80 border border-slate-100 transition-colors',
          collapsed ? 'justify-center p-1.5' : 'justify-between px-2.5 py-2'
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
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
  );
}
