'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Bot,
  Plus,
  Zap,
  CheckCircle2,
  Trash2,
  MessageSquare,
  ArrowRight,
  ListFilter,
  Layers,
  ShoppingBag,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Smartphone,
  Eye,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationFlow, FlowActionType } from '@/lib/db/types';

export default function AutomationsPage() {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);

  // New Node Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [actionType, setActionType] = useState<FlowActionType>('buttons');

  // Text state
  const [textBody, setTextBody] = useState('Hello! Welcome to Passion Fruit concierge.');

  // Buttons state
  const [btnHeader, setBtnHeader] = useState('Private Selection');
  const [btnBody, setBtnBody] = useState('Something big is coming soon. Select an option below to proceed:');
  const [btnFooter, setBtnFooter] = useState('Official WhatsApp Business');
  const [btn1, setBtn1] = useState('Product Specs');
  const [btn2, setBtn2] = useState('Pricing');
  const [btn3, setBtn3] = useState('Talk to Agent');

  // List state
  const [listHeader, setListHeader] = useState('Exclusive Collections');
  const [listBody, setListBody] = useState('Please select an option from our service catalog:');
  const [listFooter, setListFooter] = useState('1-Tap Access');
  const [listButtonText, setListButtonText] = useState('View Options');
  const [listSections, setListSections] = useState([
    {
      title: 'Luxury Categories',
      rows: [
        { id: 'cat_watches', title: 'Haute Horlogerie', description: 'Handcrafted mechanical complications' },
        { id: 'cat_villas', title: 'Private Estates', description: 'Waterfront properties and penthouses' },
      ],
    },
    {
      title: 'Concierge Services',
      rows: [
        { id: 'svc_agent', title: 'Connect with Advisor', description: 'Direct priority assistance' },
      ],
    },
  ]);

  // Carousel state
  const [carouselBody, setCarouselBody] = useState('Browse our top featured items currently in high demand:');
  const [carouselCards, setCarouselCards] = useState([
    {
      headerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80',
      title: 'Obsidian Grand Chrono',
      description: 'Hand-finished titanium casing with sapphire crystal skeleton.',
      buttons: [{ id: 'card_order_1', title: 'Order Item' }, { id: 'card_info_1', title: 'Details' }],
    },
    {
      headerImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop&q=80',
      title: 'Platinum Tourbillon',
      description: 'Exclusive 1 of 50 timepiece with perpetual calendar.',
      buttons: [{ id: 'card_order_2', title: 'Order Item' }, { id: 'card_info_2', title: 'Details' }],
    },
  ]);

  // Fetch flows from real DB
  const fetchFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/automations');
      if (res.ok) {
        const data = await res.json();
        setFlows(data);
        if (data.length > 0 && !selectedFlow) {
          setSelectedFlow(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load flows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  // Toggle active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        setFlows((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isActive: !currentStatus } : f))
        );
        if (selectedFlow?.id === id) {
          setSelectedFlow((prev) => (prev ? { ...prev, isActive: !currentStatus } : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete flow
  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation flow?')) return;
    try {
      const res = await fetch(`/api/automations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFlows((prev) => prev.filter((f) => f.id !== id));
        if (selectedFlow?.id === id) {
          setSelectedFlow(flows.find((f) => f.id !== id) || null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new flow
  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerKeyword.trim()) return;

    let payload: any = {};

    if (actionType === 'text') {
      payload = { text: textBody };
    } else if (actionType === 'buttons') {
      const buttons = [
        btn1 ? { id: `btn_${Date.now()}_1`, title: btn1 } : null,
        btn2 ? { id: `btn_${Date.now()}_2`, title: btn2 } : null,
        btn3 ? { id: `btn_${Date.now()}_3`, title: btn3 } : null,
      ].filter(Boolean);

      payload = {
        header: btnHeader,
        body: btnBody,
        footer: btnFooter,
        buttons,
      };
    } else if (actionType === 'list') {
      payload = {
        header: listHeader,
        body: listBody,
        footer: listFooter,
        buttonText: listButtonText,
        sections: listSections,
      };
    } else if (actionType === 'carousel') {
      payload = {
        bodyText: carouselBody,
        cards: carouselCards,
      };
    }

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowName.trim() || `Flow: ${triggerKeyword.trim()}`,
          triggerKeyword: triggerKeyword.trim(),
          triggerType: 'keyword',
          actionType,
          actionPayload: payload,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setFlows((prev) => [created, ...prev]);
        setSelectedFlow(created);
        setShowAddModal(false);
        setTriggerKeyword('');
        setFlowName('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pl-60 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="No-Code Chatbot Flow Builder"
        subtitle="Create automated keyword journeys with official Meta Buttons, Lists, and Product Carousels"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#7C3AED]" />
              <span>Automated WhatsApp Conversation Paths</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-[#C4B5FD]">
                {flows.length} Flows Active
              </span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Every inbound message hitting your webhook is matched against active keyword rules below.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-button text-xs px-5 py-2.5 rounded-xl font-bold text-white shadow-pf-btn hover:shadow-pf-hover flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Flow</span>
          </button>
        </div>

        {/* 2-Column Main Workspace: Flows List & Live Device Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): List of Flows */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading automation flows...</div>
            ) : flows.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center space-y-3 shadow-sm">
                <Bot className="w-10 h-10 text-[#7C3AED] mx-auto" />
                <h3 className="text-sm font-bold text-[#0D0F2D]">No automation flows created</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Build your first automated reply using Buttons, Lists, or Carousels to qualify leads 24/7.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="gradient-button text-xs px-5 py-2.5 rounded-xl font-bold text-white shadow-pf-btn inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Flow</span>
                </button>
              </div>
            ) : (
              flows.map((flow) => {
                const isSelected = selectedFlow?.id === flow.id;
                return (
                  <div
                    key={flow.id}
                    onClick={() => setSelectedFlow(flow)}
                    className={cn(
                      'bg-white rounded-3xl border p-6 space-y-4 cursor-pointer transition-all shadow-sm',
                      isSelected
                        ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                        : 'border-[#E2E8F0] hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center font-bold">
                          {flow.actionType === 'buttons' && <MessageSquare className="w-5 h-5" />}
                          {flow.actionType === 'list' && <ListFilter className="w-5 h-5" />}
                          {flow.actionType === 'carousel' && <ShoppingBag className="w-5 h-5" />}
                          {flow.actionType === 'text' && <Bot className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#0D0F2D]">{flow.name}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4F6FB] text-[#7C3AED] border border-[#E2E8F0]">
                              {flow.actionType}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] font-mono mt-0.5">
                            Trigger: &quot;<strong className="text-[#7C3AED]">{flow.triggerKeyword}</strong>&quot;
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(flow.id, flow.isActive);
                          }}
                          className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border',
                            flow.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          )}
                        >
                          {flow.isActive ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFlow(flow.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Flow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Flow Action Summary */}
                    <div className="p-3.5 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] text-xs space-y-1 text-[#0D0F2D]">
                      <div className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3" />
                        <span>Then Auto-Reply: Meta {flow.actionType.toUpperCase()} Message</span>
                      </div>
                      <p className="line-clamp-2 font-medium">
                        {(flow.actionPayload as any).body ||
                          (flow.actionPayload as any).bodyText ||
                          (flow.actionPayload as any).text}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Executions: <strong>{flow.executionCount || 0} times</strong></span>
                      <span className="font-mono text-[10px]">
                        Created: {new Date(flow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column (5 cols): Live Interactive Device Simulator */}
          <div className="lg:col-span-5 sticky top-24 flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#7C3AED] font-mono flex items-center gap-1 justify-center">
                <Smartphone className="w-3.5 h-3.5" />
                Live WhatsApp Device Preview
              </span>
            </div>

            {/* Mobile Device Frame */}
            <div className="w-[340px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800">
              {/* Screen Content */}
              <div className="w-full bg-[#EFEAE2] rounded-[34px] overflow-hidden flex flex-col h-[580px] relative font-sans">
                {/* Status Bar */}
                <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      PF
                    </div>
                    <div>
                      <h5 className="font-bold text-xs leading-tight">Passion Fruit Concierge</h5>
                      <span className="text-[9px] text-emerald-200 block">Official Business</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/80">v18.0</span>
                </div>

                {/* Chat Scroll View */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {selectedFlow ? (
                    <>
                      {/* 1. Inbound Simulated Customer Trigger */}
                      <div className="flex justify-end">
                        <div className="bg-[#E7FFDB] text-slate-800 rounded-2xl rounded-tr-none px-3 py-1.5 text-xs shadow-sm max-w-[80%]">
                          <p className="font-semibold">{selectedFlow.triggerKeyword}</p>
                          <span className="text-[9px] text-slate-400 block text-right">Just now</span>
                        </div>
                      </div>

                      {/* 2. Outbound Automated Response Bubble */}
                      <div className="flex justify-start">
                        <div className="bg-white text-slate-900 rounded-2xl rounded-tl-none p-3 text-xs shadow-sm max-w-[90%] space-y-2 border border-slate-200/60">
                          {/* Header if present */}
                          {(selectedFlow.actionPayload as any).header && (
                            <h6 className="font-black text-[#0D0F2D] text-xs">
                              {(selectedFlow.actionPayload as any).header}
                            </h6>
                          )}

                          {/* Body Text */}
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {(selectedFlow.actionPayload as any).body ||
                              (selectedFlow.actionPayload as any).bodyText ||
                              (selectedFlow.actionPayload as any).text}
                          </p>

                          {/* Footer if present */}
                          {(selectedFlow.actionPayload as any).footer && (
                            <p className="text-[10px] text-slate-400">
                              {(selectedFlow.actionPayload as any).footer}
                            </p>
                          )}

                          {/* RENDER NODE TYPE: BUTTONS */}
                          {selectedFlow.actionType === 'buttons' &&
                            (selectedFlow.actionPayload as any).buttons && (
                              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                {(selectedFlow.actionPayload as any).buttons.map((btn: any, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => alert(`Customer tapped button: "${btn.title}"`)}
                                    className="w-full py-2 px-3 rounded-xl bg-purple-50 text-[#7C3AED] font-bold text-xs text-center border border-[#C4B5FD] hover:bg-purple-100 transition-colors shadow-sm"
                                  >
                                    {btn.title}
                                  </button>
                                ))}
                              </div>
                            )}

                          {/* RENDER NODE TYPE: LIST */}
                          {selectedFlow.actionType === 'list' && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <div className="p-2.5 rounded-xl bg-purple-50 border border-[#C4B5FD] text-center">
                                <span className="text-[11px] font-bold text-[#7C3AED] flex items-center justify-center gap-1">
                                  <ListFilter className="w-3.5 h-3.5" />
                                  {(selectedFlow.actionPayload as any).buttonText || 'View Options'}
                                </span>
                              </div>
                              <div className="space-y-1 text-[11px]">
                                {((selectedFlow.actionPayload as any).sections || []).map((sec: any, sIdx: number) => (
                                  <div key={sIdx} className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block pt-1">
                                      {sec.title}
                                    </span>
                                    {(sec.rows || []).map((r: any, rIdx: number) => (
                                      <div
                                        key={rIdx}
                                        onClick={() => alert(`Customer selected row: "${r.title}"`)}
                                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100"
                                      >
                                        <p className="font-bold text-[#0D0F2D]">{r.title}</p>
                                        {r.description && <p className="text-[9px] text-slate-500">{r.description}</p>}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* RENDER NODE TYPE: CAROUSEL */}
                          {selectedFlow.actionType === 'carousel' && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 block">
                                Horizontal Scrollable Product Cards
                              </span>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {((selectedFlow.actionPayload as any).cards || []).map((card: any, cIdx: number) => (
                                  <div
                                    key={cIdx}
                                    className="w-44 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                                  >
                                    {card.headerImage && (
                                      <img
                                        src={card.headerImage}
                                        alt={card.title}
                                        className="w-full h-20 object-cover"
                                      />
                                    )}
                                    <div className="p-2 space-y-1">
                                      <h6 className="font-bold text-[11px] text-[#0D0F2D] truncate">{card.title}</h6>
                                      <p className="text-[9px] text-slate-500 line-clamp-2">{card.description}</p>
                                      <div className="pt-1 space-y-1">
                                        {(card.buttons || []).map((b: any, bIdx: number) => (
                                          <button
                                            key={bIdx}
                                            onClick={() => alert(`Customer clicked carousel button: "${b.title}"`)}
                                            className="w-full py-1 text-[9px] font-bold text-[#7C3AED] bg-white border border-[#C4B5FD] rounded-lg shadow-sm"
                                          >
                                            {b.title}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <span className="text-[9px] text-slate-400 block text-right pt-0.5">
                            Just now &bull; ✓✓
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <Bot className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">Select a flow to preview</p>
                    </div>
                  )}
                </div>

                {/* Bottom Input Preview */}
                <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full px-3 py-1 text-[11px] text-slate-400">
                    Type a message...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#075E54] text-white flex items-center justify-center text-xs">
                    ➤
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE FLOW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-[#E2E8F0] shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  Create WhatsApp Conversational Node
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Configure trigger keywords and response node types supported by Meta Cloud API v18.0
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-[#0D0F2D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFlow} className="space-y-5">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                    Flow Name
                  </label>
                  <input
                    type="text"
                    required
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="e.g. VIP Concierge Booking"
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                    Trigger Keyword / Payload
                  </label>
                  <input
                    type="text"
                    required
                    value={triggerKeyword}
                    onChange={(e) => setTriggerKeyword(e.target.value)}
                    placeholder="e.g. SHOW ME or PRICING or VIP"
                    className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* 4 Supported Node Types Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0D0F2D] uppercase tracking-wider">
                  Select WhatsApp Node Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'buttons', name: 'Interactive Buttons', desc: 'Up to 3 Quick Replies', icon: MessageSquare },
                    { id: 'list', name: 'Interactive List', desc: 'Sections & Rows Menu', icon: ListFilter },
                    { id: 'carousel', name: 'Product Carousel', desc: 'Horizontal Cards', icon: ShoppingBag },
                    { id: 'text', name: 'Standard Text', desc: 'Plain text reply', icon: Bot },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = actionType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setActionType(t.id as any)}
                        className={cn(
                          'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1',
                          isSelected
                            ? 'bg-purple-50 border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm'
                            : 'border-[#E2E8F0] hover:bg-[#F4F6FB]'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', isSelected ? 'text-[#7C3AED]' : 'text-slate-500')} />
                        <p className={cn('text-xs font-bold', isSelected ? 'text-[#7C3AED]' : 'text-[#0D0F2D]')}>
                          {t.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC FORM FIELDS BASED ON NODE TYPE */}
              <div className="p-5 rounded-2xl bg-[#F4F6FB] border border-[#E2E8F0] space-y-4">
                {/* 1. BUTTONS CONFIG */}
                {actionType === 'buttons' && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
                      Interactive 3-Buttons Configuration
                    </span>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D0F2D]">Header Text (Optional)</label>
                      <input
                        type="text"
                        value={btnHeader}
                        onChange={(e) => setBtnHeader(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0D0F2D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D0F2D]">Body Message</label>
                      <textarea
                        rows={2}
                        required
                        value={btnBody}
                        onChange={(e) => setBtnBody(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0D0F2D]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Button 1</label>
                        <input
                          type="text"
                          value={btn1}
                          onChange={(e) => setBtn1(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0D0F2D]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Button 2</label>
                        <input
                          type="text"
                          value={btn2}
                          onChange={(e) => setBtn2(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0D0F2D]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Button 3</label>
                        <input
                          type="text"
                          value={btn3}
                          onChange={(e) => setBtn3(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0D0F2D]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LIST CONFIG */}
                {actionType === 'list' && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
                      Interactive List Menu Configuration
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#0D0F2D]">Header Text</label>
                        <input
                          type="text"
                          value={listHeader}
                          onChange={(e) => setListHeader(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0D0F2D]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#0D0F2D]">Menu Button Label</label>
                        <input
                          type="text"
                          value={listButtonText}
                          onChange={(e) => setListButtonText(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0D0F2D]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D0F2D]">Body Message</label>
                      <textarea
                        rows={2}
                        value={listBody}
                        onChange={(e) => setListBody(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0D0F2D]"
                      />
                    </div>
                  </div>
                )}

                {/* 3. CAROUSEL CONFIG */}
                {actionType === 'carousel' && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
                      Horizontal Product Cards Carousel
                    </span>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#0D0F2D]">Carousel Introduction Text</label>
                      <input
                        type="text"
                        value={carouselBody}
                        onChange={(e) => setCarouselBody(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0D0F2D]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Configured with {carouselCards.length} high-conversion horizontal cards.
                    </p>
                  </div>
                )}

                {/* 4. TEXT CONFIG */}
                {actionType === 'text' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#0D0F2D]">Standard Text Message</label>
                    <textarea
                      rows={3}
                      required
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      placeholder="Enter response text..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0D0F2D]"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F4F6FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-button px-6 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover"
                >
                  Save Automation Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
