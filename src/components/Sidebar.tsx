'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';
import { SidebarNav } from './sidebar/SidebarNav';
import { SidebarProfile } from './sidebar/SidebarProfile';

import { MobileBottomNav } from './MobileBottomNav';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
        window.dispatchEvent(new CustomEvent('sidebar-collapse', { detail: { collapsed: next } }));
      } catch {}
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex h-screen bg-white border-r border-slate-200/80 flex-col justify-between select-none fixed left-0 top-0 z-30 transition-all duration-200 ease-in-out shadow-xs',
          collapsed ? 'w-[68px] p-2.5' : 'w-60 p-4'
        )}
      >
        <div className="space-y-6">
          {/* Brand & Collapse Button */}
          <div className="flex items-center justify-between px-1 pt-1">
            <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
              {collapsed ? (
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                  P
                </div>
              ) : (
                <PassionFruitLogo size="sm" showSubtitle={false} />
              )}
            </Link>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Modular Navigation */}
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Modular Profile Footer */}
        <SidebarProfile collapsed={collapsed} />
      </aside>

      {/* Mobile Touch Navigation (iPhone / Android) */}
      <MobileBottomNav />
    </>
  );
}
