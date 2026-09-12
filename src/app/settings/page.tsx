'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Settings,
  Key,
  Phone,
  Shield,
  Copy,
  Check,
  Globe,
  Server,
  Database,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState('EAAG_SAMPLE_TOKEN_REPLACE_WITH_REAL_META_GRAPH_API_USER_TOKEN');
  const [phoneId, setPhoneId] = useState('109823485764321');
  const [wabaId, setWabaId] = useState('102938475610293');
  const [verifyToken, setVerifyToken] = useState('apex_luxury_secret_token_2025');
  const [redisUrl, setRedisUrl] = useState('redis://localhost:6379');
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/meta`
    : 'https://whatsapp-auto-saas.vercel.app/api/webhooks/meta';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const testWebhookEndpoint = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const challenge = `test_challenge_${Date.now()}`;
      const res = await fetch(
        `/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          verifyToken
        )}&hub.challenge=${challenge}`
      );
      const text = await res.text();

      if (res.ok && text === challenge) {
        setWebhookTestResult({
          success: true,
          message: 'Webhook handshake verified successfully! Returns hub.challenge with HTTP 200.',
        });
      } else {
        setWebhookTestResult({
          success: false,
          message: `Verification returned status ${res.status}: ${text}`,
        });
      }
    } catch (err: any) {
      setWebhookTestResult({ success: false, message: err.message });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pl-64 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="API Credentials & Meta Webhook Configuration"
        subtitle="Configure Cloud API tokens, webhook endpoints, and Hostinger Redis cluster"
      />

      <main className="p-8 space-y-8 flex-1 max-w-5xl">
        {/* Meta Developer Portal Integration Card */}
        <section className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-5 shadow-zap-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
                  Meta Developer Portal Webhook Setup
                </h3>
              </div>
              <p className="text-xs text-[#777777]">
                Paste these into Meta Developer Portal &rarr; WhatsApp &rarr; Configuration &rarr; Webhook
              </p>
            </div>
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#0066FF] hover:underline font-semibold"
            >
              <span>developers.facebook.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Callback URL Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#222222]">Generated Webhook Callback URL</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0066FF] font-mono select-all overflow-x-auto font-semibold">
                {webhookUrl}
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#222222] flex items-center gap-2 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Verify Token Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#222222]">Webhook Verify Token</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] font-mono focus:outline-none focus:border-[#0066FF]"
              />
              <button
                type="button"
                onClick={testWebhookEndpoint}
                disabled={isTestingWebhook}
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0066FF] text-xs font-semibold flex items-center gap-2 transition-all"
              >
                {isTestingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                <span>Test Webhook Handshake</span>
              </button>
            </div>
          </div>

          {/* Handshake Result */}
          {webhookTestResult && (
            <div
              className={cn(
                'p-3.5 rounded-xl text-xs font-mono flex items-center gap-2',
                webhookTestResult.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {webhookTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{webhookTestResult.message}</span>
            </div>
          )}
        </section>

        {/* Credentials Form */}
        <section className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-6 shadow-zap-sm">
          <div className="border-b border-[#E5E7EB] pb-4">
            <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0066FF]" />
              Meta Cloud API Credentials (workspaces table)
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Used by Vercel Webhooks and Hostinger BullMQ Worker to authenticate Graph API requests
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#222222]">
                  Meta Permanent Access Token (System User)
                </label>
                <span className="text-[10px] text-[#777777] font-mono">Scope: whatsapp_business_messaging</span>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EAAG..."
                className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] font-mono focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#222222]">
                  Phone Number ID (Receiving / Sender ID)
                </label>
                <input
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  placeholder="e.g. 109823485764321"
                  className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#222222]">
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="e.g. 102938475610293"
                  className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-4">
              <h4 className="text-xs font-bold text-[#222222] uppercase tracking-wider flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-[#0066FF]" />
                Infrastructure & Hostinger Redis Cluster
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#222222]">Redis Connection URI</label>
                <input
                  type="text"
                  value={redisUrl}
                  onChange={(e) => setRedisUrl(e.target.value)}
                  placeholder="redis://default:password@hostinger-server:6379"
                  className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isSaved ? (
                <span className="text-xs text-emerald-600 font-mono flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="gradient-button px-6 py-2.5 rounded-xl text-white font-semibold text-xs uppercase tracking-wider shadow-sm"
              >
                Save Workspace Configuration
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
