'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Radio,
  Key,
  CheckCircle2,
  ExternalLink,
  Save,
} from 'lucide-react';

interface SettingsHeroProps {
  whatsappConnected: boolean;
  onSave: () => void;
  saving?: boolean;
}

export function SettingsHero({
  whatsappConnected,
  onSave,
  saving = false,
}: SettingsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0E1322] to-purple-950 text-white p-6 md:p-8 shadow-xl border border-slate-800">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-10 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Value & Status */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-purple-200 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Workspace Security &amp; Credentials</span>
            <span className="text-white/40">&bull;</span>
            <span className="text-purple-200 font-mono">Meta Cloud v18.0</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Workspace Configuration &amp; Omnichannel Security
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
            Enterprise-grade Meta Cloud API credentials, webhook verification secrets, and team permissions configured for maximum uptime, anti-ban isolation, and PCI-compliant checkout.
          </p>

          {/* Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Status:{' '}
                <strong className={whatsappConnected ? 'text-emerald-300' : 'text-amber-300'}>
                  {whatsappConnected ? 'Active & Verifying' : 'Keys Pending'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>256-Bit TLS Encryption</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Zero-Storage Token Vault</span>
            </div>
          </div>
        </div>

        {/* Right Action Area */}
        <div className="flex flex-row sm:flex-col gap-2.5 shrink-0 justify-start sm:justify-center">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>

          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all backdrop-blur-md"
          >
            <span>Meta API Docs</span>
            <ExternalLink className="w-3 h-3 text-white/60" />
          </a>
        </div>
      </div>
    </section>
  );
}
