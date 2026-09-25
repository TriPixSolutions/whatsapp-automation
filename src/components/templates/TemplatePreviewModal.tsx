'use client';

import React from 'react';
import { WorkflowTemplate } from '@/types/workflowTemplates';
import {
  X,
  Sparkles,
  Download,
  Play,
  Copy,
  Layers,
  Zap,
  ArrowRight,
  MessageSquare,
  LayoutGrid,
  Clock,
  UserCheck,
  Tag,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplatePreviewModalProps {
  template: WorkflowTemplate | null;
  onClose: () => void;
  onImport: (template: WorkflowTemplate) => void;
  onRunTest: (template: WorkflowTemplate) => void;
  onDuplicate: (template: WorkflowTemplate) => void;
  isImporting?: boolean;
}

export function TemplatePreviewModal({
  template,
  onClose,
  onImport,
  onRunTest,
  onDuplicate,
  isImporting = false,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
      case 'trigger_keyword':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'button':
        return <LayoutGrid className="w-4 h-4 text-blue-500" />;
      case 'carousel':
        return <LayoutGrid className="w-4 h-4 text-purple-500" />;
      case 'delay':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'crm_action':
      case 'set_variable':
        return <UserCheck className="w-4 h-4 text-rose-500" />;
      case 'tag_management':
        return <Tag className="w-4 h-4 text-indigo-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {template.category}
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                v{template.version}
              </span>
              {template.isOfficial && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Verified Template
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900">{template.name}</h2>
            <p className="text-xs text-slate-500">{template.description}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Purpose and Metadata Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Testing Purpose</span>
              </div>
              <p className="text-emerald-900 mt-1 font-medium">{template.purpose}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Node & Edge Count</span>
              </div>
              <p className="text-slate-900 mt-1 font-semibold">
                {template.nodes.length} Nodes · {template.edges.length} Directed Edges
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Trigger Keyword</span>
              </div>
              <p className="text-slate-900 mt-1 font-mono font-bold">
                "{template.triggerKeyword || 'hello'}" ({template.triggerType})
              </p>
            </div>
          </div>

          {/* Detailed Node Pipeline Visualizer */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Graph Execution Steps</span>
            </h4>

            <div className="space-y-2.5">
              {template.nodes.map((node, index) => {
                const config = node.config || {};
                return (
                  <div
                    key={node.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex items-start gap-3.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getNodeIcon(node.type)}
                          <span className="text-xs font-bold text-slate-900">{node.title}</span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {node.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">{node.description}</p>

                      {/* Node Config Preview Details */}
                      {config.text && (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700">
                          {config.text}
                        </div>
                      )}

                      {config.buttons && Array.isArray(config.buttons) && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {config.buttons.map((btn: any) => (
                            <span
                              key={btn.id}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                            >
                              🔘 {btn.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {config.cards && Array.isArray(config.cards) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {config.cards.map((c: any, cIdx: number) => (
                            <div
                              key={cIdx}
                              className="p-2 rounded-lg bg-purple-50/50 border border-purple-100 text-[11px] space-y-1"
                            >
                              <div className="font-bold text-purple-900 truncate">{c.title}</div>
                              <div className="text-purple-700 text-[10px] truncate">{c.description}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {config.delayAmount && (
                        <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Wait for {config.delayAmount} {config.delayUnit || 'minutes'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlights */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Included Validation Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {template.highlightFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            onClick={() => onDuplicate(template)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate Template</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onRunTest(template);
              }}
              className="px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>Run Template Test</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onImport(template);
              }}
              disabled={isImporting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'One-Click Import'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
