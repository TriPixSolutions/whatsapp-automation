'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Copy,
  Plus,
  Sparkles,
  Layers,
  MousePointerClick,
  MessageSquare,
  GitBranch,
  Clock,
  UserCheck,
  Tag,
  Globe,
  FileSpreadsheet,
  Webhook,
  ShoppingBag,
  Smartphone,
  Check,
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  Code,
  Smartphone as PhoneIcon,
  Sliders,
  Play,
  RotateCcw,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowNode, NodeValidationError } from '@/types/automations';
import { PhoneMockup } from '@/components/PhoneMockup';

interface RightInspectorStudioProps {
  selectedNode: WorkflowNode | null;
  allNodes: WorkflowNode[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (updated: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  validationErrors?: NodeValidationError[];
}

export function RightInspectorStudio({
  selectedNode,
  allNodes,
  isOpen,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onSelectNode,
  validationErrors = [],
}: RightInspectorStudioProps) {
  const [activeTab, setActiveTab] = useState<'inspector' | 'preview'>('inspector');
  const [variablePickerField, setVariablePickerField] = useState<string | null>(null);

  // Derive node errors
  const nodeErrors = useMemo(() => {
    if (!selectedNode) return [];
    return validationErrors.filter((e) => e.nodeId === selectedNode.id);
  }, [selectedNode, validationErrors]);

  if (!isOpen) {
    return (
      <div
        onClick={onClose}
        className="w-12 h-full rounded-2xl border border-slate-800 bg-slate-950/90 hover:bg-slate-900 flex flex-col items-center py-4 gap-3 shrink-0 cursor-pointer shadow-lg transition-colors group select-none"
        title="Open Inspector & Live Simulator"
      >
        <div className="p-2 rounded-xl bg-slate-900 group-hover:bg-slate-800 border border-slate-800 text-emerald-400 group-hover:text-emerald-300 transition-colors">
          <Sliders className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
          Inspector & Simulator
        </span>
      </div>
    );
  }

  // Fallback to first node if none explicitly selected
  const activeNode = selectedNode || allNodes[0] || null;
  const nodeType = (activeNode?.type || 'whatsapp_message').toLowerCase();
  const config = activeNode?.config || {};

  const updateConfig = (patch: Record<string, any>) => {
    if (!activeNode) return;
    onUpdateNode({
      ...activeNode,
      config: {
        ...config,
        ...patch,
      },
    });
  };

  const updateField = (field: keyof WorkflowNode, val: any) => {
    if (!activeNode) return;
    onUpdateNode({
      ...activeNode,
      [field]: val,
    });
  };

  // Button helpers
  const buttons = config.buttons || [];
  const addButton = () => {
    if (buttons.length >= 3) return;
    const newBtn = {
      id: `btn_${Date.now()}`,
      title: `Option ${buttons.length + 1}`,
      type: 'reply' as const,
    };
    updateConfig({ buttons: [...buttons, newBtn] });
  };

  const updateButton = (index: number, patch: Record<string, any>) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], ...patch };
    updateConfig({ buttons: updated });
  };

  const removeButton = (index: number) => {
    updateConfig({ buttons: buttons.filter((_: any, i: number) => i !== index) });
  };

  // Carousel helpers
  const cards = config.cards || [];
  const addCard = () => {
    if (cards.length >= 10) return;
    const newCard = {
      headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      title: `Item ${cards.length + 1}`,
      description: 'Exclusive product highlights and details.',
      buttons: [{ id: `card_btn_${Date.now()}`, title: 'Order Now' }],
    };
    updateConfig({ cards: [...cards, newCard] });
  };

  const updateCard = (index: number, patch: Record<string, any>) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], ...patch };
    updateConfig({ cards: updated });
  };

  const removeCard = (index: number) => {
    updateConfig({ cards: cards.filter((_: any, i: number) => i !== index) });
  };

  // Preview derivations
  let previewMessageType: any = 'text';
  if (nodeType.includes('button')) previewMessageType = 'button';
  else if (nodeType.includes('carousel')) previewMessageType = 'carousel';
  else if (nodeType.includes('catalog')) previewMessageType = 'catalog';
  else if (nodeType.includes('flow')) previewMessageType = 'whatsapp_flow';
  else if (nodeType.includes('list')) previewMessageType = 'list';

  const previewBodyText =
    config.bodyText ||
    config.text ||
    (nodeType.startsWith('trigger')
      ? `[Customer Message]: "${config.text || activeNode?.triggerKeyword || 'Hi, send details'}"`
      : 'Hello! Thank you for contacting our WhatsApp service.');

  const handleSimulatedButtonClick = (buttonTitle: string) => {
    // If condition or branch matches, auto select next target node in preview
    const nextNode = allNodes.find(
      (n) =>
        n.id === activeNode?.nextNodeId ||
        n.id === activeNode?.config?.trueNextNodeId ||
        n.title.toLowerCase().includes(buttonTitle.toLowerCase())
    );
    if (nextNode) {
      onSelectNode(nextNode.id);
    }
  };

  const DYNAMIC_VARIABLES = [
    { label: 'First Name', value: '{{contact.firstName}}' },
    { label: 'Full Name', value: '{{contact.name}}' },
    { label: 'Phone Number', value: '{{contact.phoneNumber}}' },
    { label: 'Last Message', value: '{{inbound.text}}' },
    { label: 'Button Title', value: '{{inbound.buttonTitle}}' },
    { label: 'Current Time', value: '{{system.now}}' },
  ];

  return (
    <aside className="w-80 lg:w-96 h-full bg-slate-950/95 border border-slate-800 rounded-2xl flex flex-col select-none shrink-0 z-20 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Top Header & Tab Switcher */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('inspector')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 text-xs',
              activeTab === 'inspector'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspector</span>
            {nodeErrors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 text-xs',
              activeTab === 'preview'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <PhoneIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mobile Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {activeNode && (
            <>
              <button
                onClick={() => onDuplicateNode(activeNode.id)}
                title="Duplicate Node"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteNode(activeNode.id)}
                title="Delete Node"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            title="Collapse Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: NODE INSPECTOR */}
      {/* ============================================================== */}
      {activeTab === 'inspector' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!activeNode ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              Select any node on the canvas to configure properties.
            </div>
          ) : (
            <>
              {/* Type Badge & General Properties */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {nodeType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{activeNode.id}</span>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                    Node Title
                  </label>
                  <input
                    type="text"
                    value={activeNode.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter descriptive title..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                    Description / Internal Notes
                  </label>
                  <input
                    type="text"
                    value={activeNode.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Workflow role description..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Validation Warnings for this node */}
              {nodeErrors.length > 0 && (
                <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Configuration Required</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 pl-4 list-disc">
                    {nodeErrors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dynamic Variables Quick Inserter */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Insert Variable</span>
                </span>
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const cur = config.bodyText || config.text || '';
                    updateConfig({
                      text: `${cur} ${e.target.value}`,
                      bodyText: `${cur} ${e.target.value}`,
                    });
                    e.target.value = '';
                  }}
                  className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-0.5 outline-none"
                >
                  <option value="">Insert variable...</option>
                  {DYNAMIC_VARIABLES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label} ({v.value})
                    </option>
                  ))}
                </select>
              </div>

              {/* ============================================================== */}
              {/* DYNAMIC CONFIG FIELDS PER NODE TYPE */}
              {/* ============================================================== */}

              {/* 1. Triggers */}
              {(nodeType === 'trigger' || nodeType.startsWith('trigger_')) && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200">Trigger Conditions</h4>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                      Trigger Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={config.text || activeNode.triggerKeyword || ''}
                      onChange={(e) => updateConfig({ text: e.target.value, triggerKeyword: e.target.value })}
                      placeholder="pricing, quote, buy, start"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 2. Text & Media Messages */}
              {(nodeType === 'message' || nodeType === 'whatsapp_message' || nodeType === 'message_media') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200">Message Body</h4>
                  <div>
                    <textarea
                      rows={5}
                      value={config.text || config.bodyText || ''}
                      onChange={(e) => updateConfig({ text: e.target.value, bodyText: e.target.value })}
                      placeholder="Enter WhatsApp message text..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                      Media URL (Optional Image/PDF)
                    </label>
                    <input
                      type="text"
                      value={config.mediaUrl || ''}
                      onChange={(e) => updateConfig({ mediaUrl: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 3. Interactive Buttons */}
              {(nodeType === 'button' || nodeType === 'whatsapp_button') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">Interactive Buttons ({buttons.length}/3)</h4>
                    {buttons.length < 3 && (
                      <button
                        onClick={addButton}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Button
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Message Prompt</label>
                    <textarea
                      rows={3}
                      value={config.bodyText || ''}
                      onChange={(e) => updateConfig({ bodyText: e.target.value })}
                      placeholder="Select an option below:"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    {buttons.map((b: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500">{idx + 1}.</span>
                        <input
                          type="text"
                          maxLength={20}
                          value={b.title || ''}
                          onChange={(e) => updateButton(idx, { title: e.target.value })}
                          placeholder="Button title (max 20 chars)"
                          className="flex-1 bg-transparent text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => removeButton(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Carousel */}
              {(nodeType === 'carousel' || nodeType === 'whatsapp_carousel') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">Carousel Cards ({cards.length}/10)</h4>
                    {cards.length < 10 && (
                      <button
                        onClick={addCard}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Card
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {cards.map((c: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">Card #{idx + 1}</span>
                          <button
                            onClick={() => removeCard(idx)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={c.title || ''}
                          onChange={(e) => updateCard(idx, { title: e.target.value })}
                          placeholder="Product Title"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={c.description || ''}
                          onChange={(e) => updateCard(idx, { description: e.target.value })}
                          placeholder="Short description / price"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                        />
                        <input
                          type="text"
                          value={c.headerImage || ''}
                          onChange={(e) => updateCard(idx, { headerImage: e.target.value })}
                          placeholder="Image URL"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Condition / Logic */}
              {(nodeType === 'condition' || nodeType === 'conditional_logic') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200">Condition Evaluation</h4>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Variable</label>
                    <select
                      value={config.conditionVariable || 'text'}
                      onChange={(e) => updateConfig({ conditionVariable: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="text">Message Text</option>
                      <option value="phoneNumber">Contact Phone</option>
                      <option value="leadScore">Lead Score</option>
                      <option value="optinStatus">Opt-in Status</option>
                      <option value="stage">CRM Stage</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Operator</label>
                    <select
                      value={config.conditionOperator || 'contains'}
                      onChange={(e) => updateConfig({ conditionOperator: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="contains">Contains</option>
                      <option value="equals">Equals</option>
                      <option value="not_equals">Does Not Equal</option>
                      <option value="greater_than">Greater Than (&gt;)</option>
                      <option value="less_than">Less Than (&lt;)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Value to Match</label>
                    <input
                      type="text"
                      value={config.conditionValue || ''}
                      onChange={(e) => updateConfig({ conditionValue: e.target.value })}
                      placeholder="e.g. order, 50, VIP"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 6. Delay */}
              {nodeType === 'delay' && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200">Delay Duration</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={config.delayAmount || 15}
                      onChange={(e) => updateConfig({ delayAmount: Number(e.target.value) })}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white text-center font-bold"
                    />
                    <select
                      value={config.delayUnit || 'minutes'}
                      onChange={(e) => updateConfig({ delayUnit: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 7. AI Agent */}
              {(nodeType === 'ai_agent' || nodeType === 'ai') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-violet-400" />
                    <h4 className="text-xs font-bold text-slate-200">AI Agent Behavior</h4>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">System Instructions</label>
                    <textarea
                      rows={5}
                      value={config.systemPrompt || ''}
                      onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
                      placeholder="Instruct the AI persona..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                      Confidence Threshold ({Math.round((config.confidenceThreshold || 0.75) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={0.95}
                      step={0.05}
                      value={config.confidenceThreshold || 0.75}
                      onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-violet-500"
                    />
                    <span className="text-[10px] text-slate-400">
                      Handover to human agent if confidence drops below threshold.
                    </span>
                  </div>
                </div>
              )}

              {/* 8. REST API / Webhook */}
              {(nodeType === 'api_request' || nodeType === 'api_node' || nodeType === 'api' || nodeType === 'webhook_node') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200">HTTP Endpoint</h4>
                  <div className="flex gap-2">
                    <select
                      value={config.apiMethod || 'POST'}
                      onChange={(e) => updateConfig({ apiMethod: e.target.value })}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                      <option value="PUT">PUT</option>
                    </select>
                    <input
                      type="text"
                      value={config.apiUrl || config.webhookUrl || ''}
                      onChange={(e) => updateConfig({ apiUrl: e.target.value, webhookUrl: e.target.value })}
                      placeholder="https://api.crm.com/v1/lead"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Payload (JSON)</label>
                    <textarea
                      rows={4}
                      value={config.webhookBody || ''}
                      onChange={(e) => updateConfig({ webhookBody: e.target.value })}
                      placeholder='{ "phone": "{{contact.phoneNumber}}" }'
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 9. CRM / Tagging */}
              {(nodeType === 'tag' || nodeType === 'tag_management' || nodeType === 'lead_management') && (
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200">CRM Actions</h4>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Tag Name</label>
                    <input
                      type="text"
                      value={config.tag || ''}
                      onChange={(e) => updateConfig({ tag: e.target.value })}
                      placeholder="vip_buyer, interested, followup"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Action</label>
                    <select
                      value={config.action || 'add'}
                      onChange={(e) => updateConfig({ action: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="add">Add Tag to Contact</option>
                      <option value="remove">Remove Tag from Contact</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MOBILE PREVIEW */}
      {/* ============================================================== */}
      {activeTab === 'preview' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900/40 overflow-y-auto custom-scrollbar">
          <div className="w-full flex items-center justify-between mb-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE WHATSAPP SIMULATOR
            </span>
            <span>{nodeType.replace(/_/g, ' ').toUpperCase()}</span>
          </div>

          <div className="w-full flex justify-center scale-90 origin-top">
            <PhoneMockup
              businessName="TriPix Verified"
              messageType={previewMessageType}
              bodyText={previewBodyText}
              buttons={buttons.map((b: any) => ({
                id: b.id || b.title,
                title: b.title,
                type: b.type === 'reply' ? 'quick_reply' : b.type === 'call' ? 'call' : b.type === 'url' ? 'url' : 'quick_reply',
                url: b.url,
                phone: b.phone,
              }))}
              cards={cards}
              catalogProduct={{
                title: config.productTitle || 'Official Product',
                price: config.productPrice || '$149.00',
                image: config.mediaUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
              }}
              onButtonClick={handleSimulatedButtonClick}
              className="shadow-2xl"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
