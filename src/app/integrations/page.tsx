'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Loader2, RefreshCw, Server, Settings, Smartphone, Workflow } from 'lucide-react';

type Check = { key: string; label: string; status: 'ready' | 'attention' | 'not_observable'; detail: string };
type RuntimeReport = { overallStatus: string; checks: Check[]; timestamp: string };

const StatusIcon = ({ status }: { status: Check['status'] }) => status === 'ready'
  ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  : status === 'attention'
    ? <AlertTriangle className="h-5 w-5 text-amber-600" />
    : <Clock3 className="h-5 w-5 text-slate-400" />;

export default function IntegrationsPage() {
  const [report, setReport] = useState<RuntimeReport | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [runtimeResponse, connectionResponse] = await Promise.all([
        fetch('/api/diagnostics/runtime', { cache: 'no-store' }),
        fetch('/api/meta/connection', { cache: 'no-store' }),
      ]);
      const runtimeBody = await runtimeResponse.json();
      const connectionBody = await connectionResponse.json();
      if (!runtimeResponse.ok) throw new Error(runtimeBody.error || 'Runtime health is unavailable.');
      if (!connectionResponse.ok) throw new Error(connectionBody.error || 'Meta connection status is unavailable.');
      setReport(runtimeBody);
      setConnection(connectionBody);
    } catch (cause: any) {
      setError(cause.message || 'Integration status is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const metaConnected = connection?.connectionStatus === 'connected' && !connection?.configurationError;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pl-60">
      <Sidebar />
      <Header title="Integrations" subtitle="Live connection and automation infrastructure health" />
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-950">System connections</h1>
            <p className="mt-1 text-sm text-slate-500">Statuses come from saved configuration and persisted production evidence.</p>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {loading && !report ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div> : <>
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3"><Smartphone className="h-5 w-5 text-emerald-700" /></div>
                  <div><h2 className="font-bold text-slate-950">WhatsApp Cloud API</h2><p className="mt-1 text-sm text-slate-500">Meta sender, token and phone number</p></div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${metaConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{metaConnected ? 'Connected' : 'Needs attention'}</span>
              </div>
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <p>Phone: {connection?.phoneNumberHealth?.displayPhoneNumber || 'Not verified'}</p>
                <p>Token: {connection?.tokenHealth?.status || 'Not configured'}</p>
                {connection?.configurationError && <p className="text-amber-700">{connection.configurationError}</p>}
              </div>
              <Link href="/settings?section=whatsapp" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-950">Configure connection <ExternalLink className="h-4 w-4" /></Link>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-3"><Workflow className="h-5 w-5 text-indigo-700" /></div>
                  <div><h2 className="font-bold text-slate-950">Automation runtime</h2><p className="mt-1 text-sm text-slate-500">Workflow, webhook and worker evidence</p></div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${report?.overallStatus === 'ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{report?.overallStatus === 'ready' ? 'Ready' : report?.overallStatus === 'attention' ? 'Needs attention' : 'Not verified'}</span>
              </div>
              <p className="mt-5 text-sm text-slate-600">A background worker without a persisted heartbeat remains “Not verified”; it is never shown as healthy based only on configuration.</p>
              <Link href="/test-center" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-950">Open Automation Lab <ExternalLink className="h-4 w-4" /></Link>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3"><Server className="h-5 w-5 text-slate-600" /><div><h2 className="font-bold text-slate-950">Production checks</h2><p className="text-sm text-slate-500">Latest refresh: {report?.timestamp ? new Date(report.timestamp).toLocaleString() : 'Unavailable'}</p></div></div>
            <div className="mt-5 divide-y divide-slate-100">
              {(report?.checks || []).map((check) => <div key={check.key} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <StatusIcon status={check.status} />
                <div><p className="text-sm font-bold text-slate-900">{check.label}</p><p className="mt-1 text-sm text-slate-500">{check.detail}</p></div>
              </div>)}
            </div>
          </section>

          <section className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3"><Settings className="h-5 w-5 text-slate-500" /><div><h2 className="font-bold text-slate-950">Workspace and security settings</h2><p className="text-sm text-slate-500">Manage saved IDs, secrets and webhook configuration.</p></div></div>
            <Link href="/settings" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Open settings</Link>
          </section>
        </>}
      </main>
    </div>
  );
}
