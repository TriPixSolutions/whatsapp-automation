'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import PassionFruitLogo from '@/components/PassionFruitLogo';
import { verifyAdminLogin, setAdminSession } from '@/lib/auth-admin';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('passionfruit2025');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const isValid = verifyAdminLogin(username, password);

      if (isValid) {
        setAdminSession(username);
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
      } else {
        setErrorMsg('Invalid credentials. Use default username: admin & password: passionfruit2025');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col justify-center items-center p-6 relative font-sans">
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-purple-100/60 via-indigo-50/30 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="inline-block group">
            <PassionFruitLogo size="lg" showSubtitle={true} />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-[#C4B5FD] text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Control Center
          </div>
          <p className="text-xs text-[#64748B] max-w-xs">
            Sign in to access your WhatsApp Automation SaaS Dashboard
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-xl shadow-purple-900/5 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#22C55E]" />
              <span>Login successful! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0D0F2D] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-[#7C3AED] font-semibold">Secured</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0D0F2D] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full gradient-button py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-[#C4B5FD]/70 space-y-1 text-[#0D0F2D] text-xs">
            <p className="font-bold text-[#7C3AED] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-[#7C3AED]" />
              Default Super Admin Login
            </p>
            <p className="text-[11px] text-[#0D0F2D]">
              Username: <strong className="font-mono text-[#0D0F2D]">admin</strong> &nbsp;|&nbsp; Password: <strong className="font-mono text-[#0D0F2D]">passionfruit2025</strong>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-[#64748B]">
          Need help setting up Meta Cloud API?{' '}
          <Link href="/setup" className="text-[#7C3AED] font-semibold hover:underline">
            View Setup Guide
          </Link>
        </div>
      </div>
    </div>
  );
}
