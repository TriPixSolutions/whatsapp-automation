'use client';

import React, { useState } from 'react';
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
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Smartphone,
  ListFilter,
  Hourglass,
  StopCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisualNodeType } from '@/types/automations';

export interface NodePaletteItem {
  type: VisualNodeType;
  title: string;
  description: string;
  category: 'Triggers' | 'WhatsApp Messages' | 'Logic & Flow' | 'CRM & Contacts' | 'Integrations';
  icon: any;
  color: string;
  badge: string;
  defaultConfig: Record<string, any>;
}

export const PALETTE_ITEMS: NodePaletteItem[] = [
  // 1. Triggers
  {
    type: 'trigger_incoming',
    title: 'Incoming Message',
    description: 'Triggers on any customer message',
    category: 'Triggers',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Trigger',
    defaultConfig: { text: '' },
  },
  {
    type: 'trigger_keyword',
    title: 'Keyword Trigger',
    description: 'Triggers when message matches keywords',
    category: 'Triggers',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Keyword',
    defaultConfig: { text: 'Pricing, Quote, Info', triggerKeyword: 'Pricing' },
  },
  {
    type: 'trigger_button',
    title: 'Button Click Trigger',
    description: 'Triggers when customer clicks an action button',
    category: 'Triggers',
    icon: MousePointerClick,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Click',
    defaultConfig: { buttonId: 'btn_catalog' },
  },
  {
    type: 'trigger_carousel',
    title: 'Carousel Click Trigger',
    description: 'Triggers when customer clicks a carousel card button',
    category: 'Triggers',
    icon: Layers,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Carousel',
    defaultConfig: { cardButtonId: 'buy_shoes' },
  },
  {
    type: 'trigger_list',
    title: 'List Selection Trigger',
    description: 'Triggers when customer selects an item from a list',
    category: 'Triggers',
    icon: ListFilter,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'List',
    defaultConfig: { listId: 'opt_vip_support' },
  },
  {
    type: 'trigger_flow',
    title: 'WhatsApp Flow Trigger',
    description: 'Triggers when customer completes an in-chat form',
    category: 'Triggers',
    icon: Smartphone,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Flow',
    defaultConfig: { flowId: 'flow_consultation_form' },
  },

  // 2. WhatsApp Messages
  {
    type: 'whatsapp_message',
    title: 'WhatsApp Message',
    description: 'Send personalized text or media message',
    category: 'WhatsApp Messages',
    icon: MessageSquare,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'WhatsApp',
    defaultConfig: {
      text: 'Hello! Thank you for reaching out to us. How can we help you today?',
    },
  },
  {
    type: 'whatsapp_button',
    title: 'WhatsApp Buttons',
    description: 'Send message with up to 3 quick reply buttons',
    category: 'WhatsApp Messages',
    icon: MousePointerClick,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Buttons',
    defaultConfig: {
      bodyText: 'Please select an option below:',
      footerText: 'Official WhatsApp Service',
      buttons: [
        { id: 'btn_1', title: 'Explore Products', type: 'reply' },
        { id: 'btn_2', title: 'Talk to Specialist', type: 'reply' },
      ],
    },
  },
  {
    type: 'whatsapp_carousel',
    title: 'WhatsApp Carousel',
    description: 'Interactive multi-card scrollable product showcase',
    category: 'WhatsApp Messages',
    icon: Layers,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    badge: 'Carousel',
    defaultConfig: {
      bodyText: 'Explore our top trending catalog highlights:',
      cards: [
        {
          headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          title: 'Runner Pro Sneakers',
          description: 'Ultra-light breathable performance shoes. $129',
          buttons: [{ id: 'card_btn_1', title: 'Order Sneakers' }],
        },
        {
          headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          title: 'Chronos Smart Watch',
          description: 'Titanium chassis with sapphire glass. $249',
          buttons: [{ id: 'card_btn_2', title: 'Order Watch' }],
        },
      ],
    },
  },
  {
    type: 'whatsapp_catalog',
    title: 'WhatsApp Catalog',
    description: 'Display interactive product catalog card with price & CTA',
    category: 'WhatsApp Messages',
    icon: ShoppingBag,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    badge: 'Catalog',
    defaultConfig: {
      productTitle: 'Precision Mechanical Watch',
      productPrice: '$249.00',
      productSubtitle: 'Free Shipping Available',
      mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      bodyText: 'Check out our featured product of the week:',
    },
  },
  {
    type: 'whatsapp_flow',
    title: 'WhatsApp Flow',
    description: 'Native interactive form screen inside WhatsApp',
    category: 'WhatsApp Messages',
    icon: Smartphone,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    badge: 'Flow Form',
    defaultConfig: {
      flowTitle: 'Consultation Booking Form',
      flowCta: 'Book Now',
      bodyText: 'Please tap below to book your appointment in 30 seconds:',
    },
  },

  // 3. Logic & Flow Control
  {
    type: 'conditional_logic',
    title: 'Conditional Logic',
    description: 'If / Else decision branching with True & False paths',
    category: 'Logic & Flow',
    icon: GitBranch,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    badge: 'If / Else',
    defaultConfig: {
      conditionVariable: 'text',
      conditionOperator: 'contains',
      conditionValue: 'quote',
    },
  },
  {
    type: 'multi_branch',
    title: 'Multi-Path Branching',
    description: 'Route flow into multiple custom branch paths',
    category: 'Logic & Flow',
    icon: GitBranch,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    badge: 'Router',
    defaultConfig: {
      conditionVariable: 'text',
      branches: [
        { id: 'branch_sales', label: 'Sales Inquiry', conditionValue: 'sales' },
        { id: 'branch_support', label: 'Support Help', conditionValue: 'support' },
        { id: 'branch_billing', label: 'Billing Question', conditionValue: 'billing' },
      ],
    },
  },
  {
    type: 'wait_for_reply',
    title: 'Wait For Reply',
    description: 'Wait for customer response with timeout fallback',
    category: 'Logic & Flow',
    icon: Hourglass,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    badge: 'Wait',
    defaultConfig: {
      timeoutMinutes: 30,
      timeoutUnit: 'minutes',
    },
  },
  {
    type: 'delay',
    title: 'Delay Timer',
    description: 'Pause flow execution for a set duration',
    category: 'Logic & Flow',
    icon: Clock,
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    badge: 'Delay',
    defaultConfig: {
      delayAmount: 15,
      delayUnit: 'minutes',
    },
  },
  {
    type: 'end',
    title: 'Workflow End',
    description: 'Conclude workflow execution cleanly',
    category: 'Logic & Flow',
    icon: StopCircle,
    color: 'text-gray-400 bg-gray-500/10 border-gray-600/30',
    badge: 'End',
    defaultConfig: {},
  },

  // 4. CRM & Contacts
  {
    type: 'crm_action',
    title: 'CRM Stage & Note',
    description: 'Update pipeline stage and append CRM notes',
    category: 'CRM & Contacts',
    icon: SlidersHorizontal,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'CRM',
    defaultConfig: {
      stage: 'qualified',
      notes: 'Qualified through WhatsApp automated funnel',
    },
  },
  {
    type: 'lead_management',
    title: 'Lead Management',
    description: 'Update lead score, value, priority, and status',
    category: 'CRM & Contacts',
    icon: UserCheck,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'Lead',
    defaultConfig: {
      leadStatus: 'qualified',
      leadValue: 500,
      priority: 'high',
      scoreIncrement: 20,
    },
  },
  {
    type: 'tag_management',
    title: 'Tag Management',
    description: 'Add or remove tags on contact profile',
    category: 'CRM & Contacts',
    icon: Tag,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    badge: 'Tag',
    defaultConfig: {
      action: 'add',
      tag: 'vip_buyer',
    },
  },

  // 5. Integrations
  {
    type: 'google_sheets',
    title: 'Google Sheets',
    description: 'Append or update lead row in spreadsheet',
    category: 'Integrations',
    icon: FileSpreadsheet,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Sheets',
    defaultConfig: {
      sheetName: 'WhatsApp Leads 2025',
      operation: 'append_row',
    },
  },
  {
    type: 'api_node',
    title: 'REST API Request',
    description: 'Execute HTTP GET/POST/PUT request with response mapping',
    category: 'Integrations',
    icon: Globe,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    badge: 'API',
    defaultConfig: {
      apiUrl: 'https://api.example.com/leads',
      apiMethod: 'POST',
      webhookHeaders: { 'Authorization': 'Bearer YOUR_KEY' },
      webhookBody: JSON.stringify({ phone: '{{phoneNumber}}', status: 'new_lead' }, null, 2),
    },
  },
  {
    type: 'webhook_node',
    title: 'Webhook Dispatch',
    description: 'Send webhook payload to Zapier, Make, or custom URL',
    category: 'Integrations',
    icon: Webhook,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    badge: 'Webhook',
    defaultConfig: {
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/sample',
      webhookMethod: 'POST',
    },
  },
];

