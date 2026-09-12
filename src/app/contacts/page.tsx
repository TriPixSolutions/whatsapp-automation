'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CsvImporter } from '@/components/CsvImporter';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Tag,
  Phone,
  FileSpreadsheet,
  X,
  Loader2,
} from 'lucide-react';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { Contact } from '@/types';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showImporter, setShowImporter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newTags, setNewTags] = useState('vip, teaser_list');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const tagsArray = newTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = contacts.filter((c) => {
    const matchesTag = selectedTag === 'all' || c.tags.includes(selectedTag);
    const matchesSearch =
      c.phone_number.toLowerCase().includes(search.toLowerCase()) ||
      c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name?.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] pl-60 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Customer Contacts Directory"
        subtitle="Manage customer phone numbers, VIP tags, and WhatsApp opt-in status"
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or international phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF] shadow-sm"
              />
            </div>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-xs text-[#555555] focus:outline-none focus:border-[#0066FF] shadow-sm"
            >
              <option value="all">All Tags</option>
              <option value="teaser_list">teaser_list</option>
              <option value="vip">vip</option>
              <option value="private-aviation">private-aviation</option>
              <option value="haute-horlogerie">haute-horlogerie</option>
              <option value="luxury-villas">luxury-villas</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#222222] shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Bulk Import CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="gradient-button text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer Contact</span>
            </button>
          </div>
        </div>

        {/* Collapsible Bulk CSV Importer */}
        {showImporter && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <CsvImporter
              onImportSuccess={() => {
                fetchContacts();
                setShowImporter(false);
              }}
            />
          </div>
        )}

        {/* Contacts Table */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-zap-sm">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0066FF]" />
              <span className="text-xs font-bold text-[#222222] uppercase tracking-wider">
                Customer Contacts ({filtered.length})
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-[#C4B5FD] text-[#7C3AED] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-[#0D0F2D]">
                  {search || selectedTag !== 'all' ? 'No matching contacts' : 'No contacts in directory'}
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {search || selectedTag !== 'all'
                    ? 'Try adjusting your search query or tag filter.'
                    : 'Import your customer phone directory via CSV or add a customer contact to begin messaging.'}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setShowImporter(true)}
                  className="px-4 py-2 rounded-xl bg-[#F4F6FB] hover:bg-purple-50 border border-[#E2E8F0] hover:border-[#C4B5FD] text-xs font-bold text-[#0D0F2D] hover:text-[#7C3AED] transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Bulk Import CSV</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="gradient-button text-xs px-4 py-2 rounded-xl font-bold text-white shadow-pf-btn flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Contact</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#555555]">
                <thead className="bg-slate-50 text-[10px] uppercase text-[#777777] tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-4">Contact Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Audience Tags</th>
                    <th className="p-4">Opt-In Status</th>
                    <th className="p-4 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-sans">
                  {filtered.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-[#222222]">
                        {contact.first_name} {contact.last_name || ''}
                      </td>
                      <td className="p-4 font-mono text-[#0066FF] font-semibold">
                        {contact.phone_number}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-mono text-[#0066FF] border border-blue-100"
                            >
                              <Tag className="w-2.5 h-2.5 opacity-60" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Opted In
                        </span>
                      </td>
                      <td className="p-4 text-right text-[#777777] font-mono text-[11px]">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Contact Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider">
                  Add New Customer Contact
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-400 hover:text-[#222222]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Phone Number (E.164 with Country Code)</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+971501234567"
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#222222]">First Name</label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#222222]">Last Name</label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#222222]">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="vip, teaser_list, real-estate"
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl gradient-button text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save Contact to Workspace
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
