'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Bot,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRight,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  AlertCircle,
  FlaskConical,
  MousePointerClick,
  Layers,
  Webhook,
  Code2,
  Check,
  Split,
  ChevronRight,
  Save,
  Sliders,
  TrendingUp,
  BarChart3,
  Flame,
  Zap,
  Activity,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowDefinition, WorkflowNode } from '@/types/automations';
import Link from 'next/link';

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [debugMode, setDebugMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'builder' | 'analytics'>('builder');

  // Load Workflows from Backend
  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/automations?format=dag');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        if (data.length > 0 && !activeWorkflowId) {
          setActiveWorkflowId(data[0].id);
          if (data[0].nodes?.length > 0) {
            setSelectedNodeId(data[0].nodes[0].id);
          }
        }
      }
    } catch (err) {
      console.error('[Automations] Failed to load workflows:', err);
    }
  }, [activeWorkflowId]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];
  const selectedNode = activeWorkflow?.nodes?.find((n) => n.id === selectedNodeId) || activeWorkflow?.nodes?.[0];

  // Save active workflow
  const handleSaveWorkflow = async () => {
    if (!activeWorkflow) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activeWorkflow,
          debugModeEnabled: debugMode,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add node to active workflow
  const handleAddNode = (type: WorkflowNode['type']) => {
    if (!activeWorkflow) return;
    const newNodeId = `node_${Date.now()}`;
    const titles: Record<string, string> = {
      trigger: 'Trigger Event',
      message: 'Send WhatsApp Message',
      button: 'Interactive Buttons',
      carousel: 'Product Carousel Cards',
      delay: 'Delay Timer',
      condition: 'Conditional Logic & Branch',
      webhook: 'Outgoing Webhook Action',
      api: 'API Request Action',
      end: 'Complete Workflow',
    };

    const newNode: WorkflowNode = {
      id: newNodeId,
      type,
      title: titles[type] || 'Step',
      description: `Configured ${type} step`,
      config: {
        text: type === 'message' ? 'Hello from WhatsApp Automation!' : undefined,
        bodyText: type === 'button' ? 'Please select an option:' : undefined,
        buttons: type === 'button' ? [{ id: 'btn_1', title: 'Option 1' }] : undefined,
        cards: type === 'carousel' ? [
          {
            headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
            title: 'Featured Item',
            description: 'Item summary description',
            buttons: [{ id: 'btn_item_1', title: 'Select' }],
          }
        ] : undefined,
        delayAmount: type === 'delay' ? 1 : undefined,
        delayUnit: type === 'delay' ? 'hours' : undefined,
      },
    };

    const updatedNodes = [...activeWorkflow.nodes, newNode];
    // Auto-link previous node to new node if previous had no nextNodeId
    if (updatedNodes.length >= 2) {
      const prev = updatedNodes[updatedNodes.length - 2];
      if (!prev.nextNodeId) {
        prev.nextNodeId = newNodeId;
      }
    }

    const updatedWf = { ...activeWorkflow, nodes: updatedNodes };
    setWorkflows(workflows.map((w) => (w.id === updatedWf.id ? updatedWf : w)));
    setSelectedNodeId(newNodeId);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    if (!activeWorkflow || activeWorkflow.nodes.length <= 1) return;
    const updatedNodes = activeWorkflow.nodes.filter((n) => n.id !== nodeId);
    const updatedWf = { ...activeWorkflow, nodes: updatedNodes };
    setWorkflows(workflows.map((w) => (w.id === updatedWf.id ? updatedWf : w)));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(updatedNodes[0]?.id || '');
    }
  };

  // Update selected node config
  const updateNodeConfig = (key: string, value: any) => {
    if (!activeWorkflow || !selectedNode) return;
    const updatedNodes = activeWorkflow.nodes.map((n) => {
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

    const updatedWf = { ...activeWorkflow, nodes: updatedNodes };
    setWorkflows(workflows.map((w) => (w.id === updatedWf.id ? updatedWf : w)));
  };

  // Update node title / description
  const updateNodeMeta = (field: 'title' | 'description' | 'triggerKeyword', val: string) => {
    if (!activeWorkflow || !selectedNode) return;
    const updatedNodes = activeWorkflow.nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          [field]: val,
        };
      }
      return n;
    });

    const updatedWf = { ...activeWorkflow, nodes: updatedNodes };
    setWorkflows(workflows.map((w) => (w.id === updatedWf.id ? updatedWf : w)));
  };

  const stats = activeWorkflow?.stats || {
    enteredCount: 38,
    completedCount: 34,
    droppedCount: 4,
    sentCount: 76,
    deliveredCount: 74,
    readCount: 68,
    clickedCount: 52,
    repliedCount: 41,
  };

  const deliveryRate = stats.sentCount > 0 ? Math.round((stats.deliveredCount / stats.sentCount) * 100) : 98;
  const readRate = stats.deliveredCount > 0 ? Math.round((stats.readCount / stats.deliveredCount) * 100) : 92;
  const clickRate = stats.readCount > 0 ? Math.round((stats.clickedCount / stats.readCount) * 100) : 76;
  const replyRate = stats.readCount > 0 ? Math.round((stats.repliedCount / stats.readCount) * 100) : 60;
  const conversionRate = stats.enteredCount > 0 ? Math.round((stats.completedCount / stats.enteredCount) * 100) : 89;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header title="Automations" subtitle="Visual Workflow Builder 2.0" />

        {/* Builder Top Action Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Visual Workflow Builder 2.0
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/50">
                  DAG Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visual node connections, multi-step branching, button menus & automated trigger dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('builder')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                  viewMode === 'builder' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Canvas Builder
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                  viewMode === 'analytics' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Workflow Analytics
              </button>
            </div>

            {/* Debug Mode Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Debug Trace</span>
            </label>

            {/* Test Center Quick Link */}
            <Link
              href="/test-center"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-2xs"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Open in Test Center
            </Link>

            {/* Save Workflow Button */}
            <button
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Workflow'}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: VISUAL NODE BUILDER CANVAS */}
        {/* ============================================================== */}
        {viewMode === 'builder' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Visual Node Flowchart */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 flex flex-col items-center">
              <div className="w-full max-w-2xl space-y-3">
                {/* Node Toolbar Add Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Add Node:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { type: 'message', label: 'Message', icon: MessageSquare },
                      { type: 'button', label: 'Buttons', icon: MousePointerClick },
                      { type: 'carousel', label: 'Carousel', icon: Layers },
                      { type: 'delay', label: 'Delay', icon: Clock },
                      { type: 'condition', label: 'Condition', icon: Split },
                      { type: 'webhook', label: 'Webhook', icon: Webhook },
                      { type: 'api', label: 'API', icon: Code2 },
                      { type: 'end', label: 'End', icon: CheckCircle2 },
                    ].map((btn) => {
                      const Icon = btn.icon;
                      return (
                        <button
                          key={btn.type}
                          type="button"
                          onClick={() => handleAddNode(btn.type as any)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Icon className="w-3 h-3 text-emerald-600" />
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workflow Nodes Flowchart Stack */}
                <div className="space-y-4 pt-2">
                  {activeWorkflow?.nodes?.map((node, index) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isFirst = index === 0;
                    const isLast = index === activeWorkflow.nodes.length - 1;

                    return (
                      <div key={node.id} className="relative group">
                        {/* Connecting Line Downward */}
                        {!isLast && (
                          <div className="absolute left-1/2 -bottom-4 w-0.5 h-4 bg-slate-300 -translate-x-1/2 z-0" />
                        )}

                        {/* Node Card */}
                        <div
                          onClick={() => setSelectedNodeId(node.id)}
                          className={cn(
                            'relative z-10 bg-white rounded-2xl border p-4 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs',
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono',
                                  node.type === 'trigger'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : node.type === 'button'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                    : node.type === 'carousel'
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : node.type === 'delay'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : node.type === 'condition'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : node.type === 'end'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                                )}
                              >
                                {index + 1}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                                    {node.type}
                                  </span>
                                  <h3 className="text-xs font-bold text-slate-900">{node.title}</h3>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1">{node.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isFirst && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(node.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Delete Node"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <ChevronRight className={cn('w-4 h-4', isSelected ? 'text-emerald-600' : 'text-slate-300')} />
                            </div>
                          </div>

                          {/* Node Snapshot Preview */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
                            {node.type === 'trigger' && (
                              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                Keyword Match: &ldquo;{node.config?.text || node.triggerKeyword || activeWorkflow.triggerKeyword}&rdquo;
                              </span>
                            )}
                            {node.type === 'message' && (
                              <span className="text-slate-700 line-clamp-1">
                                Text: &ldquo;{node.config?.text || 'Standard message body'}&rdquo;
                              </span>
                            )}
                            {node.type === 'button' && (
                              <div className="flex gap-1.5 flex-wrap">
                                {node.config?.buttons?.map((b: any, bIdx: number) => (
                                  <span key={bIdx} className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                    🔘 {b.title}
                                  </span>
                                ))}
                              </div>
                            )}
                            {node.type === 'carousel' && (
                              <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                🎠 {node.config?.cards?.length || 3} Interactive Cards configured
                              </span>
                            )}
                            {node.type === 'delay' && (
                              <span className="text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded">
                                ⏳ Delay: {node.config?.delayAmount || 1} {node.config?.delayUnit || 'hours'}
                              </span>
                            )}
                            {node.type === 'condition' && (
                              <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded">
                                ⚖️ Tag / Inbound reply check
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Node Configuration Inspector */}
            <div className="w-80 md:w-96 border-l border-slate-200 bg-white p-5 overflow-y-auto shrink-0 shadow-2xs space-y-5">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                        Node Inspector
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{selectedNode.title}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 uppercase">
                      {selectedNode.type}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Step Title</label>
                      <input
                        type="text"
                        value={selectedNode.title}
                        onChange={(e) => updateNodeMeta('title', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={selectedNode.description}
                        onChange={(e) => updateNodeMeta('description', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Specific Node Configurations */}
                  {selectedNode.type === 'trigger' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Inbound Trigger Keyword
                        </label>
                        <input
                          type="text"
                          value={selectedNode.config?.text || selectedNode.triggerKeyword || ''}
                          onChange={(e) => updateNodeConfig('text', e.target.value)}
                          placeholder="e.g. Hello, Price, VIP"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'message' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Message Body Content
                        </label>
                        <textarea
                          rows={4}
                          value={selectedNode.config?.text || ''}
                          onChange={(e) => updateNodeConfig('text', e.target.value)}
                          placeholder="Type customer WhatsApp message..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'button' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Button Message Body
                        </label>
                        <textarea
                          rows={3}
                          value={selectedNode.config?.bodyText || ''}
                          onChange={(e) => updateNodeConfig('bodyText', e.target.value)}
                          placeholder="Select an option below:"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Action Buttons (Up to 3)
                        </label>
                        <div className="space-y-2">
                          {(selectedNode.config?.buttons || [{ id: 'btn_1', title: 'Option 1' }]).map((btn: any, bIdx: number) => (
                            <div key={bIdx} className="flex gap-2">
                              <input
                                type="text"
                                value={btn.title}
                                onChange={(e) => {
                                  const currentButtons = [...(selectedNode.config?.buttons || [])];
                                  currentButtons[bIdx] = { ...btn, title: e.target.value };
                                  updateNodeConfig('buttons', currentButtons);
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'delay' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Wait Duration</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            value={selectedNode.config?.delayAmount || 1}
                            onChange={(e) => updateNodeConfig('delayAmount', parseInt(e.target.value, 10))}
                            className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                          />
                          <select
                            value={selectedNode.config?.delayUnit || 'hours'}
                            onChange={(e) => updateNodeConfig('delayUnit', e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'condition' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Tag Action</label>
                        <input
                          type="text"
                          value={selectedNode.config?.tag || ''}
                          onChange={(e) => updateNodeConfig('tag', e.target.value)}
                          placeholder="e.g. vip_lead, high_intent"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Select a node on the canvas to configure parameters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: WORKFLOW ANALYTICS DASHBOARD */}
        {/* ============================================================== */}
        {viewMode === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Workflow Funnel & Engagement Analytics
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time metrics for: {activeWorkflow.name}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {stats.enteredCount} Total Runs
                </span>
              </div>

              {/* 8 Core Analytics Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Entered Workflow', value: stats.enteredCount, unit: 'contacts', sub: 'Total trigger entries' },
                  { label: 'Completed Workflow', value: stats.completedCount, unit: 'contacts', sub: `${conversionRate}% completion rate` },
                  { label: 'Dropped Workflow', value: stats.droppedCount, unit: 'contacts', sub: 'Exited before end' },
                  { label: 'Delivery Rate', value: `${deliveryRate}%`, unit: '', sub: `${stats.deliveredCount}/${stats.sentCount} delivered` },
                  { label: 'Read Rate', value: `${readRate}%`, unit: '', sub: `${stats.readCount} read receipts` },
                  { label: 'Button Click Rate', value: `${clickRate}%`, unit: '', sub: `${stats.clickedCount} total clicks` },
                  { label: 'Customer Reply Rate', value: `${replyRate}%`, unit: '', sub: `${stats.repliedCount} inbound replies` },
                  { label: 'Conversion Rate', value: `${conversionRate}%`, unit: '', sub: 'Funnel goal achieved' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {item.label}
                    </span>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {item.value} {item.unit && <span className="text-xs font-normal text-slate-500">{item.unit}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-0.5">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
