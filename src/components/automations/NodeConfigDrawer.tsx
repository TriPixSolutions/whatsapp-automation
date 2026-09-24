'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowNode } from '@/types/automations';

interface NodeConfigDrawerProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
}

export function NodeConfigDrawer({
  node,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: NodeConfigDrawerProps) {
  if (!isOpen || !node) return null;

  const nodeType = (node.type || 'whatsapp_message') as string;
  const config = node.config || {};

  const updateConfig = (patch: Record<string, any>) => {
    onUpdate({
      ...node,
      config: {
        ...config,
        ...patch,
      },
    });
  };

  const updateField = (field: keyof WorkflowNode, val: any) => {
    onUpdate({
      ...node,
      [field]: val,
    });
  };

  // Button management helpers
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

  const updateButton = (index: number, title: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], title };
    updateConfig({ buttons: updated });
  };

  const removeButton = (index: number) => {
    const updated = buttons.filter((_, i) => i !== index);
    updateConfig({ buttons: updated });
  };

  // Carousel cards management helpers
  const cards = config.cards || [];
  const addCard = () => {
    if (cards.length >= 10) return;
    const newCard = {
      headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      title: `Item ${cards.length + 1}`,
      description: 'Handcrafted luxury product. In stock now.',
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
    const updated = cards.filter((_, i) => i !== index);
    updateConfig({ cards: updated });
  };

  // Multi-branch management helpers
  const branches = config.branches || [];
  const addBranch = () => {
    const newBr = {
      id: `branch_${Date.now()}`,
      label: `Route ${branches.length + 1}`,
      conditionValue: '',
    };
    updateConfig({ branches: [...branches, newBr] });
  };

  const updateBranch = (index: number, patch: Record<string, any>) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], ...patch };
    updateConfig({ branches: updated });
  };

  const removeBranch = (index: number) => {
    const updated = branches.filter((_, i) => i !== index);
    updateConfig({ branches: updated });
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-gray-950/95 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/60">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {nodeType.replace(/_/g, ' ')}
          </span>
          <h3 className="text-sm font-bold text-white mt-1">Configure Node</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(node.id)}
            title="Duplicate Node"
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            title="Delete Node"
            className="p-1.5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
        {/* Node Name & Description */}
        <div className="space-y-3 pb-3 border-b border-gray-800/80">
          <div>
            <label className="text-[11px] font-medium text-gray-400 mb-1 block">
              Node Title
            </label>
            <input
              type="text"
              value={node.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-400 mb-1 block">
              Internal Description
            </label>
            <input
              type="text"
              value={node.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Notes for your team..."
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. KEYWORD & INCOMING TRIGGERS */}
        {/* ============================================================== */}
        {(nodeType === 'trigger_keyword' || nodeType === 'trigger') && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Trigger Keywords (comma separated)
              </label>
              <input
                type="text"
                value={config.text || node.triggerKeyword || ''}
                onChange={(e) => {
                  updateConfig({ text: e.target.value });
                  updateField('triggerKeyword', e.target.value);
                }}
                placeholder="price, quote, info, buy, catalog"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Trigger fires when customer message contains any of these terms.
              </p>
            </div>
          </div>
        )}

        {nodeType === 'trigger_button' && (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-300 block">
              Target Button ID
            </label>
            <input
              type="text"
              value={config.buttonId || ''}
              onChange={(e) => updateConfig({ buttonId: e.target.value })}
              placeholder="btn_catalog"
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
          </div>
        )}

        {nodeType === 'trigger_carousel' && (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-300 block">
              Target Carousel Card Button ID
            </label>
            <input
              type="text"
              value={config.cardButtonId || ''}
              onChange={(e) => updateConfig({ cardButtonId: e.target.value })}
              placeholder="buy_shoes"
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. WHATSAPP MESSAGE */}
        {/* ============================================================== */}
        {(nodeType === 'whatsapp_message' || nodeType === 'message') && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Message Body Text
              </label>
              <textarea
                rows={4}
                value={config.text || config.bodyText || ''}
                onChange={(e) => updateConfig({ text: e.target.value, bodyText: e.target.value })}
                placeholder="Type your WhatsApp message..."
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 resize-none"
              />
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                <span>Variables:</span>
                <button
                  type="button"
                  onClick={() => updateConfig({ text: (config.text || '') + ' {{firstName}}' })}
                  className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/20"
                >
                  {'{firstName}'}
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ text: (config.text || '') + ' {{phoneNumber}}' })}
                  className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/20"
                >
                  {'{phoneNumber}'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Optional Header Image / Media URL
              </label>
              <input
                type="text"
                value={config.mediaUrl || ''}
                onChange={(e) => updateConfig({ mediaUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. WHATSAPP BUTTONS */}
        {/* ============================================================== */}
        {(nodeType === 'whatsapp_button' || nodeType === 'button') && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Message Body Text
              </label>
              <textarea
                rows={3}
                value={config.bodyText || config.text || ''}
                onChange={(e) => updateConfig({ bodyText: e.target.value, text: e.target.value })}
                placeholder="Choose an option below:"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Footer Text (Optional)
              </label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => updateConfig({ footerText: e.target.value })}
                placeholder="Verified Official Account"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-300">
                  Interactive Buttons (Max 3)
                </label>
                {buttons.length < 3 && (
                  <button
                    onClick={addButton}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add Button
                  </button>
                )}
              </div>

              {buttons.map((btn, idx) => (
                <div key={btn.id || idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={btn.title}
                    onChange={(e) => updateButton(idx, e.target.value)}
                    maxLength={20}
                    className="flex-1 bg-gray-900 border border-gray-700/80 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <button
                    onClick={() => removeButton(idx)}
                    className="p-1 hover:text-rose-400 text-gray-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. WHATSAPP CAROUSEL */}
        {/* ============================================================== */}
        {(nodeType === 'whatsapp_carousel' || nodeType === 'carousel') && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Carousel Header Text
              </label>
              <input
                type="text"
                value={config.bodyText || ''}
                onChange={(e) => updateConfig({ bodyText: e.target.value })}
                placeholder="Browse our popular selections:"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-purple-400">
                  Carousel Cards ({cards.length})
                </label>
                <button
                  onClick={addCard}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" /> Add Card
                </button>
              </div>

              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Card #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeCard(idx)}
                      className="p-0.5 text-gray-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Card Title</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updateCard(idx, { title: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Description</label>
                    <input
                      type="text"
                      value={card.description}
                      onChange={(e) => updateCard(idx, { description: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Image URL</label>
                    <input
                      type="text"
                      value={card.headerImage || ''}
                      onChange={(e) => updateCard(idx, { headerImage: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-[11px] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">CTA Button</label>
                    <input
                      type="text"
                      value={card.buttons?.[0]?.title || ''}
                      onChange={(e) =>
                        updateCard(idx, {
                          buttons: [{ id: `card_btn_${idx}`, title: e.target.value }],
                        })
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. WHATSAPP CATALOG */}
        {/* ============================================================== */}
        {nodeType === 'whatsapp_catalog' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Product Title
              </label>
              <input
                type="text"
                value={config.productTitle || ''}
                onChange={(e) => updateConfig({ productTitle: e.target.value })}
                placeholder="Product Name"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Price
              </label>
              <input
                type="text"
                value={config.productPrice || ''}
                onChange={(e) => updateConfig({ productPrice: e.target.value })}
                placeholder="$199.00"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Product Image URL
              </label>
              <input
                type="text"
                value={config.mediaUrl || ''}
                onChange={(e) => updateConfig({ mediaUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. WHATSAPP FLOW */}
        {/* ============================================================== */}
        {nodeType === 'whatsapp_flow' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Flow Form Title
              </label>
              <input
                type="text"
                value={config.flowTitle || ''}
                onChange={(e) => updateConfig({ flowTitle: e.target.value })}
                placeholder="VIP Booking Form"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                CTA Button Text
              </label>
              <input
                type="text"
                value={config.flowCta || ''}
                onChange={(e) => updateConfig({ flowCta: e.target.value })}
                placeholder="Open Form"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. CONDITIONAL LOGIC */}
        {/* ============================================================== */}
        {(nodeType === 'conditional_logic' || nodeType === 'condition') && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Variable to Test
              </label>
              <select
                value={config.conditionVariable || 'text'}
                onChange={(e) => updateConfig({ conditionVariable: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="text">Message Text</option>
                <option value="buttonId">Button ID Clicked</option>
                <option value="phoneNumber">Phone Number</option>
                <option value="stage">CRM Stage</option>
                <option value="leadValue">Lead Value ($)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Operator
              </label>
              <select
                value={config.conditionOperator || 'contains'}
                onChange={(e) => updateConfig({ conditionOperator: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="not_equals">not equals</option>
                <option value="exists">is not empty</option>
                <option value="greater_than">greater than (&gt;)</option>
                <option value="less_than">less than (&lt;)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Target Value
              </label>
              <input
                type="text"
                value={config.conditionValue || ''}
                onChange={(e) => updateConfig({ conditionValue: e.target.value })}
                placeholder="e.g. quote, yes, 500"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 8. MULTI-BRANCH ROUTER */}
        {/* ============================================================== */}
        {nodeType === 'multi_branch' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-indigo-300">
                Custom Routes ({branches.length})
              </label>
              <button
                onClick={addBranch}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" /> Add Route
              </button>
            </div>

            {branches.map((br: any, idx: number) => (
              <div
                key={br.id || idx}
                className="p-2 rounded-lg bg-gray-900/80 border border-gray-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={br.label}
                    onChange={(e) => updateBranch(idx, { label: e.target.value })}
                    placeholder="Branch Label"
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none"
                  />
                  <button
                    onClick={() => removeBranch(idx)}
                    className="text-gray-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={br.conditionValue || ''}
                  onChange={(e) => updateBranch(idx, { conditionValue: e.target.value })}
                  placeholder="Matches keyword (e.g. sales)"
                  className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-[11px] text-gray-300 font-mono"
                />
              </div>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* 9. WAIT FOR REPLY */}
        {/* ============================================================== */}
        {nodeType === 'wait_for_reply' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Timeout Waiting Duration (Minutes)
              </label>
              <input
                type="number"
                value={config.timeoutMinutes || 30}
                onChange={(e) => updateConfig({ timeoutMinutes: parseInt(e.target.value) || 30 })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 10. DELAY TIMER */}
        {/* ============================================================== */}
        {nodeType === 'delay' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Amount
              </label>
              <input
                type="number"
                min={1}
                value={config.delayAmount || 15}
                onChange={(e) => updateConfig({ delayAmount: parseInt(e.target.value) || 1 })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Unit
              </label>
              <select
                value={config.delayUnit || 'minutes'}
                onChange={(e) => updateConfig({ delayUnit: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 11. CRM ACTION */}
        {/* ============================================================== */}
        {nodeType === 'crm_action' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Set Lead Pipeline Stage
              </label>
              <select
                value={config.stage || 'qualified'}
                onChange={(e) => updateConfig({ stage: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="new_lead">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won / Customer</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Append CRM Note
              </label>
              <textarea
                rows={2}
                value={config.notes || ''}
                onChange={(e) => updateConfig({ notes: e.target.value })}
                placeholder="e.g. Lead engaged with automated pricing catalog"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg p-2 text-xs text-white resize-none"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 12. LEAD MANAGEMENT */}
        {/* ============================================================== */}
        {nodeType === 'lead_management' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Lead Status
              </label>
              <select
                value={config.leadStatus || 'qualified'}
                onChange={(e) => updateConfig({ leadStatus: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="disqualified">Disqualified</option>
                <option value="converted">Converted</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Lead Value ($ USD)
              </label>
              <input
                type="number"
                value={config.leadValue || 500}
                onChange={(e) => updateConfig({ leadValue: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Priority
              </label>
              <select
                value={config.priority || 'high'}
                onChange={(e) => updateConfig({ priority: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 13. TAG MANAGEMENT */}
        {/* ============================================================== */}
        {nodeType === 'tag_management' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Action
              </label>
              <select
                value={config.action || 'add'}
                onChange={(e) => updateConfig({ action: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="add">Add Tag</option>
                <option value="remove">Remove Tag</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Tag Name
              </label>
              <input
                type="text"
                value={config.tag || ''}
                onChange={(e) => updateConfig({ tag: e.target.value })}
                placeholder="vip_lead"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 14. GOOGLE SHEETS */}
        {/* ============================================================== */}
        {nodeType === 'google_sheets' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Google Spreadsheet Name
              </label>
              <input
                type="text"
                value={config.sheetName || 'WhatsApp Leads 2025'}
                onChange={(e) => updateConfig({ sheetName: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Operation
              </label>
              <select
                value={config.operation || 'append_row'}
                onChange={(e) => updateConfig({ operation: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="append_row">Append New Row</option>
                <option value="update_row">Update Existing Row</option>
                <option value="lookup_row">Lookup Contact Row</option>
              </select>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 15. REST API & WEBHOOK */}
        {/* ============================================================== */}
        {(nodeType === 'api_node' || nodeType === 'api' || nodeType === 'webhook_node' || nodeType === 'webhook') && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                Endpoint URL
              </label>
              <input
                type="text"
                value={config.apiUrl || config.webhookUrl || ''}
                onChange={(e) =>
                  updateConfig({ apiUrl: e.target.value, webhookUrl: e.target.value })
                }
                placeholder="https://api.crm.com/v1/webhook"
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                HTTP Method
              </label>
              <select
                value={config.apiMethod || config.webhookMethod || 'POST'}
                onChange={(e) =>
                  updateConfig({ apiMethod: e.target.value, webhookMethod: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-300 mb-1 block">
                JSON Body Payload
              </label>
              <textarea
                rows={4}
                value={config.webhookBody || ''}
                onChange={(e) => updateConfig({ webhookBody: e.target.value })}
                placeholder={`{\n  "phone": "{{phoneNumber}}",\n  "leadStatus": "qualified"\n}`}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg p-2 text-xs text-white font-mono resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
