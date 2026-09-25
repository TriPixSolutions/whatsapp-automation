'use client';

import React from 'react';
import { WorkflowTemplate } from '@/types/workflowTemplates';
import {
  Sparkles,
  Zap,
  Play,
  Download,
  Eye,
  Copy,
  ArrowRight,
  Layers,
  GitFork,
  Clock,
  CheckCircle2,
  Tag,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: WorkflowTemplate;
  onPreview: (template: WorkflowTemplate) => void;
  onImport: (template: WorkflowTemplate) => void;
  onRunTest: (template: WorkflowTemplate) => void;
  onDuplicate: (template: WorkflowTemplate) => void;
  isImporting?: boolean;
}

export function TemplateCard({
  template,
  onPreview,
  onImport,
  onRunTest,
  onDuplicate,
  isImporting = false,
}: TemplateCardProps) {
  // Category styling colors
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Trigger Testing':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Interactive Buttons':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'E-Commerce & Carousel':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Schedulers & Delays':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Lead Capture & CRM':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Full Demos':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Node type icons / labels for visual flow preview
  const nodeFlowPreview = template.nodes.slice(0, 4);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner & Badges */}
      <div className="p-5 pb-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-[11px] font-bold px-2.5 py-0.5 rounded-full border',
                getCategoryBadgeClass(template.category)
              )}
            >
              {template.category}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
              v{template.version}
            </span>
            {template.isOfficial && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Verified Test
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDuplicate(template)}
              title="Duplicate as custom template"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Purpose */}
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
            {template.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Purpose Alert Pill */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Testing Purpose:</span>
          </div>
          <p className="text-slate-600 text-[11px] mt-0.5 font-medium">{template.purpose}</p>
        </div>

        {/* Visual Mini Flow Pipeline */}
        <div className="pt-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Workflow Structure ({template.nodes.length} nodes · {template.edges.length} edges)</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            {nodeFlowPreview.map((node, i) => (
              <React.Fragment key={node.id}>
                <div
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/70 shrink-0 whitespace-nowrap text-[11px] truncate max-w-[110px]"
                  title={node.title}
                >
                  {node.title.replace(/Keyword: /g, '').replace(/Send /g, '')}
                </div>
                {i < nodeFlowPreview.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
            {template.nodes.length > 4 && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                +{template.nodes.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          {template.highlightFeatures.slice(0, 2).map((feat, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onPreview(template)}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Preview</span>
        </button>

        <button
          onClick={() => onRunTest(template)}
          className="py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Run instant sandbox execution test"
        >
          <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          <span>Run Test</span>
        </button>

        <button
          onClick={() => onImport(template)}
          disabled={isImporting}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isImporting ? 'Importing...' : 'Import'}</span>
        </button>
      </div>
    </div>
  );
}
