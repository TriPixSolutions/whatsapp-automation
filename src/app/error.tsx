'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to console and production error monitoring (e.g. Sentry)
    console.error('[Application Error Boundary caught error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-[#12141F] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-14 h-14 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
          <AlertCircle className="w-7 h-7" />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
          An Unexpected Error Occurred
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The application encountered an issue while processing your request. Our telemetry has captured this incident.
        </p>

        {/* Error Digest */}
        {error.digest && (
          <div className="mb-6 px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 break-all">
            Event Reference: <span className="text-slate-200">{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-2 text-sm font-medium py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-slate-200 gap-2 text-sm font-medium py-2.5 rounded-xl"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
