'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Play,
  RotateCcw,
  CheckCheck,
  Eye,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { PhoneMockup } from '@/components/PhoneMockup';
import { WorkflowNode, ExecutionTraceStep } from '@/types/automations';
import { cn } from '@/lib/utils';

interface RightLivePreviewPanelProps {
  selectedNode: WorkflowNode | null;
  allNodes: WorkflowNode[];
  executionTrace?: ExecutionTraceStep[];
  isOpen: boolean;
  onToggle: () => void;
  onButtonClick?: (buttonTitle: string) => void;
}

export function RightLivePreviewPanel({
  selectedNode,
  allNodes,
  executionTrace,
  isOpen,
  onToggle,
  onButtonClick,
}: RightLivePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'selected' | 'flow'>('selected');

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-gray-900/90 hover:bg-gray-800 text-white border border-gray-700/80 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md transition-all group"
      >
        <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold">Live Preview</span>
      </button>
    );
  }

  // Derive preview properties based on selected node or execution
  const node = selectedNode || allNodes[0];
  const nodeType = (node?.type || 'whatsapp_message') as string;
  const config = node?.config || {};

  // Resolve messageType for PhoneMockup
  let previewMessageType: any = 'text';
  if (nodeType === 'whatsapp_button' || nodeType === 'button') previewMessageType = 'button';
  else if (nodeType === 'whatsapp_carousel' || nodeType === 'carousel') previewMessageType = 'carousel';
  else if (nodeType === 'whatsapp_catalog') previewMessageType = 'catalog';
  else if (nodeType === 'whatsapp_flow') previewMessageType = 'whatsapp_flow';
  else if (nodeType === 'trigger_incoming' || nodeType === 'trigger_keyword' || nodeType === 'trigger') {
    previewMessageType = 'text';
  }

  const buttons = (config.buttons || []).map((b: any) => ({
    id: b.id || b.title,
    title: b.title,
  }));

  const cards = (config.cards || []).map((c: any) => ({
    headerImage: c.headerImage,
    title: c.title,
    description: c.description,
    buttons: c.buttons || [{ id: 'b1', title: 'Select' }],
  }));

  const catalogProduct = {
    title: config.productTitle || 'Featured Product',
    price: config.productPrice || '$149.00',
    subtitle: config.productSubtitle || 'In Stock',
    image: config.mediaUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  };

  const bodyText =
    config.bodyText ||
    config.text ||
    (isTriggerNode(nodeType)
      ? `[Customer Inbound]: "${config.text || node?.triggerKeyword || 'Hello, I want pricing'}"`
      : 'Hello! Welcome to our automated WhatsApp assistance.');

  function isTriggerNode(type: string) {
    return type.startsWith('trigger');
  }

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-gray-950/95 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-xl z-20 flex flex-col overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Live WhatsApp</span>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                REAL-TIME
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => setViewMode('selected')}
              className={cn(
                'px-2 py-0.5 rounded font-medium transition-colors',
                viewMode === 'selected'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Selected
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={cn(
                'px-2 py-0.5 rounded font-medium transition-colors',
                viewMode === 'flow'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Trace ({executionTrace?.length || 0})
            </button>
          </div>

          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors ml-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Node Context Info */}
      <div className="px-3.5 py-1.5 bg-gray-900/80 border-b border-gray-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-400 truncate">
          <Eye className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-gray-200 font-semibold truncate">
            {node?.title || 'Previewing Flow'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
          {previewMessageType}
        </span>
      </div>

      {/* Phone Canvas Container */}
      <div className="flex-1 overflow-y-auto p-2 flex items-center justify-center bg-radial from-gray-900/50 to-gray-950">
        <div className="scale-[0.88] origin-top transition-transform">
          <PhoneMockup
            businessName="TriPix Business"
            bodyText={bodyText}
            headerText={config.headerText}
            footerText={config.footerText || 'Official Verified WhatsApp'}
            mediaUrl={config.mediaUrl}
            messageType={previewMessageType}
            buttons={buttons.length > 0 ? buttons : undefined}
            cards={cards.length > 0 ? cards : undefined}
            catalogProduct={catalogProduct}
            flowTitle={config.flowTitle || 'Registration Form'}
            flowCta={config.flowCta || 'Start Form'}
            showInboundReply={isTriggerNode(nodeType)}
            inboundText={config.text || node?.triggerKeyword || 'Hi, send details'}
            onButtonClick={(title) => onButtonClick?.(title)}
          />
        </div>
      </div>

      {/* Execution Trace Mini Bar if available */}
      {executionTrace && executionTrace.length > 0 && (
        <div className="p-2.5 bg-gray-900/90 border-t border-gray-800 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCheck className="w-4 h-4" />
            <span>Execution Completed</span>
          </div>
          <span className="text-gray-400 font-mono text-[10px]">
            {executionTrace.length} steps simulated
          </span>
        </div>
      )}
    </div>
  );
}
