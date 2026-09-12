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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  buttons?: string[];
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
}

export function LiveTeamInbox() {
  const [contacts, setContacts] = useState<ChatContact[]>([
    {
      id: 'c1',
      name: 'Julian Vance',
      phone: '+971 50 123 4567',
      lastMessage: 'Show me',
      time: '2m ago',
      unread: 1,
      tags: ['vip', 'teaser_list', 'private-aviation'],
      status: 'active',
    },
    {
      id: 'c2',
      name: 'Lady Eleanor Sterling',
      phone: '+44 7700 900123',
      lastMessage: 'Something big is coming soon...',
      time: '25m ago',
      unread: 0,
      tags: ['vip', 'teaser_list', 'haute-horlogerie'],
      status: 'pending',
    },
    {
      id: 'c3',
      name: 'Marcus Castile',
      phone: '+1 415 555 2671',
      lastMessage: 'Can I see the specifications?',
      time: '1h ago',
      unread: 0,
      tags: ['vip', 'luxury-villas'],
      status: 'resolved',
    },
  ]);

  const [activeContactId, setActiveContactId] = useState<string>('c1');
  const [messageInput, setMessageInput] = useState('');

  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({
    c1: [
      {
        id: 'm1',
        sender: 'agent',
        text: 'Something big is coming soon. Are you ready?',
        time: '12:00 PM',
        status: 'delivered',
      },
      {
        id: 'm2',
        sender: 'user',
        text: 'Show me',
        time: '12:02 PM',
        status: 'read',
      },
      {
        id: 'm3',
        sender: 'agent',
        text: 'Discover our confidential collection. Select an option below:',
        time: '12:02 PM',
        status: 'delivered',
        buttons: ['Product Specs', 'Pricing', 'Talk to Agent'],
      },
    ],
    c2: [
      {
        id: 'm4',
        sender: 'agent',
        text: 'Something big is coming soon. Are you ready?',
        time: '11:40 AM',
        status: 'delivered',
      },
    ],
    c3: [
      {
        id: 'm5',
        sender: 'user',
        text: 'Can I see the specifications?',
        time: '10:30 AM',
        status: 'read',
      },
    ],
  });

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];
  const activeMessages = chatHistory[activeContactId] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

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

    setMessageInput('');
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
    <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-zap-md overflow-hidden flex flex-col h-[650px]">
      {/* Top Banner */}
      <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] flex items-center justify-center text-white">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#222222]">ZapElite Live Team Inbox</h3>
            <p className="text-xs text-[#777777]">Multi-agent WhatsApp conversation console & CRM</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Meta Live Webhook Connected
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 1. Contacts List (Left Column) */}
        <div className="w-72 border-r border-[#E5E7EB] flex flex-col bg-white">
          <div className="p-3 border-b border-[#E5E7EB]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-slate-50 border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setActiveContactId(contact.id)}
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
                  <div className="flex gap-1 mt-1.5">
                    {contact.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">{contact.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Chat Pane (Center Column) */}
        <div className="flex-1 flex flex-col bg-[#F9FAFB]">
          {/* Chat Header */}
          <div className="p-3.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[#222222] font-semibold text-xs">
                {activeContact.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#222222]">{activeContact.name}</h4>
                <p className="text-[10px] text-[#777777] font-mono">{activeContact.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Phone className="w-4 h-4 hover:text-[#222222] cursor-pointer" />
              <MoreVertical className="w-4 h-4 hover:text-[#222222] cursor-pointer" />
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {activeMessages.map((msg) => (
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

                {/* Interactive Buttons (Zapelite quick replies) */}
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
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#E5E7EB] flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type official WhatsApp reply or select template..."
              className="flex-1 bg-slate-50 border border-[#E5E7EB] rounded-xl px-4 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
            />
            <button
              type="submit"
              className="gradient-button p-2.5 rounded-xl text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 3. Customer CRM Profile (Right Column) */}
        <div className="w-64 border-l border-[#E5E7EB] p-4 bg-white hidden lg:flex flex-col gap-4 text-xs">
          <div className="text-center space-y-1 pb-3 border-b border-[#E5E7EB]">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0066FF] font-bold text-sm mx-auto flex items-center justify-center">
              {activeContact.name.slice(0, 2).toUpperCase()}
            </div>
            <h4 className="font-bold text-[#222222] text-sm">{activeContact.name}</h4>
            <p className="text-[11px] text-[#777777] font-mono">{activeContact.phone}</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
              Assigned Tags
            </span>
            <div className="flex flex-wrap gap-1">
              {activeContact.tags.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] font-mono text-[10px] border border-blue-100">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
              Opt-In Verification
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Opted-In</span>
            </div>
          </div>

          <div className="space-y-1 text-zinc-500 pt-2 border-t border-[#E5E7EB]">
            <p className="text-[10px]">Direct Meta Graph API Route: v18.0</p>
            <p className="text-[10px]">Hostinger Rate Limiter: 50ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
