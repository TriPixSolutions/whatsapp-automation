'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CsvImporter } from '@/components/CsvImporter';
import {
  Contact,
  Search,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Tag,
  Phone,
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  MoreVertical,
  Filter,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactItem {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  company?: string;
  tags: string[];
  optin_status: boolean;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [availableTags, setAvailableTags] = useState<string[]>(['all']);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newTag, setNewTag] = useState('Customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setContacts(data);
          const tags = Array.from(new Set(['all', ...data.flatMap((c: any) => c.tags || [])]));
          setAvailableTags(tags);
        }
      }
    } catch (err) {
      console.warn('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newPhone,
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          company: newCompany,
          tags: [newTag],
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewPhone('');
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewCompany('');
        setFeedback('Customer contact added successfully!');
        setTimeout(() => setFeedback(null), 3500);
        await fetchContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts(contacts.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (tagFilter !== 'all' && !c.tags.includes(tagFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(q);
      const matchPhone = (c.phone_number || '').includes(q);
      const matchCompany = (c.company || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCompany) return false;
    }
    return true;
  });

  const exportContactsCsv = () => {
    const headers = ['Phone Number,First Name,Last Name,Email,Company,Tags'];
    const rows = filteredContacts.map((c) =>
      `"${c.phone_number}","${c.first_name || ''}","${c.last_name || ''}","${c.email || ''}","${c.company || ''}","${(c.tags || []).join(';')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsapp_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Contacts"
          subtitle="Manage your customer phonebook and segment audience with tags"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full pb-24 md:pb-12">
          {/* Top Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-2.5 py-2 text-slate-700 cursor-pointer focus:outline-none"
                >
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag === 'all' ? 'All Tags' : `#${tag}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                onClick={exportContactsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Contacts Data Grid (Desktop Table + Mobile Cards) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">WhatsApp Phone</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4">Added On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Loading contacts directory...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Contact className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-600 text-sm">No contacts found</p>
                            <p className="text-xs text-slate-400">Click &quot;Add Contact&quot; or &quot;Import CSV&quot; to begin</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => {
                      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'WhatsApp Customer';
                      return (
                        <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                {fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {fullName}
                                </p>
                                {contact.company && (
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {contact.company}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {contact.phone_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              {(contact.tags || []).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(contact.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/inbox?phone=${encodeURIComponent(contact.phone_number)}`}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(contact.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards (Zero Horizontal Scrolling) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredContacts.map((contact) => {
                const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'WhatsApp Customer';
                return (
                  <div key={contact.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{contact.phone_number}</p>
                        </div>
                      </div>
                      <Link
                        href={`/inbox?phone=${encodeURIComponent(contact.phone_number)}`}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {(contact.tags || []).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Contact Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add New Contact</h3>
                    <p className="text-xs text-slate-500">Save a customer for WhatsApp automations</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddContact} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      WhatsApp Phone Number (with Country Code) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+919876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tag / Group</label>
                    <input
                      type="text"
                      placeholder="e.g. VIP, Retail, Wholesale"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSubmitting ? 'Saving...' : 'Add Contact'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Import CSV Modal */}
          {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Import Contacts</h3>
                    <p className="text-xs text-slate-500">Upload CSV or Excel with phone numbers</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <CsvImporter
                  onImportSuccess={(count) => {
                    setShowImportModal(false);
                    setFeedback(`Successfully imported ${count} contacts!`);
                    setTimeout(() => setFeedback(null), 3500);
                    fetchContacts();
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

