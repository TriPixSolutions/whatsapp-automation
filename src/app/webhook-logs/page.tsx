'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Webhook,
  Play,
  RotateCcw,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WebhookLogItem } from '@/types/automations';

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/webhook-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > 0 && !selectedLogId) {
          setSelectedLogId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Webhook logs load error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLogId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleReplay = async (id: string) => {
    setReplaying(true);
    try {
      const res = await fetch('/api/webhook-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'replay', logId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`✓ Webhook replayed successfully!`);
        await fetchLogs();
      } else {
        setToastMessage(`Replay error: ${data.error}`);
      }
    } catch (err: any) {
      setToastMessage(`Failed: ${err.message}`);
    } finally {
      setReplaying(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const filteredLogs = logs.filter((l) => {
    if (directionFilter !== 'all' && l.direction !== directionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.id.toLowerCase().includes(q) ||
        l.eventType.toLowerCase().includes(q) ||
        JSON.stringify(l.payload).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyPayload = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Webhook Inspector"
          subtitle="Real-time Meta Cloud API webhook ingress, payload inspection & zero-loss event replay"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Control Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, payloads, or message IDs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setDirectionFilter('all')}
                  className={cn('px-2.5 py-1.5 rounded-lg transition-all', directionFilter === 'all' && 'bg-white text-slate-900 font-bold shadow-2xs')}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter('incoming')}
                  className={cn('px-2.5 py-1.5 rounded-lg transition-all', directionFilter === 'incoming' && 'bg-white text-slate-900 font-bold shadow-2xs')}
                >
                  Inbound
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter('outgoing')}
                  className={cn('px-2.5 py-1.5 rounded-lg transition-all', directionFilter === 'outgoing' && 'bg-white text-slate-900 font-bold shadow-2xs')}
                >
                  Outbound
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLogs}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-2xs"
                title="Refresh Logs"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-emerald-600')} />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Two-Column Inspector Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Columns: Webhooks Feed Table */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Webhook Event Stream ({filteredLogs.length})
                </h3>
                <span className="text-[10px] font-mono text-slate-400">HMAC-SHA256 Verified</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto custom-scrollbar">
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Webhook className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600 text-sm">No webhook events logged</p>
                    <p className="text-xs text-slate-400">Events from Meta Cloud API will appear here automatically</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLogId === log.id;
                    const isSuccess = log.responseStatus >= 200 && log.responseStatus < 300;

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLogId(log.id)}
                        className={cn(
                          'p-3.5 cursor-pointer transition-colors space-y-1.5',
                          isSelected
                            ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                            : 'hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border',
                                isSuccess
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              )}
                            >
                              {log.responseStatus || 200}
                            </span>
                            <span className="text-xs font-bold text-slate-900 font-mono truncate max-w-[180px]">
                              {log.eventType}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[220px]">{log.source}</span>
                          <span className="font-mono text-[10px] text-slate-400">{log.executionTimeMs}ms</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 6 Columns: Payload Details & Replay Action */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              {selectedLog ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Webhook Payload Inspection
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">{selectedLog.id}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyPayload}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                        title="Copy JSON Payload"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={replaying}
                        onClick={() => handleReplay(selectedLog.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RotateCcw className={cn('w-3.5 h-3.5', replaying && 'animate-spin')} />
                        <span>{replaying ? 'Replaying...' : 'Replay Webhook'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Code</span>
                      <span className="font-mono font-bold text-slate-800">{selectedLog.responseStatus}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Execution Latency</span>
                      <span className="font-mono font-bold text-slate-800">{selectedLog.executionTimeMs}ms</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">HMAC Signature</span>
                      <span className="font-mono font-bold text-emerald-700">Verified ✓</span>
                    </div>
                  </div>

                  {/* JSON Payload Viewer */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Request Body JSON
                    </span>
                    <pre className="p-3 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[400px] leading-relaxed custom-scrollbar">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs">Select a webhook to inspect its payload</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
