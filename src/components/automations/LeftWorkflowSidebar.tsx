'use client';

import React, { useState, useMemo } from 'react';
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
  Bot,
  BrainCircuit,
  MessageCircle,
  PhoneForwarded,
  FileText,
  MapPin,
  FileCode,
  FolderTree,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisualNodeType, WorkflowNode, WorkflowTreeNode, WorkflowDefinition } from '@/types/automations';
import { buildWorkflowTree, validateWorkflow } from '@/lib/automations/dagLayout';

export interface NodePaletteItem {
  type: VisualNodeType;
  title: string;
  description: string;
  category:
    | 'Trigger Nodes'
    | 'Message Nodes'
    | 'WhatsApp Nodes'
    | 'Logic Nodes'
    | 'AI Nodes'
    | 'CRM Nodes'
    | 'Integrations';
  icon: any;
  color: string;
  badge: string;
  defaultConfig: Record<string, any>;
}

export const PALETTE_CATEGORIES = [
  'Trigger Nodes',
  'Message Nodes',
  'WhatsApp Nodes',
  'Logic Nodes',
  'AI Nodes',
  'CRM Nodes',
  'Integrations',
] as const;

export const COMPREHENSIVE_PALETTE_ITEMS: NodePaletteItem[] = [
  // 1. TRIGGER NODES
  {
    type: 'trigger_incoming',
    title: 'Incoming Message',
    description: 'Fires whenever any customer sends a message',
    category: 'Trigger Nodes',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Any Inbound',
    defaultConfig: { text: '' },
  },
  {
    type: 'trigger_keyword',
    title: 'Keyword Match',
    description: 'Matches exact or partial keywords (e.g. pricing, help)',
    category: 'Trigger Nodes',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Keyword',
    defaultConfig: { text: 'pricing, catalog, order', triggerKeyword: 'pricing' },
  },
  {
    type: 'trigger_button',
    title: 'Button Click Trigger',
    description: 'Fires when customer taps a WhatsApp quick reply button',
    category: 'Trigger Nodes',
    icon: MousePointerClick,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Button CTA',
    defaultConfig: { buttonId: 'btn_catalog' },
  },
  {
    type: 'trigger_carousel',
    title: 'Carousel Click Trigger',
    description: 'Fires when customer clicks a card action inside a carousel',
    category: 'Trigger Nodes',
    icon: Layers,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Card CTA',
    defaultConfig: { cardButtonId: 'order_now' },
  },
  {
    type: 'trigger_list',
    title: 'List Item Selected',
    description: 'Fires when customer picks an option from a sectioned menu',
    category: 'Trigger Nodes',
    icon: ListFilter,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'List Menu',
    defaultConfig: { listId: 'opt_vip_support' },
  },
  {
    type: 'trigger_flow',
    title: 'WhatsApp Flow Submitted',
    description: 'Fires when customer completes an in-chat native form',
    category: 'Trigger Nodes',
    icon: Smartphone,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'Flow Form',
    defaultConfig: { flowId: 'flow_lead_qualification' },
  },

  // 2. MESSAGE NODES
  {
    type: 'whatsapp_message',
    title: 'Text Message',
    description: 'Send personalized text with emojis and dynamic variables',
    category: 'Message Nodes',
    icon: MessageSquare,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Text',
    defaultConfig: {
      text: 'Hello {{contact.firstName}}! Welcome to our store. How may we assist you today?',
    },
  },
  {
    type: 'message_media',
    title: 'Media Attachment',
    description: 'Send image, PDF document, video, or voice note',
    category: 'Message Nodes',
    icon: FileText,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Media',
    defaultConfig: {
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      caption: 'Explore our latest lookbook and seasonal collection.',
    },
  },
  {
    type: 'message_template',
    title: 'WhatsApp Template',
    description: 'Pre-approved Meta utility or marketing template message',
    category: 'Message Nodes',
    icon: FileCode,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Template',
    defaultConfig: {
      templateName: 'order_confirmation',
      languageCode: 'en_US',
    },
  },
  {
    type: 'message_location',
    title: 'Location Pin',
    description: 'Send store or office GPS coordinates with address',
    category: 'Message Nodes',
    icon: MapPin,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Location',
    defaultConfig: {
      locationName: 'TriPix Flagship Showroom',
      locationAddress: '100 Innovation Boulevard, Tech District',
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },

  // 3. WHATSAPP NODES
  {
    type: 'whatsapp_button',
    title: 'Interactive Buttons',
    description: 'Message with up to 3 quick reply or CTA buttons',
    category: 'WhatsApp Nodes',
    icon: MousePointerClick,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    badge: 'Buttons (3)',
    defaultConfig: {
      bodyText: 'Please choose an option to continue:',
      footerText: 'Official Business Service',
      buttons: [
        { id: 'btn_catalog', title: 'Browse Products', type: 'reply' },
        { id: 'btn_sales', title: 'Talk to Sales', type: 'reply' },
      ],
    },
  },
  {
    type: 'whatsapp_list',
    title: 'Section List Menu',
    description: 'Organized menu list with up to 10 interactive rows',
    category: 'WhatsApp Nodes',
    icon: ListFilter,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    badge: 'List (10)',
    defaultConfig: {
      buttonText: 'View Options',
      bodyText: 'Select a category to browse our inventory:',
      sections: [
        {
          title: 'Categories',
          rows: [
            { id: 'cat_electronics', title: 'Consumer Electronics', description: 'Smartphones, watches & gadgets' },
            { id: 'cat_apparel', title: 'Luxury Apparel', description: 'Designer wear & footwear' },
          ],
        },
      ],
    },
  },
  {
    type: 'whatsapp_carousel',
    title: 'Product Carousel',
    description: 'Multi-card horizontal swipe carousel with images & buttons',
    category: 'WhatsApp Nodes',
    icon: Layers,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    badge: 'Carousel',
    defaultConfig: {
      bodyText: 'Explore our hand-picked VIP selection today:',
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
    type: 'whatsapp_flow',
    title: 'Interactive Flow',
    description: 'Open native in-app form for leads, appointments or surveys',
    category: 'WhatsApp Nodes',
    icon: Smartphone,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    badge: 'Flow Form',
    defaultConfig: {
      flowId: 'flow_consultation_form',
      flowTitle: 'Book VIP Consultation',
      flowCta: 'Start Booking',
      flowScreen: 'SCREEN_DETAILS',
    },
  },
  {
    type: 'whatsapp_catalog',
    title: 'Catalog Showcase',
    description: 'Highlight specific catalog item or multi-product message',
    category: 'WhatsApp Nodes',
    icon: ShoppingBag,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    badge: 'Catalog',
    defaultConfig: {
      productTitle: 'Official Store Catalog',
      productPrice: 'Starting at $49',
      retailerId: 'SKU_PREMIUM_01',
    },
  },

  // 4. LOGIC NODES
  {
    type: 'conditional_logic',
    title: 'If / Else Condition',
    description: 'Split workflow based on message text, tags or CRM fields',
    category: 'Logic Nodes',
    icon: GitBranch,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    badge: 'Branching',
    defaultConfig: {
      conditionVariable: 'text',
      conditionOperator: 'contains',
      conditionValue: 'pricing',
    },
  },
  {
    type: 'delay',
    title: 'Delay Timer',
    description: 'Pause automation for minutes, hours or days before next step',
    category: 'Logic Nodes',
    icon: Clock,
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    badge: 'Delay',
    defaultConfig: {
      delayAmount: 15,
      delayUnit: 'minutes',
    },
  },
  {
    type: 'wait_for_reply',
    title: 'Wait For Reply',
    description: 'Wait for customer reply with timeout fallback branch',
    category: 'Logic Nodes',
    icon: Hourglass,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    badge: 'Wait Reply',
    defaultConfig: {
      timeoutMinutes: 60,
    },
  },
  {
    type: 'multi_branch',
    title: 'Multi Router',
    description: 'Route customer into one of up to 5 custom condition paths',
    category: 'Logic Nodes',
    icon: GitBranch,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    badge: 'Switch Case',
    defaultConfig: {
      branches: [
        { id: 'b_sales', label: 'Sales Route', conditionValue: 'sales' },
        { id: 'b_support', label: 'Support Route', conditionValue: 'help' },
      ],
    },
  },
  {
    type: 'end',
    title: 'End Workflow',
    description: 'Mark conversation flow complete or handover to inbox',
    category: 'Logic Nodes',
    icon: StopCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    badge: 'Stop',
    defaultConfig: {},
  },

  // 5. AI NODES
  {
    type: 'ai_agent',
    title: 'AI Agent Engine',
    description: 'Autonomous LLM agent grounded with business knowledge base',
    category: 'AI Nodes',
    icon: Bot,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    badge: 'LLM Agent',
    defaultConfig: {
      systemPrompt: 'You are an intelligent WhatsApp sales concierge. Answer inquiries politely and accurately using our catalog.',
      temperature: 0.7,
      confidenceThreshold: 0.75,
    },
  },
  {
    type: 'ai_sentiment',
    title: 'AI Sentiment Filter',
    description: 'Analyze customer sentiment (Positive, Neutral, Urgent, Frustrated)',
    category: 'AI Nodes',
    icon: BrainCircuit,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    badge: 'Sentiment',
    defaultConfig: {
      targetField: 'sentiment',
    },
  },
  {
    type: 'ai_smart_reply',
    title: 'AI Smart Reply',
    description: 'Generate contextual instant response based on chat context',
    category: 'AI Nodes',
    icon: MessageCircle,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    badge: 'Smart Reply',
    defaultConfig: {
      prompt: 'Draft a short, welcoming reply addressing the customer question.',
    },
  },
  {
    type: 'ai_handoff',
    title: 'AI Human Handover',
    description: 'Gracefully transfer customer from bot to human support inbox',
    category: 'AI Nodes',
    icon: PhoneForwarded,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    badge: 'Handover',
    defaultConfig: {
      assigneeEmail: 'support@tripixsolutions.com',
      note: 'Customer requested human agent assistance.',
    },
  },

  // 6. CRM NODES
  {
    type: 'tag_management',
    title: 'Tag Contact',
    description: 'Add or remove customer segment tags (e.g. VIP, Interested)',
    category: 'CRM Nodes',
    icon: Tag,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    badge: 'Tagging',
    defaultConfig: {
      action: 'add',
      tag: 'vip_buyer',
    },
  },
  {
    type: 'lead_management',
    title: 'Update Lead Stage',
    description: 'Advance lead through sales pipeline Kanban stages',
    category: 'CRM Nodes',
    icon: UserCheck,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'Lead Stage',
    defaultConfig: {
      leadStatus: 'qualified',
      scoreIncrement: 10,
    },
  },
  {
    type: 'crm_action',
    title: 'Assign Agent',
    description: 'Assign customer conversation to specific agent or team',
    category: 'CRM Nodes',
    icon: SlidersHorizontal,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'Assign',
    defaultConfig: {
      assigneeEmail: 'agent@tripixsolutions.com',
      priority: 'high',
    },
  },

  // 7. INTEGRATIONS
  {
    type: 'api_node',
    title: 'REST API Request',
    description: 'Call external webhook, CRM, ERP, or server endpoint',
    category: 'Integrations',
    icon: Globe,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    badge: 'REST API',
    defaultConfig: {
      apiUrl: 'https://api.example.com/v1/leads',
      apiMethod: 'POST',
      webhookBody: '{\n  "phone": "{{contact.phoneNumber}}",\n  "status": "active"\n}',
    },
  },
  {
    type: 'webhook_node',
    title: 'Webhook Dispatch',
    description: 'Send JSON payload to Zapier, Make, n8n, or backend webhook',
    category: 'Integrations',
    icon: Webhook,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    badge: 'Webhook',
    defaultConfig: {
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/sample',
      webhookMethod: 'POST',
    },
  },
  {
    type: 'google_sheets',
    title: 'Google Sheets',
    description: 'Append or update lead row inside a Google Spreadsheet',
    category: 'Integrations',
    icon: FileSpreadsheet,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'Sheets',
    defaultConfig: {
      sheetName: 'WhatsApp Leads 2026',
      operation: 'append_row',
    },
  },
];

interface LeftWorkflowSidebarProps {
  workflow: WorkflowDefinition;
  onAddNode: (item: NodePaletteItem) => void;
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function LeftWorkflowSidebar({
  workflow,
  onAddNode,
  onSelectNode,
  selectedNodeId,
  isOpen,
  onToggle,
}: LeftWorkflowSidebarProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'structure'>('nodes');
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Tree computation
  const workflowTree = useMemo(() => {
    return buildWorkflowTree(workflow);
  }, [workflow]);

  // Validation errors
  const validationErrors = useMemo(() => {
    return validateWorkflow(workflow);
  }, [workflow]);

  // Filtered nodes
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COMPREHENSIVE_PALETTE_ITEMS;
    return COMPREHENSIVE_PALETTE_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const onDragStart = (event: React.DragEvent, item: NodePaletteItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isOpen) {
    return (
      <div
        onClick={onToggle}
        className="w-12 h-full rounded-2xl border border-slate-800 bg-slate-950/90 hover:bg-slate-900 flex flex-col items-center py-4 gap-3 shrink-0 cursor-pointer shadow-lg transition-colors group select-none"
        title="Open Nodes Library & Structure Tree"
      >
        <div className="p-2 rounded-xl bg-slate-900 group-hover:bg-slate-800 border border-slate-800 text-emerald-400 group-hover:text-emerald-300 transition-colors">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
          Nodes & Structure
        </span>
        {validationErrors.length > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse mt-auto" />
        )}
      </div>
    );
  }

  return (
    <aside className="w-72 lg:w-80 h-full bg-slate-950/95 border border-slate-800 rounded-2xl flex flex-col select-none shrink-0 z-20 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Top Header & Tab Switcher */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('nodes')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 text-xs',
              activeTab === 'nodes'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nodes</span>
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 text-xs',
              activeTab === 'structure'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Structure</span>
            {validationErrors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        <button
          onClick={onToggle}
          title="Collapse Panel"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: NODES LIBRARY */}
      {activeTab === 'nodes' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all 25+ nodes..."
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories List (Fully visible, no clipping, custom scrollbar) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
            {PALETTE_CATEGORIES.map((category) => {
              const items = filteredItems.filter((i) => i.category === category);
              if (items.length === 0) return null;
              const isCollapsed = collapsedCategories[category];

              return (
                <div key={category} className="space-y-1.5">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 hover:text-white uppercase px-1 py-1 transition-colors"
                  >
                    <span>
                      {category} ({items.length})
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Category Items */}
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
                            className="group flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] active:scale-95"
                          >
                            <div
                              className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5',
                                item.color
                              )}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                                  {item.title}
                                </span>
                                <span className="text-[9px] text-slate-400 uppercase font-mono px-1 py-0.5 rounded bg-slate-950 border border-slate-800/60 shrink-0">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
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
      )}

      {/* TAB 2: WORKFLOW STRUCTURE / LAYERS */}
      {activeTab === 'structure' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800/60 bg-slate-900/20 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Execution Tree</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {workflow.nodes.length} Nodes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {workflowTree.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No nodes in workflow yet. Add a trigger to begin.
              </div>
            ) : (
              workflowTree.map((rootNode) => (
                <TreeItem
                  key={rootNode.id}
                  node={rootNode}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                />
              ))
            )}
          </div>

          {/* Validation Warnings Summary */}
          {validationErrors.length > 0 && (
            <div className="p-3 border-t border-slate-800 bg-rose-950/20 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{validationErrors.length} Configuration Issues</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Fix missing fields to ensure zero-failure WhatsApp execution.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function TreeItem({
  node,
  selectedNodeId,
  onSelectNode,
}: {
  node: WorkflowTreeNode;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const isSelected = selectedNodeId === node.id;
  const isTrigger = node.type.startsWith('trigger') || node.type === 'trigger';

  return (
    <div className="space-y-1">
      <div
        onClick={() => onSelectNode(node.id)}
        style={{ paddingLeft: `${node.depth * 14 + 8}px` }}
        className={cn(
          'flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-colors group',
          isSelected
            ? 'bg-emerald-600 text-white font-bold'
            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {node.branchLabel && (
            <span
              className={cn(
                'text-[9px] font-mono px-1 rounded uppercase font-bold shrink-0',
                node.branchLabel.toLowerCase() === 'yes' || node.branchLabel.toLowerCase() === 'true'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : node.branchLabel.toLowerCase() === 'no' || node.branchLabel.toLowerCase() === 'false'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              )}
            >
              {node.branchLabel}
            </span>
          )}

          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isTrigger
                ? 'bg-amber-400'
                : node.hasError
                ? 'bg-rose-500'
                : isSelected
                ? 'bg-white'
                : 'bg-slate-600'
            )}
          />

          <span className="truncate">{node.title}</span>
        </div>

        {node.hasError && (
          <span title={node.errorMessage} className="shrink-0 text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
