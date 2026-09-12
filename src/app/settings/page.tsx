'use client';

import React, { useState, useEffect } from 'react';
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
  User,
  KeyRound,
  ShieldCheck,
  Lock,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredAdminCredentials, saveAdminCredentials } from '@/lib/auth-admin';
import { getMetaCredentials, saveMetaCredentials } from '@/lib/meta';
import Link from 'next/link';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [verifyToken, setVerifyToken] = useState('passion_fruit_verify_token_2025');
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  // Super Admin Credentials state
  const [adminUser, setAdminUser] = useState('User 1');
  const [adminPass, setAdminPass] = useState('0725');
  const [adminSaved, setAdminSaved] = useState(false);

  // Subdomain state
  const [customSubdomain, setCustomSubdomain] = useState('app.yourbrand.com');
  const [subdomainSaved, setSubdomainSaved] = useState(false);

  useEffect(() => {
    const creds = getStoredAdminCredentials();
    if (creds.username) setAdminUser(creds.username);
    if (creds.password) setAdminPass(creds.password);

    const metaCreds = getMetaCredentials();
    if (metaCreds.accessToken) setToken(metaCreds.accessToken);
    if (metaCreds.phoneNumberId) setPhoneId(metaCreds.phoneNumberId);
    if (metaCreds.wabaId) setWabaId(metaCreds.wabaId);
    if (metaCreds.verifyToken) setVerifyToken(metaCreds.verifyToken);
  }, []);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/whatsapp`
    : 'https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    saveMetaCredentials({
      accessToken: token.trim(),
      phoneNumberId: phoneId.trim(),
      wabaId: wabaId.trim(),
      verifyToken: verifyToken.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass.trim()) {
      alert('Username and password cannot be empty.');
      return;
    }
    saveAdminCredentials(adminUser, adminPass);
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 3000);
  };

  const handleSaveSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    setSubdomainSaved(true);
    setTimeout(() => setSubdomainSaved(false), 3000);
  };

  const testWebhookEndpoint = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const challenge = `test_challenge_${Date.now()}`;
      const res = await fetch(
        `/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          verifyToken
        )}&hub.challenge=${challenge}`
      );
      const text = await res.text();

      if (res.ok && text === challenge) {
        setWebhookTestResult({
          success: true,
          message: 'Webhook handshake verified successfully! Meta can send and receive live messages.',
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
    <div className="min-h-screen bg-[#F4F6FB] pl-60 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Settings & Admin Security"
        subtitle="Manage Super Admin credentials, Meta WhatsApp API keys, and custom domain setup"
      />

      <main className="p-8 space-y-8 flex-1 max-w-5xl">
        {/* Quick link banner to setup guide */}
        <div className="rounded-3xl bg-[#0D0F2D] border border-[#7C3AED]/30 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-purple-900/10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD] block">
                Same energy. Bigger possibilities.
              </span>
              <h4 className="text-sm font-bold text-white">
                First Time Connecting Meta WhatsApp?
              </h4>
              <p className="text-xs text-slate-300">
                Follow our 5-minute visual setup guide with 1-click copyable webhooks.
              </p>
            </div>
          </div>
          <Link
            href="/setup"
            className="gradient-button px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-pf-btn hover:shadow-pf-hover flex-shrink-0 w-fit"
          >
            <span>Open Setup Guide</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 1. SUPER ADMIN CREDENTIALS CARD */}
        <section className="rounded-3xl bg-white border border-[#E2E8F0] p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
                <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Super Admin Account & Security
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Configure your manual Super Admin login credentials to protect your dashboard access.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-[#C4B5FD]">
              Active Security Lock
            </span>
          </div>

          <form onSubmit={handleSaveAdminCreds} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0D0F2D] font-medium focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0D0F2D] font-medium focus:outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {adminSaved ? (
                <span className="text-xs text-[#22C55E] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Super Admin credentials updated successfully!
                </span>
              ) : (
                <span className="text-[11px] text-[#64748B]">
                  Default credentials: <strong>admin</strong> / <strong>passionfruit2025</strong>
                </span>
              )}

              <button
                type="submit"
                className="gradient-button px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover"
              >
                Update Admin Login
              </button>
            </div>
          </form>
        </section>

        {/* 2. META DEVELOPER WEBHOOK CARD */}
        <section className="rounded-3xl bg-white border border-[#E2E8F0] p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#7C3AED]" />
                <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Meta Developer Portal Webhook Connection
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Copy and paste these into your Meta App &rarr; WhatsApp &rarr; Configuration &rarr; Webhook
              </p>
            </div>
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:underline font-bold"
            >
              <span>developers.facebook.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Callback URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
              Webhook Callback URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#7C3AED] font-mono select-all overflow-x-auto font-semibold">
                {webhookUrl}
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F6FB] border border-[#E2E8F0] text-xs font-bold text-[#0D0F2D] flex items-center gap-2 transition-all shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
              Webhook Verify Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
              />
              <button
                type="button"
                onClick={testWebhookEndpoint}
                disabled={isTestingWebhook}
                className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-[#C4B5FD] text-[#7C3AED] text-xs font-bold flex items-center gap-2 transition-all"
              >
                {isTestingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                <span>Test Webhook Handshake</span>
              </button>
            </div>
          </div>

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
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#22C55E]" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{webhookTestResult.message}</span>
            </div>
          )}
        </section>

        {/* 3. META CREDENTIALS FORM */}
        <section className="rounded-3xl bg-white border border-[#E2E8F0] p-7 space-y-6 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-[#7C3AED]" />
              WhatsApp Cloud API Keys & IDs
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Found on your Meta for Developers dashboard under WhatsApp &rarr; API Setup
            </p>
          </div>

          <form onSubmit={handleSaveMeta} className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Permanent Access Token (System User)
                </label>
                <span className="text-[10px] text-[#64748B]">Meta System User Token</span>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EAAG..."
                className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  placeholder="e.g. 109823485764321"
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="e.g. 102938475610293"
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isSaved ? (
                <span className="text-xs text-[#22C55E] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> WhatsApp configuration saved!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="gradient-button px-6 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover"
              >
                Save Meta Configuration
              </button>
            </div>
          </form>
        </section>

        {/* 4. CUSTOM SUBDOMAIN & BRAND DOMAIN SETUP */}
        <section className="rounded-3xl bg-white border border-[#E2E8F0] p-7 space-y-5 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#7C3AED]" />
              Custom Subdomain & White-Label Domain
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Host Passion fruit on your own branded domain (e.g. <code>app.yourbrand.com</code>)
            </p>
          </div>

          <form onSubmit={handleSaveSubdomain} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                Your Preferred Subdomain
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSubdomain}
                  onChange={(e) => setCustomSubdomain(e.target.value)}
                  placeholder="app.yourbrand.com"
                  className="flex-1 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="submit"
                  className="gradient-button px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover"
                >
                  Save Subdomain
                </button>
              </div>
            </div>

            {subdomainSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Subdomain saved! Point your CNAME record to finish connection.
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] space-y-2 text-xs">
              <p className="font-bold text-[#0D0F2D]">DNS Configuration Instructions:</p>
              <ul className="space-y-1 text-[#64748B] text-[11px] list-disc list-inside">
                <li>Log in to your DNS provider (Cloudflare, GoDaddy, Hostinger, Namecheap).</li>
                <li>Add a new <strong>CNAME</strong> record.</li>
                <li>Set <strong>Host / Name:</strong> <code>app</code> (or your chosen subdomain prefix).</li>
                <li>Set <strong>Target / Value:</strong> <code>cname.vercel-dns.com</code></li>
                <li>Save the record. SSL will be automatically provisioned within 1–2 minutes!</li>
              </ul>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
