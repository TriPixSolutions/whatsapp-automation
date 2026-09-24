'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Zap,
  MessageSquare,
  MousePointerClick,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  GitBranch,
  UserCheck,
  Tag,
  Globe,
  Webhook,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Trash2,
  ChevronRight,
  Sparkles,
  Smartphone,
  Check,
  ListFilter,
  Hourglass,
  StopCircle,
  Bot,
  BrainCircuit,
  PhoneForwarded,
  MapPin,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowNode } from '@/types/automations';

export interface CustomNodeData extends WorkflowNode {
  status?: 'idle' | 'running' | 'completed' | 'failed';
  executionDurationMs?: number;
  errorMessage?: string;
  isSelected?: boolean;
  onSelectNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
}

const CATEGORY_STYLES: Record<
  string,
  {
    icon: any;
    accent: string;
    border: string;
    bg: string;
    badge: string;
    badgeBg: string;
    tagLabel: string;
  }
> = {
  // Triggers
  trigger_incoming: {
    icon: Zap,
    accent: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/20 to-gray-900',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    tagLabel: 'TRIGGER',
  },
  trigger_keyword: {
    icon: Zap,
    accent: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/20 to-gray-900',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    tagLabel: 'KEYWORD TRIGGER',
  },
  trigger_button: {
    icon: MousePointerClick,
    accent: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/20 to-gray-900',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    tagLabel: 'BUTTON TRIGGER',
  },
  trigger_carousel: {
    icon: Layers,
    accent: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/20 to-gray-900',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    tagLabel: 'CAROUSEL TRIGGER',
  },
  trigger_list: {
    icon: ListFilter,
    accent: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/20 to-gray-900',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    tagLabel: 'LIST TRIGGER',
  },
  trigger_flow: {
    icon: Smartphone,
    accent: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/20 to-gray-900',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    tagLabel: 'FLOW TRIGGER',
  },

  // WhatsApp Message Types
  whatsapp_message: {
    icon: MessageSquare,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-950/20 to-gray-900',
    badge: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    tagLabel: 'WHATSAPP MESSAGE',
  },
  whatsapp_button: {
    icon: MousePointerClick,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-950/20 to-gray-900',
    badge: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    tagLabel: 'BUTTON MESSAGE',
  },
  whatsapp_carousel: {
    icon: Layers,
    accent: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'from-purple-950/20 to-gray-900',
    badge: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    tagLabel: 'CAROUSEL MESSAGE',
  },
  whatsapp_catalog: {
    icon: ShoppingBag,
    accent: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'from-pink-950/20 to-gray-900',
    badge: 'text-pink-400',
    badgeBg: 'bg-pink-500/10 border-pink-500/30',
    tagLabel: 'CATALOG PRODUCT',
  },
  whatsapp_flow: {
    icon: Smartphone,
    accent: 'text-teal-400',
    border: 'border-teal-500/40',
    bg: 'from-teal-950/20 to-gray-900',
    badge: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 border-teal-500/30',
    tagLabel: 'WHATSAPP FLOW',
  },

  // Logic & Routing
  conditional_logic: {
    icon: GitBranch,
    accent: 'text-indigo-400',
    border: 'border-indigo-500/40',
    bg: 'from-indigo-950/20 to-gray-900',
    badge: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
    tagLabel: 'IF / ELSE LOGIC',
  },
  multi_branch: {
    icon: GitBranch,
    accent: 'text-indigo-400',
    border: 'border-indigo-500/40',
    bg: 'from-indigo-950/20 to-gray-900',
    badge: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
    tagLabel: 'MULTI ROUTER',
  },
  wait_for_reply: {
    icon: Hourglass,
    accent: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'from-sky-950/20 to-gray-900',
    badge: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    tagLabel: 'WAIT FOR REPLY',
  },
  delay: {
    icon: Clock,
    accent: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'from-yellow-950/20 to-gray-900',
    badge: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/30',
    tagLabel: 'DELAY TIMER',
  },

  // CRM & Leads
  crm_action: {
    icon: SlidersHorizontal,
    accent: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'from-blue-950/20 to-gray-900',
    badge: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    tagLabel: 'CRM ACTION',
  },
  lead_management: {
    icon: UserCheck,
    accent: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'from-blue-950/20 to-gray-900',
    badge: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    tagLabel: 'LEAD MANAGEMENT',
  },
  tag_management: {
    icon: Tag,
    accent: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'from-cyan-950/20 to-gray-900',
    badge: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
    tagLabel: 'TAG CONTACT',
  },

  // Integrations
  google_sheets: {
    icon: FileSpreadsheet,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-950/20 to-gray-900',
    badge: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    tagLabel: 'GOOGLE SHEETS',
  },
  api_node: {
    icon: Globe,
    accent: 'text-orange-400',
    border: 'border-orange-500/40',
    bg: 'from-orange-950/20 to-gray-900',
    badge: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 border-orange-500/30',
    tagLabel: 'REST API',
  },
  webhook_node: {
    icon: Webhook,
    accent: 'text-orange-400',
    border: 'border-orange-500/40',
    bg: 'from-orange-950/20 to-gray-900',
    badge: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 border-orange-500/30',
    tagLabel: 'WEBHOOK',
  },
  // AI Nodes
  ai_agent: {
    icon: Bot,
    accent: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'from-violet-950/20 to-gray-900',
    badge: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    tagLabel: 'AI AGENT',
  },
  ai_sentiment: {
    icon: BrainCircuit,
    accent: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'from-violet-950/20 to-gray-900',
    badge: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    tagLabel: 'AI SENTIMENT',
  },
  ai_smart_reply: {
    icon: MessageSquare,
    accent: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'from-violet-950/20 to-gray-900',
    badge: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    tagLabel: 'AI REPLY',
  },
  ai_handoff: {
    icon: PhoneForwarded,
    accent: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'from-violet-950/20 to-gray-900',
    badge: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    tagLabel: 'AI HANDOVER',
  },
  // WhatsApp Media & Templates
  message_media: {
    icon: Layers,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-950/20 to-gray-900',
    badge: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    tagLabel: 'MEDIA MESSAGE',
  },
  message_template: {
    icon: FileCode,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-950/20 to-gray-900',
    badge: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    tagLabel: 'META TEMPLATE',
  },
  whatsapp_list: {
    icon: ListFilter,
    accent: 'text-teal-400',
    border: 'border-teal-500/40',
    bg: 'from-teal-950/20 to-gray-900',
    badge: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 border-teal-500/30',
    tagLabel: 'SECTION LIST',
  },
  end: {
    icon: StopCircle,
    accent: 'text-gray-400',
    border: 'border-gray-600/40',
    bg: 'from-gray-950/20 to-gray-900',
    badge: 'text-gray-400',
    badgeBg: 'bg-gray-500/10 border-gray-600/30',
    tagLabel: 'WORKFLOW END',
  },
};

