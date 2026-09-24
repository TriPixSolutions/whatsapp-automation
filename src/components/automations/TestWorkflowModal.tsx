'use client';

import React, { useState } from 'react';
import {
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowDefinition, ExecutionTraceStep, WorkflowExecutionLog } from '@/types/automations';

interface TestWorkflowModalProps {
  workflow: WorkflowDefinition;
  isOpen: boolean;
  onClose: () => void;
  onRunTest: (payload: {
    phoneNumber: string;
    text: string;
    simulationType: string;
  }) => Promise<WorkflowExecutionLog | null>;
  isRunning: boolean;
  lastExecution: WorkflowExecutionLog | null;
}

export function TestWorkflowModal({
  workflow,
  isOpen,
  onClose,
  onRunTest,
  isRunning,
  lastExecution,
}: TestWorkflowModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [simulationType, setSimulationType] = useState('keyword_trigger');
  const [triggerText, setTriggerText] = useState(workflow.triggerKeyword || 'Hello');
  const [activeStepTab, setActiveStepTab] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleExecute = async () => {
    await onRunTest({
      phoneNumber,
      text: triggerText,
      simulationType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Play className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Run Test Workflow</h3>
              <p className="text-[11px] text-gray-400">
                Execute "{workflow.name}" against live database & sandbox engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Test Setup Inputs */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Recipient WhatsApp Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-gray-950 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Trigger Simulation Type
              </label>
              <select
                value={simulationType}
                onChange={(e) => setSimulationType(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="keyword_trigger">Keyword Trigger</option>
                <option value="incoming_message">Inbound Greeting Message</option>
                <option value="button_click">Interactive Button Click</option>
                <option value="carousel_click">Carousel Card Click</option>
                <option value="list_selection">List Menu Selection</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Trigger Value / Keyword
              </label>
              <input
                type="text"
                value={triggerText}
                onChange={(e) => setTriggerText(e.target.value)}
                placeholder="e.g. Hello or Pricing"
                className="w-full bg-gray-950 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Execution Results View */}
          {lastExecution && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">Execution Flow Trace</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase',
                    lastExecution.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  )}
                >
                  Status: {lastExecution.status} ({lastExecution.totalDurationMs}ms)
                </span>
              </div>

              {/* Step Timeline */}
              <div className="space-y-2">
                {lastExecution.steps.map((step, idx) => (
                  <div
                    key={step.nodeId + idx}
                    onClick={() => setActiveStepTab(activeStepTab === idx ? null : idx)}
                    className={cn(
                      'p-2.5 rounded-xl border transition-all cursor-pointer',
                      step.status === 'failed'
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] font-mono text-gray-300 font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{step.nodeTitle}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({step.nodeType})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">
                          {step.durationMs}ms
                        </span>
                        {step.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Step Trace Detail */}
                    {activeStepTab === idx && (
                      <div className="mt-2.5 pt-2 border-t border-gray-800 text-[11px] font-mono space-y-1.5 text-gray-300">
                        {step.error && (
                          <div className="text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                            Error: {step.error}
                          </div>
                        )}
                        {step.outputResult && (
                          <div className="bg-gray-950 p-2 rounded border border-gray-800/80 text-[10px] overflow-x-auto text-emerald-300">
                            <span className="text-gray-500 block mb-0.5">// Node Output Payload:</span>
                            {JSON.stringify(step.outputResult, null, 2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/40">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulates live webhook and WhatsApp API dispatch</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Graph...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Test Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
