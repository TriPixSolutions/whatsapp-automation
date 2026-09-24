'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Bot,
  Play,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  MousePointerClick,
  List,
  Layers,
  Clock,
  Split,
  UserCheck,
  Tag,
  Webhook,
  Code2,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  ChevronRight,
  Sliders,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type NodeType =
  | 'start'
  | 'message'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'button'
  | 'list'
  | 'carousel'
  | 'whatsapp_flow'
  | 'delay'
  | 'condition'
  | 'wait_for_reply'
  | 'assign_agent'
  | 'tag_contact'
  | 'webhook'
  | 'api_request'
  | 'end';

interface ChatbotNode {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  config: {
    text?: string;
    mediaUrl?: string;
    caption?: string;
    fileName?: string;
    headerText?: string;
    footerText?: string;
    buttonText?: string;
    buttons?: { id: string; title: string }[];
    sections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
    cards?: { title: string; description: string; buttons: { id: string; title: string }[] }[];
    flowId?: string;
    flowCta?: string;
    delayMinutes?: number;
    conditionVar?: string;
    conditionVal?: string;
    agentName?: string;
    tag?: string;
    webhookUrl?: string;
  };
  nextNodeId?: string;
}

const PALETTE_ITEMS: { type: NodeType; title: string; category: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'start', title: 'Start', category: 'Trigger', icon: Play },
  { type: 'message', title: 'Text Message', category: 'Messages', icon: MessageSquare },
  { type: 'button', title: 'Interactive Buttons', category: 'Messages', icon: MousePointerClick },
  { type: 'list', title: 'Interactive List', category: 'Messages', icon: List },
  { type: 'carousel', title: 'Product Carousel', category: 'Messages', icon: Layers },
  { type: 'image', title: 'Send Image', category: 'Media', icon: ImageIcon },
  { type: 'video', title: 'Send Video', category: 'Media', icon: Video },
  { type: 'audio', title: 'Voice Note / Audio', category: 'Media', icon: Music },
  { type: 'document', title: 'PDF / Document', category: 'Media', icon: FileText },
  { type: 'whatsapp_flow', title: 'WhatsApp Flow', category: 'Interactive', icon: Smartphone },
  { type: 'wait_for_reply', title: 'Wait For Reply', category: 'Logic', icon: HelpCircle },
  { type: 'delay', title: 'Delay Timer', category: 'Logic', icon: Clock },
  { type: 'condition', title: 'If / Else Condition', category: 'Logic', icon: Split },
  { type: 'assign_agent', title: 'Assign Agent', category: 'Actions', icon: UserCheck },
  { type: 'tag_contact', title: 'Tag Contact', category: 'Actions', icon: Tag },
  { type: 'webhook', title: 'Trigger Webhook', category: 'Integrations', icon: Webhook },
  { type: 'api_request', title: 'HTTP API Request', category: 'Integrations', icon: Code2 },
  { type: 'end', title: 'End Conversation', category: 'Flow', icon: CheckCircle2 },
];

