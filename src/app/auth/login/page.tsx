'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import PassionFruitLogo from '@/components/PassionFruitLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.trim(),
          password: password.trim(),
          provider: 'email',
          redirect: redirectTarget,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard');
          router.refresh();
        }, 300);
      } else {
        setErrorMsg(data.error || 'Invalid credentials. Please verify your email and password.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10 space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Link href="/" className="inline-block group">
          <PassionFruitLogo size="lg" showSubtitle={true} />
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Enterprise Authentication
        </div>
        <p className="text-xs text-slate-500 max-w-xs">
          Sign in to access your WhatsApp Automation Console &amp; Team Inbox
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-7 md:p-8 shadow-xl shadow-slate-900/5 space-y-5">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Authenticated. Redirecting to workspace...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs px-3.5 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50 hover:bg-white text-slate-900 placeholder:text-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs px-3.5 py-3 pl-10 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50 hover:bg-white text-slate-900 placeholder:text-slate-400"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full gradient-button text-xs py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : success ? (
              <span>Authenticated</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Pill */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Super Admin Demo?{' '}
            <button
              type="button"
              onClick={() => {
                setEmailOrUsername('admin@passionfruit.io');
                setPassword('Admin@PassionFruit2026');
              }}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Autofill Credentials
            </button>
          </p>
        </div>
      </div>

      {/* Footer Switch to Sign Up */}
      <div className="text-center text-xs text-slate-500">
        Don&apos;t have a workspace yet?{' '}
        <Link href="/auth/signup" className="text-indigo-600 font-bold hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden bg-dot-pattern">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading auth...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
