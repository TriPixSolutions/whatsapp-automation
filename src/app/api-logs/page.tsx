'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Code2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Clock,
  Terminal,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetaApiLog } from '@/types/automations';

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<MetaApiLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/api-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > 0 && !selectedLogId) {
          setSelectedLogId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('API logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLogId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const filteredLogs = logs.filter((l) => {
    const isSuccess = l.httpStatus >= 200 && l.httpStatus < 300;
    if (statusFilter === 'success' && !isSuccess) return false;
    if (statusFilter === 'error' && isSuccess) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.endpoint.toLowerCase().includes(q) ||
        (l.templateName || '').toLowerCase().includes(q) ||
        (l.errorMessage || '').toLowerCase().includes(q) ||
        JSON.stringify(l.requestBody).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyAsCurl = () => {
    if (!selectedLog) return;
    const curl = `curl -X POST "${selectedLog.endpoint}" \\\n  -H "Authorization: Bearer <META_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(selectedLog.requestBody)}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Meta Debug Center"
          subtitle="Graph API v18.0 request/response telemetry, HTTP status codes, delivery receipts & error diagnosis"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by endpoint, template, or error code..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={cn('px-2.5 py-1.5 rounded-lg transition-all', statusFilter === 'all' && 'bg-white text-slate-900 font-bold shadow-2xs')}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('success')}
                  className={cn('px-2.5 py-1.5 rounded-lg transition-all', statusFilter === 'success' && 'bg-white text-slate-900 font-bold shadow-2xs')}
                >
                  200 OK
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('error')}
                  className={cn('px-2.5 py-1.5 rounded-lg transition-all', statusFilter === 'error' && 'bg-white text-slate-900 font-bold shadow-2xs')}
                >
                  Errors
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLogs}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-2xs"
                title="Refresh API Logs"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-emerald-600')} />
              </button>
            </div>
          </div>

          {/* Two-Column Debugger View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Columns: API Requests List */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Meta Graph API Requests ({filteredLogs.length})
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Graph API v18.0</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto custom-scrollbar">
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Code2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600 text-sm">No API logs available</p>
                    <p className="text-xs text-slate-400">Dispatches through Meta Cloud API will appear here live</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLogId === log.id;
                    const isSuccess = log.httpStatus >= 200 && log.httpStatus < 300;

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
                              {log.httpStatus}
                            </span>
                            <span className="text-xs font-bold text-slate-900 font-mono truncate max-w-[200px]">
                              {log.method} /{log.endpoint.split('/').slice(-2).join('/')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[200px] font-mono">
                            {log.templateName ? `Template: ${log.templateName}` : log.phoneNumberId ? `Phone: ${log.phoneNumberId}` : 'Meta API Call'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{log.latencyMs}ms</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 6 Columns: Request & Response Inspector */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              {selectedLog ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Request & Response Telemetry
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{selectedLog.endpoint}</p>
                    </div>

                    <button
                      type="button"
                      onClick={copyAsCurl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      title="Copy cURL Command"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied cURL' : 'Copy cURL'}</span>
                    </button>
                  </div>

                  {/* Status Banner */}
                  {selectedLog.errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Error Code #{selectedLog.errorCode || selectedLog.httpStatus}</span>
                      </div>
                      <p className="leading-relaxed text-rose-800">{selectedLog.errorMessage}</p>
                    </div>
                  )}

                  {/* Request Payload */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Outbound Request Payload
                    </span>
                    <pre className="p-3 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[220px] leading-relaxed custom-scrollbar">
                      {JSON.stringify(selectedLog.requestBody, null, 2)}
                    </pre>
                  </div>

                  {/* Response Payload */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Meta Graph Response ({selectedLog.httpStatus})
                    </span>
                    <pre className="p-3 bg-slate-900 text-cyan-300 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[220px] leading-relaxed custom-scrollbar">
                      {JSON.stringify(selectedLog.responseBody, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs">Select an API call to inspect telemetry</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
