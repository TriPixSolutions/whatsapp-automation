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
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowNode, NodeValidationError } from '@/types/automations';
import { PhoneMockup } from '@/components/PhoneMockup';
import { messageFromWorkflowNode, toWhatsAppPreview } from '@/lib/whatsapp/messageModel';

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
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState('');

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

  const uploadMedia = async (file?: File) => {
    if (!activeNode || !file) return;
    if (file.size > 16 * 1024 * 1024) {
      setMediaUploadError('Choose a file smaller than 16 MB.');
      return;
    }
    setIsUploadingMedia(true);
    setMediaUploadError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/media', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The file could not be uploaded.');
      const messageType = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
          : file.type.startsWith('audio/') ? 'audio' : 'document';
      onUpdateNode({
        ...activeNode,
        messageType,
        config: {
          ...config,
          mediaAssetId: result.assetId,
          mediaPreviewUrl: result.previewUrl,
          mediaUrl: undefined,
          fileName: result.fileName,
          mediaMimeType: result.mimeType,
          mediaSize: result.fileSize,
        },
      });
    } catch (error) {
      setMediaUploadError(error instanceof Error ? error.message : 'The file could not be uploaded.');
    } finally {
      setIsUploadingMedia(false);
    }
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
      headerImage: '',
      title: `Item ${cards.length + 1}`,
      description: '',
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

  const listRows = config.sections?.[0]?.rows || [];
  const updateListRows = (rows: any[]) => updateConfig({
    sections: [{ title: config.sections?.[0]?.title || 'Options', rows }],
  });

  const canonicalMessage = activeNode ? messageFromWorkflowNode(activeNode) : null;
  const preview = canonicalMessage ? toWhatsAppPreview(canonicalMessage) : null;
  const previewMessageType: any = preview?.kind === 'flow' ? 'whatsapp_flow'
    : preview?.kind === 'contact_card' ? 'contact'
      : preview?.kind || 'text';
  const previewBodyText = preview?.body || (nodeType.startsWith('trigger')
    ? `[Customer message] ${config.text || activeNode?.triggerKeyword || ''}`
    : 'Configure this step to see the WhatsApp message.');

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
                      Image, video, audio or PDF
                    </label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-emerald-500 hover:text-white">
                      {isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-emerald-400" />}
                      {isUploadingMedia ? 'Uploading securely…' : config.mediaAssetId ? 'Replace uploaded file' : 'Upload file'}
                      <input
                        type="file"
                        className="sr-only"
                        disabled={isUploadingMedia}
                        accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/ogg,application/pdf"
                        onChange={(event) => uploadMedia(event.target.files?.[0])}
                      />
                    </label>
                    {config.fileName && (
                      <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px]">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-200">{config.fileName}</p>
                          <p className="text-slate-500">{config.mediaMimeType} · {config.mediaSize ? `${(config.mediaSize / 1024 / 1024).toFixed(2)} MB` : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateConfig({ mediaAssetId: undefined, mediaPreviewUrl: undefined, fileName: undefined, mediaMimeType: undefined, mediaSize: undefined })}
                          className="ml-2 text-rose-400 hover:text-rose-300"
                        >Remove</button>
                      </div>
                    )}
                    {mediaUploadError && <p role="alert" className="mt-2 text-[11px] text-rose-400">{mediaUploadError}</p>}
                  </div>
                  <details className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-slate-400">Use an HTTPS media URL instead</summary>
                    <input
                      type="text"
                      value={config.mediaUrl || ''}
                      onChange={(e) => updateConfig({ mediaUrl: e.target.value, mediaAssetId: undefined, mediaPreviewUrl: undefined })}
                      placeholder="https://example.com/banner.jpg"
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-white focus:border-emerald-500"
                    />
                  </details>
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
                      <div key={idx} className="grid grid-cols-[1fr_auto] gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            maxLength={20}
                            value={b.title || ''}
                            onChange={(e) => updateButton(idx, { title: e.target.value })}
                            placeholder="Visible title (max 20 chars)"
                            className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            maxLength={256}
                            value={b.id || ''}
                            onChange={(e) => updateButton(idx, { id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_') })}
                            placeholder="Stable action ID"
                            className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-400 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <button
                          onClick={() => removeButton(idx)}
                          className="self-center text-slate-500 hover:text-rose-400 p-1"
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
                  <label className="text-xs text-slate-300 block">Approved Meta carousel template name
                    <input aria-label="Carousel template name" value={config.templateName || ''} onChange={(e) => updateConfig({ templateName: e.target.value })} className="w-full mt-1 p-2 bg-slate-950 rounded border border-slate-700" />
                  </label>
                  <p className="text-xs text-slate-400">Live sends require a matching approved template. Sandbox previews do not verify approval or delivery.</p>
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
                        {(c.buttons || []).map((button: any, buttonIndex: number) => (
                          <div key={buttonIndex} className="grid grid-cols-2 gap-2">
                            <input
                              value={button.title || ''}
                              maxLength={20}
                              onChange={(event) => {
                                const nextButtons = [...(c.buttons || [])];
                                nextButtons[buttonIndex] = { ...button, title: event.target.value };
                                updateCard(idx, { buttons: nextButtons });
                              }}
                              placeholder="Button title"
                              className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white"
                            />
                            <input
                              value={button.id || ''}
                              onChange={(event) => {
                                const nextButtons = [...(c.buttons || [])];
                                nextButtons[buttonIndex] = { ...button, id: event.target.value.replace(/[^a-zA-Z0-9_-]/g, '_') };
                                updateCard(idx, { buttons: nextButtons });
                              }}
                              placeholder="Stable action ID"
                              className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-400"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(nodeType === 'list' || nodeType === 'whatsapp_list') && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">WhatsApp list</h4>
                  <textarea value={config.bodyText || ''} onChange={(event) => updateConfig({ bodyText: event.target.value })} rows={3} placeholder="What should the customer choose?" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white" />
                  <input value={config.buttonText || ''} maxLength={20} onChange={(event) => updateConfig({ buttonText: event.target.value })} placeholder="Open list button text" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white" />
                  <input value={config.sections?.[0]?.title || ''} maxLength={24} onChange={(event) => updateConfig({ sections: [{ title: event.target.value, rows: listRows }] })} placeholder="Section title" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white" />
                  <div className="space-y-2">
                    {listRows.map((row: any, index: number) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2">
                        <input value={row.title || ''} maxLength={24} onChange={(event) => { const rows = [...listRows]; rows[index] = { ...row, title: event.target.value }; updateListRows(rows); }} placeholder="Visible option" className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white" />
                        <input value={row.id || ''} onChange={(event) => { const rows = [...listRows]; rows[index] = { ...row, id: event.target.value.replace(/[^a-zA-Z0-9_-]/g, '_') }; updateListRows(rows); }} placeholder="Stable action ID" className="rounded border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-400" />
                        <button type="button" onClick={() => updateListRows(listRows.filter((_: any, rowIndex: number) => rowIndex !== index))} className="text-rose-400"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  {listRows.length < 10 && <button type="button" onClick={() => updateListRows([...listRows, { id: `option_${Date.now()}`, title: `Option ${listRows.length + 1}` }])} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><Plus className="h-3 w-3" /> Add option</button>}
                </div>
              )}

              {nodeType === 'message_template' && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">Approved Meta template</h4>
                  <input value={config.templateName || ''} onChange={(event) => updateConfig({ templateName: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} placeholder="template_name" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white" />
                  <input value={config.languageCode || 'en_US'} onChange={(event) => updateConfig({ languageCode: event.target.value })} placeholder="en_US" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white" />
                  <p className="text-[11px] text-slate-400">The final content and buttons come from the approved Meta template.</p>
                </div>
              )}

              {nodeType === 'whatsapp_catalog' && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">Connected Meta catalog</h4>
                  <input value={config.catalogId || ''} onChange={(event) => updateConfig({ catalogId: event.target.value })} placeholder="Catalog ID" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white" />
                  <input value={config.retailerId || ''} onChange={(event) => updateConfig({ retailerId: event.target.value })} placeholder="Product retailer ID (optional)" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white" />
                  <textarea value={config.bodyText || ''} onChange={(event) => updateConfig({ bodyText: event.target.value })} rows={3} placeholder="Browse our products" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white" />
                  <p className="text-[11px] text-slate-400">IDs must come from the catalog connected to this WhatsApp Business Account.</p>
                </div>
              )}

              {(nodeType === 'whatsapp_flow' || nodeType === 'flow') && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">Published WhatsApp Flow</h4>
                  <input value={config.flowId || ''} onChange={(event) => updateConfig({ flowId: event.target.value })} placeholder="Published Flow ID" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white" />
                  <input value={config.flowCta || ''} maxLength={20} onChange={(event) => updateConfig({ flowCta: event.target.value })} placeholder="Open form" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white" />
                  <textarea value={config.bodyText || ''} onChange={(event) => updateConfig({ bodyText: event.target.value })} rows={3} placeholder="Complete this form" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white" />
                </div>
              )}

              {/* 5. Condition / Logic */}
              {nodeType === 'trigger_scheduled' && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">Schedule</h4>
                  <label className="block text-[11px] text-slate-400">Start date and time
                    <input type="datetime-local" value={config.scheduleAt ? String(config.scheduleAt).slice(0, 16) : ''}
                      onChange={(event) => updateConfig({ scheduleAt: event.target.value ? new Date(event.target.value).toISOString() : '' })}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white" />
                  </label>
                  <label className="block text-[11px] text-slate-400">Recipient phone (E.164)
                    <input value={config.recipientPhone || ''} onChange={(event) => updateConfig({ recipientPhone: event.target.value })}
                      placeholder="+919876543210" className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-white" />
                  </label>
                  <label className="block text-[11px] text-slate-400">Repeat every minutes (0 = once)
                    <input type="number" min={0} value={config.recurrenceMinutes || 0}
                      onChange={(event) => updateConfig({ recurrenceMinutes: Math.max(0, Number(event.target.value)) })}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white" />
                  </label>
                  <p className="text-[11px] text-slate-400">Saving an active workflow creates a durable database job. The background worker must be online.</p>
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
              {(nodeType === 'tag' || nodeType === 'tag_management') && (
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

              {nodeType === 'lead_management' && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">Update lead</h4>
                  <label className="block text-[11px] text-slate-400">Lead status
                    <select value={config.leadStatus || ''} onChange={(event) => updateConfig({ leadStatus: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white">
                      <option value="">Choose status</option><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="disqualified">Disqualified</option><option value="converted">Converted</option>
                    </select>
                  </label>
                  <label className="block text-[11px] text-slate-400">Lead value (optional)
                    <input type="number" min={0} value={config.leadValue ?? ''} onChange={(event) => updateConfig({ leadValue: event.target.value === '' ? undefined : Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white" />
                  </label>
                </div>
              )}

              {nodeType === 'crm_action' && (
                <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <h4 className="text-xs font-bold text-slate-200">Assign conversation</h4>
                  <label className="block text-[11px] text-slate-400">Agent email or stable agent ID
                    <input type="text" value={config.assigneeEmail || ''} onChange={(event) => updateConfig({ assigneeEmail: event.target.value })} placeholder="agent@example.com" className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white" />
                  </label>
                  <label className="block text-[11px] text-slate-400">Priority
                    <select value={config.priority || 'normal'} onChange={(event) => updateConfig({ priority: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
                  </label>
                  <label className="block text-[11px] text-slate-400">Internal note (optional)
                    <textarea rows={3} value={config.notes || ''} onChange={(event) => updateConfig({ notes: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white" />
                  </label>
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
              businessName="Your business"
              messageType={previewMessageType}
              bodyText={previewBodyText}
              headerText={canonicalMessage?.headerText}
              footerText={preview?.footer}
              mediaUrl={preview?.mediaUrl}
              mediaType={['image', 'video', 'audio', 'document'].includes(preview?.kind || '') ? preview?.kind as any : undefined}
              fileName={canonicalMessage?.filename}
              buttons={(preview?.buttons || []).map((b: any) => ({
                id: b.id || b.title,
                title: b.title,
                type: b.type === 'reply' ? 'quick_reply' : b.type === 'call' ? 'call' : b.type === 'url' ? 'url' : 'quick_reply',
                url: b.url,
                phone: b.phone,
              }))}
              sections={preview?.sections || []}
              cards={preview?.cards || []}
              catalogProduct={preview?.kind === 'catalog' ? {
                title: config.productTitle || 'Select a product',
                price: config.productPrice || '',
                image: preview.mediaUrl,
                subtitle: config.productSubtitle,
              } : undefined}
              location={canonicalMessage?.location ? {
                name: canonicalMessage.location.name || 'Location',
                address: canonicalMessage.location.address || '',
                latitude: canonicalMessage.location.latitude,
                longitude: canonicalMessage.location.longitude,
              } : undefined}
              contactCard={canonicalMessage?.contact ? {
                name: canonicalMessage.contact.formattedName,
                phone: canonicalMessage.contact.phoneNumber,
                organization: canonicalMessage.contact.organization,
              } : undefined}
              flowTitle={config.flowTitle}
              flowCta={canonicalMessage?.flowCta}
              className="shadow-2xl"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
