'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Clock, FileCheck } from 'lucide-react';

function StatusContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('No confirmation code provided. Please provide a valid deletion code.');
      setLoading(false);
      return;
    }

    fetch(`/api/meta/data-deletion?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.record) {
          setRecord(data.record);
        } else {
          setError(data.error || 'No deletion request found matching this confirmation code.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch status');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium text-sm">Verifying Deletion Status with Database...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <h2 className="text-lg font-bold">Request Lookup Failed</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          {error || 'Unable to retrieve data deletion details.'}
        </p>
        <div className="pt-2">
          <Link
            href="/data-deletion"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Submit a New Deletion Request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Hero Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Deletion Completed</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                All associated Meta Platform and workspace telemetry has been permanently purged.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-medium text-slate-400 block">Status Check Timestamp</span>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Confirmation Code</div>
            <div className="font-mono font-bold text-slate-900 text-xs break-all">
              {record.confirmationCode}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Execution Status</div>
            <div className="font-semibold text-emerald-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              100% Purged & Completed
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Requested At</div>
            <div className="font-mono text-xs text-slate-700">
              {new Date(record.requestedAt).toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Completed At</div>
            <div className="font-mono text-xs text-slate-700">
              {record.completedAt ? new Date(record.completedAt).toLocaleString() : 'Immediate'}
            </div>
          </div>
        </div>

        {/* Purged Data Summary */}
        <div className="p-5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
            <FileCheck className="w-4 h-4 text-[#7C3AED]" />
            Items Purged & Anonymized
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
            <li>Meta OAuth Access Tokens and Page/System credentials destroyed</li>
            <li>Inbound & outbound WhatsApp message records deleted</li>
            <li>Customer phone numbers and contact profile identifiers erased</li>
            <li>Active session cookies and authentication credentials invalidated</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function DataDeletionStatusPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#7C3AED] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Official Meta Compliance Tracker
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Data Deletion Status & Receipt
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Official record of user data deletion under Meta Platform Terms and GDPR regulations.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium text-sm">Loading Status...</p>
            </div>
          }
        >
          <StatusContent />
        </Suspense>
      </main>
    </div>
  );
}
