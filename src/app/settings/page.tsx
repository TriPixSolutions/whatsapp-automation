'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AlertTriangle, Building2, CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';

type Section = 'workspace' | 'whatsapp' | 'webhook';
type FormState = { name: string; customSubdomain: string; wabaId: string; phoneNumberId: string; accessToken: string; appId: string; appSecret: string; verifyToken: string; catalogId: string; adAccountId: string };
const emptyForm: FormState = { name: '', customSubdomain: '', wabaId: '', phoneNumberId: '', accessToken: '', appId: '', appSecret: '', verifyToken: '', catalogId: '', adAccountId: '' };

const fieldsFor = (section: Section): Array<{ key: keyof FormState; label: string; help?: string; secret?: boolean; placeholder?: string }> => section === 'workspace' ? [
  { key: 'name', label: 'Workspace name', placeholder: 'Your company name' },
  { key: 'customSubdomain', label: 'Custom subdomain', help: 'Optional. Domain routing still needs deployment configuration.', placeholder: 'support.example.com' },
] : section === 'whatsapp' ? [
  { key: 'wabaId', label: 'WhatsApp Business Account ID' },
  { key: 'phoneNumberId', label: 'Phone Number ID' },
  { key: 'accessToken', label: 'Permanent System User access token', secret: true, help: 'A masked value means the saved token will be kept.' },
  { key: 'catalogId', label: 'Catalog ID', help: 'Required only for catalog messages.' },
  { key: 'adAccountId', label: 'Meta Ad Account ID', help: 'Optional. Required for real ad insights.' },
] : [
  { key: 'appId', label: 'Meta App ID' },
  { key: 'appSecret', label: 'Meta App Secret', secret: true, help: 'Required for webhook signature verification. It must be the 32-character secret from Meta App settings.' },
  { key: 'verifyToken', label: 'Webhook verify token', secret: true, help: 'Use this exact value while subscribing the webhook in Meta.' },
];

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('workspace');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResponse, connectionResponse] = await Promise.all([
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/meta/connection', { cache: 'no-store' }),
      ]);
      const settings = await settingsResponse.json();
      const status = await connectionResponse.json();
      if (!settingsResponse.ok) throw new Error(settings.error || 'Settings could not be loaded.');
      if (!connectionResponse.ok) throw new Error(status.error || 'Connection status could not be loaded.');
      setForm((current) => ({ ...current, ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, settings[key] || ''])) } as FormState));
      setConnection(status);
    } catch (cause: any) {
      setMessage({ kind: 'error', text: cause.message || 'Settings could not be loaded.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook/whatsapp`);
    const requested = new URLSearchParams(window.location.search).get('section');
    if (requested === 'workspace' || requested === 'whatsapp' || requested === 'webhook') setSection(requested);
    load();
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Settings could not be saved.');
      setMessage({ kind: 'success', text: 'Settings saved.' });
      await load();
    } catch (cause: any) {
      setMessage({ kind: 'error', text: cause.message || 'Settings could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/meta/connection/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok || !body.verified) throw new Error([body.error, body.hint].filter(Boolean).join(' ') || 'Live Meta verification failed.');
      setMessage({ kind: 'success', text: `Meta verified ${body.displayPhoneNumber || body.phoneNumberId}.` });
      await load();
    } catch (cause: any) {
      setMessage({ kind: 'error', text: cause.message || 'Live Meta verification failed.' });
    } finally {
      setTesting(false);
    }
  };

  const tabs: Array<{ id: Section; label: string; description: string; icon: typeof Building2 }> = [
    { id: 'workspace', label: 'Workspace', description: 'Company identity', icon: Building2 },
    { id: 'whatsapp', label: 'WhatsApp', description: 'Sender and token', icon: Smartphone },
    { id: 'webhook', label: 'Webhook & security', description: 'Inbound verification', icon: ShieldCheck },
  ];
  const connected = connection?.connectionStatus === 'connected' && !connection?.configurationError;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pl-60">
      <Sidebar />
      <Header title="Settings" subtitle="Workspace, WhatsApp, and webhook configuration" />
      <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8">
        {message && <div role="alert" className={`flex items-start gap-2 rounded-2xl border p-4 text-sm ${message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {message.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}{message.text}
        </div>}

        <div className="grid gap-5 md:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-2">
            {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setSection(tab.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${section === tab.id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
              <Icon className="h-4 w-4 shrink-0" /><span><span className="block text-sm font-bold">{tab.label}</span><span className={`block text-xs ${section === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>{tab.description}</span></span>
            </button>; })}
            <Link href="/integrations" className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm font-bold text-slate-700">All system checks <ExternalLink className="h-4 w-4" /></Link>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div> : <form onSubmit={save} className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div><h2 className="font-bold text-slate-950">{tabs.find((tab) => tab.id === section)?.label}</h2><p className="mt-1 text-sm text-slate-500">Only saved, production-backed settings are shown here.</p></div>
                {section === 'whatsapp' && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{connected ? 'Live verified' : 'Needs attention'}</span>}
              </div>

              {section === 'webhook' && <div className="rounded-2xl bg-slate-50 p-4">
                <label className="text-xs font-bold text-slate-700">Webhook callback URL</label>
                <div className="mt-2 flex gap-2"><input readOnly value={webhookUrl} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700" /><button type="button" onClick={() => navigator.clipboard.writeText(webhookUrl)} className="rounded-xl border border-slate-200 bg-white p-2.5" title="Copy webhook URL"><Copy className="h-4 w-4" /></button></div>
                <p className="mt-2 text-xs text-slate-500">Subscribe this URL to messages and message status events in Meta.</p>
                <Link href="/meta-setup-guide" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">Open the complete Meta setup guide <ExternalLink className="h-3.5 w-3.5" /></Link>
              </div>}

              <div className="space-y-4">
                {fieldsFor(section).map((field) => <div key={field.key}>
                  <label htmlFor={field.key} className="mb-1.5 block text-sm font-bold text-slate-700">{field.label}</label>
                  <input id={field.key} type={field.secret ? 'password' : 'text'} value={form[field.key]} placeholder={field.placeholder} autoComplete="off" onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500" />
                  {field.help && <p className="mt-1.5 text-xs text-slate-500">{field.help}</p>}
                </div>)}
              </div>

              {section === 'whatsapp' && connection?.tokenHealth?.error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{connection.tokenHealth.error}</p>}
              {section === 'webhook' && connection?.configurationError && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{connection.configurationError}</p>}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                {section === 'whatsapp' && <button type="button" onClick={testConnection} disabled={testing || saving} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Verify live</button>}
                <button type="submit" disabled={saving || testing} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save settings</button>
              </div>
            </form>}
          </section>
        </div>
      </main>
    </div>
  );
}
