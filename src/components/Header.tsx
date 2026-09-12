'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  BookOpen,
  LogOut,
  Settings,
  ShieldCheck,
  ChevronDown,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { clearClientAuthCookies } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { UserRecord } from '@/lib/db/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      } catch (e) {
        // silent fail
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleSignOut = () => {
    clearClientAuthCookies();
    router.push('/auth/login');
    router.refresh();
  };

  const displayName = user?.name || 'Workspace Member';
  const displayEmail = user?.email || 'user@passionfruit.io';
  const displayAvatar =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7C3AED&color=ffffff&bold=true&rounded=true&size=128`;
  const initial = (displayName[0] || 'U').toUpperCase();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="h-18 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-8 py-4 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-[#0D0F2D] flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Wati AI Copilot Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-[#C4B5FD]/70 text-xs text-[#7C3AED] font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] fill-current" />
          <span>Wati AI Copilot Active</span>
        </div>

        {/* WhatsApp Setup Guide Link */}
        <Link
          href="/setup"
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] text-xs font-bold text-[#0D0F2D] hover:text-[#7C3AED] transition-all shadow-2xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>Setup Guide</span>
        </Link>

        {/* Broadcast Action Button */}
        <Link
          href="/campaigns"
          className="gradient-button text-xs px-3.5 sm:px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs text-white"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Broadcast</span>
        </Link>

        {/* User Profile Avatar with Click-to-Open Sign Out Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            className={cn(
              'flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-3 rounded-2xl border transition-all cursor-pointer select-none',
              menuOpen
                ? 'bg-purple-50 border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
            )}
            title="User profile & account settings"
          >
            {/* Profile Picture Avatar */}
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
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

            {/* Name and Role (Desktop) */}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize leading-tight">
                {user?.role?.replace('_', ' ') || 'Member'}
              </span>
            </div>

            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-slate-400 transition-transform duration-150',
                menuOpen && 'rotate-180 text-[#7C3AED]'
              )}
            />
          </button>

          {/* Sleek Floating Profile Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Header */}
              <div className="flex items-center gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-inner">
                  {!imgError && displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                <div className="overflow-hidden space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{displayEmail}</span>
                  </div>
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider',
                      isSuperAdmin
                        ? 'bg-purple-100 text-[#7C3AED]'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    )}
                  >
                    {isSuperAdmin ? 'Super Admin' : 'Approved Member'}
                  </span>
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="space-y-1 pt-1 border-t border-slate-100 text-xs font-medium text-slate-700">
                {isSuperAdmin && (
                  <Link
                    href="/super-admin-control"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-[#7C3AED] transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                    <span className="font-bold">Super Admin Control</span>
                  </Link>
                )}

                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account &amp; Workspace Settings</span>
                </Link>

                <Link
                  href="/setup"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>WhatsApp API Setup Guide</span>
                </Link>
              </div>

              {/* Sign Out Action Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Passion Fruit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