interface NodePaletteProps {
  onAddNode: (item: NodePaletteItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function NodePalette({ onAddNode, isOpen, onToggle }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categories: Array<NodePaletteItem['category']> = [
    'Triggers',
    'WhatsApp Messages',
    'Logic & Flow',
    'CRM & Contacts',
    'Integrations',
  ];

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const onDragStart = (event: React.DragEvent, item: NodePaletteItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-gray-900/90 hover:bg-gray-800 text-white border border-gray-700/80 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md transition-all group"
      >
        <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
        <span className="text-xs font-semibold">Add Nodes</span>
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-4 bottom-4 w-72 bg-gray-950/95 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-xl z-20 flex flex-col overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">Node Library</h3>
            <p className="text-[10px] text-gray-400">Drag or click to insert</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-800/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search all 30 nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Categories & Node Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
        {categories.map((cat) => {
          const items = filteredItems.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          const isCollapsed = collapsedCategories[cat];

          return (
            <div key={cat} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 hover:text-gray-200 tracking-wider uppercase px-1 py-0.5 transition-colors"
              >
                <span>
                  {cat} ({items.length})
                </span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        onClick={() => onAddNode(item)}
                        className="group flex items-start gap-2.5 p-2 rounded-xl bg-gray-900/60 hover:bg-gray-800/90 border border-gray-800 hover:border-gray-700/80 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] active:scale-95"
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 mt-0.5',
                            item.color
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                              {item.title}
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase font-mono px-1 py-0.5 rounded bg-gray-950">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
