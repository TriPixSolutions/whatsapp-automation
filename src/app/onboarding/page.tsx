'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Building,
  ArrowRight,
  LogOut,
  RefreshCw,
  Lock,
  MessageSquare,
  Bot,
  Zap,
} from 'lucide-react';
import PassionFruitLogo from '@/components/PassionFruitLogo';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'new_user' | 'unrequested' | 'pending_approval' | 'approved' | 'rejected';
  company?: string;
  intendedUse?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<'new_user' | 'pending_approval' | 'approved' | 'rejected'>('new_user');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch current session and profile
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        const userStatus = data.user.status;

        if (userStatus === 'approved') {
          setStatus('approved');
          // Automatically route approved users to dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 1200);
          return;
        }

        if (userStatus === 'pending_approval') {
          setStatus('pending_approval');
        } else if (userStatus === 'rejected') {
          setStatus('rejected');
        } else {
          setStatus('new_user');
        }

        if (data.user.company && !company) setCompany(data.user.company);
        if (data.user.intendedUse && !useCase) setUseCase(data.user.intendedUse);
      } else {
        router.push('/auth/login');
      }
    } catch (e) {
      console.error('Session check failed', e);
    } finally {
      setLoadingUser(false);
    }
  }, [router, company, useCase]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Live polling: check status every 3 seconds to auto-transition when Super Admin approves
  useEffect(() => {
    if (status !== 'pending_approval') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user?.status === 'approved') {
          setStatus('approved');
          clearInterval(interval);
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      } catch (e) {
        // silent retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, router]);

  const handleRequestAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          company: company.trim() || 'Enterprise Workspace',
          intendedUse: useCase.trim() || 'WhatsApp Automation & CRM',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('pending_approval');
      }
    } catch (err) {
      console.error('Failed to request access:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    document.cookie = 'pf_auth=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pf_user_id=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pf_status=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pf_role=; path=/; max-age=0; SameSite=Lax';
    try {
      localStorage.removeItem('pf_session');
    } catch (e) {}
    router.push('/auth/login');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 text-[#7C3AED] animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Checking onboarding status...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial from-purple-50/50 via-slate-50 to-white text-[#0D0F2D] flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <PassionFruitLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 font-medium">{user.email}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        {/* Approved State Banner */}
        {status === 'approved' && (
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-emerald-200 shadow-2xl shadow-emerald-500/10 text-center space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Access Granted! Welcome Aboard.
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your account has been approved by the Super Admin. Directing you to the Passion Fruit dashboard...
              </p>
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Entering Workspace...</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approval State */}
        {status === 'pending_approval' && (
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-amber-200/90 shadow-2xl shadow-amber-500/5 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Review in Progress
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Request Pending Super Admin Approval
              </h2>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left space-y-2">
                <p className="text-xs font-bold text-amber-900">
                  Your request has been submitted and is pending Super Admin approval.
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Our system administrator has been notified. As soon as your request is accepted, this screen will automatically refresh and grant you full access to your workspace.
                </p>
              </div>
            </div>

            {/* Live Polling Status */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
              <span>Checking approval status in real-time...</span>
            </div>

            {/* Feature Highlights while waiting */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-left">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MessageSquare className="w-4 h-4 text-[#7C3AED] mb-1.5" />
                <span className="text-[11px] font-bold block text-slate-800">Shared Inbox</span>
                <span className="text-[10px] text-slate-400">Omnichannel sync</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Bot className="w-4 h-4 text-indigo-600 mb-1.5" />
                <span className="text-[11px] font-bold block text-slate-800">AI Automation</span>
                <span className="text-[10px] text-slate-400">Gemini 4-node flows</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Zap className="w-4 h-4 text-amber-500 mb-1.5" />
                <span className="text-[11px] font-bold block text-slate-800">Meta API v18.0</span>
                <span className="text-[10px] text-slate-400">Direct cloud dispatch</span>
              </div>
            </div>
          </div>
        )}

        {/* Initial "new_user" State */}
        {status === 'new_user' && (
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/90 shadow-2xl shadow-purple-500/5 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Step 1 of 2 • Account Activation
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Welcome to Passion Fruit
              </h1>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
                Your account is ready. To maintain high platform deliverability and compliance, new accounts require 1-click Super Admin activation.
              </p>
            </div>

            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{user?.name || 'New Member'}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{user?.email}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Status: New User
              </span>
            </div>

            {/* Optional Details Form */}
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Company / Organization</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Commerce Global"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Prominent Request Access Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-sm font-bold rounded-2xl shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Request Access to Passion Fruit</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Encrypted Role-Based Security • Monitored 24/7</span>
            </div>
          </div>
        )}

        {/* Rejected State */}
        {status === 'rejected' && (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-rose-900">Access Request Not Approved</h2>
            <p className="text-xs text-slate-500">
              Your access request was reviewed and could not be approved at this time. If you believe this was an error, please contact platform support.
            </p>
            <button
              onClick={() => handleRequestAccess()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
            >
              Re-submit Access Request
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-slate-400 py-3">
        © {new Date().getFullYear()} Passion Fruit SaaS Inc. All rights reserved.
      </footer>
    </div>
  );
}
