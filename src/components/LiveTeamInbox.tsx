'use client';

import React, { useState } from 'react';
import {
  Inbox,
  Search,
  CheckCheck,
  Send,
  MoreVertical,
  Phone,
  Tag,
  Sparkles,
  Paperclip,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  StickyNote,
  ShoppingBag,
  Zap,
  Lock,
  ChevronDown,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PassionFruitLogo from './PassionFruitLogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'note';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  buttons?: string[];
  isInternalNote?: boolean;
  authorName?: string;
  productCard?: {
    name: string;
    price: string;
    image: string;
    sku: string;
  };
}

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: number;
  tags: string[];
  status: 'active' | 'pending' | 'resolved';
  assignedAgent: string;
  adSource?: string;
}

export function LiveTeamInbox() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0] || {
    id: '',
    name: 'No Active Contact',
    phone: '',
    lastMessage: '',
    time: '',
    unread: 0,
    tags: [],
    status: 'pending' as const,
    assignedAgent: 'Unassigned',
  };
  const activeMessages = activeContactId ? (chatHistory[activeContactId] || []) : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (isNoteMode) {
      // Add Private Internal Team Note (Wati Internal Note Feature)
      const newNote: ChatMessage = {
        id: `note_${Date.now()}`,
        sender: 'note',
        text: messageInput,
        time: 'Just now',
        isInternalNote: true,
        authorName: 'You (Agent)',
      };
      setChatHistory((prev) => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), newNote],
      }));
      setIsNoteMode(false);
    } else {
      // Outbound WhatsApp Message
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'agent',
        text: messageInput,
        time: 'Just now',
        status: 'delivered',
      };

      setChatHistory((prev) => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), newMsg],
      }));
    }

    setMessageInput('');
  };

  // Wati AI Copilot Summarize Action
  const handleGenerateAiSummary = () => {
    setAiSummary(
      `📌 Summary for ${activeContact.name}:\n• Source: ${activeContact.adSource || 'Direct Chat'}\n• Intent: Inquired about confidential catalog specs after responding 'Show me'.\n• Recommended Next Action: Send official PDF brochure and quote VIP pricing tier.`
    );
  };

  // Wati AI Copilot Suggest Reply Action
  const handleApplyAiSuggestion = () => {
    setMessageInput(
      `Hello ${activeContact.name.split(' ')[0]}! I would be delighted to share the exclusive specs and pricing with you directly. Would you like me to send our confidential PDF brochure right here on WhatsApp?`
    );
  };

  // Wati Canned Quick Reply
  const applyCannedReply = (text: string) => {
    setMessageInput(text);
  };

  // Send WhatsApp Catalog Product Card
  const handleSendCatalogProduct = () => {
    const productMsg: ChatMessage = {
      id: `prod_${Date.now()}`,
      sender: 'agent',
      text: 'Here is the featured catalog item you requested from our Private Collection:',
      time: 'Just now',
      status: 'delivered',
      productCard: {
        name: 'The Obsidian Grand Complication',
        price: '$124,000 USD',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80',
        sku: 'PF-LUX-001',
      },
    };
    setChatHistory((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), productMsg],
    }));
    setShowCatalogModal(false);
  };

  const sendQuickButtonReply = (title: string) => {
    const userReply: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: title,
      time: 'Just now',
      status: 'delivered',
    };

    setChatHistory((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), userReply],
    }));
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-zap-md overflow-hidden flex flex-col h-[700px]">
      {/* Top Banner with Passion Fruit & Wati AI indicators */}
      <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#222222]">Passion Fruit Shared Team Inbox</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 font-bold border border-fuchsia-200">
                Wati AI Copilot
              </span>
            </div>
            <p className="text-xs text-[#777777]">Multi-agent WhatsApp conversation console & CRM</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Meta Webhook Live (v18.0)
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 1. Contacts List (Left Column) */}
        <div className="w-72 border-r border-[#E5E7EB] flex flex-col bg-white">
          <div className="p-3 border-b border-[#E5E7EB]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chats by name or tag..."
                className="w-full bg-slate-50 border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => {
                  setActiveContactId(contact.id);
                  setAiSummary(null);
                }}
                className={cn(
                  'p-3.5 cursor-pointer transition-colors flex items-start justify-between gap-2',
                  activeContactId === contact.id
                    ? 'bg-blue-50/70 border-l-4 border-[#0066FF]'
                    : 'hover:bg-slate-50'
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#222222] truncate">{contact.name}</span>
                    {contact.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#0066FF] text-white text-[10px] font-bold flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#777777] truncate mt-0.5">{contact.lastMessage}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                      {contact.assignedAgent.split(' ')[0]}
                    </span>
                    {contact.adSource && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-mono">
                        CTWA
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">{contact.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Chat Pane (Center Column) */}
        <div className="flex-1 flex flex-col bg-[#F9FAFB]">
          {/* Chat Header with Agent Assignment & Wati Actions */}
          <div className="p-3 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[#222222] font-semibold text-xs">
                {activeContact.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                  {activeContact.name}
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    Assigned: <b>{activeContact.assignedAgent}</b>
                  </span>
                </h4>
                <p className="text-[10px] text-[#777777] font-mono">{activeContact.phone}</p>
              </div>
            </div>

            {/* Wati AI Copilot Action Bar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleGenerateAiSummary}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 border border-fuchsia-200/70 flex items-center gap-1 transition-colors"
                title="Wati AI Summary"
              >
                <Sparkles className="w-3 h-3 text-fuchsia-600 fill-current" />
                <span>AI Summary</span>
              </button>

              <button
                onClick={handleApplyAiSuggestion}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-[#0066FF] hover:bg-blue-100 border border-blue-200/70 flex items-center gap-1 transition-colors"
                title="AI Suggested Reply"
              >
                <Bot className="w-3 h-3" />
                <span>Suggest Reply</span>
              </button>

              <button
                onClick={() => setShowCatalogModal(true)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1 transition-colors"
                title="Send WhatsApp Catalog Product"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Catalog</span>
              </button>
            </div>
          </div>

          {/* AI Summary Notification Callout (Wati AI Feature) */}
          {aiSummary && (
            <div className="m-3 p-3 rounded-xl bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-200/80 shadow-sm relative">
              <button
                onClick={() => setAiSummary(null)}
                className="absolute top-2 right-2 text-xs text-fuchsia-400 hover:text-fuchsia-700 font-bold"
              >
                ✕
              </button>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-fuchsia-950 whitespace-pre-line leading-relaxed font-medium">
                  {aiSummary}
                </div>
              </div>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {activeMessages.map((msg) => {
              if (msg.isInternalNote) {
                // Wati Internal Private Team Note
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-[85%] rounded-xl p-3 bg-amber-50 border border-amber-200/80 text-amber-900 shadow-sm text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                        <Lock className="w-3 h-3" />
                        <span>Internal Team Note (Private — Not Sent to WhatsApp)</span>
                        <span className="font-normal text-[10px] text-amber-700 ml-auto">
                          {msg.authorName} • {msg.time}
                        </span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col', msg.sender === 'agent' ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm',
                      msg.sender === 'agent'
                        ? 'bg-[#0066FF] text-white rounded-tr-none'
                        : 'bg-white border border-[#E5E7EB] text-[#222222] rounded-tl-none'
                    )}
                  >
                    <p>{msg.text}</p>

                    {/* WhatsApp Product Card (Wati Commerce Feature) */}
                    {msg.productCard && (
                      <div className="mt-2.5 p-2 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-sm overflow-hidden">
                        <div className="h-24 w-full bg-slate-100 rounded-lg overflow-hidden mb-2 relative">
                          <img
                            src={msg.productCard.image}
                            alt={msg.productCard.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 text-white font-bold text-[10px]">
                            {msg.productCard.price}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs">{msg.productCard.name}</h5>
                        <p className="text-[10px] text-zinc-500 font-mono">SKU: {msg.productCard.sku}</p>
                        <button className="w-full mt-2 py-1 bg-[#0066FF] text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          View on WhatsApp Catalog
                        </button>
                      </div>
                    )}

                    <div
                      className={cn(
                        'flex items-center justify-end gap-1 text-[9px] mt-1',
                        msg.sender === 'agent' ? 'text-blue-100' : 'text-zinc-400'
                      )}
                    >
                      <span>{msg.time}</span>
                      {msg.sender === 'agent' && <CheckCheck className="w-3 h-3 text-cyan-200" />}
                    </div>
                  </div>

                  {/* Interactive Quick Reply Buttons */}
                  {msg.buttons && (
                    <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
                      {msg.buttons.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuickButtonReply(btn)}
                          className="px-3 py-1 rounded-lg bg-white border border-[#0066FF]/30 text-[#0066FF] hover:bg-blue-50 text-xs font-medium shadow-sm transition-colors"
                        >
                          [{btn}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Canned Replies Shortcuts (Wati Quick Replies) */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-t border-[#E5E7EB] flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-current" />
              Quick:
            </span>
            <button
              onClick={() => applyCannedReply('Thank you for reaching out! How can I assist you today?')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 font-medium whitespace-nowrap"
            >
              /greeting
            </button>
            <button
              onClick={() => applyCannedReply('Our VIP Collection starts from $25,000 with private preview access.')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 font-medium whitespace-nowrap"
            >
              /pricing
            </button>
            <button
              onClick={() => applyCannedReply('A dedicated agent will connect with you in 5 minutes.')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 font-medium whitespace-nowrap"
            >
              /human-agent
            </button>
          </div>

          {/* Message Input Box & Internal Note Switcher */}
          <form
            onSubmit={handleSendMessage}
            className={cn(
              'p-3 border-t transition-colors flex items-center gap-2',
              isNoteMode ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-[#E5E7EB]'
            )}
          >
            {/* Toggle Private Team Note */}
            <button
              type="button"
              onClick={() => setIsNoteMode(!isNoteMode)}
              className={cn(
                'p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all',
                isNoteMode
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              title="Toggle Internal Private Team Note"
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">{isNoteMode ? 'Private Note' : 'Note'}</span>
            </button>

            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                isNoteMode
                  ? 'Write private note for your team (customer will NOT see this)...'
                  : 'Type official WhatsApp reply or select quick action...'
              }
              className={cn(
                'flex-1 border rounded-xl px-4 py-2 text-xs focus:outline-none',
                isNoteMode
                  ? 'bg-white border-amber-300 text-amber-950 focus:border-amber-500'
                  : 'bg-slate-50 border-[#E5E7EB] text-[#222222] focus:border-[#0066FF]'
              )}
            />

            <button
              type="submit"
              className={cn(
                'p-2.5 rounded-xl text-white font-bold transition-transform active:scale-95',
                isNoteMode ? 'bg-amber-600 hover:bg-amber-700' : 'gradient-button'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 3. Customer CRM Profile & Ad Attribution (Right Column) */}
        <div className="w-68 border-l border-[#E5E7EB] p-4 bg-white hidden lg:flex flex-col gap-4 text-xs overflow-y-auto">
          <div className="text-center space-y-1 pb-3 border-b border-[#E5E7EB]">
            <div className="w-12 h-12 rounded-full bg-fuchsia-50 text-fuchsia-600 font-bold text-sm mx-auto flex items-center justify-center border border-fuchsia-200">
              {activeContact.name.slice(0, 2).toUpperCase()}
            </div>
            <h4 className="font-bold text-[#222222] text-sm">{activeContact.name}</h4>
            <p className="text-[11px] text-[#777777] font-mono">{activeContact.phone}</p>
          </div>

          {/* Wati CTWA Meta Ad Attribution */}
          {activeContact.adSource && (
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-50 to-pink-50 border border-purple-200/70 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-600" />
                CTWA Meta Ad Lead
              </span>
              <p className="text-[11px] font-semibold text-purple-950">{activeContact.adSource}</p>
            </div>
          )}

          {/* Assigned Agent Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
              Assigned Agent
            </span>
            <select
              value={activeContact.assignedAgent}
              onChange={(e) => {
                const newAgent = e.target.value;
                setContacts((prev) =>
                  prev.map((c) => (c.id === activeContact.id ? { ...c, assignedAgent: newAgent } : c))
                );
              }}
              className="w-full bg-slate-50 border border-[#E5E7EB] rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0066FF]"
            >
              <option value="Agent 1">Agent 1 (Lead Agent)</option>
              <option value="Agent 2">Agent 2 (Support)</option>
              <option value="Passion Fruit AI Bot">Passion Fruit AI Bot</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* Assigned Tags */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
              Audience Tags
            </span>
            <div className="flex flex-wrap gap-1">
              {activeContact.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] font-mono text-[10px] border border-blue-100"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Opt-In Verification */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
              Opt-In Verification
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Opted-In</span>
            </div>
          </div>

          {/* Meta API Stats */}
          <div className="space-y-1 text-zinc-500 pt-2 border-t border-[#E5E7EB]">
            <p className="text-[10px]">Direct Meta Graph API: v18.0</p>
            <p className="text-[10px]">Wati Flow Engine: Active</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Catalog Item Modal (Wati Commerce Feature) */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0066FF]" />
                Send WhatsApp Catalog Item
              </h4>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
              <div className="h-32 bg-slate-100 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80"
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>
              <h5 className="font-bold text-xs text-slate-900">The Obsidian Grand Complication</h5>
              <p className="text-xs text-zinc-500">Luxury Titanium & Sapphire automatic timepiece.</p>
              <div className="flex items-center justify-between font-bold text-xs text-emerald-600">
                <span>$124,000 USD</span>
                <span className="text-[10px] text-zinc-400 font-mono">SKU: PF-LUX-001</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCatalogProduct}
                className="flex-1 py-2 rounded-xl gradient-button text-xs font-semibold text-white"
              >
                Send to Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
