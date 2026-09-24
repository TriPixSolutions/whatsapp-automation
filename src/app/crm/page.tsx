'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Users,
  Building2,
  Flame,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  Tag,
  StickyNote,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, Company, ContactNote, ContactTimelineEvent } from '@/lib/db/types';

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'companies'>('pipeline');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<Record<string, Contact[]>>({
    lead: [],
    contacted: [],
    qualified: [],
    opportunity: [],
    customer: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Contact Drawer State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<ContactTimelineEvent[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // New Company Modal
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compDomain, setCompDomain] = useState('');
  const [compIndustry, setCompIndustry] = useState('');

  const loadCrmData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setCompanies(data.companies || []);
        if (data.stages) setStages(data.stages);
      }
    } catch (err) {
      console.warn('CRM data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrmData();
  }, [loadCrmData]);

  const loadContactDetails = async (contactId: string) => {
    try {
      const res = await fetch(`/api/crm?contactId=${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedContact(data.contact);
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          contactId: selectedContact.id,
          note: newNoteText,
        }),
      });
      if (res.ok) {
        setNewNoteText('');
        await loadContactDetails(selectedContact.id);
        await loadCrmData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleUpdateStage = async (contactId: string, newStage: string) => {
    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          contactId,
          stage: newStage,
        }),
      });
      await loadCrmData();
      if (selectedContact?.id === contactId) {
        await loadContactDetails(contactId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_company',
          companyData: {
            name: compName,
            domain: compDomain,
            industry: compIndustry,
          },
        }),
      });
      if (res.ok) {
        setShowCompanyModal(false);
        setCompName('');
        setCompDomain('');
        setCompIndustry('');
        await loadCrmData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pipelineStages = [
    { key: 'lead', title: 'New Leads', color: 'border-blue-500 bg-blue-50/50 text-blue-900' },
    { key: 'contacted', title: 'Contacted', color: 'border-amber-500 bg-amber-50/50 text-amber-900' },
    { key: 'qualified', title: 'Qualified', color: 'border-indigo-500 bg-indigo-50/50 text-indigo-900' },
    { key: 'opportunity', title: 'Opportunity', color: 'border-purple-500 bg-purple-50/50 text-purple-900' },
    { key: 'customer', title: 'Won Customers', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="CRM & Pipeline"
          subtitle="Customer relationship management, multi-stage sales pipeline & unified activity timeline"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('pipeline')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'pipeline'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                Pipeline Board
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('companies')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'companies'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                Companies ({companies.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter pipeline..."
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={loadCrmData}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs"
                title="Refresh CRM"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-emerald-600')} />
              </button>

              {activeTab === 'companies' && (
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: KANBAN PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {pipelineStages.map((stage) => {
                const stageContacts = (stages[stage.key] || []).filter((c) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                    c.phoneNumber.includes(q)
                  );
                });

                return (
                  <div
                    key={stage.key}
                    className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col h-[650px]"
                  >
                    <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', stage.color.split(' ')[0].replace('border-', 'bg-'))} />
                        <h4 className="text-xs font-bold text-slate-900">{stage.title}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs font-mono">
                        {stageContacts.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
                      {stageContacts.length === 0 ? (
                        <div className="h-28 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 font-medium">
                          No contacts in {stage.title}
                        </div>
                      ) : (
                        stageContacts.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => loadContactDetails(c.id)}
                            className={cn(
                              'bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer group space-y-2 select-none',
                              selectedContact?.id === c.id && 'ring-2 ring-emerald-500 border-emerald-500'
                            )}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {`${c.firstName} ${c.lastName}`.trim() || 'WhatsApp Lead'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.phoneNumber}</p>
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Score: {c.leadScore ?? 50}
                              </span>
                            </div>

                            {c.company && (
                              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{c.company}</span>
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                              <span>{c.assignedAgent || 'Unassigned'}</span>
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/inbox?phone=${encodeURIComponent(c.phoneNumber)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-600 hover:text-emerald-800 font-bold p-0.5"
                                  title="Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: COMPANIES LIST */}
          {activeTab === 'companies' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Domain / Website</th>
                      <th className="py-3 px-4">Industry</th>
                      <th className="py-3 px-4">Total Contacts</th>
                      <th className="py-3 px-4">Pipeline Value</th>
                      <th className="py-3 px-4 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-600">No companies recorded yet</p>
                          <p className="text-xs text-slate-400">Click &apos;Add Company&apos; to register B2B accounts</p>
                        </td>
                      </tr>
                    ) : (
                      companies.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{comp.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                            {comp.domain || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{comp.industry || 'General'}</td>
                          <td className="py-3.5 px-4 font-mono font-medium">{comp.contactCount || 0}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            ${comp.dealValue || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(comp.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTACT DETAILS & TIMELINE DRAWER */}
          {selectedContact && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {`${selectedContact.firstName} ${selectedContact.lastName}`.trim() || 'WhatsApp Lead'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedContact.phoneNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Pipeline Stage Quick Switcher */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Pipeline Stage
                  </label>
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold">
                    {pipelineStages.map((st) => (
                      <button
                        key={st.key}
                        onClick={() => handleUpdateStage(selectedContact.id, st.key)}
                        className={cn(
                          'py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer',
                          (selectedContact.stage || 'lead') === st.key
                            ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {st.title.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Team Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                      <span>Internal Notes</span>
                    </h4>
                  </div>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Add an internal note about this customer..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !newNoteText.trim()}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isSubmittingNote ? 'Saving...' : 'Add Note'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {(selectedContact.notes || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No notes added yet.</p>
                    ) : (
                      selectedContact.notes?.map((n) => (
                        <div key={n.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-amber-800 font-semibold">
                            <span>{n.authorName}</span>
                            <span className="font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Complete Unified Activity Timeline */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Activity Timeline</span>
                  </h4>

                  <div className="space-y-3 relative pl-4 border-l-2 border-slate-100">
                    {timeline.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No timeline events recorded yet.</p>
                    ) : (
                      timeline.map((evt) => (
                        <div key={evt.id} className="relative space-y-0.5">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                          <p className="text-xs font-bold text-slate-900">{evt.title}</p>
                          <p className="text-xs text-slate-500">{evt.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Company Modal */}
          {showCompanyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Add B2B Company</h3>
                  <button
                    type="button"
                    onClick={() => setShowCompanyModal(false)}
                    className="text-slate-400 font-bold p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCompany} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corporation"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Domain / Website</label>
                    <input
                      type="text"
                      placeholder="acme.com"
                      value={compDomain}
                      onChange={(e) => setCompDomain(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Industry</label>
                    <input
                      type="text"
                      placeholder="Technology / Retail"
                      value={compIndustry}
                      onChange={(e) => setCompIndustry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCompanyModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs"
                    >
                      Create Company
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
