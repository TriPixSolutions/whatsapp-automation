'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CsvImporter } from '@/components/CsvImporter';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Tag,
  Phone,
  FileSpreadsheet,
  X,
  MessageSquare,
  Flame,
  Package,
  ArrowRight,
  Kanban,
  List,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Send,
} from 'lucide-react';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { Contact } from '@/types';

type LeadStage = 'new' | 'engaged' | 'priority' | 'closed';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showImporter, setShowImporter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lead Form State
  const [newPhone, setNewPhone] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newStage, setNewStage] = useState<LeadStage>('new');
  const [newIntent, setNewIntent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch contacts from real DB
  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?tag=${selectedTag}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setContacts(data);
        }
      }
    } catch (e) {
      console.warn('API error, using active state:', e);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [selectedTag]);

  // Helper to determine stage from contact tags
  const getLeadStage = (contact: Contact): LeadStage => {
    const tags = contact.tags || [];
    if (tags.includes('closed') || tags.includes('won')) return 'closed';
    if (
      tags.includes('priority') ||
      tags.includes('vip') ||
      tags.includes('price_inquiry') ||
      tags.includes('delivery_inquiry')
    ) {
      return 'priority';
    }
    if (tags.includes('engaged') || tags.includes('replied')) return 'engaged';
    return 'new';
  };

  // Helper to get intent reason badge
  const getIntentBadge = (contact: Contact) => {
    const tags = contact.tags || [];
    if (tags.includes('price_inquiry')) {
      return { label: 'Asked Price', icon: '💰', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (tags.includes('delivery_inquiry')) {
      return { label: 'Asked Delivery', icon: '📦', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (tags.includes('replied') || tags.includes('priority')) {
      return { label: 'Customer Replied', icon: '💬', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return null;
  };

  // Move Lead to another stage
  const handleMoveStage = async (contact: Contact, targetStage: LeadStage) => {
    try {
      // Remove previous stage tags and add new one
      const cleanTags = (contact.tags || []).filter(
        (t) => !['new', 'engaged', 'priority', 'closed', 'won'].includes(t)
      );
      cleanTags.push(targetStage);

      const phone = contact.phone_number || (contact as any).phoneNumber;

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          firstName: contact.first_name || (contact as any).firstName,
          lastName: contact.last_name || (contact as any).lastName,
          tags: cleanTags,
        }),
      });

      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            (c.phone_number || (c as any).phoneNumber) === phone ? { ...c, tags: cleanTags } : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to move stage:', err);
    }
  };

  // Create new contact / lead
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const tagsArray: string[] = [newStage];
      if (newIntent) tagsArray.push(newIntent);

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newPhone,
          firstName: newFirstName,
          lastName: newLastName,
          tags: tagsArray,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setContacts((prev) => [created, ...prev]);
        setShowAddModal(false);
        setNewPhone('');
        setNewFirstName('');
        setNewLastName('');
        setNewIntent('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const phone = (c.phone_number || (c as any).phoneNumber || '').toLowerCase();
    const first = (c.first_name || (c as any).firstName || '').toLowerCase();
    const last = (c.last_name || (c as any).lastName || '').toLowerCase();
    const q = search.toLowerCase();
    return phone.includes(q) || first.includes(q) || last.includes(q);
  });

  const columns: { id: LeadStage; title: string; subtitle: string; icon: string; count: number }[] = [
    {
      id: 'new',
      title: 'New Leads',
      subtitle: 'Fresh inquiries awaiting response',
      icon: '🎯',
      count: filteredContacts.filter((c) => getLeadStage(c) === 'new').length,
    },
    {
      id: 'engaged',
      title: 'Engaged Leads',
      subtitle: 'Customer received message',
      icon: '💬',
      count: filteredContacts.filter((c) => getLeadStage(c) === 'engaged').length,
    },
    {
      id: 'priority',
      title: 'Priority Leads',
      subtitle: 'Hot buyer intent (Price/Replied)',
      icon: '🔥',
      count: filteredContacts.filter((c) => getLeadStage(c) === 'priority').length,
    },
    {
      id: 'closed',
      title: 'Closed Leads',
      subtitle: 'Order completed or deal won',
      icon: '🎉',
      count: filteredContacts.filter((c) => getLeadStage(c) === 'closed').length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Priority Leads & CRM"
          subtitle="Simple customer pipeline with automatic buyer intent detection"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Control Bar: Search + View Mode + Add Actions */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* View Mode + Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  )}
                  title="Kanban Board View"
                >
                  <Kanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  )}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowImporter(!showImporter)}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* CSV Importer Drawer if open */}
          {showImporter && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Upload Customer Phone Numbers</h3>
                <button
                  type="button"
                  onClick={() => setShowImporter(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CsvImporter onImportSuccess={() => fetchContacts()} />
            </div>
          )}

          {/* Quick Explainer Banner */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-xl font-bold">
                🔥
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Automatic Priority Movement</h4>
                <p className="text-[11px] text-slate-500">
                  When a customer asks for price, shipping, or replies on WhatsApp, they move directly to <strong>Priority Leads</strong> so you never miss a sale.
                </p>
              </div>
            </div>
            <Link
              href="/inbox"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-end sm:self-center shrink-0"
            >
              <span>Open Live Chat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* KANBAN BOARD VIEW                                                */}
          {/* ---------------------------------------------------------------- */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {columns.map((col) => {
                const colContacts = filteredContacts.filter((c) => getLeadStage(c) === col.id);

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{col.icon}</span>
                        <span className="text-xs font-bold text-slate-900">{col.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {col.count}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-3 min-h-[160px]">
                      {colContacts.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No leads in this stage
                        </div>
                      ) : (
                        colContacts.map((contact) => {
                          const phone = contact.phone_number || (contact as any).phoneNumber;
                          const name =
                            [contact.first_name || (contact as any).firstName, contact.last_name || (contact as any).lastName]
                              .filter(Boolean)
                              .join(' ') || 'Customer';
                          const intent = getIntentBadge(contact);

                          return (
                            <div
                              key={contact.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">{name}</h4>
                                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    {formatPhoneNumber(phone)}
                                  </p>
                                </div>
                                {intent && (
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1',
                                      intent.color
                                    )}
                                  >
                                    <span>{intent.icon}</span>
                                    <span>{intent.label}</span>
                                  </span>
                                )}
                              </div>

                              {/* Quick Actions (Max 3 clicks) */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                <Link
                                  href={`/inbox`}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Open WhatsApp Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Chat</span>
                                </Link>

                                <a
                                  href={`tel:${phone}`}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-medium transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>

                                {/* Stage Mover */}
                                {col.id !== 'priority' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStage(contact, 'priority')}
                                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <span>🔥 Priority</span>
                                  </button>
                                )}

                                {col.id === 'priority' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStage(contact, 'closed')}
                                    className="px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    <span>Won ✓</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* LIST VIEW                                                        */}
          {/* ---------------------------------------------------------------- */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Intent Trigger</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map((contact) => {
                      const phone = contact.phone_number || (contact as any).phoneNumber;
                      const name =
                        [contact.first_name || (contact as any).firstName, contact.last_name || (contact as any).lastName]
                          .filter(Boolean)
                          .join(' ') || 'Customer';
                      const stage = getLeadStage(contact);
                      const intent = getIntentBadge(contact);

                      return (
                        <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{name}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {formatPhoneNumber(phone)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                stage === 'priority' && 'bg-amber-100 text-amber-800',
                                stage === 'engaged' && 'bg-blue-100 text-blue-800',
                                stage === 'closed' && 'bg-slate-900 text-white',
                                stage === 'new' && 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {stage}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {intent ? (
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1',
                                  intent.color
                                )}
                              >
                                <span>{intent.icon}</span>
                                <span>{intent.label}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href="/inbox"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat</span>
                              </Link>
                              <a
                                href={`tel:${phone}`}
                                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Lead Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Add New Lead</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateContact} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      WhatsApp Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+15551234567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Initial Stage
                    </label>
                    <select
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="new">🎯 New Lead</option>
                      <option value="engaged">💬 Engaged Lead</option>
                      <option value="priority">🔥 Priority Lead</option>
                      <option value="closed">🎉 Closed Won</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Intent Trigger (Optional)
                    </label>
                    <select
                      value={newIntent}
                      onChange={(e) => setNewIntent(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">None</option>
                      <option value="price_inquiry">💰 Asked Price</option>
                      <option value="delivery_inquiry">📦 Asked Delivery</option>
                      <option value="replied">💬 Replied on WhatsApp</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      {isSaving ? 'Saving...' : 'Create Lead'}
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
