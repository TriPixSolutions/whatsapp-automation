'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Flame,
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  ExternalLink,
  ChevronDown,
  Sparkles,
  X,
  Filter,
} from 'lucide-react';
import { cn, formatPhoneNumber } from '@/lib/utils';

interface PriorityLead {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  lastMessage: string;
  intent: string;
  isPriority: boolean;
  status: string;
  assignedAgent: string;
  tags: string[];
  lastActivity: string;
}

const SALES_AGENTS = [
  'Sales Specialist',
  'Sarah Jenkins',
  'Marcus Vance',
  'Alex Chen',
  'Unassigned',
];

const INTENT_BADGES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  'Asked Price': { label: 'Price Inquiry', icon: '💰', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Wants to Order': { label: 'Ready to Buy', icon: '🛒', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Stock Check': { label: 'Stock Available?', icon: '📦', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Delivery Charge': { label: 'Delivery Cost?', icon: '🚚', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'High Interest': { label: 'High Intent', icon: '🔥', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  'General Inquiry': { label: 'Inquiry', icon: '💬', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function PriorityLeadsPage() {
  const [leads, setLeads] = useState<PriorityLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lead state
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newIntent, setNewIntent] = useState('Asked Price');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (intentFilter !== 'all') params.set('intent', intentFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.warn('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, [search, intentFilter, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleUpdateLead = async (id: string, updates: { status?: string; assignedAgent?: string }) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
        );
        showToast('Lead updated successfully');
      }
    } catch {
      showToast('Error updating lead');
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newPhone.trim(),
          firstName: newName.trim() || 'Prospective Buyer',
          tags: ['priority', newIntent.toLowerCase().replace(/\s+/g, '_')],
          metadata: {
            lastMessage: `Customer inquired: ${newIntent}`,
            status: 'priority',
          },
        }),
      });

      if (res.ok) {
        showToast('Priority lead created and automated follow-up scheduled!');
        setShowAddModal(false);
        setNewPhone('');
        setNewName('');
        fetchLeads();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create lead');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityLeadsCount = leads.filter((l) => l.isPriority).length;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Priority Leads"
          subtitle="Auto-detected high-intent buyers ready for closing"
        />

        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Intent Explanation Banner */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-2xl font-black shadow-2xs border border-amber-200/60">
                🔥
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-950">Automatic Buying Intent Recognition</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Incoming replies containing keywords like <em>&ldquo;What is the price?&rdquo;</em>, <em>&ldquo;How can I order?&rdquo;</em>, or <em>&ldquo;Is stock available?&rdquo;</em> are automatically tagged and escalated here for your sales team.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Priority Leads</span>
                <span className="text-base font-black text-slate-900 font-mono">{priorityLeadsCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Priority Lead</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Intent Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-0.5 scrollbar-none">
              {[
                { id: 'all', label: 'All Intents' },
                { id: 'Price', label: '💰 Price' },
                { id: 'Order', label: '🛒 Order' },
                { id: 'Stock', label: '📦 Stock' },
                { id: 'Delivery', label: '🚚 Delivery' },
                { id: 'Interest', label: '🔥 High Intent' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setIntentFilter(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    intentFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                onClick={fetchLeads}
                title="Refresh leads"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-emerald-600')} />
              </button>
            </div>
          </div>

          {/* Priority Lead Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Lead Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4 max-w-xs">Last Message</th>
                    <th className="py-3.5 px-4">Intent</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned Agent</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading priority leads...</span>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-xl">
                          💬
                        </div>
                        <p className="font-semibold text-slate-700">No leads found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          When leads reply on WhatsApp or ask for prices, they will automatically appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => {
                      const badge = INTENT_BADGES[lead.intent] || INTENT_BADGES['General Inquiry'];
                      const cleanPhone = lead.phoneNumber.replace(/[^0-9]/g, '');

                      return (
                        <tr
                          key={lead.id}
                          className={cn(
                            'hover:bg-slate-50/70 transition-colors',
                            lead.isPriority && 'bg-amber-50/20'
                          )}
                        >
                          {/* 1. Lead Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {lead.isPriority && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Hot Priority" />
                              )}
                              <span>{lead.name}</span>
                            </div>
                          </td>

                          {/* 2. Phone */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {formatPhoneNumber(lead.phoneNumber)}
                          </td>

                          {/* 3. Last Message */}
                          <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={lead.lastMessage}>
                            {lead.lastMessage}
                          </td>

                          {/* 4. Intent */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border',
                                badge.bg,
                                badge.text,
                                badge.border
                              )}
                            >
                              <span>{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* 5. Status Selector */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateLead(lead.id, { status: e.target.value })}
                              className="text-[11px] font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="priority">🔥 Priority</option>
                              <option value="new">🎯 New</option>
                              <option value="contacted">💬 Contacted</option>
                              <option value="won">🎉 Won</option>
                              <option value="lost">❌ Lost</option>
                            </select>
                          </td>

                          {/* 6. Assigned Agent */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={lead.assignedAgent}
                              onChange={(e) => handleUpdateLead(lead.id, { assignedAgent: e.target.value })}
                              className="text-[11px] font-medium px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              {SALES_AGENTS.map((agent) => (
                                <option key={agent} value={agent}>
                                  {agent}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 7. Last Activity */}
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                            {lead.lastActivity
                              ? new Date(lead.lastActivity).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </td>

                          {/* 8. Quick Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                                title="Open WhatsApp Chat directly"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Priority Lead Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">Add Priority Lead</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddLead} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      WhatsApp Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+15551234567 (with country code)"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Lead Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Initial Buying Intent Trigger
                    </label>
                    <select
                      value={newIntent}
                      onChange={(e) => setNewIntent(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="Asked Price">💰 Asked Price (&quot;What is the price?&quot;)</option>
                      <option value="Wants to Order">🛒 Ready to Order (&quot;How can I order?&quot;)</option>
                      <option value="Stock Check">📦 Stock Available? (&quot;Is stock available?&quot;)</option>
                      <option value="Delivery Charge">🚚 Delivery Charge (&quot;Delivery fee?&quot;)</option>
                      <option value="High Interest">🔥 High Interest (&quot;Interested, buy now&quot;)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900">
                    💡 This lead will immediately be tagged as a <strong>Priority Lead</strong> and our automated follow-up sequence will trigger to nurture them.
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {isSubmitting ? 'Saving...' : 'Create Priority Lead'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
