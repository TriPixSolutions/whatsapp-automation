'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRight,
  ArrowDown,
  MessageSquare,
  Sparkles,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Filter,
  Users,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FunnelBlockType = 'trigger' | 'message' | 'delay' | 'condition' | 'action';

export interface FunnelBlock {
  id: string;
  type: FunnelBlockType;
  title: string;
  config: {
    keyword?: string;
    text?: string;
    buttons?: string[];
    delayMinutes?: number;
    delayUnit?: 'minutes' | 'hours' | 'days';
    conditionCriteria?: string;
    actionType?: 'tag' | 'assign' | 'stage';
    actionValue?: string;
  };
}

// 8 Instant Templates that work immediately (Zero emojis, enterprise ready)
const TEMPLATES: {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: FunnelBlock[];
}[] = [
  {
    id: 'lead_follow_up',
    name: 'Lead Follow Up',
    description: 'Instantly captures inbound buyer interest and follows up with automated qualification.',
    category: 'Sales',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When customer sends a message',
        config: { keyword: 'PRICE, QUOTE, DETAILS, CATALOG' },
      },
      {
        id: 'b2',
        type: 'message',
        title: 'Send welcome message with options',
        config: {
          text: 'Hello! Thank you for reaching out. Here is our pricing overview and product details. How can we best assist your inquiry?',
          buttons: ['Request Quotation', 'Speak to Specialist'],
        },
      },
      {
        id: 'b3',
        type: 'delay',
        title: 'Wait for response',
        config: { delayMinutes: 30, delayUnit: 'minutes' },
      },
      {
        id: 'b4',
        type: 'condition',
        title: 'Check customer response',
        config: { conditionCriteria: 'Customer has not replied within 30 minutes' },
      },
      {
        id: 'b5',
        type: 'message',
        title: 'Send gentle reminder',
        config: {
          text: 'Just checking in regarding your inquiry. Would you like our product team to prepare an estimate for you today?',
          buttons: ['Yes, send estimate', 'Not right now'],
        },
      },
      {
        id: 'b6',
        type: 'action',
        title: 'Update CRM lead status',
        config: { actionType: 'tag', actionValue: 'Qualified Lead' },
      },
    ],
  },
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    description: 'Confirms scheduled appointments and sends timed reminders to reduce no-shows.',
    category: 'Operations',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When appointment is scheduled or confirmed',
        config: { keyword: 'BOOK, APPOINTMENT, SCHEDULE' },
      },
      {
        id: 'b2',
        type: 'message',
        title: 'Send booking confirmation',
        config: {
          text: 'Your consultation has been confirmed. Our specialist looks forward to meeting with you.',
          buttons: ['View Details', 'Reschedule'],
        },
      },
      {
        id: 'b3',
        type: 'delay',
        title: 'Wait until 2 hours before appointment',
        config: { delayMinutes: 120, delayUnit: 'minutes' },
      },
      {
        id: 'b4',
        type: 'message',
        title: 'Send reminder notice',
        config: {
          text: 'Reminder: Your consultation starts in 2 hours. Please confirm your attendance below.',
          buttons: ['Confirm Attendance', 'Need to Reschedule'],
        },
      },
      {
        id: 'b5',
        type: 'action',
        title: 'Mark as confirmed in schedule',
        config: { actionType: 'tag', actionValue: 'Appointment Confirmed' },
      },
    ],
  },
  {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    description: 'Re-engages shoppers who left items in cart with product reminder and checkout link.',
    category: 'E-commerce',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When cart is abandoned on website',
        config: { keyword: 'CART_ABANDONED, CHECKOUT' },
      },
      {
        id: 'b2',
        type: 'delay',
        title: 'Wait for customer return',
        config: { delayMinutes: 45, delayUnit: 'minutes' },
      },
      {
        id: 'b3',
        type: 'message',
        title: 'Send cart recovery reminder',
        config: {
          text: 'You left items in your shopping bag. We have reserved them for you for the next 24 hours.',
          buttons: ['Complete Checkout', 'Contact Support'],
        },
      },
      {
        id: 'b4',
        type: 'action',
        title: 'Tag lead as high intent',
        config: { actionType: 'tag', actionValue: 'Cart Recovery' },
      },
    ],
  },
  {
    id: 'welcome_series',
    name: 'Welcome Series',
    description: 'Introduces new contacts to your business services and core catalog items.',
    category: 'Onboarding',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When a new customer messages for the first time',
        config: { keyword: 'HI, HELLO, START, MENU' },
      },
      {
        id: 'b2',
        type: 'message',
        title: 'Send welcome introduction',
        config: {
          text: 'Welcome to our official WhatsApp service. How can our team assist you today?',
          buttons: ['Explore Services', 'Talk to Support'],
        },
      },
      {
        id: 'b3',
        type: 'action',
        title: 'Record new contact in phonebook',
        config: { actionType: 'tag', actionValue: 'New Contact' },
      },
    ],
  },
  {
    id: 're_engagement',
    name: 'Re-engagement',
    description: 'Reconnects with inactive customers who have not messaged in the past 30 days.',
    category: 'Retention',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When contact has been inactive for 30 days',
        config: { keyword: 'INACTIVE_30_DAYS' },
      },
      {
        id: 'b2',
        type: 'message',
        title: 'Send re-engagement inquiry',
        config: {
          text: 'We have updated our service catalog and new offerings for this month. Would you like to review the updates?',
          buttons: ['View Updates', 'Unsubscribe'],
        },
      },
      {
        id: 'b3',
        type: 'action',
        title: 'Update contact segment',
        config: { actionType: 'tag', actionValue: 'Re-engaged' },
      },
    ],
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Routes common support questions and assigns unresolved queries to team members.',
    category: 'Support',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When customer asks for help',
        config: { keyword: 'HELP, SUPPORT, ISSUE, PROBLEM' },
      },
      {
        id: 'b2',
        type: 'message',
        title: 'Provide support routing menu',
        config: {
          text: 'Welcome to customer support. Please select the topic you need assistance with:',
          buttons: ['Order Status', 'Account Inquiries', 'Speak to Agent'],
        },
      },
      {
        id: 'b3',
        type: 'action',
        title: 'Route to active support agent',
        config: { actionType: 'assign', actionValue: 'Support Agent' },
      },
    ],
  },
  {
    id: 'order_updates',
    name: 'Order Updates',
    description: 'Sends automated order status updates, dispatch tracking, and delivery notifications.',
    category: 'Operations',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When order status changes to Dispatched',
        config: { keyword: 'ORDER_DISPATCHED' },
      },
      {
        id: 'b2',
        type: 'message',
        title: 'Send dispatch notification with tracking',
        config: {
          text: 'Good news! Your order has been dispatched and is on its way. You can track package status below.',
          buttons: ['Track Order', 'Delivery Help'],
        },
      },
      {
        id: 'b3',
        type: 'action',
        title: 'Update lead stage to customer',
        config: { actionType: 'stage', actionValue: 'Won' },
      },
    ],
  },
  {
    id: 'feedback_collection',
    name: 'Feedback Collection',
    description: 'Collects customer satisfaction ratings and reviews 24 hours after service completion.',
    category: 'Quality',
    blocks: [
      {
        id: 'b1',
        type: 'trigger',
        title: 'When service or order is marked delivered',
        config: { keyword: 'ORDER_DELIVERED' },
      },
      {
        id: 'b2',
        type: 'delay',
        title: 'Wait 24 hours after delivery',
        config: { delayMinutes: 1440, delayUnit: 'hours' },
      },
      {
        id: 'b3',
        type: 'message',
        title: 'Send satisfaction feedback prompt',
        config: {
          text: 'How was your recent experience with our service? We would appreciate your feedback.',
          buttons: ['Excellent', 'Good', 'Needs Improvement'],
        },
      },
      {
        id: 'b4',
        type: 'action',
        title: 'Tag feedback status',
        config: { actionType: 'tag', actionValue: 'Feedback Received' },
      },
    ],
  },
];

