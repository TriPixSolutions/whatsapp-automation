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
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  Copy,
  ArrowDown,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Tag as TagIcon,
  HelpCircle,
  Play,
  RotateCcw,
  Check,
  Smartphone,
  Eye,
  Send,
  Video,
  Split,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  Filter,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoneMockup } from '@/components/PhoneMockup';

// Block types supported in Visual Builder
export type BlockType =
  | 'trigger'
  | 'message'
  | 'image'
  | 'template'
  | 'wait'
  | 'condition'
  | 'tag'
  | 'end';

export interface WorkflowBlock {
  id: string;
  type: BlockType;
  title: string;
  description: string;
  config: {
    text?: string;
    mediaUrl?: string;
    templateName?: string;
    waitDuration?: number;
    waitUnit?: 'minutes' | 'hours' | 'days';
    conditionField?: string;
    conditionValue?: string;
    tagName?: string;
    buttons?: string[];
  };
}

export interface FollowUpStep {
  id: string;
  stepNumber: number;
  type: 'message' | 'wait';
  title: string;
  messageText?: string;
  delayAmount?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
}

export interface ChatbotNode {
  id: string;
  prompt: string;
  mediaType?: 'text' | 'image' | 'video' | 'document';
  mediaUrl?: string;
  options: {
    id: string;
    label: string;
    actionType: 'reply' | 'branch';
    replyText: string;
  }[];
}

export interface LeadFunnelStage {
  id: string;
  title: string;
  subtitle: string;
  leadsCount: number;
  conversionRate: string;
  icon: string;
  status: 'active' | 'completed' | 'pending';
}