export default function ChatbotBuilderPage() {
  const [nodes, setNodes] = useState<ChatbotNode[]>([
    {
      id: 'node_start',
      type: 'start',
      title: 'Trigger: Keyword "hi"',
      x: 100,
      y: 120,
      config: { text: 'Customer says: hi, hello, order' },
      nextNodeId: 'node_welcome',
    },
    {
      id: 'node_welcome',
      type: 'button',
      title: 'Welcome Buttons',
      x: 380,
      y: 120,
      config: {
        headerText: 'TriPix Concierge',
        text: 'Hello! Welcome to our automated WhatsApp VIP concierge. How can we assist you today?',
        footerText: 'Official Verified Account',
        buttons: [
          { id: 'btn_catalog', title: 'Browse Catalog' },
          { id: 'btn_pricing', title: 'VIP Pricing' },
          { id: 'btn_agent', title: 'Talk to Agent' },
        ],
      },
      nextNodeId: 'node_wait',
    },
    {
      id: 'node_wait',
      type: 'wait_for_reply',
      title: 'Wait For Reply',
      x: 660,
      y: 120,
      config: { delayMinutes: 5 },
      nextNodeId: 'node_condition',
    },
    {
      id: 'node_condition',
      type: 'condition',
      title: 'Evaluate Buyer Intent',
      x: 940,
      y: 120,
      config: {
        conditionVar: 'button_id',
        conditionVal: 'btn_catalog',
      },
    },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_welcome');
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<ChatbotNode[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const pushState = (newNodes: ChatbotNode[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newNodes);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setIsSaved(false);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history[historyIndex + 1]);
    }
  };

  // Auto-Save Effect
  useEffect(() => {
    if (!isSaved) {
      const timer = setTimeout(() => {
        setIsSaving(true);
        setTimeout(() => {
          setIsSaving(false);
          setIsSaved(true);
        }, 600);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [nodes, isSaved]);

  const handleAddNode = (type: NodeType) => {
    const item = PALETTE_ITEMS.find((p) => p.type === type);
    const newNodeId = `node_${Date.now()}`;
    const newNode: ChatbotNode = {
      id: newNodeId,
      type,
      title: item?.title || 'New Node',
      x: 200 + Math.random() * 200,
      y: 180 + Math.random() * 150,
      config: {
        text: type === 'message' ? 'Hello from WhatsApp Automation!' : undefined,
        buttons: type === 'button' ? [{ id: 'btn_1', title: 'Option 1' }] : undefined,
      },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushState(nextNodes);
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 1) return;
    const nextNodes = nodes.filter((n) => n.id !== id);
    setNodes(nextNodes);
    pushState(nextNodes);
    if (selectedNodeId === id) {
      setSelectedNodeId(nextNodes[0].id);
    }
  };

  const handleUpdateConfig = (key: string, value: any) => {
    const nextNodes = nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          config: {
            ...n.config,
            [key]: value,
          },
        };
      }
      return n;
    });
    setNodes(nextNodes);
    setIsSaved(false);
  };

  // Node Drag and Drop handlers
  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setDraggingNodeId(id);
    const node = nodes.find((n) => n.id === id);
    if (node) {
      setDragOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const nextNodes = nodes.map((n) => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.max(20, Math.round((e.clientX - dragOffset.x) / 10) * 10),
            y: Math.max(20, Math.round((e.clientY - dragOffset.y) / 10) * 10),
          };
        }
        return n;
      });
      setNodes(nextNodes);
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      pushState(nodes);
    }
  };

  return (
    <div
      className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Chatbot Flow Builder"
          subtitle="Visual drag-and-drop conversational decision tree with auto-save & zoom canvas"
        />

        {/* Builder Top Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">VIP Welcome & Sales Concierge</h2>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    isSaving
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : isSaved
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {isSaving ? 'Saving...' : isSaved ? 'Auto-Saved ✓' : 'Unsaved Changes'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Trigger: Inbound WhatsApp messages & keyword triggers</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-200" />
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 px-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono px-1 font-bold text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
                className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Test in Simulator Link */}
            <Link
              href="/test-center"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulate Flow</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsSaving(true);
                setTimeout(() => {
                  setIsSaving(false);
                  setIsSaved(true);
                }, 400);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Flow</span>
            </button>
          </div>
        </div>

        {/* Builder Work Area: Node Palette (Left) + Visual Canvas (Center) + Node Config (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: 18 Node Palette */}
          <div className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Node Palette</h3>
              <p className="text-[11px] text-slate-500">Click to add step to canvas</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {['Trigger', 'Messages', 'Media', 'Interactive', 'Logic', 'Actions', 'Integrations', 'Flow'].map(
                (cat) => {
                  const items = PALETTE_ITEMS.filter((i) => i.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                        {cat}
                      </span>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => handleAddNode(item.type)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left border border-slate-100 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 hover:text-emerald-950 transition-all text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center border border-slate-200 group-hover:border-emerald-300 text-slate-700 group-hover:text-emerald-600 transition-colors">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate">{item.title}</span>
                              <Plus className="w-3 h-3 text-slate-300 ml-auto group-hover:text-emerald-600" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Center: Infinite Pan-and-Zoom Canvas */}
          <div className="flex-1 bg-dot-pattern bg-slate-50 relative overflow-hidden">
            <div
              className="absolute inset-0 transition-transform origin-top-left"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Render SVG Connectors between nodes */}
              <svg className="absolute inset-0 pointer-events-none w-[3000px] h-[3000px] z-0">
                {nodes.map((node) => {
                  if (!node.nextNodeId) return null;
                  const nextNode = nodes.find((n) => n.id === node.nextNodeId);
                  if (!nextNode) return null;

                  const startX = node.x + 220;
                  const startY = node.y + 40;
                  const endX = nextNode.x;
                  const endY = nextNode.y + 40;
                  const midX = (startX + endX) / 2;

                  return (
                    <path
                      key={`${node.id}->${nextNode.id}`}
                      d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                      stroke="#059669"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray="4 2"
                    />
                  );
                })}
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const item = PALETTE_ITEMS.find((p) => p.type === node.type);
                const Icon = item?.icon || MessageSquare;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={cn(
                      'absolute w-56 rounded-2xl bg-white border p-3 shadow-xs cursor-grab active:cursor-grabbing transition-shadow z-10 space-y-2',
                      isSelected
                        ? 'border-emerald-600 ring-4 ring-emerald-500/10 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate">{node.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="text-slate-300 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Delete node"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                      {node.config.text || node.config.headerText || `${node.type} configured`}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      <span>ID: {node.id.slice(0, 10)}</span>
                      {node.nextNodeId && <span className="text-emerald-700 font-bold">→ Next Step</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Node Properties Configuration Drawer */}
          {selectedNode && (
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Node Properties</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedNode.id}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedNode.type}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Step Title</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(nodes.map((n) => (n.id === selectedNode.id ? { ...n, title: val } : n)));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Next Node Connector Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Next Step</label>
                  <select
                    value={selectedNode.nextNodeId || ''}
                    onChange={(e) => {
                      const targetId = e.target.value || undefined;
                      setNodes(nodes.map((n) => (n.id === selectedNode.id ? { ...n, nextNodeId: targetId } : n)));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">(End of flow)</option>
                    {nodes
                      .filter((n) => n.id !== selectedNode.id)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title} ({n.type})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Conditional Fields depending on Node Type */}
                {(selectedNode.type === 'message' || selectedNode.type === 'button') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Message Body *</label>
                    <textarea
                      rows={4}
                      value={selectedNode.config.text || ''}
                      onChange={(e) => handleUpdateConfig('text', e.target.value)}
                      placeholder="Type your message text here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 leading-relaxed"
                    />
                  </div>
                )}

                {selectedNode.type === 'button' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Quick Reply Buttons</label>
                    {(selectedNode.config.buttons || []).map((btn, idx) => (
                      <div key={btn.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={btn.title}
                          onChange={(e) => {
                            const updated = [...(selectedNode.config.buttons || [])];
                            updated[idx].title = e.target.value;
                            handleUpdateConfig('buttons', updated);
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedNode.type === 'delay' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Delay Duration (Minutes)</label>
                    <input
                      type="number"
                      value={selectedNode.config.delayMinutes ?? 1}
                      onChange={(e) => handleUpdateConfig('delayMinutes', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                )}

                {selectedNode.type === 'tag_contact' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tag to Apply</label>
                    <input
                      type="text"
                      placeholder="e.g. qualified_buyer"
                      value={selectedNode.config.tag || ''}
                      onChange={(e) => handleUpdateConfig('tag', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                )}

                {selectedNode.type === 'webhook' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Webhook Endpoint URL</label>
                    <input
                      type="url"
                      placeholder="https://api.yourdomain.com/webhook"
                      value={selectedNode.config.webhookUrl || ''}
                      onChange={(e) => handleUpdateConfig('webhookUrl', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
