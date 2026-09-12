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
  Sparkles,
  Inbox,
  Megaphone,
  BookOpen,
  LogOut,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';
import { clearAdminSession } from '@/lib/auth-admin';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Team Inbox', href: '/dashboard#team-inbox', icon: Inbox, badge: 'AI Copilot' },
  { name: 'No-Code Chatbot', href: '/automations', icon: Bot, badge: 'Flows' },
  { name: 'Send Broadcasts', href: '/campaigns', icon: Send },
  { name: 'Customer Contacts', href: '/contacts', icon: Users },
  { name: 'Meta Ad Leads', href: '/dashboard#ctwa', icon: Megaphone, badge: 'Meta' },
  { name: 'Quick WhatsApp Sender', href: '/dashboard#quick-sender', icon: Smartphone },
  { name: 'WhatsApp Setup Guide', href: '/setup', icon: BookOpen, badge: 'Start Here', highlight: true },
  { name: 'Settings & Security', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#E5E7EB] flex flex-col justify-between p-5 select-none fixed left-0 top-0 z-30 shadow-sm overflow-y-auto">
      {/* Top Brand Identity */}
      <div>
        <Link href="/" className="block px-1 py-2 mb-4 border-b border-[#E5E7EB] pb-4 group">
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
                    : item.highlight
                    ? 'bg-amber-50/70 text-amber-900 border border-amber-200/60 hover:bg-amber-100/60'
                    : 'text-[#555555] hover:text-[#222222] hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-amber-600'
                        : 'text-[#777777] group-hover:text-[#0066FF]'
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
                        : item.highlight
                        ? 'bg-amber-500 text-white shadow-sm'
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
              Connected (v18.0)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Delivery Protection: Safe</span>
            <span className="text-fuchsia-600 font-bold">Wati AI On</span>
          </div>
        </div>

        {/* Workspace Account & Logout */}
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
              PF
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#222222] truncate">Super Admin</p>
              <p className="text-[10px] text-[#777777] truncate">pkrishal462@gmail.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out Super Admin"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
