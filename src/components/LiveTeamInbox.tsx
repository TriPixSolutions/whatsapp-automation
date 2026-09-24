'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCheck,
  Send,
  Tag,
  Sparkles,
  Paperclip,
  Smile,
  CheckCircle2,
  Clock,
  User,
  StickyNote,
  ShoppingBag,
  Zap,
  Lock,
  Bot,
  AlertCircle,
  Phone,
  Plus,
  X,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  notes?: string;
}

export function LiveTeamInbox() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [isSending, setIsSending] = useState(false);
  const [windowNotice, setWindowNotice] = useState<string | null>(null);

  // Filters & State
  const [inboxTab, setInboxTab] = useState<'all' | 'unread' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableAgents] = useState(['Sarah Jenkins', 'Alex Chen', 'Priya Sharma', 'Unassigned']);
  
  // Tag & Note input states
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [contactNoteInput, setContactNoteInput] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Load contacts and messages from live database
  const loadLiveInbox = useCallback(async () => {
    try {
      const [contactsRes, msgRes] = await Promise.all([
        fetch('/api/contacts').catch(() => null),
        fetch('/api/messages').catch(() => null),
      ]);

      if (contactsRes?.ok) {
        const data = await contactsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ChatContact[] = data.map((c: any, index: number) => ({
            id: c.id || `contact_${index}`,
            name: `${c.first_name || c.firstName || ''} ${c.last_name || c.lastName || ''}`.trim() || c.phone_number || c.phoneNumber || 'WhatsApp User',
            phone: c.phone_number || c.phoneNumber || '',
            lastMessage: 'Active conversation',
            time: 'Just now',
            unread: index === 0 ? 1 : 0,
            tags: c.tags || ['Customer', 'VIP'],
            status: 'active' as const,
            assignedAgent: 'Sarah Jenkins',
            notes: 'Prefers evening WhatsApp notifications.',
          }));

          setContacts((prev) => {
            if (prev.length === 0) return mapped;
            // Preserve user modified tags/notes
            return mapped.map((m) => {
              const existing = prev.find((p) => p.id === m.id);
              return existing ? { ...m, tags: existing.tags, notes: existing.notes, assignedAgent: existing.assignedAgent, status: existing.status } : m;
            });
          });

          if (!activeContactId && mapped.length > 0) {
            setActiveContactId(mapped[0].id);
          }
        }
      }

      if (msgRes?.ok) {
        const msgData = await msgRes.json();
        if (Array.isArray(msgData.messages)) {
          const grouped: Record<string, ChatMessage[]> = {};
          for (const m of msgData.messages) {
            const phone = m.phoneNumber || m.phone_number;
            if (!grouped[phone]) grouped[phone] = [];
            grouped[phone].unshift({
              id: m.id || m.metaMessageId || `m_${Date.now()}_${Math.random()}`,
              sender: m.direction === 'inbound' ? 'user' : 'agent',
              text: m.content || '',
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM',
              status: m.status || 'delivered',
            });
          }

          setChatHistory((prev) => {
            const next = { ...prev };
            for (const [phone, msgs] of Object.entries(grouped)) {
              const match = contacts.find((c) => c.phone === phone);
              if (match) {
                next[match.id] = msgs;
              }
            }
            return next;
          });
        }
      }
    } catch (e) {
      console.warn('[Inbox Fetch Error]:', e);
    }
  }, [activeContactId, contacts]);

  useEffect(() => {
    loadLiveInbox();
    const interval = setInterval(loadLiveInbox, 8000);
    return () => clearInterval(interval);
  }, [loadLiveInbox]);

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0] || {
    id: 'placeholder_1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    lastMessage: 'Can you please share your pricing?',
    time: '12:45 PM',
    unread: 0,
    tags: ['Lead', 'Price Inquiry'],
    status: 'active' as const,
    assignedAgent: 'Sarah Jenkins',
    notes: 'Interested in the premium enterprise tier.',
  };

  const activeMessages = activeContactId ? (chatHistory[activeContactId] || [
    {
      id: 'default_1',
      sender: 'user',
      text: 'Hello! I saw your WhatsApp advertisement. Can you share the latest product catalogue and pricing?',
      time: '12:40 PM',
      status: 'delivered',
    },
    {
      id: 'default_2',
      sender: 'agent',
      text: 'Hi Rahul! Welcome to our store. We have sent our full catalogue to your number. Let us know if you have any questions!',
      time: '12:41 PM',
      status: 'read',
    },
  ]) : [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    if (isNoteMode) {
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
        [activeContactId]: [...(prev[activeContactId] || activeMessages), newNote],
      }));
      setIsNoteMode(false);
      setMessageInput('');
      return;
    }

    const currentText = messageInput;
    setMessageInput('');
    setIsSending(true);
    setWindowNotice(null);

    const tempId = `msg_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: 'agent',
      text: currentText,
      time: 'Just now',
      status: 'sent',
    };

    setChatHistory((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || activeMessages), optimisticMsg],
    }));

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: activeContact.phone,
          text: currentText,
          type: 'text',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.windowClosed || data.errorCode === 131047) {
          setWindowNotice(
            '⚠️ 24-Hour Policy Window Closed: Customer has not messaged in >24 hours. Send a Meta Template message instead.'
          );
        } else {
          setWindowNotice(`Send notice: ${data.error || 'Check Meta WhatsApp credentials'}`);
        }
      } else {
        setChatHistory((prev) => {
          const list = prev[activeContactId] || [];
          return {
            ...prev,
            [activeContactId]: list.map((m) => (m.id === tempId ? { ...m, status: 'delivered' } : m)),
          };
        });
      }
    } catch (err: any) {
      setWindowNotice(`Network error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c))
    );
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, tags: c.tags.filter((t) => t !== tagToRemove) } : c))
    );
  };

  const handleSaveContactNotes = () => {
    if (!contactNoteInput) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, notes: contactNoteInput } : c))
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-140px)] min-h-[600px] bg-slate-50 select-none">
      {/* 1. LEFT COLUMN: Conversation List */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-88 border-r border-slate-200/90 flex flex-col bg-white shrink-0',
          showMobileChat ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Search & Tabs */}
        <div className="p-3 border-b border-slate-200/80 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, name, phone..."
              className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
            {(['all', 'unread', 'open', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setInboxTab(tab)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer',
                  inboxTab === tab
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Thread List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {contacts
            .filter((c) => {
              if (inboxTab === 'unread' && c.unread === 0) return false;
              if (inboxTab === 'open' && c.status === 'resolved') return false;
              if (inboxTab === 'resolved' && c.status !== 'resolved') return false;
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.tags.some((t) => t.toLowerCase().includes(q));
              }
              return true;
            })
            .map((contact) => {
              const isSelected = activeContactId === contact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                    setContactNoteInput(contact.notes || '');
                    setShowMobileChat(true);
                  }}
                  className={cn(
                    'p-3.5 cursor-pointer transition-colors flex items-start gap-3 relative group',
                    isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{contact.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{contact.time}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{contact.lastMessage}</p>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {contact.tags.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {t}
                        </span>
                      ))}
                      {contact.status === 'resolved' ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-600 font-semibold">
                          Resolved
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 2. CENTER COLUMN: Chat Window (Authentic WhatsApp Web Styling) */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-[#EFEAE2] min-w-0 border-r border-slate-200/90 relative',
          !showMobileChat ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* WhatsApp Chat Header */}
        <div className="p-3 bg-white border-b border-slate-200/90 flex items-center justify-between shadow-2xs z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMobileChat(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {activeContact.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">{activeContact.name}</h4>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">{activeContact.phone || 'Online via WhatsApp'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newStatus = activeContact.status === 'resolved' ? 'active' : 'resolved';
                setContacts(contacts.map((c) => (c.id === activeContact.id ? { ...c, status: newStatus } : c)));
              }}
              className={cn(
                'px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer',
                activeContact.status === 'resolved'
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {activeContact.status === 'resolved' ? 'Reopen Chat' : 'Mark Resolved'}
            </button>
          </div>
        </div>

        {/* Chat History Stream with WhatsApp Bubbles */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-[#efeae2]/80">
          {activeMessages.map((msg) => {
            if (msg.isInternalNote) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="max-w-md rounded-2xl p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private Team Note (Customer does not see this)</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[9px] text-amber-600 block mt-1 text-right">{msg.time}</span>
                  </div>
                </div>
              );
            }

            const isAgent = msg.sender === 'agent';
            return (
              <div key={msg.id} className={cn('flex flex-col', isAgent ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs relative',
                    isAgent
                      ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-xs border border-emerald-200/50'
                      : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/70'
                  )}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 mt-1">
                    <span>{msg.time}</span>
                    {isAgent && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 24-Hour Policy Notice */}
        {windowNotice && (
          <div className="mx-3 my-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>{windowNotice}</span>
            <button type="button" onClick={() => setWindowNotice(null)} className="font-bold ml-2 text-amber-800">
              ✕
            </button>
          </div>
        )}

        {/* Message Input & Action Bar */}
        <form
          onSubmit={handleSendMessage}
          className={cn(
            'p-3 border-t flex items-center gap-2 bg-white transition-colors',
            isNoteMode && 'bg-amber-50/90 border-amber-200'
          )}
        >
          <button
            type="button"
            onClick={() => setIsNoteMode(!isNoteMode)}
            className={cn(
              'px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
              isNoteMode ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
            title="Private Team Note"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isNoteMode ? 'Note Mode' : 'Note'}</span>
          </button>

          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              isNoteMode
                ? 'Type private note for your team...'
                : 'Type WhatsApp message...'
            }
            className={cn(
              'flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all',
              isNoteMode
                ? 'bg-white border-amber-300 text-amber-950 focus:border-amber-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
            )}
          />

          <button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            className={cn(
              'p-2.5 rounded-xl text-white font-bold transition-all disabled:opacity-40 cursor-pointer',
              isNoteMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 3. RIGHT COLUMN: Contact Details, Tags & Notes */}
      <div className="w-72 lg:w-80 bg-white border-l border-slate-200/90 p-4 hidden lg:flex flex-col gap-4 text-xs overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-black text-base mx-auto flex items-center justify-center border-2 border-emerald-200">
            {activeContact.name.slice(0, 2).toUpperCase()}
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{activeContact.name}</h4>
          <p className="text-xs text-slate-500 font-mono">{activeContact.phone}</p>
        </div>

        {/* Assigned Agent */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Agent</label>
          <select
            value={activeContact.assignedAgent}
            onChange={(e) => {
              const val = e.target.value;
              setContacts(contacts.map((c) => (c.id === activeContact.id ? { ...c, assignedAgent: val } : c)));
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {availableAgents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Section with Live Adding */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tags</label>
            <button
              type="button"
              onClick={() => setIsAddingTag(!isAddingTag)}
              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Tag</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {activeContact.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium text-xs border border-emerald-200/70 inline-flex items-center gap-1 group"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-emerald-500 hover:text-emerald-800 opacity-60 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {isAddingTag && (
            <form onSubmit={handleAddTag} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="New tag..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
              >
                Save
              </button>
            </form>
          )}
        </div>

        {/* Customer Notes */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Notes</label>
          <textarea
            rows={3}
            value={contactNoteInput || activeContact.notes || ''}
            onChange={(e) => setContactNoteInput(e.target.value)}
            onBlur={handleSaveContactNotes}
            placeholder="Add internal notes about this customer..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
          />
        </div>

        {/* Channel Info */}
        <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
          <p>Official WhatsApp Cloud API</p>
          <p>Status: <span className="text-emerald-600 font-semibold">24-Hour Active</span></p>
        </div>
      </div>
    </div>
  );
}
