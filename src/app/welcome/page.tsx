'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  ArrowRight,
  LogOut,
  Send,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { clearClientAuthCookie } from '@/lib/auth';

export default function WelcomeRequestAccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<'unrequested' | 'pending_approval' | 'approved' | 'rejected'>('unrequested');

  // Form state for request access
  const [company, setCompany] = useState('');
  const [intendedUse, setIntendedUse] = useState('WhatsApp Broadcast Campaigns & Shared Team Inbox');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Poll user profile to check if approved
  useEffect(() => {
    let interval: any;

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setStatus(data.user.status);
          if (data.user.company && !company) setCompany(data.user.company);

          // If approved -> auto-route to dashboard!
          if (data.user.status === 'approved') {
            clearInterval(interval);
            setTimeout(() => {
              router.push('/dashboard');
            }, 800);
          }
        } else {
          router.push('/auth/login');
        }
      } catch (e) {
        console.warn('Status check error:', e);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    // Poll every 3.5s for live real-time approval reaction
    interval = setInterval(checkStatus, 3500);

    return () => clearInterval(interval);
  }, [router]);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          intendedUse: intendedUse.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('pending_approval');
        setSubmittedMessage('Your request has been sent to the admin. Please wait for approval.');
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      alert('Error submitting access request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearClientAuthCookie();
    document.cookie = 'pf_auth=; path=/; max-age=0';
    document.cookie = 'pf_status=; path=/; max-age=0';
    document.cookie = 'pf_role=; path=/; max-age=0';
    document.cookie = 'pf_user_id=; path=/; max-age=0';
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col justify-between p-4 md:p-8 font-sans text-[#0D0F2D] selection:bg-[#7C3AED] selection:text-white">
      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white text-lg shadow-md shadow-purple-500/20 font-bold">
            🍇
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#0D0F2D] block">
              Passion Fruit
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Enterprise WhatsApp SaaS</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-all shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="max-w-xl w-full mx-auto my-8">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/90 shadow-xl shadow-purple-500/5 relative overflow-hidden">
          {/* Subtle Top Ambient Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

          {/* STATE 1: UNREQUESTED (Sign-up complete, ready to request) */}
          {status === 'unrequested' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0D0F2D]">
                  Welcome to Passion Fruit!
                </h1>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Hi <strong className="text-slate-900">{user?.name || 'there'}</strong> ({user?.email}), your account has been registered. Because Passion Fruit is an enterprise platform, new workspaces require administrator authorization.
                </p>
              </div>

              <form onSubmit={handleRequestAccess} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Company or Brand Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Luxury Retail or Digital Agency"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Intended Primary Use</label>
                  <select
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  >
                    <option value="WhatsApp Broadcast Campaigns & Shared Team Inbox">
                      WhatsApp Broadcast Campaigns &amp; Shared Team Inbox
                    </option>
                    <option value="No-Code Chatbots & 4-Node Automation Flows">
                      No-Code Chatbots &amp; 4-Node Automation Flows
                    </option>
                    <option value="Omnichannel Meta (WhatsApp + Instagram + Messenger)">
                      Omnichannel Meta (WhatsApp + Instagram + Messenger)
                    </option>
                    <option value="Meta Click-to-WhatsApp Ads Lead Nurturing">
                      Meta Click-to-WhatsApp Ads Lead Nurturing
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-xs font-bold rounded-2xl shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 group mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Access to Platform</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STATE 2: PENDING APPROVAL (Waiting for Super Admin) */}
          {status === 'pending_approval' && (
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs relative">
                <Clock className="w-8 h-8 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </span>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Status: Pending Administrator Approval
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0D0F2D]">
                  Your request has been sent!
                </h1>
                <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Your request has been sent to the admin. Please wait for approval. This page will automatically unlock and route you to your dashboard once authorized.
                </p>
              </div>

              {/* Status Telemetry Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 max-w-md mx-auto">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Account:</span>
                  <span className="font-semibold text-slate-800">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Organization:</span>
                  <span className="font-semibold text-slate-800">{user?.company || company || 'Enterprise'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Auto-Refresh:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Checking every 3.5s
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Are you an authorized administrator?{' '}
                <Link href="/auth/login" className="text-[#7C3AED] hover:underline font-semibold">
                  Sign in with Super Admin credentials
                </Link>
              </div>
            </div>
          )}

          {/* STATE 3: APPROVED (Auto-redirecting) */}
          {status === 'approved' && (
            <div className="space-y-6 text-center py-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0D0F2D]">
                  Access Approved!
                </h1>
                <p className="text-xs text-slate-600 mt-2">
                  Welcome aboard. Launching your Passion Fruit WhatsApp Automation Console...
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-[#7C3AED] font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Redirecting to Dashboard...</span>
              </div>
            </div>
          )}

          {/* STATE 4: REJECTED */}
          {status === 'rejected' && (
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <XCircle className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0D0F2D]">
                  Access Request Declined
                </h1>
                <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Your access request could not be approved at this time. Please contact your workspace administrator or support team.
                </p>
              </div>

              <button
                onClick={() => setStatus('unrequested')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Submit New Request
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] text-slate-400">
        Passion Fruit &copy; 2026. Enterprise Role-Based Access Control &amp; Meta Cloud API Integration.
      </footer>
    </div>
  );
}
