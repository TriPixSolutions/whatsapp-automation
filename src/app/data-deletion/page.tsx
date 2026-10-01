'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Shield,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Search,
  ExternalLink,
  Lock,
  Mail,
  FileText,
  UserCheck,
  Server,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

interface DeletionStatusRecord {
  id: string;
  confirmationCode: string;
  userId?: string;
  email?: string;
  status: 'completed' | 'in_progress' | 'pending';
  details: string;
  requestedAt: string;
  completedAt?: string;
}

function DataDeletionContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [confirmationCodeInput, setConfirmationCodeInput] = useState(initialCode);
  const [queriedStatus, setQueriedStatus] = useState<DeletionStatusRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Manual submission state
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [deletionReason, setDeletionReason] = useState('account_cancellation');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // If a confirmation code is provided in URL (?code=XYZ), query it immediately
  useEffect(() => {
    if (initialCode) {
      handleLookupCode(initialCode);
    }
  }, [initialCode]);

  async function handleLookupCode(codeToLookup: string) {
    const cleanCode = codeToLookup.trim();
    if (!cleanCode) return;
    setIsSearching(true);
    setSearchError(null);
    setQueriedStatus(null);

    try {
      const res = await fetch(`/api/meta/data-deletion?code=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSearchError(data.error || 'Confirmation code not found. Please verify the code and try again.');
      } else {
        setQueriedStatus(data.record);
      }
    } catch {
      setSearchError('Network error while querying deletion status. Please retry.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmitManualRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/meta/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailOrPhone.includes('@') ? emailOrPhone.trim() : undefined,
          userId: !emailOrPhone.includes('@') ? emailOrPhone.trim() : undefined,
          details: `Manual deletion requested for ${emailOrPhone.trim()}. Reason: ${deletionReason}. Notes: ${additionalNotes || 'None'}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.confirmation_code) {
        setSubmittedCode(data.confirmation_code);
        setConfirmationCodeInput(data.confirmation_code);
        handleLookupCode(data.confirmation_code);
      } else {
        alert(data.error || 'Failed to submit data deletion request. Please contact support.');
      }
    } catch {
      alert('An unexpected network error occurred while submitting your request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Meta Platform Terms & Privacy Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold uppercase tracking-wider mb-4">
            <Trash2 className="w-4 h-4" />
            User Rights & GDPR / CCPA Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            User Data Deletion Instructions & Policy
          </h1>
          <p className="mt-3 text-slate-600 text-base max-w-2xl mx-auto leading-relaxed">
            In accordance with Meta Platform Terms, WhatsApp Business Platform policies, and international privacy regulations (GDPR, CCPA), you have the right to request full erasure of all personal data, Facebook/Meta connection data, and WhatsApp messaging logs associated with your account.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Real-time Status Checker Box */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Check Deletion Request Status</h2>
              <p className="text-xs text-slate-500">
                Track real-time confirmation for Facebook callback or manual deletion requests.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="text"
              placeholder="e.g. del_1740000000000_ABC123"
              value={confirmationCodeInput}
              onChange={(e) => setConfirmationCodeInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
            <button
              onClick={() => handleLookupCode(confirmationCodeInput)}
              disabled={isSearching || !confirmationCodeInput.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSearching ? 'Checking...' : 'Check Status'}
            </button>
          </div>

          {searchError && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {queriedStatus && (
            <div className="mt-6 p-6 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Status: {queriedStatus.status.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">
                  Requested: {new Date(queriedStatus.requestedAt).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Confirmation Code</span>
                  <span className="font-mono font-bold text-slate-800 break-all">
                    {queriedStatus.confirmationCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Execution SLA</span>
                  <span className="font-semibold text-slate-800">
                    Purged across all production databases & caches
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 pt-2 border-t border-emerald-200/60">
                <span className="font-semibold text-slate-800">Action Summary:</span> {queriedStatus.details}
              </p>
            </div>
          )}
        </section>

        {/* Official Meta Platform Instructions */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                How to Delete Your Data via Facebook / Meta Settings
              </h2>
              <p className="text-sm text-slate-500">
                Follow these 4 simple steps in your Facebook account to automatically revoke access and trigger our automated data deletion pipeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Open Facebook Settings</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log into your Facebook account, click your profile avatar in the top right, and navigate to{' '}
                <strong className="text-slate-800">Settings &amp; privacy &gt; Settings</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Locate Apps and Websites</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In the left menu, select <strong className="text-slate-800">Apps and Websites</strong> to view all active integrations authorized on your account.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Find Our SaaS Platform</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search for our application name or <strong className="text-slate-800">WhatsApp Automation Platform</strong> in your list of connected business apps.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Click Remove &amp; Confirm Deletion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click <strong className="text-slate-800">Remove</strong>, check the box asking Meta to delete all data and historical content, and click <strong className="text-slate-800">Remove</strong> again. Meta automatically sends our callback endpoint an encrypted webhook request to erase your data immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Alternative: Direct Deletion Request Form */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Direct Data Deletion Request (Self-Service)
              </h2>
              <p className="text-sm text-slate-500">
                If you do not have Facebook access or wish to submit an immediate erasure request directly to our Data Protection Officer, submit your identifier below.
              </p>
            </div>
          </div>

          {submittedCode ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Data Deletion Request Successfully Registered!
              </div>
              <p className="text-xs text-slate-600">
                Your request has been queued in our deletion system. Your permanent confirmation tracking code is:
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-200">
                <code className="text-sm font-bold font-mono text-emerald-700">{submittedCode}</code>
                <button
                  onClick={() => handleCopy(submittedCode)}
                  className="px-3 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Save this code. You can return to this page at any time to verify the completion status of your data erasure.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitManualRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Email or WhatsApp Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user@domain.com or +1 (555) 123-4567"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Deletion
                </label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50"
                >
                  <option value="account_cancellation">Closing account / Ceasing service</option>
                  <option value="gdpr_erasure">GDPR / CCPA Right to be Forgotten</option>
                  <option value="meta_app_revoked">Revoked Meta / Facebook integration</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any specific workspaces, sub-accounts, or customer records to highlight..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !emailOrPhone.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                {isSubmitting ? 'Registering Deletion Request...' : 'Submit Data Deletion Request'}
              </button>
            </form>
          )}
        </section>

        {/* Detailed Data Deletion Policy */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Data Deletion Policy & Retention Schedule
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">1. Scope of Data Subject to Deletion</h3>
              <p>
                When a valid data deletion request is processed through our Meta callback URL (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">/api/meta/data-deletion</code>) or via our direct submission form, we permanently and irrevocably delete the following categories of data:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                <li><strong className="text-slate-800">User Profile Data:</strong> Full names, avatar URLs, email addresses, and workspace memberships.</li>
                <li><strong className="text-slate-800">WhatsApp &amp; Meta Credentials:</strong> Encrypted permanent system user access tokens, App Secret hashes, Webhook Verify Tokens, and WABA configuration data.</li>
                <li><strong className="text-slate-800">Customer Communication Data:</strong> Inbound and outbound WhatsApp chat transcripts, message timestamps, customer phone numbers, media attachments, and interactive payload history.</li>
                <li><strong className="text-slate-800">CRM &amp; Lead Data:</strong> Tags, customer interaction timelines, agent notes, contact records, and pipeline qualification states.</li>
                <li><strong className="text-slate-800">Workflow State:</strong> Active workflow execution sessions, waiting queues, campaign schedules, and trigger logs.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">2. Execution SLA & Verification Mechanism</h3>
              <p>
                Data erasure is initiated automatically upon receipt of the Meta signed request or user submission. All database records, Redis queues, and server caches are completely purged within <strong className="text-slate-800">24 to 48 hours</strong>. An immutable confirmation code is issued for each request, allowing verification of the permanent deletion timestamp.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">3. Legal Exceptions & Statutory Retention</h3>
              <p>
                We do not retain personal customer information for marketing or profiling following a deletion request. In limited instances, certain non-identifiable financial transaction metadata (such as invoice reference numbers and payment receipts) may be retained for the minimum period required by applicable fiscal, accounting, and anti-fraud laws.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">4. Contact our Data Protection Officer</h3>
              <p>
                For questions regarding our privacy practices, GDPR compliance, or this Data Deletion Policy, contact our Data Protection Office at:
              </p>
              <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
                <p><strong className="text-slate-900">Entity:</strong> TriPix Solutions / WhatsApp Automation SaaS</p>
                <p><strong className="text-slate-900">Email:</strong> privacy@tripixsolutions.com / dymaglobal@gmail.com</p>
                <p><strong className="text-slate-900">Response SLA:</strong> Within 24 business hours</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} TriPix Solutions. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="hover:text-indigo-600 transition-colors font-semibold text-slate-700">
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-sm text-slate-500">Loading Data Deletion Portal...</div>}>
      <DataDeletionContent />
    </Suspense>
  );
}
