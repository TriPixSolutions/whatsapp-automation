'use client';

import React, { useState } from 'react';
import { WorkflowTemplate } from '@/types/workflowTemplates';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Zap,
  Smartphone,
  ChevronRight,
  Terminal,
  Activity,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateTestRunnerDrawerProps {
  template: WorkflowTemplate | null;
  onClose: () => void;
  onImportAfterTest?: (template: WorkflowTemplate) => void;
}

export function TemplateTestRunnerDrawer({
  template,
  onClose,
  onImportAfterTest,
}: TemplateTestRunnerDrawerProps) {
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [customKeyword, setCustomKeyword] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!template) return null;

  const handleRunTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/automations/templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          phoneNumber,
          customTriggerText: customKeyword || template.triggerKeyword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute template test run');
      }
      setTestResult(data);
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-600" />
                Live Engine Test Runner
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900">{template.name}</h2>
            <p className="text-xs text-slate-500">Run sandbox validation against Automation Engine</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-5 space-y-4 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Test Recipient Phone
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919876543210"
                  className="text-xs font-mono font-semibold text-slate-800 bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Trigger Keyword
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                <Zap className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder={template.triggerKeyword || 'hello'}
                  className="text-xs font-mono font-semibold text-slate-800 bg-transparent outline-none w-full"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isRunning ? 'Executing Workflow Simulation...' : 'Execute Template Test'}</span>
          </button>
        </div>

        {/* Test Result Execution Trace */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Execution Failure</div>
                <div className="mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {testResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Pill */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1',
                        testResult.status === 'completed' || testResult.status === 'waiting'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: {testResult.status.toUpperCase()}
                    </span>
                    {testResult.waitingFor && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Paused: Waiting for {testResult.waitingFor}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    ⏱ {testResult.durationMs}ms
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{testResult.message}</p>
              </div>

              {/* Step By Step Traversal Logs */}
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Execution Trace Steps ({testResult.steps.length})</span>
                </div>

                <div className="space-y-2">
                  {testResult.steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-600 flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-900">{step.nodeTitle || step.nodeId}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {step.status}
                        </span>
                      </div>

                      {step.outputResult && (
                        <div className="p-2 rounded-lg bg-slate-50 text-[11px] font-mono text-slate-600 overflow-x-auto">
                          <pre>{JSON.stringify(step.outputResult, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!testResult && !isRunning && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <Activity className="w-8 h-8 text-slate-300" />
              <div className="text-xs font-bold text-slate-600">Ready for Execution</div>
              <div className="text-[11px] text-slate-400 max-w-xs">
                Click "Execute Template Test" above to trace real node evaluation, message dispatching, and branch resolutions.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Close Runner
          </button>

          {onImportAfterTest && (
            <button
              onClick={() => {
                onClose();
                onImportAfterTest(template);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Import to Workflows</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