export default function AutomationsPage() {
  const [workflowName, setWorkflowName] = useState('Lead Follow Up');
  const [blocks, setBlocks] = useState<FunnelBlock[]>(TEMPLATES[0].blocks);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('b2');

  // Load existing workflow if available
  useEffect(() => {
    fetch('/api/automations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          if (first.name) setWorkflowName(first.name);
          if (first.isActive !== undefined) setIsActive(first.isActive);
        }
      })
      .catch((e) => console.warn(e));
  }, []);

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    setWorkflowName(template.name);
    setBlocks(template.blocks);
    const firstMsg = template.blocks.find((b) => b.type === 'message');
    if (firstMsg) setSelectedBlockId(firstMsg.id);
  };

  const handleUpdateBlockConfig = (blockId: string, updates: Partial<FunnelBlock['config']>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, config: { ...b.config, ...updates } } : b))
    );
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 1 || targetIdx >= blocks.length) return; // Keep trigger as first block
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    setBlocks(newBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (blocks.length <= 2) return;
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const handleAddBlock = (type: FunnelBlockType) => {
    const newId = `b_${Date.now()}`;
    let newBlock: FunnelBlock;

    switch (type) {
      case 'message':
        newBlock = {
          id: newId,
          type: 'message',
          title: 'Send WhatsApp message',
          config: {
            text: 'Thank you for your message. We are here to help.',
            buttons: ['Learn More', 'Contact Us'],
          },
        };
        break;
      case 'delay':
        newBlock = {
          id: newId,
          type: 'delay',
          title: 'Wait before next step',
          config: { delayMinutes: 15, delayUnit: 'minutes' },
        };
        break;
      case 'condition':
        newBlock = {
          id: newId,
          type: 'condition',
          title: 'Check customer reply condition',
          config: { conditionCriteria: 'Customer replied to previous message' },
        };
        break;
      case 'action':
        newBlock = {
          id: newId,
          type: 'action',
          title: 'Perform CRM action',
          config: { actionType: 'tag', actionValue: 'Engaged Lead' },
        };
        break;
      default:
        return;
    }

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          isActive,
          triggerKeyword: blocks[0]?.config?.keyword || 'HI',
          nodes: blocks.map((b, idx) => ({
            id: b.id,
            type: b.type,
            title: b.title,
            config: b.config,
            order: idx,
          })),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.warn('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Find active message block for realistic WhatsApp phone preview
  const activeMessageBlock = blocks.find((b) => b.id === selectedBlockId && b.type === 'message') ||
    blocks.find((b) => b.type === 'message');

  return (
    <div className="min-h-screen bg-slate-50 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Automation Builder"
        subtitle="Create funnel-style automated customer journeys without code or technical complexity"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-12">
        {/* Template Selector Carousel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Instant Automation Templates</h3>
              <p className="text-xs text-slate-500">
                Click any pre-built template to load it immediately into your funnel.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              8 Ready Templates
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className={cn(
                  'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20',
                  workflowName === tmpl.name
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                )}
              >
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wider block',
                    workflowName === tmpl.name ? 'text-slate-300' : 'text-slate-400'
                  )}
                >
                  {tmpl.category}
                </span>
                <span className="text-xs font-bold leading-tight line-clamp-2">
                  {tmpl.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Builder Toolbar & Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-base font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-slate-900 focus:outline-hidden pb-0.5 max-w-xs"
            />
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors cursor-pointer',
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              )}
            >
              {isActive ? 'Active 24/7' : 'Paused'}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved Live</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Automation'}</span>
            </button>
          </div>
        </div>

        {/* Funnel Builder 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Funnel Stack (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Funnel Steps Sequence
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {blocks.length} Steps
                </span>
              </div>

              {/* Vertical Stack with Connector Lines */}
              <div className="space-y-3">
                {blocks.map((block, idx) => {
                  const isSelected = block.id === selectedBlockId;
                  const isFirst = idx === 0;
                  const isLast = idx === blocks.length - 1;

                  return (
                    <React.Fragment key={block.id}>
                      {/* Downward Connector Arrow */}
                      {idx > 0 && (
                        <div className="flex justify-center my-1">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

                      {/* Visual Funnel Block Card */}
                      <div
                        onClick={() => setSelectedBlockId(block.id)}
                        className={cn(
                          'p-4 rounded-xl border transition-all cursor-pointer relative group space-y-2',
                          isSelected
                            ? 'bg-slate-50 border-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                                block.type === 'trigger' && 'bg-amber-50 text-amber-800 border-amber-200',
                                block.type === 'message' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                                block.type === 'delay' && 'bg-blue-50 text-blue-800 border-blue-200',
                                block.type === 'condition' && 'bg-purple-50 text-purple-800 border-purple-200',
                                block.type === 'action' && 'bg-rose-50 text-rose-800 border-rose-200'
                              )}
                            >
                              {block.type}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{block.title}</span>
                          </div>

                          {/* Reorder and Delete Controls */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            {!isFirst && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBlock(idx, 'up');
                                }}
                                disabled={idx <= 1}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isFirst && !isLast && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBlock(idx, 'down');
                                }}
                                className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isFirst && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBlock(block.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Quick Preview of Block Content */}
                        {block.type === 'trigger' && (
                          <p className="text-xs text-slate-600 font-mono">
                            Keywords: {block.config.keyword || 'HI, HELLO'}
                          </p>
                        )}
                        {block.type === 'message' && (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-600 line-clamp-2">{block.config.text}</p>
                            {block.config.buttons && block.config.buttons.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {block.config.buttons.map((btn, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                                  >
                                    [{btn}]
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {block.type === 'delay' && (
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              Wait {block.config.delayMinutes || 15} {block.config.delayUnit || 'minutes'}
                            </span>
                          </p>
                        )}
                        {block.type === 'condition' && (
                          <p className="text-xs text-slate-600">
                            If: {block.config.conditionCriteria}
                          </p>
                        )}
                        {block.type === 'action' && (
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-rose-600" />
                            <span>
                              Assign Tag: <strong>{block.config.actionValue}</strong>
                            </span>
                          </p>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Add Step Action Menu */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Add Next Step in Funnel
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddBlock('message')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('delay')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Delay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('condition')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-purple-600" />
                    <span>Condition</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('action')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-rose-600" />
                    <span>Action</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Block Configuration Inspector */}
            {selectedBlockId && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                {(() => {
                  const b = blocks.find((item) => item.id === selectedBlockId);
                  if (!b) return null;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          Edit Step: {b.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {b.type}
                        </span>
                      </div>

                      {b.type === 'trigger' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Trigger Keywords (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={b.config.keyword || ''}
                            onChange={(e) => handleUpdateBlockConfig(b.id, { keyword: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            When an incoming customer message contains any of these words, this funnel activates.
                          </p>
                        </div>
                      )}

                      {b.type === 'message' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              WhatsApp Message Text
                            </label>
                            <textarea
                              rows={3}
                              value={b.config.text || ''}
                              onChange={(e) => handleUpdateBlockConfig(b.id, { text: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              Supports variables like &#123;&#123;name&#125;&#125; and &#123;&#123;phone&#125;&#125;.
                            </p>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Quick Reply Buttons (Max 3)
                            </label>
                            <div className="space-y-1.5">
                              {(b.config.buttons || []).map((btnText, btnIdx) => (
                                <div key={btnIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={btnText}
                                    onChange={(e) => {
                                      const updated = [...(b.config.buttons || [])];
                                      updated[btnIdx] = e.target.value;
                                      handleUpdateBlockConfig(b.id, { buttons: updated });
                                    }}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (b.config.buttons || []).filter((_, i) => i !== btnIdx);
                                      handleUpdateBlockConfig(b.id, { buttons: updated });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {(b.config.buttons || []).length < 3 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(b.config.buttons || []), `Option ${(b.config.buttons?.length || 0) + 1}`];
                                    handleUpdateBlockConfig(b.id, { buttons: updated });
                                  }}
                                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Button</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {b.type === 'delay' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Wait Duration (Minutes)
                          </label>
                          <input
                            type="number"
                            value={b.config.delayMinutes || 15}
                            onChange={(e) => handleUpdateBlockConfig(b.id, { delayMinutes: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                          />
                        </div>
                      )}

                      {b.type === 'condition' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Condition Criteria
                          </label>
                          <select
                            value={b.config.conditionCriteria || 'Customer replied to previous message'}
                            onChange={(e) => handleUpdateBlockConfig(b.id, { conditionCriteria: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                          >
                            <option>Customer replied to previous message</option>
                            <option>Customer clicked a button</option>
                            <option>Customer has not replied within delay</option>
                          </select>
                        </div>
                      )}

                      {b.type === 'action' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Tag to Apply to Contact
                          </label>
                          <input
                            type="text"
                            value={b.config.actionValue || 'Qualified Lead'}
                            onChange={(e) => handleUpdateBlockConfig(b.id, { actionValue: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Column: Real Device WhatsApp Phone Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live WhatsApp Device Preview
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Pixel-Exact Render
              </span>
            </div>

            <PhoneMockup
              businessName="Your Business"
              bodyText={activeMessageBlock?.config?.text || 'Hello! Thank you for reaching out.'}
              messageType={activeMessageBlock?.config?.buttons?.length ? 'button' : 'text'}
              buttons={(activeMessageBlock?.config?.buttons || []).map((b, i) => ({
                id: `btn_${i}`,
                title: b,
              }))}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
