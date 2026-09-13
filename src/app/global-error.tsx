'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Global Error Caught]:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-6 font-sans antialiased">
        <div className="w-full max-w-md bg-[#12141F] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 text-xl font-bold">
            !
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
            Critical Application Crash
          </h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            A critical root-level error interrupted application rendering. Our engineering team has been alerted.
          </p>

          {error.digest && (
            <p className="mb-6 px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 break-all">
              Incident ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              Reload Application
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-medium transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
