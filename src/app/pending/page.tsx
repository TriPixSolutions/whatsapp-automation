'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Mail,
  Building,
  ArrowRight,
  AlertCircle,
  Radio,
} from 'lucide-react';
import PassionFruitLogo from '@/components/PassionFruitLogo';
import { clearClientAuthCookie } from '@/lib/auth';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  company?: string;
  createdAt?: string;
}

export default function PendingApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Check auth session & real-time approval status
  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setIsChecking(true);
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        setCheckCount((prev) => prev + 1);

        if (data.user.status === 'approved') {
          setIsApproved(true);
          // Wait 800ms to show the green confirmation and transition smoothly
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 800);
        }
      } else {
        // Not authenticated, send to login
        router.replace('/auth/login');
      }
    } catch (e) {
      console.warn('Heartbeat check error:', e);
    } finally {
      setLoading(false);
      if (manual) setIsChecking(false);
    }
  }, [router]);

  // Initial check on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Real-time heartbeat probe every 2.5 seconds
  useEffect(() => {
    if (isApproved) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, [isApproved, checkStatus]);

  const handleSignOut = () => {
    clearClientAuthCookie();
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <PassionFruitLogo size="sm" showSubtitle={false} />
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{user.email}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-xl">
          {isApproved ? (
            /* Instant Approval Success Transition State */
            <div className="bg-white border-2 border-emerald-500/80 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-250">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  Access Approved!
                </h2>
                <p className="text-sm text-slate-600">
                  Your account has been authorized by a Superadmin. Your session has been refreshed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Redirecting to your main workspace...</span>
              </div>
            </div>
          ) : (
            /* Pending Approval Waiting Room */
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-9 shadow-sm space-y-6">
              {/* Header Status Badge */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Pending Superadmin Approval</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Radio className="w-3 h-3 text-indigo-500 animate-pulse" />
                  <span>Live heartbeat sync active</span>
                </div>
              </div>

              {/* Title & Explanation */}
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                  Account Under Review
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Thank you for registering for <strong className="text-slate-800 font-bold">Passion Fruit</strong>. To protect WhatsApp API quotas and ensure platform security, new accounts require one-time approval by a Superadmin.
                </p>
              </div>

              {/* User Identity Card */}
              {user && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    Account Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Full Name</span>
                      <span className="font-bold text-slate-800">{user.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Work Email</span>
                      <span className="font-mono font-medium text-slate-800">{user.email}</span>
                    </div>
                    {user.company && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Organization</span>
                        <span className="font-semibold text-slate-800">{user.company}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block text-[11px]">Authorization Status</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                        <Clock className="w-3 h-3" /> Under Review
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3-Step Verification Pipeline */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
                  Approval Timeline
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-emerald-950">Registration Submitted</p>
                      <p className="text-[11px] text-emerald-700">Account credentials validated and saved.</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      Done
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-amber-950">Superadmin Review</p>
                      <p className="text-[11px] text-amber-700">Awaiting approval in the Superadmin Portal.</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-600">Workspace Activation</p>
                      <p className="text-[11px] text-slate-400">Instant access to Team Inbox, Flows &amp; Broadcasts.</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Automatic Refresh Info & Manual Refresh Trigger */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <RefreshCw className={isChecking ? 'w-3.5 h-3.5 text-indigo-600 animate-spin' : 'w-3.5 h-3.5 text-slate-400'} />
                  <span>Auto-syncing every 2.5s {checkCount > 0 && <span className="font-mono text-[11px]">({checkCount} checks)</span>}</span>
                </div>

                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={isChecking}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Check Status Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
