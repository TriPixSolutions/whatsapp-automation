'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import PassionFruitLogo from '@/components/PassionFruitLogo';
import { verifyAdminLogin, setAdminSession } from '@/lib/auth-admin';

export default function AdminLoginPage() {
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
        setErrorMsg('Invalid Super Admin credentials. Use default username: admin & password: passionfruit2025');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 relative font-sans">
      {/* Soft Background Accents */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-fuchsia-100/50 via-blue-50/40 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="inline-block group">
            <PassionFruitLogo size="lg" showSubtitle={true} />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-[#0066FF] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Control Center
          </div>
          <p className="text-xs text-slate-500 max-w-xs">
            Enter your Super Admin credentials to access your WhatsApp Automation SaaS Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Login successful! Opening dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-[#0066FF] font-medium">Secured</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full gradient-button py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Info Box for First Time Setup */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1 text-slate-700 text-xs">
            <p className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Default Super Admin Login
            </p>
            <p className="text-[11px] text-amber-900/80">
              Username: <strong className="font-mono text-slate-900">admin</strong> &nbsp;|&nbsp; Password: <strong className="font-mono text-slate-900">passionfruit2025</strong>
            </p>
            <p className="text-[10px] text-slate-500 pt-0.5">
              You can change this password anytime in <strong className="text-slate-700">Dashboard &rarr; Settings</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Need help? Check out our{' '}
          <Link href="/setup" className="text-[#0066FF] font-semibold hover:underline">
            Meta WhatsApp Setup Guide
          </Link>
        </div>
      </div>
    </div>
  );
}
