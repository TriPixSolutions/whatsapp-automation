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
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  Phone,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SetupGuidePage() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'needs_attention'
  >('connected');

  const [businessName, setBusinessName] = useState('My WhatsApp Business');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 019-2834');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('passion_fruit_verify_token_2025');

  // Test message state
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Advanced accordion toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSavingAdvanced, setIsSavingAdvanced] = useState(false);
  const [advancedSaved, setAdvancedSaved] = useState(false);

  // Load existing configuration
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.phoneNumberId) setPhoneId(data.phoneNumberId);
        if (data.wabaId) setWabaId(data.wabaId);
        if (data.accessToken) setAccessToken(data.accessToken);
        if (data.verifyToken) setVerifyToken(data.verifyToken);

        if (data.phoneNumberId && data.accessToken) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      })
      .catch((err) => {
        console.warn('Could not load settings:', err);
        setConnectionStatus('needs_attention');
      });
  }, []);

  // Send 1-Click Test WhatsApp Message
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber) return;

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhoneNumber,
          type: 'template',
          templateName: 'teaser_alert',
          text: 'Hello from your WhatsApp Automation SaaS! Your connection is live and verified. 🚀',
          bypassWindowCheck: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Test message sent successfully! Check your WhatsApp.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to send test message. Check phone number format.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection error while sending test message.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Save manual advanced credentials if used
  const handleSaveAdvanced = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdvanced(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: phoneId.trim(),
          wabaId: wabaId.trim(),
          accessToken: accessToken.trim(),
          verifyToken: verifyToken.trim(),
        }),
      });
      setAdvancedSaved(true);
      setConnectionStatus('connected');
      setTimeout(() => setAdvancedSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingAdvanced(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Connect WhatsApp"
          subtitle="Connect your official WhatsApp Business account in a few simple steps"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Main Status Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0',
                  connectionStatus === 'connected' && 'bg-emerald-50 text-emerald-600',
                  connectionStatus === 'needs_attention' && 'bg-amber-50 text-amber-600',
                  connectionStatus === 'disconnected' && 'bg-slate-100 text-slate-500'
                )}
              >
                {connectionStatus === 'connected' && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                {connectionStatus === 'needs_attention' && <AlertCircle className="w-8 h-8 text-amber-600" />}
                {connectionStatus === 'disconnected' && <Smartphone className="w-8 h-8 text-slate-400" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-950">WhatsApp Cloud Connection</h2>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border',
                      connectionStatus === 'connected' &&
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                      connectionStatus === 'needs_attention' &&
                        'bg-amber-50 text-amber-700 border-amber-200',
                      connectionStatus === 'disconnected' &&
                        'bg-slate-100 text-slate-600 border-slate-200'
                    )}
                  >
                    {connectionStatus === 'connected' && 'Connected & Ready'}
                    {connectionStatus === 'needs_attention' && 'Needs Attention'}
                    {connectionStatus === 'disconnected' && 'Disconnected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {connectionStatus === 'connected'
                    ? 'Your official Meta WhatsApp account is active. Automations and broadcasts are live.'
                    : 'Connect your Meta WhatsApp Business number to start sending messages.'}
                </p>
              </div>
            </div>

            {/* Quick Meta Connect Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/api/auth/google" // Meta Embedded Signup OAuth link
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Zap className="w-4 h-4" />
                <span>{connectionStatus === 'connected' ? 'Reconnect with Meta' : 'Connect WhatsApp with Meta'}</span>
              </Link>
            </div>
          </div>

          {/* 4-Step User Journey Visualizer */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Simple 4-Step Setup Flow
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-50/20 space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900">Connect WhatsApp</h4>
                <p className="text-[11px] text-slate-500">
                  Click the green button above to initiate official Meta onboarding.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900">Login To Meta</h4>
                <p className="text-[11px] text-slate-500">
                  Log in with your existing Facebook or Meta Business Manager credentials.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900">Select Number</h4>
                <p className="text-[11px] text-slate-500">
                  Pick the WhatsApp phone number you want customers to chat with.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-slate-900">All Done!</h4>
                <p className="text-[11px] text-slate-500">
                  Webhook and permissions automatically link in the background.
                </p>
              </div>
            </div>
          </div>

          {/* Instant Test Message Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-950">Verify Your Connection</h3>
            </div>
            <p className="text-xs text-slate-500">
              Send a real test WhatsApp message to your own personal phone to verify that outbound messages are working.
            </p>

            <form onSubmit={handleSendTestMessage} className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                required
                placeholder="+15551234567 (with country code)"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                className="flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={isSendingTest}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px] shrink-0"
              >
                {isSendingTest ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test WhatsApp</span>
                  </>
                )}
              </button>
            </form>

            {testResult && (
              <div
                className={cn(
                  'p-3.5 rounded-xl text-xs flex items-center gap-2.5',
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Advanced / Developer Details (Collapsed by default to keep UI clean) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Advanced / Manual API Setup
                </span>
                <span className="text-[11px] text-slate-400">
                  Only needed if manually configuring custom Meta System User tokens
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 transition-transform duration-200',
                  showAdvanced && 'rotate-180'
                )}
              />
            </button>

            {showAdvanced && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/40 space-y-4">
                <form onSubmit={handleSaveAdvanced} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={phoneId}
                        onChange={(e) => setPhoneId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        WhatsApp Business Account (WABA) ID
                      </label>
                      <input
                        type="text"
                        value={wabaId}
                        onChange={(e) => setWabaId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      System User Access Token
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAdvanced}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                    >
                      {advancedSaved ? 'Saved!' : 'Save Manual Keys'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
