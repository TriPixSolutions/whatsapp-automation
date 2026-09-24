'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Search,
  Send,
  Phone,
  User,
  Check,
  CheckCheck,
  AlertCircle,
  MessageSquare,
  Bot,
  Sparkles,
  Tag,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationItem {
  phoneNumber: string;
  contactName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: string;
}

interface MessageItem {
  id: string;
  metaMessageId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  type: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  content: string;
  payload?: any;
  createdAt: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePhone, setActivePhone] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newChatModal, setNewChatModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);

        // Select first conversation if none selected
        if (!activePhone && convs.length > 0) {
          setActivePhone(convs[0].phoneNumber);
        }
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // 2. Fetch messages for active conversation
  const fetchActiveMessages = async (phone: string, silent = false) => {
    if (!phone) return;
    try {
      const res = await fetch(`/api/messages?phoneNumber=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.warn('Failed to load messages for conversation:', e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // When active conversation changes, fetch its messages
  useEffect(() => {
    if (activePhone) {
      fetchActiveMessages(activePhone);
    }
  }, [activePhone]);

  // Real-time background polling every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (activePhone) {
        fetchActiveMessages(activePhone, true);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activePhone]);

  // Scroll to bottom on messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activePhone || isSending) return;

    const messageText = inputMessage.trim();
    setIsSending(true);

    // Optimistic UI append
    const tempMessage: MessageItem = {
      id: `temp_${Date.now()}`,
      phoneNumber: activePhone,
      direction: 'outbound',
      type: 'text',
      status: 'pending',
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage('');

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: activePhone,
          text: messageText,
          type: 'text',
        }),
      });

      if (res.ok) {
        fetchActiveMessages(activePhone, true);
        fetchConversations(true);
      } else {
        const err = await res.json();
        alert(`Error sending message: ${err.error || 'Meta API returned an error'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Start New Chat
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    const clean = newPhone.trim();
    // Add contact
    await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: clean,
        firstName: newName.trim() || 'Customer',
      }),
    });

    setActivePhone(clean);
    setNewChatModal(false);
    setNewPhone('');
    setNewName('');
    fetchConversations();
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery)
  );

  const activeConv = conversations.find((c) => c.phoneNumber === activePhone);

  return (
    <div className="min-h-screen bg-[#F4F6FB] pl-0 md:pl-60 pb-20 md:pb-0 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Live Shared Team Inbox"
        subtitle="Real-time two-way WhatsApp customer messaging & automated flow replies"
      />

      <main className="p-3 sm:p-6 flex-1 flex flex-col h-[calc(100vh-80px)]">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex-1 flex overflow-hidden">
          {/* 1. LEFT PANE: CONVERSATION DIRECTORY */}
          <div className="w-80 border-r border-[#E2E8F0] flex flex-col bg-white">
            {/* Top Bar with Search & New Chat */}
            <div className="p-4 border-b border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#0D0F2D]">Conversations</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED]">
                    {conversations.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchConversations()}
                    title="Refresh inbox"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                  </button>
                  <button
                    onClick={() => setNewChatModal(true)}
                    title="Start new chat"
                    className="p-1.5 rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-purple-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0D0F2D] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-[#0D0F2D]">No chats in inbox</p>
                  <p className="text-[11px] text-[#64748B]">
                    New WhatsApp messages and webhook incoming chats will appear here live.
                  </p>
                  <button
                    onClick={() => setNewChatModal(true)}
                    className="mt-2 text-xs font-bold text-[#7C3AED] hover:underline"
                  >
                    + Start New Chat
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.phoneNumber === activePhone;
                  return (
                    <div
                      key={conv.phoneNumber}
                      onClick={() => setActivePhone(conv.phoneNumber)}
                      className={cn(
                        'p-4 cursor-pointer transition-all flex items-start gap-3 border-l-4',
                        isSelected
                          ? 'bg-purple-50/60 border-[#7C3AED]'
                          : 'border-transparent hover:bg-[#F4F6FB]'
                      )}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-[#0D0F2D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {conv.contactName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#0D0F2D] truncate">
                            {conv.contactName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                            {new Date(conv.lastTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {conv.lastMessage}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {conv.phoneNumber}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#7C3AED] mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. CENTER PANE: ACTIVE CHAT THREAD */}
          {activePhone ? (
            <div className="flex-1 flex flex-col bg-[#F9FAFB]">
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white flex items-center justify-center font-bold text-xs">
                    {(activeConv?.contactName || activePhone).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0D0F2D] flex items-center gap-2">
                      <span>{activeConv?.contactName || activePhone}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Opted In
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#64748B] font-mono">{activePhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Meta Cloud API v18.0 Connected
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-bold text-[#0D0F2D]">No messages exchanged yet</p>
                    <p className="text-[11px] text-[#64748B] max-w-xs">
                      Send a message below to start a direct WhatsApp conversation with this customer.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col', isOutbound ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-sm space-y-1',
                            isOutbound
                              ? 'bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white rounded-br-none'
                              : 'bg-white text-[#0D0F2D] border border-[#E2E8F0] rounded-bl-none'
                          )}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                          {/* Render interactive payload details if present */}
                          {msg.payload?.buttons && (
                            <div className="pt-2 flex flex-wrap gap-1.5 border-t border-white/20">
                              {msg.payload.buttons.map((b: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px] font-bold"
                                >
                                  [{b.title}]
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.payload?.interaction && (
                            <div className="pt-1.5 text-[10px] opacity-80 flex items-center gap-1 font-mono">
                              <span>User clicked:</span>
                              <strong className="underline">{msg.payload.interaction.title}</strong>
                            </div>
                          )}

                          <div
                            className={cn(
                              'flex items-center justify-end gap-1.5 text-[9px] pt-1',
                              isOutbound ? 'text-white/80' : 'text-slate-400'
                            )}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOutbound && (
                              <span>
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 inline" />
                                ) : msg.status === 'failed' ? (
                                  <AlertCircle className="w-3 h-3 text-rose-300 inline" />
                                ) : (
                                  <Check className="w-3 h-3 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-4 bg-white border-t border-[#E2E8F0] space-y-2">
                {/* Canned Quick Shortcuts */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Quick:
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputMessage('Hello! How can our concierge team help you today?')}
                    className="px-2.5 py-1 rounded-lg bg-[#F4F6FB] hover:bg-purple-50 text-slate-700 hover:text-[#7C3AED] border border-[#E2E8F0] text-[11px] font-medium transition-colors flex-shrink-0"
                  >
                    /greeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMessage('Thank you for reaching out! Would you like to receive our exclusive lookbook?')}
                    className="px-2.5 py-1 rounded-lg bg-[#F4F6FB] hover:bg-purple-50 text-slate-700 hover:text-[#7C3AED] border border-[#E2E8F0] text-[11px] font-medium transition-colors flex-shrink-0"
                  >
                    /lookbook
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMessage('Your request has been routed to a specialist. We will contact you shortly.')}
                    className="px-2.5 py-1 rounded-lg bg-[#F4F6FB] hover:bg-purple-50 text-slate-700 hover:text-[#7C3AED] border border-[#E2E8F0] text-[11px] font-medium transition-colors flex-shrink-0"
                  >
                    /handoff
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a real-time WhatsApp message to customer..."
                    disabled={isSending}
                    className="flex-1 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#0D0F2D] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    className="gradient-button px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn hover:shadow-pf-hover transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-[#F9FAFB]">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-[#0D0F2D]">Select a conversation</h4>
                <p className="text-xs text-[#64748B]">
                  Choose an active customer from the left directory or start a new WhatsApp chat.
                </p>
              </div>
              <button
                onClick={() => setNewChatModal(true)}
                className="gradient-button text-xs px-4 py-2 rounded-xl font-bold text-white shadow-pf-btn flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Chat</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Start New Chat Modal */}
      {newChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 border border-[#E2E8F0] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0D0F2D] uppercase tracking-wider">
                Start WhatsApp Customer Chat
              </h3>
              <button
                onClick={() => setNewChatModal(false)}
                className="text-slate-400 hover:text-[#0D0F2D] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D0F2D]">
                  Customer Mobile Number (E.164 with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+14155552671 or +971501234567"
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] font-mono focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D0F2D]">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0D0F2D] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewChatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F4F6FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-button px-5 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-pf-btn"
                >
                  Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
