'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Check,
  CheckCheck,
  Send,
  Tag,
  Clock,
  User,
  StickyNote,
  Zap,
  Phone,
  Plus,
  X,
  Filter,
  ChevronDown,
  Building,
  Mail,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'note';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  isInternalNote?: boolean;
  authorName?: string;
}

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  lastMessage: string;
  time: string;
  unread: number;
  tags: string[];
  stage: string;
  assignedAgent: string;
  notes: string[];
  automationsTriggered?: string[];
  campaignsReceived?: string[];
}

const SAVED_REPLIES = [
  { id: 'sr_1', label: 'Greeting', text: 'Hello! Thank you for contacting our team. How can we assist you today?' },
  { id: 'sr_2', label: 'Pricing Sheet', text: 'Here is our official pricing overview. Please let us know if you have specific volume requirements.' },
  { id: 'sr_3', label: 'Office Hours', text: 'Our team is available Monday through Friday from 9:00 AM to 6:00 PM.' },
  { id: 'sr_4', label: 'Consultation', text: 'Would you like to schedule a 15-minute consultation with our product specialist?' },
];

const TEAM_MEMBERS = ['Unassigned', 'Sarah Jenkins', 'Alex Chen', 'Marcus Vance'];

const STAGES = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
];

export function LiveTeamInbox() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [isSending, setIsSending] = useState(false);
  const [showSavedReplies, setShowSavedReplies] = useState(false);

  // Filters & Search
  const [filterTab, setFilterTab] = useState<'all' | 'unassigned' | 'mine' | 'open'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Load real contacts and messages
  const loadInboxData = useCallback(async () => {
    try {
      const [contactsRes, msgRes] = await Promise.all([
        fetch('/api/contacts').catch(() => null),
        fetch('/api/messages').catch(() => null),
      ]);

      let loadedContacts: ChatContact[] = [];

      if (contactsRes?.ok) {
        const data = await contactsRes.json();
        if (Array.isArray(data)) {
          loadedContacts = data.map((c: any) => ({
            id: c.id,
            name: `${c.first_name || c.firstName || ''} ${c.last_name || c.lastName || ''}`.trim() || c.phone_number || c.phoneNumber || 'Contact',
            phone: c.phone_number || c.phoneNumber || '',
            email: c.email || '',
            company: c.company || '',
            lastMessage: 'Conversation opened',
            time: c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
            unread: 0,
            tags: c.tags || ['Lead'],
            stage: c.stage || 'New Lead',
            assignedAgent: c.assignedAgent || 'Unassigned',
            notes: c.notes || [],
            automationsTriggered: ['Lead Follow Up Flow'],
            campaignsReceived: ['Seasonal Broadcast'],
          }));

          setContacts(loadedContacts);

          if (loadedContacts.length > 0 && !activeContactId) {
            setActiveContactId(loadedContacts[0].id);
          }
        }
      }

      if (msgRes?.ok) {
        const msgData = await msgRes.json();
        if (Array.isArray(msgData?.messages)) {
          const grouped: Record<string, ChatMessage[]> = {};
          for (const m of msgData.messages) {
            const phone = m.phoneNumber || m.phone_number;
            if (!grouped[phone]) grouped[phone] = [];
            grouped[phone].unshift({
              id: m.id || `msg_${Date.now()}_${Math.random()}`,
              sender: m.direction === 'inbound' ? 'user' : 'agent',
              text: m.content || '',
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
              status: m.status || 'delivered',
            });
          }

          // Map messages to contact IDs
          setChatHistory((prev) => {
            const next = { ...prev };
            for (const c of loadedContacts) {
              const cleanPhone = c.phone.replace(/[^0-9]/g, '');
              const matchedKey = Object.keys(grouped).find((k) => k.replace(/[^0-9]/g, '') === cleanPhone);
              if (matchedKey && grouped[matchedKey]) {
                next[c.id] = grouped[matchedKey];
              }
            }
            return next;
          });
        }
      }
    } catch (e) {
      console.warn('Inbox load error:', e);
    }
  }, [activeContactId]);

  useEffect(() => {
    loadInboxData();
  }, [loadInboxData]);

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];
  const activeMessages = (activeContact ? chatHistory[activeContact.id] : []) || [];

  // SEND MESSAGE OR INTERNAL NOTE
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeContact) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: isNoteMode ? 'note' : 'agent',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isInternalNote: isNoteMode,
      authorName: isNoteMode ? 'Sales Agent' : undefined,
    };

    setChatHistory((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));

    if (!isNoteMode) {
      try {
        await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: activeContact.phone,
            text: textToSend,
            type: 'text',
          }),
        });
      } catch (err) {
        console.warn('Send message error:', err);
      }
    } else {
      // Record internal note in CRM
      try {
        await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_note',
            contactId: activeContact.id,
            note: textToSend,
          }),
        });
      } catch (err) {
        console.warn('Add note error:', err);
      }
    }

    setIsSending(false);
  };

  const handleUpdateContactStage = async (newStage: string) => {
    if (!activeContact) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, stage: newStage } : c))
    );

    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          contactId: activeContact.id,
          stage: newStage,
        }),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateContactAgent = async (newAgent: string) => {
    if (!activeContact) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, assignedAgent: newAgent } : c))
    );

    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_agent',
          contactId: activeContact.id,
          assignedAgent: newAgent,
        }),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim() || !activeContact) return;
    const tag = newTagInput.trim();
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id ? { ...c, tags: Array.from(new Set([...c.tags, tag])) } : c
      )
    );
    setNewTagInput('');
    setIsAddingTag(false);
  };

  // Filtered contacts list
  const filteredContacts = contacts.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    }
    if (filterTab === 'unassigned') return c.assignedAgent === 'Unassigned';
    if (filterTab === 'mine') return c.assignedAgent !== 'Unassigned';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-white">
      {/* 1. Left Panel: Conversations Directory (w-80) */}
      <div className="w-full lg:w-80 border-r border-slate-200 flex flex-col shrink-0 h-full bg-slate-50/50">
        {/* Search Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {(['all', 'unassigned', 'mine', 'open'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer whitespace-nowrap',
                  filterTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const isSelected = contact.id === activeContact?.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => setActiveContactId(contact.id)}
                  className={cn(
                    'p-3.5 cursor-pointer transition-colors space-y-1',
                    isSelected ? 'bg-white border-l-4 border-slate-900 shadow-2xs' : 'hover:bg-slate-100/70'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {contact.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {contact.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {contact.phone}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {contact.stage}
                    </span>
                    {contact.assignedAgent !== 'Unassigned' && (
                      <span className="text-[9px] text-slate-400 truncate">
                        • {contact.assignedAgent}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-1">
              <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No conversations yet</p>
              <p className="text-[11px] text-slate-400">
                When customers message your WhatsApp number, they will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Panel: Active Chat Stream */}
      {activeContact ? (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] min-w-0">
          {/* Chat Header */}
          <div className="p-3.5 px-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {activeContact.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{activeContact.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    {activeContact.phone}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Lead Stage Selector */}
                  <select
                    value={activeContact.stage}
                    onChange={(e) => handleUpdateContactStage(e.target.value)}
                    className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {/* Assignee Selector */}
                  <select
                    value={activeContact.assignedAgent}
                    onChange={(e) => handleUpdateContactAgent(e.target.value)}
                    className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 cursor-pointer"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 24h Service Window Badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">24h Window Active</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {activeMessages.length > 0 ? (
              activeMessages.map((msg) => {
                if (msg.isInternalNote) {
                  return (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1 my-2 max-w-lg mx-auto"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-800">
                        <span className="flex items-center gap-1">
                          <StickyNote className="w-3 h-3 text-amber-700" />
                          <span>Internal Note • {msg.authorName || 'Team'}</span>
                        </span>
                        <span className="font-mono text-amber-700/80">{msg.time}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  );
                }

                const isAgent = msg.sender === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={cn('flex flex-col max-w-[80%]', isAgent ? 'ml-auto items-end' : 'mr-auto items-start')}
                  >
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-xs space-y-1 shadow-2xs',
                        isAgent
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                      )}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div
                        className={cn(
                          'flex items-center justify-end gap-1 text-[9px]',
                          isAgent ? 'text-slate-400' : 'text-slate-400'
                        )}
                      >
                        <span>{msg.time}</span>
                        {isAgent && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                <p className="font-semibold text-slate-600">No messages in thread yet</p>
                <p className="text-[11px] text-slate-400">Type a message below to start the conversation.</p>
              </div>
            )}
          </div>

          {/* Saved Replies Popup Menu */}
          {showSavedReplies && (
            <div className="p-3 bg-white border-t border-slate-200 space-y-2 shadow-lg animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Saved Replies
                </span>
                <button
                  type="button"
                  onClick={() => setShowSavedReplies(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAVED_REPLIES.map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    onClick={() => {
                      setMessageInput(reply.text);
                      setShowSavedReplies(false);
                    }}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-slate-800 block text-[11px]">{reply.label}</span>
                    <span className="text-slate-500 text-[10px] truncate block">{reply.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Message Composer */}
          <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsNoteMode(false)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer',
                    !isNoteMode ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  WhatsApp Reply
                </button>
                <button
                  type="button"
                  onClick={() => setIsNoteMode(true)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1',
                    isNoteMode ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  <StickyNote className="w-3 h-3" />
                  <span>Internal Note</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSavedReplies(!showSavedReplies)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Saved Replies</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <textarea
                rows={2}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={isNoteMode ? 'Write an internal note only visible to team members...' : 'Type message to send via official WhatsApp...'}
                className={cn(
                  'flex-1 p-2.5 text-xs rounded-xl border focus:outline-hidden resize-none',
                  isNoteMode
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950 focus:border-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-900'
                )}
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className={cn(
                  'px-4 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shrink-0',
                  isNoteMode ? 'bg-amber-700 hover:bg-amber-800' : 'bg-slate-900 hover:bg-slate-800'
                )}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isNoteMode ? 'Save Note' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
          Select a conversation from the left to view messages.
        </div>
      )}

      {/* 3. Right Panel: Customer Profile, Timeline & History (w-72) */}
      {activeContact && (
        <div className="w-full lg:w-72 border-l border-slate-200 p-4 shrink-0 overflow-y-auto space-y-5 bg-white">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Customer Details
            </span>
            <h4 className="text-sm font-bold text-slate-900">{activeContact.name}</h4>
            <p className="text-xs text-slate-500 font-mono">{activeContact.phone}</p>
            {activeContact.company && (
              <p className="text-xs text-slate-600 flex items-center gap-1 pt-1 font-medium">
                <Building className="w-3 h-3 text-slate-400" />
                <span>{activeContact.company}</span>
              </p>
            )}
            {activeContact.email && (
              <p className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{activeContact.email}</span>
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer Tags
              </span>
              <button
                type="button"
                onClick={() => setIsAddingTag(!isAddingTag)}
                className="text-[10px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                + Add Tag
              </button>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {activeContact.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                >
                  #{t}
                </span>
              ))}
            </div>

            {isAddingTag && (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="New tag..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Automation History */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Automation History
            </span>
            <div className="space-y-1">
              {(activeContact.automationsTriggered || ['Lead Follow Up Flow']).map((auto, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{auto}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign History */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Campaign History
            </span>
            <div className="space-y-1">
              {(activeContact.campaignsReceived || ['Seasonal Broadcast']).map((camp, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{camp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Activity Timeline */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Customer Timeline
            </span>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800">Inbound WhatsApp Received</p>
                <p className="text-[10px] text-slate-400 font-mono">Today, 12:00 PM</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800">Lead Stage Set: {activeContact.stage}</p>
                <p className="text-[10px] text-slate-400 font-mono">Today, 12:01 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
