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
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '00000000-0000-0000-0000-000000000011',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+971501234567',
      first_name: 'Julian',
      last_name: 'Vance',
      tags: ['vip', 'teaser_list', 'private-aviation'],
      optin_status: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+447700900123',
      first_name: 'Lady Eleanor',
      last_name: 'Sterling',
      tags: ['vip', 'teaser_list', 'haute-horlogerie'],
      optin_status: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+14155552671',
      first_name: 'Marcus',
      last_name: 'Castile',
      tags: ['vip', 'teaser_list', 'luxury-villas'],
      optin_status: true,
      created_at: new Date().toISOString(),
    },
  ]);

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
        if (Array.isArray(data) && data.length > 0) {
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
    <div className="min-h-screen bg-[#07090E] pl-64 flex flex-col">
      <Sidebar />
      <Header
        title="High-Ticket Audience & Contacts"
        subtitle="Manage segmented phone registries, tags, and verified opt-in statuses"
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or international phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-[#D4AF37]"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#E6C687]" />
              <span>Bulk Import CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black text-xs font-semibold uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add VIP Contact</span>
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
        <div className="rounded-2xl bg-[#0B0F17]/90 border border-white/10 overflow-hidden shadow-luxury-md">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E6C687]" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Audience Directory ({filtered.length} Contacts)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-[10px] uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="p-4">Contact Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Audience Tags</th>
                  <th className="p-4">Opt-In Status</th>
                  <th className="p-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-white">
                      {contact.first_name} {contact.last_name || ''}
                    </td>
                    <td className="p-4 font-mono text-[#E6C687]">
                      {contact.phone_number}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {contact.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-zinc-300 border border-white/10"
                          >
                            <Tag className="w-2.5 h-2.5 text-zinc-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Opted In
                      </span>
                    </td>
                    <td className="p-4 text-right text-zinc-500 font-mono text-[11px]">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Contact Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0B0F17] border border-white/10 rounded-2xl p-6 space-y-5 shadow-luxury-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Add Single VIP Contact
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Phone Number (E.164 with Country Code)</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+971501234567"
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">First Name</label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="Julian"
                      className="w-full bg-[#111622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Last Name</label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Vance"
                      className="w-full bg-[#111622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="vip, teaser_list, yachting"
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
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