const DEFAULT_STYLE = {
  icon: MessageSquare,
  accent: 'text-emerald-400',
  border: 'border-emerald-500/40',
  bg: 'from-emerald-950/20 to-gray-900',
  badge: 'text-emerald-400',
  badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
  tagLabel: 'STEP',
};

export const CustomWorkflowNode = memo(function CustomWorkflowNode({
  id,
  data,
  selected,
}: NodeProps) {
  const node = data as unknown as CustomNodeData;
  const nodeType = (node.type || 'whatsapp_message') as string;

  // Resolve category styling (supporting all 16 node types & legacy aliases)
  const resolvedKey =
    nodeType === 'trigger'
      ? 'trigger_keyword'
      : nodeType === 'message'
      ? 'whatsapp_message'
      : nodeType === 'button'
      ? 'whatsapp_button'
      : nodeType === 'list'
      ? 'whatsapp_list'
      : nodeType === 'carousel'
      ? 'whatsapp_carousel'
      : nodeType === 'flow'
      ? 'whatsapp_flow'
      : nodeType === 'condition'
      ? 'conditional_logic'
      : nodeType === 'ai' || nodeType === 'ai_agent'
      ? 'ai_agent'
      : nodeType === 'api' || nodeType === 'api_request'
      ? 'api_node'
      : nodeType === 'webhook'
      ? 'webhook_node'
      : nodeType === 'tag'
      ? 'tag_management'
      : nodeType === 'assign_agent'
      ? 'crm_action'
      : nodeType === 'wait'
      ? 'wait_for_reply'
      : nodeType === 'branch'
      ? 'multi_branch'
      : nodeType;

  const style = CATEGORY_STYLES[resolvedKey] || DEFAULT_STYLE;
  const IconComponent = style.icon;

  const isTrigger = resolvedKey.startsWith('trigger');
  const isCondition = resolvedKey === 'conditional_logic';
  const isButton = resolvedKey === 'whatsapp_button';
  const isMultiBranch = resolvedKey === 'multi_branch';
  const isWaitForReply = resolvedKey === 'wait_for_reply';
  const isEnd = resolvedKey === 'end';

  const buttons = node.config?.buttons || [];
  const cards = node.config?.cards || [];
  const branches = node.config?.branches || [];

  return (
    <div
      onClick={() => node.onSelectNode?.(id)}
      className={cn(
        'group relative min-w-[280px] max-w-[340px] rounded-xl border bg-gradient-to-b p-3.5 shadow-xl transition-all duration-200 cursor-pointer',
        style.bg,
        style.border,
        'hover:shadow-2xl hover:border-opacity-100',
        selected
          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-950 shadow-emerald-500/20 scale-[1.02]'
          : 'hover:scale-[1.01]',
        node.status === 'running' && 'ring-2 ring-blue-500 animate-pulse',
        node.status === 'completed' && 'ring-2 ring-emerald-500/80 shadow-emerald-950/50',
        node.status === 'failed' && 'ring-2 ring-rose-500 shadow-rose-950/50'
      )}
    >
      {/* Target input handle (Left) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !-left-2 !bg-gray-400 !border-2 !border-gray-950 hover:!bg-emerald-400 transition-colors"
        />
      )}

      {/* Floating Action Menu on Hover */}
      <div className="absolute -top-3.5 right-2 hidden group-hover:flex items-center gap-1 bg-gray-900/90 border border-gray-700/60 rounded-lg px-1.5 py-0.5 shadow-lg backdrop-blur-sm z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.onDuplicateNode?.(id);
          }}
          title="Duplicate Node"
          className="p-1 hover:text-emerald-400 text-gray-400 transition-colors"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.onDeleteNode?.(id);
          }}
          title="Delete Node"
          className="p-1 hover:text-rose-400 text-gray-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Node Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center border',
              style.badgeBg,
              style.border
            )}
          >
            <IconComponent className={cn('w-4 h-4', style.accent)} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border',
                  style.badgeBg,
                  style.badge
                )}
              >
                {style.tagLabel}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-white tracking-tight leading-tight line-clamp-1 mt-0.5">
              {node.title || 'Untitled Node'}
            </h4>
          </div>
        </div>

        {/* Execution Status Badge */}
        {node.status && node.status !== 'idle' && (
          <div className="flex-shrink-0">
            {node.status === 'running' && (
              <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                running
              </span>
            )}
            {node.status === 'completed' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-mono">
                <Check className="w-2.5 h-2.5" />
                {node.executionDurationMs !== undefined ? `${node.executionDurationMs}ms` : 'sent'}
              </span>
            )}
            {node.status === 'failed' && (
              <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded-full font-mono">
                <AlertCircle className="w-2.5 h-2.5" />
                failed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Node Description */}
      {node.description && (
        <p className="text-[11px] text-gray-400 line-clamp-1 mb-2 font-normal">
          {node.description}
        </p>
      )}

      {/* Specialized Live Preview Content inside Node */}
      <div className="bg-gray-950/60 rounded-lg p-2 border border-gray-800/80 text-[11px] text-gray-300">
        {/* Keyword Trigger */}
        {resolvedKey === 'trigger_keyword' && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Keyword:</span>
            <span className="font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[10px]">
              "{node.config?.text || node.triggerKeyword || 'hello'}"
            </span>
          </div>
        )}

        {/* Incoming Message Trigger */}
        {resolvedKey === 'trigger_incoming' && (
          <div className="text-gray-400 flex items-center gap-1 text-[10px]">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Fires on any customer inbound WhatsApp message
          </div>
        )}

        {/* WhatsApp Message */}
        {resolvedKey === 'whatsapp_message' && (
          <div className="line-clamp-2 italic text-gray-300">
            "{node.config?.text || node.config?.bodyText || 'Hello, how can we assist you today?'}"
          </div>
        )}

        {/* WhatsApp Button */}
        {resolvedKey === 'whatsapp_button' && (
          <div className="space-y-1.5">
            <p className="line-clamp-1 text-gray-300">
              {node.config?.bodyText || node.config?.text || 'Select an option below:'}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {buttons.length > 0 ? (
                buttons.map((b, idx) => (
                  <span
                    key={b.id || idx}
                    className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  >
                    <MousePointerClick className="w-2.5 h-2.5" />
                    {b.title}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-500 italic">No buttons added</span>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Carousel */}
        {resolvedKey === 'whatsapp_carousel' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Product Cards</span>
              <span className="text-purple-300 font-mono font-bold">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </span>
            </div>
            {cards.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                {cards.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-900 border border-purple-500/20 rounded p-1 text-[9px] truncate text-center text-purple-200"
                  >
                    {c.title || `Item ${i + 1}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Catalog */}
        {resolvedKey === 'whatsapp_catalog' && (
          <div className="flex items-center justify-between">
            <div className="truncate">
              <span className="text-pink-300 font-semibold text-[11px] block truncate">
                {node.config?.productTitle || 'Catalog Showcase'}
              </span>
              <span className="text-[10px] text-gray-400">
                {node.config?.productPrice || '$149.00'}
              </span>
            </div>
            <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/30 px-1.5 py-0.5 rounded">
              In Stock
            </span>
          </div>
        )}

        {/* WhatsApp Flow */}
        {resolvedKey === 'whatsapp_flow' && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-teal-300 font-medium truncate">
              {node.config?.flowTitle || 'Registration Form'}
            </span>
            <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/30 px-1 py-0.5 rounded">
              Interactive
            </span>
          </div>
        )}

        {/* Conditional Logic (If / Else) */}
        {resolvedKey === 'conditional_logic' && (
          <div className="font-mono text-[10px] text-indigo-300 space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">If:</span>
              <span className="text-indigo-200 font-bold">
                {node.config?.conditionVariable || 'text'}
              </span>
              <span className="text-indigo-400">
                {node.config?.conditionOperator || 'contains'}
              </span>
              <span className="text-amber-300">
                "{node.config?.conditionValue || 'yes'}"
              </span>
            </div>
          </div>
        )}

        {/* Multi-Branch Router */}
        {resolvedKey === 'multi_branch' && (
          <div className="space-y-1 text-[10px]">
            <span className="text-gray-400">Branches ({branches.length}):</span>
            <div className="flex flex-wrap gap-1">
              {branches.slice(0, 3).map((br: any, idx: number) => (
                <span
                  key={br.id || idx}
                  className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 rounded text-[9px]"
                >
                  {br.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wait For Reply */}
        {resolvedKey === 'wait_for_reply' && (
          <div className="flex items-center justify-between text-[10px] text-sky-300">
            <span>Timeout fallback:</span>
            <span className="font-mono font-semibold">
              {node.config?.timeoutMinutes || 60}m
            </span>
          </div>
        )}

        {/* Delay Timer */}
        {resolvedKey === 'delay' && (
          <div className="flex items-center gap-1.5 text-yellow-300 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span>Wait {node.config?.delayAmount || 1} {node.config?.delayUnit || 'minutes'}</span>
          </div>
        )}

        {/* CRM Action */}
        {resolvedKey === 'crm_action' && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Stage:</span>
            <span className="font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px]">
              {node.config?.stage || 'qualified'}
            </span>
          </div>
        )}

        {/* Tag Management */}
        {resolvedKey === 'tag_management' && (
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-gray-400">{node.config?.action === 'remove' ? 'Remove' : 'Add'}:</span>
            <span className="text-cyan-300 font-mono bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[10px]">
              #{node.config?.tag || 'vip_lead'}
            </span>
          </div>
        )}

        {/* Lead Management */}
        {resolvedKey === 'lead_management' && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Status: {node.config?.leadStatus || 'qualified'}</span>
            <span className="text-emerald-400 font-bold font-mono">
              ${node.config?.leadValue || 500}
            </span>
          </div>
        )}

        {/* Google Sheets */}
        {resolvedKey === 'google_sheets' && (
          <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] truncate">
            <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
            <span className="truncate">Sheet: {node.config?.sheetName || 'WhatsApp Leads'}</span>
          </div>
        )}

        {/* REST API & Webhook */}
        {(resolvedKey === 'api_node' || resolvedKey === 'webhook_node') && (
          <div className="space-y-0.5 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold bg-orange-500/20 text-orange-300 px-1 rounded">
                {node.config?.apiMethod || node.config?.webhookMethod || 'POST'}
              </span>
              <span className="font-mono text-gray-400 truncate text-[9px]">
                {node.config?.apiUrl || node.config?.webhookUrl || 'https://api.crm.com/v1'}
              </span>
            </div>
          </div>
        )}

        {/* Workflow End */}
        {resolvedKey === 'end' && (
          <div className="text-center text-gray-400 text-[10px] py-0.5">
            Workflow successfully concludes here
          </div>
        )}
      </div>

      {/* OUTPUT HANDLES */}

      {/* 1. Condition Node: Dual True / False Output Handles */}
      {isCondition ? (
        <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-medium px-0.5">
          <div className="relative flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            True (Yes)
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              className="!w-3 !h-3 !-right-2 !top-auto !bg-emerald-400 !border-2 !border-gray-950 hover:scale-125 transition-transform"
            />
          </div>
          <div className="relative flex items-center gap-1 text-rose-400">
            False (No)
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              className="!w-3 !h-3 !-right-2 !top-auto !bg-rose-400 !border-2 !border-gray-950 hover:scale-125 transition-transform"
            />
          </div>
        </div>
      ) : isButton && buttons.length > 0 ? (
        /* 2. Button Node: Dedicated output handles per button + standard output */
        <div className="mt-2.5 pt-2 border-t border-gray-800/80 space-y-1">
          {buttons.map((btn, idx) => (
            <div
              key={btn.id || idx}
              className="relative flex items-center justify-between text-[10px] text-emerald-300 py-0.5"
            >
              <span className="truncate pr-3">Button: {btn.title}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${idx}`}
                className="!w-2.5 !h-2.5 !-right-2 !top-auto !bg-emerald-400 !border-2 !border-gray-950 hover:scale-125 transition-transform"
              />
            </div>
          ))}
          <Handle
            type="source"
            position={Position.Right}
            id="source"
            className="!w-3 !h-3 !-right-2 !top-auto !bg-gray-400 !border-2 !border-gray-950 hover:!bg-emerald-400 transition-colors"
          />
        </div>
      ) : isMultiBranch && branches.length > 0 ? (
        /* 3. Multi-Branch Node: Dedicated handle per branch */
        <div className="mt-2.5 pt-2 border-t border-gray-800/80 space-y-1">
          {branches.map((br: any, idx: number) => (
            <div
              key={br.id || idx}
              className="relative flex items-center justify-between text-[10px] text-indigo-300 py-0.5"
            >
              <span className="truncate pr-3">{br.label || `Branch ${idx + 1}`}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={br.id || `branch-${idx}`}
                className="!w-2.5 !h-2.5 !-right-2 !top-auto !bg-indigo-400 !border-2 !border-gray-950 hover:scale-125 transition-transform"
              />
            </div>
          ))}
        </div>
      ) : isWaitForReply ? (
        /* 4. Wait For Reply: Replied vs Timeout */
        <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-medium px-0.5">
          <div className="relative flex items-center gap-1 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Customer Replied
            <Handle
              type="source"
              position={Position.Right}
              id="replied"
              className="!w-3 !h-3 !-right-2 !top-auto !bg-sky-400 !border-2 !border-gray-950 hover:scale-125 transition-transform"
            />
          </div>
          <div className="relative flex items-center gap-1 text-amber-400">
            Timeout
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <Handle
              type="source"
              position={Position.Right}
              id="timeout"
              className="!w-3 !h-3 !-right-2 !top-auto !bg-amber-400 !border-2 !border-gray-950 hover:scale-125 transition-transform"
            />
          </div>
        </div>
      ) : !isEnd ? (
        /* Standard Single Source Handle (Right) */
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !-right-2 !bg-gray-400 !border-2 !border-gray-950 hover:!bg-emerald-400 transition-colors"
        />
      ) : null}
    </div>
  );
});
