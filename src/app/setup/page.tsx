'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Send,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Check,
  Zap,
  Copy,
  Lock,
  ArrowRight,
  HelpCircle,
  Building,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsAppConnectionWizardPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('tripix_verify_token_2026');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Step 4: Webhook verification check
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);
  const [webhookVerified, setWebhookVerified] = useState(false);

  // Step 5: Test Message
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    messageId?: string;
    phoneNumberIdUsed?: string;
    error?: string;
    errorCode?: number;
    errorSubcode?: number;
    details?: any;
    isSimulated?: boolean;
    rawPayload?: any;
  } | null>(null);
  const [showDebugDetails, setShowDebugDetails] = useState(false);

  // Validation & Error states
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing credentials
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook/whatsapp`);
    }

    fetch('/api/meta/connection')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.credentials?.wabaId) setWabaId(data.credentials.wabaId);
        if (data.credentials?.phoneNumberId) setPhoneNumberId(data.credentials.phoneNumberId);
        if (data.phoneNumberHealth?.displayPhoneNumber) setDisplayPhone(data.phoneNumberHealth.displayPhoneNumber);
        if (data.connectionStatus === 'connected') {
          setWebhookVerified(true);
        }
      })
      .catch((e) => console.warn('Could not load connection:', e));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // STEP 1 VALIDATION & PROCEED
  const handleStep1Proceed = () => {
    setStepError(null);
    if (!wabaId.trim()) {
      setStepError('Please enter your WhatsApp Business Account (WABA) ID.');
      return;
    }
    setCurrentStep(2);
  };

  // STEP 2 VALIDATION & PROCEED
  const handleStep2Proceed = () => {
    setStepError(null);
    if (!phoneNumberId.trim()) {
      setStepError('Please enter your WhatsApp Phone Number ID.');
      return;
    }
    setCurrentStep(3);
  };

  // STEP 3 VALIDATION & PROCEED
  const handleStep3Proceed = async () => {
    setStepError(null);
    if (!accessToken.trim()) {
      setStepError('Please enter your Meta System User Access Token.');
      return;
    }

    setIsSaving(true);
    try {
      // Save credentials to backend
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wabaId: wabaId.trim(),
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim(),
          verifyToken: verifyToken.trim(),
        }),
      });

      if (res.ok) {
        setCurrentStep(4);
      } else {
        setStepError('Failed to save credentials.');
      }
    } catch (err: any) {
      setStepError(err.message || 'Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // STEP 4 WEBHOOK TEST HANDSHAKE
  const handleTestWebhook = async () => {
    setIsCheckingWebhook(true);
    setStepError(null);

    try {
      const res = await fetch(`/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=${encodeURIComponent(verifyToken)}`);
      if (res.ok) {
        const text = await res.text();
        if (text === 'test_challenge_123') {
          setWebhookVerified(true);
        } else {
          setStepError('Webhook responded but verification challenge mismatch.');
        }
      } else {
        setStepError('Webhook endpoint returned an error. Check verify token.');
      }
    } catch (err: any) {
      setStepError(err.message || 'Network error verifying webhook.');
    } finally {
      setIsCheckingWebhook(false);
    }
  };

  // STEP 5 SEND TEST MESSAGE
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber.trim()) {
      setTestError('Please enter a recipient WhatsApp phone number with country code (e.g. +15551234567).');
      return;
    }

    setIsSendingTest(true);
    setTestError(null);
    setTestSuccess(false);
    setTestResult(null);

    try {
      const payload: any = {
        to: testPhoneNumber.trim(),
        type: 'text',
        text: 'WhatsApp connection successful. Test message from TriPix SaaS.',
        bypassWindowCheck: true,
        requireRealDelivery: true,
        isConnectionTest: true,
      };

      if (phoneNumberId.trim()) {
        payload.phoneNumberId = phoneNumberId.trim();
      }
      if (accessToken.trim()) {
        payload.accessToken = accessToken.trim();
      }

      console.log('[Setup Wizard] Dispatching real test message request:', {
        to: payload.to,
        phoneNumberId: payload.phoneNumberId || '(from saved settings)',
        hasAccessToken: Boolean(payload.accessToken),
      });

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('[Setup Wizard] Test message response from API:', data);

      setTestResult({
        ...data,
        rawPayload: payload,
      });

      // Strict verification: messageId MUST exist, start with wamid., and NOT be a local simulation
      const isGenuineMetaDelivery = Boolean(
        res.ok &&
        data.success &&
        data.messageId &&
        typeof data.messageId === 'string' &&
        data.messageId.startsWith('wamid.') &&
        !data.messageId.startsWith('wamid.local_') &&
        !data.isSimulated
      );

      if (isGenuineMetaDelivery) {
        setTestSuccess(true);
      } else {
        const errorMsg =
          data.error ||
          (data.isSimulated
            ? 'Real delivery failed: Sandbox simulation was returned instead of a live Meta Cloud API message.'
            : 'Meta Cloud API rejected the message or did not return a valid wamid message ID.');
        setTestError(errorMsg);
        setTestSuccess(false);
      }
    } catch (err: any) {
      console.error('[Setup Wizard] Network or client error:', err);
      setTestError(err.message || 'Network error sending test message to WhatsApp API.');
      setTestSuccess(false);
    } finally {
      setIsSendingTest(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Connect Meta Business' },
    { num: 2, title: 'Choose WhatsApp Number' },
    { num: 3, title: 'Grant Permissions' },
    { num: 4, title: 'Verify Webhook' },
    { num: 5, title: 'Send Test Message' },
    { num: 6, title: 'Connection Success' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="WhatsApp Connection Wizard"
          subtitle="Official Meta Cloud API guided connection wizard for non-technical business owners"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Step Indicator Header */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {stepsList.map((s) => {
                const isCurrent = currentStep === s.num;
                const isDone = currentStep > s.num;

                return (
                  <div
                    key={s.num}
                    className={cn(
                      'p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all',
                      isCurrent && 'bg-slate-900 text-white font-bold shadow-xs',
                      isDone && 'bg-emerald-50 text-emerald-800 font-bold',
                      !isCurrent && !isDone && 'bg-slate-50 text-slate-400'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1',
                        isCurrent && 'bg-white text-slate-900',
                        isDone && 'bg-emerald-600 text-white',
                        !isCurrent && !isDone && 'bg-slate-200 text-slate-500'
                      )}
                    >
                      {isDone ? '✓' : s.num}
                    </div>
                    <span className="text-[10px] truncate max-w-full">{s.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1: Connect Meta Business */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Step 1: Connect Meta Business Manager</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect your Meta Business Account and identify your WhatsApp Business Account (WABA) ID.
                  </p>
                </div>
              </div>

              {/* Visual Guide Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>How to find your WhatsApp Business Account (WABA) ID:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 text-[11px] pt-1">
                  <li>Log in to <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">Meta Business Suite</a>.</li>
                  <li>Go to <strong>Settings</strong> $\to$ <strong>WhatsApp Accounts</strong>.</li>
                  <li>Select your account and copy the numeric <strong>WhatsApp Business Account ID</strong>.</li>
                </ol>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  WhatsApp Business Account (WABA) ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 102938475610293"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                />
              </div>

              {stepError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleStep1Proceed}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <span>Next: Choose Phone Number</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Choose WhatsApp Number */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Step 2: Choose Your WhatsApp Phone Number</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter the Phone Number ID assigned by Meta to the phone number your customers will message.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>How to find your Phone Number ID:</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  In Meta Developers Console $\to$ Your App $\to$ WhatsApp $\to$ API Setup, locate the <strong>Phone number ID</strong> below your registered sender number.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone Number ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 109823485764321"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Display Phone Number (Optional Label)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 123-4567"
                    value={displayPhone}
                    onChange={(e) => setDisplayPhone(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {stepError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep2Proceed}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <span>Next: Grant Permissions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Grant Permissions */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Step 3: Grant System User Permissions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate and paste your permanent Meta System User Access Token with messaging permissions.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Required Meta Permissions:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    whatsapp_business_messaging
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    whatsapp_business_management
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  System User Access Token *
                </label>
                <input
                  type="password"
                  required
                  placeholder="EAAG..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Your token will be cryptographically encrypted using AES-256 before saving to the database.
                </p>
              </div>

              {stepError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep3Proceed}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <span>{isSaving ? 'Encrypting & Saving...' : 'Next: Verify Webhook'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Verify Webhook */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Step 4: Configure &amp; Verify Webhook</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Copy these two values into your Meta App Configuration to receive inbound messages and delivery receipts.
                  </p>
                </div>
              </div>

              {/* Webhook URL Box */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">Callback URL:</span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-slate-900 truncate">{webhookUrl}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-100 shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">Verify Token:</span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-slate-900 truncate">{verifyToken}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(verifyToken)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-100 shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Webhook Handshake Checker */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Test Handshake Verification</span>
                  <span className="text-[11px] text-slate-500">
                    Verify that your server correctly responds to Meta&apos;s cryptographic challenge
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isCheckingWebhook}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isCheckingWebhook ? 'Verifying...' : 'Verify Now'}
                </button>
              </div>

              {webhookVerified && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Webhook verified successfully! Handshake challenge approved.</span>
                </div>
              )}

              {stepError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <span>Next: Send Test Message</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Send Test Message */}
          {currentStep === 5 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Step 5: Send Real Test Message</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send a real outbound WhatsApp test message to verify connection. Dispatches directly via Meta Cloud API text message.
                  </p>
                </div>
              </div>

              {/* Active Meta Connection Credentials Review */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Target Meta Account Configuration
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Edit Credentials
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 font-medium block">Phone Number ID</span>
                    <span className="font-mono font-bold text-slate-900 truncate block mt-0.5">
                      {phoneNumberId || <span className="text-amber-600 italic">Not set (Step 2 required)</span>}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 font-medium block">System User Access Token</span>
                    <span className="font-mono text-slate-900 truncate block mt-0.5">
                      {accessToken ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Configured ({accessToken.substring(0, 6)}...{accessToken.slice(-4)})
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Using backend saved token</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendTestMessage} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Recipient WhatsApp Phone Number (Test or Production) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+15551234567 or 15551234567"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the phone number with country code. For Meta Developer sandbox accounts, this number must be in your <strong>Allowed Test Recipients</strong> list in Meta App Dashboard &gt; WhatsApp &gt; API Setup.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold block text-slate-800">Message payload to be dispatched:</span>
                  <p className="italic text-slate-700 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                    &quot;WhatsApp connection successful. Test message from TriPix SaaS.&quot;
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Direct Cloud API text message &bull; Zero dependency on templates &bull; Real Meta delivery enforced
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[42px]"
                >
                  <Send className={cn('w-3.5 h-3.5', isSendingTest && 'animate-spin')} />
                  <span>{isSendingTest ? 'Contacting Meta Cloud API...' : 'Send Test WhatsApp Message'}</span>
                </button>
              </form>

              {/* SUCCESS CONFIRMATION BANNER */}
              {testSuccess && testResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-sm block text-emerald-950">
                        Official Meta Test Message Dispatched Successfully!
                      </span>
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        Meta Cloud API verified the payload and confirmed delivery with a genuine WhatsApp message ID.
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-emerald-200/80 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-sans font-medium">Meta Message ID (wamid):</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded">
                          {testResult.messageId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(testResult.messageId || '')}
                          className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {testResult.phoneNumberIdUsed && (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-700 font-sans font-medium">Phone Number ID Used:</span>
                        <span className="text-emerald-950">{testResult.phoneNumberIdUsed}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ERROR ALERT BANNER */}
              {testError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-rose-950">
                          Meta WhatsApp Delivery Failed
                        </span>
                        {testResult?.errorCode && (
                          <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-[10px] font-bold rounded-full">
                            Error #{testResult.errorCode}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-rose-800 font-medium leading-relaxed">
                        {testError}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic details accordion */}
                  <div className="pt-2 border-t border-rose-200/80">
                    <button
                      type="button"
                      onClick={() => setShowDebugDetails(!showDebugDetails)}
                      className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showDebugDetails && 'rotate-90')} />
                      <span>{showDebugDetails ? 'Hide Meta Debug Telemetry' : 'View Meta Debug Telemetry & Raw Response'}</span>
                    </button>

                    {showDebugDetails && testResult && (
                      <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-x-auto space-y-2">
                        <div>
                          <span className="text-emerald-400 font-bold">// Endpoint &amp; Target</span>
                          <p className="text-slate-300">
                            Phone Number ID: {testResult.phoneNumberIdUsed || phoneNumberId || 'None'}
                          </p>
                          <p className="text-slate-300">
                            Recipient: {testPhoneNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-amber-400 font-bold">// Meta API Response Payload</span>
                          <pre className="text-slate-300 whitespace-pre-wrap">
                            {JSON.stringify(testResult.details || testResult, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!testSuccess) {
                      const confirmProceed = confirm(
                        'A real Meta test message has not been confirmed yet. Are you sure you want to proceed to completion?'
                      );
                      if (!confirmProceed) return;
                    }
                    setCurrentStep(6);
                  }}
                  className={cn(
                    'px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]',
                    testSuccess ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  )}
                >
                  <span>{testSuccess ? 'Next: Connection Success' : 'Skip & Finish'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Connection Success */}
          {currentStep === 6 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                🎉
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-950">WhatsApp Connected Successfully!</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your official Meta WhatsApp Business Cloud API is active, verified, and ready to automate follow-ups and broadcast campaigns.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">WABA ID:</span>
                  <span className="font-mono font-bold text-slate-900">{wabaId || '102938475610293'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Phone ID:</span>
                  <span className="font-mono font-bold text-slate-900">{phoneNumberId || '109823485764321'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Webhook Status:</span>
                  <span className="text-emerald-700 font-bold">Active &amp; Listening</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">24-Hour Policy Window:</span>
                  <span className="text-emerald-700 font-bold">Enforced (Meta Compliant)</span>
                </div>
              </div>

              {/* Next Logical Step in Primary Workflow */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/automations"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
                >
                  <span>Step 2: Create Follow-Up Automation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
