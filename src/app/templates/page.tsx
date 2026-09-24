'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  FileText,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Smartphone,
  ExternalLink,
  Layers,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetaTemplateItem } from '@/lib/db/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MetaTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('teaser_alert');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Test Dispatch state
  const [testPhoneNumber, setTestPhoneNumber] = useState('+919876543210');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplateName) {
          setSelectedTemplateName(data[0].name);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateName]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSyncMeta = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_meta' }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Synced ${data.count || 0} templates from Meta WhatsApp Business Account.`);
        await fetchTemplates();
      } else {
        setToastMessage(data.error || 'Sync failed. Check WABA credentials in Settings.');
      }
    } catch (err: any) {
      setToastMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSendTestTemplate = async () => {
    if (!activeTemplate || !testPhoneNumber) return;
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testPhoneNumber,
          type: 'template',
          templateName: activeTemplate.name,
          languageCode: activeTemplate.language,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Test template "${activeTemplate.name}" dispatched successfully!`);
      } else {
        setToastMessage(`Test dispatch notice: ${data.error || 'Dispatched in sandbox'}`);
      }
    } catch (err: any) {
      setToastMessage(`Test failed: ${err.message}`);
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const activeTemplate = templates.find((t) => t.name === selectedTemplateName) || templates[0] || {
    id: 'sample',
    name: 'teaser_alert',
    category: 'MARKETING' as const,
    language: 'en_US',
    status: 'APPROVED' as const,
    body: 'Hello {{1}}! We have an exclusive VIP update regarding your inquiry. Reply to speak with our specialist.',
    header: 'VIP Notification',
    footer: 'Reply STOP to unsubscribe',
    buttons: [
      { id: '1', type: 'QUICK_REPLY' as const, text: 'View VIP Update' },
      { id: '2', type: 'QUICK_REPLY' as const, text: 'Chat with Specialist' },
    ],
    updatedAt: new Date().toISOString(),
  };

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="WhatsApp Templates"
          subtitle="Pre-approved Meta templates, variable customization & live device rendering"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates by name or keyword..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncMeta}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={cn('w-3.5 h-3.5 text-emerald-700', syncing && 'animate-spin')} />
                <span>{syncing ? 'Syncing WABA...' : 'Sync from Meta'}</span>
              </button>
            </div>
          </div>

          {/* Toast Message */}
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Two-Column Layout: Templates List (Left) + Realistic Phone Simulator (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Templates List */}
            <div className="lg:col-span-7 space-y-3">
              {filteredTemplates.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700 text-sm">No templates matched</p>
                  <p className="text-xs text-slate-400">Click &apos;Sync from Meta&apos; to import approved templates</p>
                </div>
              ) : (
                filteredTemplates.map((template) => {
                  const isSelected = selectedTemplateName === template.name;
                  return (
                    <div
                      key={template.name}
                      onClick={() => setSelectedTemplateName(template.name)}
                      className={cn(
                        'bg-white rounded-2xl p-4 border transition-all cursor-pointer space-y-2 shadow-2xs hover:shadow-xs',
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/10'
                          : 'border-slate-200/90 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 font-mono">{template.name}</h4>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              template.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            )}
                          >
                            {template.status}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                          {template.category} • {template.language}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-2">
                        {template.body}
                      </p>

                      {template.buttons && template.buttons.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {template.buttons.map((b) => (
                            <span
                              key={b.id}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                            >
                              [Button] {b.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right 5 Columns: Realistic Mobile Phone Simulator & Test Dispatch */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Live Device Preview
                    </h3>
                    <p className="text-[11px] text-slate-500">Real-time Meta template rendering</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    WYSIWYG
                  </span>
                </div>

                {/* Phone Simulator */}
                <PhoneMockup
                  businessName="TriPix Concierge"
                  templateName={activeTemplate.name}
                  headerText={activeTemplate.header}
                  bodyText={activeTemplate.body.replace('{{1}}', 'Alex').replace('{{2}}', 'Luxury Collection')}
                  footerText={activeTemplate.footer}
                  buttons={activeTemplate.buttons?.map((b) => ({ id: b.id, title: b.text }))}
                  messageType="template"
                  className="scale-95 -my-2"
                />

                {/* Test Dispatch to Mobile Box */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Send Test Template
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="+919876543210"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      disabled={isSendingTest}
                      onClick={handleSendTestTemplate}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingTest ? 'Sending...' : 'Send Test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
