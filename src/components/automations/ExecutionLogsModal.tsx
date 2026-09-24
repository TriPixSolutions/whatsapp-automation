'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  ChevronDown,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowExecutionLog } from '@/types/automations';

interface ExecutionLogsModalProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutionLogsModal({ workflowId, isOpen, onClose }: ExecutionLogsModalProps) {
  const [logs, setLogs] = useState<WorkflowExecutionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/test-center/logs?workflowId=${workflowId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch execution logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, workflowId]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  const selectedLog = logs.find((l) => l.executionId === selectedLogId) || filteredLogs[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Execution Logs</h3>
              <p className="text-[11px] text-gray-400">
                Audit trail of real automated workflow executions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-gray-800/80 bg-gray-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                filterStatus === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                filterStatus === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Success
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                filterStatus === 'failed'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Failed
            </button>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Showing {filteredLogs.length} runs
          </span>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Log Entries List */}
          <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-3 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No execution logs recorded yet. Run a test workflow above!
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.executionId || log.id}
                  onClick={() => setSelectedLogId(log.executionId || log.id)}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer space-y-1.5',
                    (log.executionId || log.id) === selectedLog?.executionId
                      ? 'bg-gray-900 border-emerald-500/60 shadow-lg'
                      : 'bg-gray-950/60 border-gray-800 hover:border-gray-700'
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-gray-300">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      <span>{log.phoneNumber}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase',
                        log.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      )}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="truncate max-w-[180px]">
                      Trigger: "{log.triggerValue || log.triggerType}"
                    </span>
                    <span className="font-mono text-[10px]">
                      {log.totalDurationMs}ms · {log.steps?.length || 0} steps
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-500 font-mono">
                    {new Date(log.startedAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Selected Log Detailed Inspection */}
          <div className="w-1/2 overflow-y-auto p-4 space-y-4 bg-gray-950">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Execution Overview</span>
                    <span className="font-mono text-[10px] text-gray-400">
                      ID: {selectedLog.executionId}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 pt-1">
                    <div>
                      <span className="text-gray-500 block">Recipient:</span>
                      <span className="font-mono">{selectedLog.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Total Duration:</span>
                      <span className="font-mono">{selectedLog.totalDurationMs}ms</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300">Step Trace Breakdown</h4>
                  {selectedLog.steps?.map((st, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {i + 1}. {st.nodeTitle}
                        </span>
                        <span className="text-emerald-400 text-[10px]">{st.durationMs}ms</span>
                      </div>
                      <div className="text-[10px] text-gray-400">Type: {st.nodeType}</div>
                      {st.error && (
                        <div className="text-rose-400 text-[10px] bg-rose-500/10 p-1.5 rounded">
                          {st.error}
                        </div>
                      )}
                      {st.outputResult && (
                        <div className="text-[10px] text-emerald-300 bg-gray-950 p-2 rounded border border-gray-800/60 overflow-x-auto">
                          {JSON.stringify(st.outputResult, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 text-xs">
                Select an execution log on the left to inspect
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
