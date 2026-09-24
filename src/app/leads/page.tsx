'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  Phone,
  Tag,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  Filter,
  X,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/lib/db/types';

const PIPELINE_STAGES = [
  { id: 'new_lead', name: 'New Lead', color: 'border-slate-300' },
  { id: 'contacted', name: 'Contacted', color: 'border-blue-400' },
  { id: 'qualified', name: 'Qualified', color: 'border-amber-400' },
  { id: 'proposal_sent', name: 'Proposal Sent', color: 'border-purple-400' },
  { id: 'negotiation', name: 'Negotiation', color: 'border-indigo-400' },
  { id: 'won', name: 'Won', color: 'border-emerald-500' },
  { id: 'lost', name: 'Lost', color: 'border-rose-400' },
] as const;

export default function LeadsPipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lead form
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newStage, setNewStage] = useState<string>('new_lead');
  const [newScore, setNewScore] = useState(70);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeadsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.warn('Failed to load CRM leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  const handleUpdateStage = async (contactId: string, targetStage: string) => {
    // Optimistic UI update
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, stage: targetStage } : c))
    );

    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          contactId,
          stage: targetStage,
        }),
      });
    } catch (e) {
      console.warn('Failed to update stage:', e);
      fetchLeadsData();
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const parts = newName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newPhone.trim(),
          firstName,
          lastName,
          email: newEmail.trim() || undefined,
          company: newCompany.trim() || undefined,
          stage: newStage,
          leadScore: newScore,
          tags: ['Lead'],
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewPhone('');
        setNewName('');
        setNewEmail('');
        setNewCompany('');
        fetchLeadsData();
      }
    } catch (err) {
      console.warn('Error adding lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter contacts by search
  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      c.phoneNumber.includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Lead Management"
        subtitle="CRM pipeline to qualify and track WhatsApp customer opportunities through conversion"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto w-full space-y-6 pb-24 md:pb-12">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads by name, phone, company..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={fetchLeadsData}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Refresh Leads"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-semibold mr-1">
              Total Leads: {contacts.length}
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* 7-Stage Drag & Drop Kanban Pipeline */}
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="inline-flex gap-4 min-w-full">
            {PIPELINE_STAGES.map((stage, stageIdx) => {
              const stageLeads = filteredContacts.filter((c) => {
                const s = c.stage || 'new_lead';
                if (stage.id === 'new_lead') {
                  return s === 'new_lead' || s === 'lead' || s === 'new';
                }
                if (stage.id === 'proposal_sent') {
                  return s === 'proposal_sent' || s === 'opportunity';
                }
                if (stage.id === 'won') {
                  return s === 'won' || s === 'customer';
                }
                return s === stage.id;
              });

              return (
                <div
                  key={stage.id}
                  className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[calc(100vh-250px)]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full border-2', stage.color)} />
                      <h4 className="text-xs font-bold text-slate-900">{stage.name}</h4>
                    </div>
                    <span className="text-xs font-bold font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Leads List within Column */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
                    {stageLeads.length > 0 ? (
                      stageLeads.map((lead) => {
                        const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'WhatsApp Lead';
                        return (
                          <div
                            key={lead.id}
                            className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                  {fullName}
                                </h5>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {lead.phoneNumber}
                                </p>
                              </div>
                              <Link
                                href={`/inbox?phone=${encodeURIComponent(lead.phoneNumber)}`}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                            </div>

                            {lead.company && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                <Building className="w-3 h-3 text-slate-400" />
                                <span>{lead.company}</span>
                              </p>
                            )}

                            {/* Tags */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {(lead.tags || []).slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>

                            {/* Pipeline Advancement Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold">
                              {stageIdx > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStage(lead.id, PIPELINE_STAGES[stageIdx - 1].id)}
                                  className="text-slate-400 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                                  title={`Move back to ${PIPELINE_STAGES[stageIdx - 1].name}`}
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  <span>Back</span>
                                </button>
                              ) : (
                                <span />
                              )}

                              {stageIdx < PIPELINE_STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStage(lead.id, PIPELINE_STAGES[stageIdx + 1].id)}
                                  className="text-slate-900 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer ml-auto"
                                  title={`Advance to ${PIPELINE_STAGES[stageIdx + 1].name}`}
                                >
                                  <span>Advance</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                        No leads in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Add New Lead</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+14155552671"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Company</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Morgan Enterprise"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