export default function AutomationsPage() {
  // Navigation tabs for the 5 visual builders
  const [activeTab, setActiveTab] = useState<
    'automation' | 'followup' | 'chatbot' | 'buttonflow' | 'leadfunnel'
  >('automation');

  const [savedFlows, setSavedFlows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePreviewDevice, setActivePreviewDevice] = useState(true);

  // ---------------------------------------------------------------------------
  // MODULE 1: VISUAL AUTOMATION BUILDER STATE
  // ---------------------------------------------------------------------------
  const [workflowBlocks, setWorkflowBlocks] = useState<WorkflowBlock[]>([
    {
      id: 'block_1',
      type: 'trigger',
      title: 'Lead Arrives',
      description: 'Triggered when customer submits Facebook/Instagram ad form',
      config: { text: 'Meta Lead Gen Inbound' },
    },
    {
      id: 'block_2',
      type: 'image',
      title: 'Send Welcome Image',
      description: 'Send high-resolution visual catalog preview',
      config: {
        mediaUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        text: 'Welcome to our store! Here is our featured collection.',
      },
    },
    {
      id: 'block_3',
      type: 'wait',
      title: 'Wait 1 Hour',
      description: 'Allow customer to review welcome message',
      config: { waitDuration: 1, waitUnit: 'hours' },
    },
    {
      id: 'block_4',
      type: 'message',
      title: 'Send Product Details',
      description: 'Explain core benefits and available stock',
      config: { text: 'Here are the key specifications and warranty information.' },
    },
    {
      id: 'block_5',
      type: 'wait',
      title: 'Wait 2 Hours',
      description: 'Give time before pricing discussion',
      config: { waitDuration: 2, waitUnit: 'hours' },
    },
    {
      id: 'block_6',
      type: 'message',
      title: 'Send Pricing & Offer',
      description: 'Send transparent pricing with limited 10% coupon',
      config: { text: 'Exclusive WhatsApp Offer: Complete your order today for 10% off with code SAVE10.' },
    },
    {
      id: 'block_7',
      type: 'wait',
      title: 'Wait 5 Hours',
      description: 'Final nurture delay',
      config: { waitDuration: 5, waitUnit: 'hours' },
    },
    {
      id: 'block_8',
      type: 'message',
      title: 'Send Friendly Reminder',
      description: 'Ask if they have questions before closing offer',
      config: { text: 'Quick reminder: Your 10% coupon expires tonight. Would you like assistance?' },
    },
    {
      id: 'block_9',
      type: 'end',
      title: 'End Automation',
      description: 'Flow complete. Hand off to Live Team Inbox.',
      config: {},
    },
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string>('block_2');

  // ---------------------------------------------------------------------------
  // MODULE 2: FOLLOW-UP BUILDER STATE
  // ---------------------------------------------------------------------------
  const [followUpSteps, setFollowUpSteps] = useState<FollowUpStep[]>([
    {
      id: 'fu_1',
      stepNumber: 1,
      type: 'message',
      title: 'Step 1: Welcome Message',
      messageText: 'Hello! Thank you for contacting us. How can we help you today?',
    },
    {
      id: 'fu_2',
      stepNumber: 2,
      type: 'wait',
      title: 'Step 2: Wait 1 Hour',
      delayAmount: 1,
      delayUnit: 'hours',
    },
    {
      id: 'fu_3',
      stepNumber: 3,
      type: 'message',
      title: 'Step 3: Follow-Up Message',
      messageText: 'Did you get a chance to see our catalog? Let us know if you need sizing or pricing details.',
    },
    {
      id: 'fu_4',
      stepNumber: 4,
      type: 'wait',
      title: 'Step 4: Wait 2 Hours',
      delayAmount: 2,
      delayUnit: 'hours',
    },
    {
      id: 'fu_5',
      stepNumber: 5,
      type: 'message',
      title: 'Step 5: Follow-Up Message',
      messageText: 'We have reserved your item for the next 24 hours. Would you like free doorstep delivery?',
    },
    {
      id: 'fu_6',
      stepNumber: 6,
      type: 'wait',
      title: 'Step 6: Wait 5 Hours',
      delayAmount: 5,
      delayUnit: 'hours',
    },
    {
      id: 'fu_7',
      stepNumber: 7,
      type: 'message',
      title: 'Step 7: Final Reminder',
      messageText: 'Final notice: Your inquiry will close shortly. Tap reply to speak with our product specialist.',
    },
  ]);

  // ---------------------------------------------------------------------------
  // MODULE 3 & 4: CHATBOT & BUTTON FLOW STATE
  // ---------------------------------------------------------------------------
  const [chatbotNodes, setChatbotNodes] = useState<ChatbotNode[]>([
    {
      id: 'cb_root',
      prompt: 'Welcome to our company! Are you interested in our new collection?',
      mediaType: 'text',
      options: [
        {
          id: 'opt_yes',
          label: 'Yes, Show Details',
          actionType: 'reply',
          replyText: 'Awesome! Here are our bestsellers with direct 1-tap ordering link.',
        },
        {
          id: 'opt_no',
          label: 'No, Not Right Now',
          actionType: 'reply',
          replyText: 'No problem at all! Feel free to reach out anytime you need assistance. Have a great day!',
        },
      ],
    },
  ]);

  // ---------------------------------------------------------------------------
  // MODULE 5: LEAD FUNNEL JOURNEY
  // ---------------------------------------------------------------------------
  const [funnelStages, setFunnelStages] = useState<LeadFunnelStage[]>([
    {
      id: 'fn_1',
      title: '1. Meta Lead Arrives',
      subtitle: 'Customer clicks Instagram/Facebook Ad',
      leadsCount: 1420,
      conversionRate: '100%',
      icon: '🎯',
      status: 'completed',
    },
    {
      id: 'fn_2',
      title: '2. Welcome Message Sent',
      subtitle: 'Dispatched via WhatsApp in under 3 seconds',
      leadsCount: 1412,
      conversionRate: '99.4%',
      icon: '⚡',
      status: 'completed',
    },
    {
      id: 'fn_3',
      title: '3. Follow-Up 1 (T+1 Hour)',
      subtitle: 'Automated gentle nudge sent',
      leadsCount: 980,
      conversionRate: '69.4%',
      icon: '⏱️',
      status: 'active',
    },
    {
      id: 'fn_4',
      title: '4. Follow-Up 2 (T+6 Hours)',
      subtitle: 'Special limited voucher sent',
      leadsCount: 710,
      conversionRate: '50.3%',
      icon: '🎁',
      status: 'active',
    },
    {
      id: 'fn_5',
      title: '5. Customer Reply Detected',
      subtitle: '24-hour conversational window unlocked',
      leadsCount: 524,
      conversionRate: '37.1%',
      icon: '💬',
      status: 'active',
    },
    {
      id: 'fn_6',
      title: '6. Moved to Priority Leads',
      subtitle: 'Assigned to sales agent for closing',
      leadsCount: 418,
      conversionRate: '29.6%',
      icon: '🔥',
      status: 'active',
    },
  ]);

  // Load existing flows from backend
  useEffect(() => {
    fetch('/api/automations')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setSavedFlows(data);
      })
      .catch((err) => console.warn('Could not load automations:', err));
  }, []);

  // Save current flow to backend
  const handleSaveAutomation = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        name: activeTab === 'automation'
          ? 'Visual Lead Nurture Flow'
          : activeTab === 'followup'
          ? 'Multi-Step Follow-Up Sequence'
          : activeTab === 'chatbot'
          ? 'Customer Service Chatbot'
          : activeTab === 'buttonflow'
          ? 'Interactive Button Flow'
          : 'Meta Lead Funnel Flow',
        triggerKeyword: activeTab === 'followup' ? 'lead_inbound' : 'start',
        actionType: 'buttons',
        actionPayload: {
          blocks: workflowBlocks,
          followUpSteps,
          chatbotNodes,
          funnelStages,
        },
      };

      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setSavedFlows((prev) => [created, ...prev]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save automation:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a block to Visual Workflow
  const handleAddBlock = (type: BlockType) => {
    const newId = `block_${Date.now()}`;
    const titles: Record<BlockType, string> = {
      trigger: 'New Trigger',
      message: 'Send WhatsApp Message',
      image: 'Send Image & Caption',
      template: 'Send Meta Template',
      wait: 'Wait Duration',
      condition: 'Check Condition',
      tag: 'Add Customer Tag',
      end: 'End Automation',
    };

    const newBlock: WorkflowBlock = {
      id: newId,
      type,
      title: titles[type],
      description: `Automated action for ${type}`,
      config: {
        text: type === 'message' ? 'Hello! Here is an update.' : undefined,
        waitDuration: type === 'wait' ? 1 : undefined,
        waitUnit: type === 'wait' ? 'hours' : undefined,
        tagName: type === 'tag' ? 'interested' : undefined,
      },
    };

    setWorkflowBlocks((prev) => [...prev.slice(0, -1), newBlock, prev[prev.length - 1]]);
    setSelectedBlockId(newId);
  };

  // Delete a block
  const handleDeleteBlock = (id: string) => {
    if (workflowBlocks.length <= 2) return;
    setWorkflowBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(workflowBlocks[0]?.id || '');
    }
  };

  // Add Follow-Up Step
  const handleAddFollowUpStep = () => {
    const nextStepNum = followUpSteps.length + 1;
    const isWait = followUpSteps[followUpSteps.length - 1]?.type === 'message';

    const newStep: FollowUpStep = isWait
      ? {
          id: `fu_${Date.now()}`,
          stepNumber: nextStepNum,
          type: 'wait',
          title: `Step ${nextStepNum}: Wait 3 Hours`,
          delayAmount: 3,
          delayUnit: 'hours',
        }
      : {
          id: `fu_${Date.now()}`,
          stepNumber: nextStepNum,
          type: 'message',
          title: `Step ${nextStepNum}: Follow-Up Message`,
          messageText: 'Just checking back! Would you like me to reserve your selection?',
        };

    setFollowUpSteps((prev) => [...prev, newStep]);
  };

  // Delete Follow-Up Step
  const handleDeleteFollowUp = (id: string) => {
    setFollowUpSteps((prev) => prev.filter((s) => s.id !== id));
  };

  // Reorder Follow-Up Steps
  const handleMoveFollowUp = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === followUpSteps.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...followUpSteps];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setFollowUpSteps(copy);
  };

  // Quick 1-Click Starter Template
  const handleApplyTemplate = (templateType: 'ecommerce' | 'leads' | 'appointment') => {
    if (templateType === 'ecommerce') {
      setFollowUpSteps([
        { id: 'f1', stepNumber: 1, type: 'message', title: 'Step 1: Abandoned Cart Alert', messageText: 'Hi {{name}}! You left items in your cart. Complete now for 10% off with code CART10.' },
        { id: 'f2', stepNumber: 2, type: 'wait', title: 'Step 2: Wait 1 Hour', delayAmount: 1, delayUnit: 'hours' },
        { id: 'f3', stepNumber: 3, type: 'message', title: 'Step 3: Low Stock Alert', messageText: 'Hurry! Items in your cart are low in stock. Tap below to finish order.' },
        { id: 'f4', stepNumber: 4, type: 'wait', title: 'Step 4: Wait 4 Hours', delayAmount: 4, delayUnit: 'hours' },
        { id: 'f5', stepNumber: 5, type: 'message', title: 'Step 5: Final Call Reminder', messageText: 'Your 10% cart discount expires in 1 hour. Do you need help checking out?' },
      ]);
    } else if (templateType === 'leads') {
      setFollowUpSteps([
        { id: 'l1', stepNumber: 1, type: 'message', title: 'Step 1: Instant Lead Welcome', messageText: 'Thank you for your interest! Here is our complete brochure.' },
        { id: 'l2', stepNumber: 2, type: 'wait', title: 'Step 2: Wait 30 Minutes', delayAmount: 30, delayUnit: 'minutes' },
        { id: 'l3', stepNumber: 3, type: 'message', title: 'Step 3: Schedule Consultation', messageText: 'Would you like to speak with our product expert today?' },
        { id: 'l4', stepNumber: 4, type: 'wait', title: 'Step 4: Wait 1 Day', delayAmount: 1, delayUnit: 'days' },
        { id: 'l5', stepNumber: 5, type: 'message', title: 'Step 5: Follow-Up Nudge', messageText: 'We have 2 consultation spots open this week. Would 3 PM work for you?' },
      ]);
    }
  };

  const selectedBlock = workflowBlocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Automations & Flows"
          subtitle="Build visual WhatsApp automations, follow-ups, chatbots, and lead funnels in minutes"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar: Tabs + Save Action */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* 5 Visual Builder Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('automation')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px]',
                  activeTab === 'automation'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                )}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Visual Flow</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('followup')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px]',
                  activeTab === 'followup'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                )}
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Follow-Up Sequence</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chatbot')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px]',
                  activeTab === 'chatbot'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                )}
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chatbot Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('buttonflow')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px]',
                  activeTab === 'buttonflow'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                )}
              >
                <Split className="w-3.5 h-3.5 text-purple-400" />
                <span>Button Flows</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('leadfunnel')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px]',
                  activeTab === 'leadfunnel'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>Lead Journey</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSaveAutomation}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer min-h-[40px]"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isSaving ? 'Saving...' : 'Save & Activate'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* TAB 1: MODULE 1 - VISUAL AUTOMATION BUILDER                     */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'automation' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Flowchart Canvas */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                      <span>Visual Automation Steps</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                        {workflowBlocks.length} Blocks
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Sequential workflow executed when a new lead arrives
                    </p>
                  </div>

                  {/* Add Block Dropdown */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('wait')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Wait</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('message')}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Message</span>
                    </button>
                  </div>
                </div>

                {/* Vertical Block Flow */}
                <div className="space-y-3 pt-2">
                  {workflowBlocks.map((block, idx) => {
                    const isSelected = selectedBlockId === block.id;

                    return (
                      <React.Fragment key={block.id}>
                        {/* Step Card */}
                        <div
                          onClick={() => setSelectedBlockId(block.id)}
                          className={cn(
                            'p-4 rounded-xl border transition-all cursor-pointer relative group flex items-start gap-3.5',
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                          )}
                        >
                          {/* Step Icon Badge */}
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                              block.type === 'trigger' && 'bg-amber-100 text-amber-700',
                              block.type === 'message' && 'bg-emerald-100 text-emerald-700',
                              block.type === 'image' && 'bg-purple-100 text-purple-700',
                              block.type === 'wait' && 'bg-blue-100 text-blue-700',
                              block.type === 'end' && 'bg-slate-200 text-slate-700'
                            )}
                          >
                            {block.type === 'trigger' && '⚡'}
                            {block.type === 'message' && '💬'}
                            {block.type === 'image' && '🖼️'}
                            {block.type === 'wait' && '⏱️'}
                            {block.type === 'end' && '🏁'}
                          </div>

                          {/* Block Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {block.title}
                              </span>
                              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                                {block.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {block.config.text || block.description}
                            </p>

                            {block.config.waitDuration && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Wait {block.config.waitDuration} {block.config.waitUnit}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Delete action */}
                          {block.type !== 'trigger' && block.type !== 'end' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(block.id);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Connector Arrow */}
                        {idx < workflowBlocks.length - 1 && (
                          <div className="flex justify-center py-0.5">
                            <div className="w-0.5 h-4 bg-slate-200 flex items-center justify-center">
                              <ArrowDown className="w-3 h-3 text-slate-400" />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Step Editor & Settings Panel */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Block Settings</span>
                  </h3>

                  {selectedBlock ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Step Title
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWorkflowBlocks((prev) =>
                              prev.map((b) => (b.id === selectedBlock.id ? { ...b, title: val } : b))
                            );
                          }}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {selectedBlock.type === 'wait' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">
                              Wait Duration
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={selectedBlock.config.waitDuration || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setWorkflowBlocks((prev) =>
                                  prev.map((b) =>
                                    b.id === selectedBlock.id
                                      ? { ...b, config: { ...b.config, waitDuration: val } }
                                      : b
                                  )
                                );
                              }}
                              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">
                              Time Unit
                            </label>
                            <select
                              value={selectedBlock.config.waitUnit || 'hours'}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setWorkflowBlocks((prev) =>
                                  prev.map((b) =>
                                    b.id === selectedBlock.id
                                      ? { ...b, config: { ...b.config, waitUnit: val } }
                                      : b
                                  )
                                );
                              }}
                              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="minutes">Minutes</option>
                              <option value="hours">Hours</option>
                              <option value="days">Days</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {(selectedBlock.type === 'message' || selectedBlock.type === 'image') && (
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            WhatsApp Message Text
                          </label>
                          <textarea
                            rows={4}
                            value={selectedBlock.config.text || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkflowBlocks((prev) =>
                                prev.map((b) =>
                                  b.id === selectedBlock.id
                                    ? { ...b, config: { ...b.config, text: val } }
                                    : b
                                )
                              );
                            }}
                            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            placeholder="Type the message sent to the customer..."
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Use variables like &#123;&#123;first_name&#125;&#125; for automatic personalization.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Select any block from the canvas to edit.</p>
                  )}
                </div>

                {/* 1-Click Starter Templates */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">1-Click Starter Templates</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('ecommerce')}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900">🛍️ E-Commerce Abandoned Cart</div>
                      <div className="text-[11px] text-slate-500">10m, 1h, 4h reminder sequences with coupon</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('leads')}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900">🎯 Meta Ads Lead Nurture</div>
                      <div className="text-[11px] text-slate-500">Instant welcome + 3-day appointment follow-up</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 2: MODULE 2 - DEDICATED FOLLOW-UP BUILDER                   */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'followup' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                      <span>Automated Follow-Up Sequence</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                        Auto-Cancels on Reply
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Messages scheduled in advance. When the customer replies, all remaining follow-ups cancel instantly.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFollowUpStep}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Follow-Up Step</span>
                  </button>
                </div>

                {/* Timeline Preview List */}
                <div className="space-y-4 pt-6">
                  {followUpSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            step.type === 'message'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {idx + 1}
                        </div>

                        <div className="flex-1 sm:flex-initial">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{step.title}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {step.type}
                            </span>
                          </div>

                          {step.type === 'message' ? (
                            <p className="text-xs text-slate-600 mt-1 max-w-xl">
                              "{step.messageText}"
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">Wait:</span>
                              <input
                                type="number"
                                min="1"
                                value={step.delayAmount || 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  setFollowUpSteps((prev) =>
                                    prev.map((s) => (s.id === step.id ? { ...s, delayAmount: val } : s))
                                  );
                                }}
                                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
                              />
                              <select
                                value={step.delayUnit || 'hours'}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setFollowUpSteps((prev) =>
                                    prev.map((s) => (s.id === step.id ? { ...s, delayUnit: val } : s))
                                  );
                                }}
                                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reorder and Delete controls */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleMoveFollowUp(idx, 'up')}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] text-slate-700 cursor-pointer"
                        >
                          ↑ Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFollowUp(idx, 'down')}
                          disabled={idx === followUpSteps.length - 1}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] text-slate-700 cursor-pointer"
                        >
                          ↓ Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFollowUp(step.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 3 & 4: MODULE 3 & 4 - CHATBOT & BUTTON FLOWS                 */}
          {/* ---------------------------------------------------------------- */}
          {(activeTab === 'chatbot' || activeTab === 'buttonflow') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <span>
                      {activeTab === 'chatbot' ? 'Interactive Chatbot Flow' : 'Button-Based Decision Tree'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ask customers questions and provide 1-tap buttons for instant replies. No coding needed.
                  </p>
                </div>

                {/* Question Node Card */}
                <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      1. Message Sent to Customer
                    </label>
                    <textarea
                      rows={3}
                      value={chatbotNodes[0].prompt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatbotNodes((prev) => [{ ...prev[0], prompt: val }]);
                      }}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Buttons Branching List */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-800 block">
                      2. Customer Quick Reply Buttons (Branches)
                    </label>

                    {chatbotNodes[0].options.map((opt, optIdx) => (
                      <div
                        key={opt.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Button {optIdx + 1}: [{opt.label}]
                          </span>
                          <span className="text-[11px] text-slate-400">If Customer Taps This</span>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">
                            Automatic Reply Message:
                          </label>
                          <input
                            type="text"
                            value={opt.replyText}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updatedOptions = [...chatbotNodes[0].options];
                              updatedOptions[optIdx].replyText = val;
                              setChatbotNodes((prev) => [{ ...prev[0], options: updatedOptions }]);
                            }}
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Phone Simulation */}
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Interactive Customer Preview</span>
                </div>
                <PhoneMockup
                  businessName="Your Business"
                  bodyText={chatbotNodes[0].prompt}
                  buttons={chatbotNodes[0].options.map((o) => ({ id: o.id, title: o.label }))}
                  className="scale-95 origin-top"
                />
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 5: MODULE 5 - VISUAL LEAD FUNNEL JOURNEY                     */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'leadfunnel' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Visual Lead Funnel Journey</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full end-to-end customer progression from Meta Ad click to Priority Lead
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Overall Conversion:</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                    29.6% Closed
                  </span>
                </div>
              </div>

              {/* Visual Funnel Stages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funnelStages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500/60 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{stage.icon}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {stage.conversionRate}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{stage.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {stage.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Leads:</span>
                      <span className="font-bold text-slate-800">{stage.leadsCount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Automatic Intent Escalation:</strong> When any customer asks for price, shipping, or types "interested", they are automatically promoted to <strong>Priority Leads</strong> and highlighted in your CRM inbox.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
