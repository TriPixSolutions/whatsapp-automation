'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { TemplateTestRunnerDrawer } from '@/components/templates/TemplateTestRunnerDrawer';
import { WorkflowTemplate, TemplateCategory } from '@/types/workflowTemplates';
import {
  Sparkles,
  Zap,
  Search,
  Filter,
  Plus,
  Layers,
  FlaskConical,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  FileCode2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetaTemplateItem } from '@/lib/db/types';
import { PhoneMockup } from '@/components/PhoneMockup';

const CATEGORIES: { label: TemplateCategory; count?: number; icon?: string }[] = [
  { label: 'All' },
  { label: 'Trigger Testing' },
  { label: 'Interactive Buttons' },
  { label: 'E-Commerce & Carousel' },
  { label: 'Schedulers & Delays' },
  { label: 'Lead Capture & CRM' },
  { label: 'Full Demos' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'workflows' | 'meta_hsm'>('workflows');

  // Workflow Templates State
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);
  const [testRunnerTemplate, setTestRunnerTemplate] = useState<WorkflowTemplate | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error'; actionUrl?: string } | null>(null);

  // Meta HSM Templates State
  const [hsmTemplates, setHsmTemplates] = useState<MetaTemplateItem[]>([]);
  const [hsmLoading, setHsmLoading] = useState(false);
  const [selectedHsmTemplate, setSelectedHsmTemplate] = useState<string>('teaser_alert');
  const [hsmTestPhone, setHsmTestPhone] = useState('+919876543210');
  const [hsmSending, setHsmSending] = useState(false);

  // Fetch Workflow Templates
  const fetchWorkflowTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/automations/templates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.warn('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchWorkflowTemplates();
  }, [fetchWorkflowTemplates]);

  // Fetch Meta HSM Templates (if tab opened)
  const fetchHsmTemplates = useCallback(async () => {
    try {
      setHsmLoading(true);
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setHsmTemplates(data);
        if (data.length > 0 && !selectedHsmTemplate) {
          setSelectedHsmTemplate(data[0].name);
        }
      }
    } catch (err) {
      console.warn('Failed to load HSM templates:', err);
    } finally {
      setHsmLoading(false);
    }
  }, [selectedHsmTemplate]);

  useEffect(() => {
    if (activeTab === 'meta_hsm') {
      fetchHsmTemplates();
    }
  }, [activeTab, fetchHsmTemplates]);

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'error' = 'success', actionUrl?: string) => {
    setToastMessage({ text, type, actionUrl });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // One-Click Import Action
  const handleImport = async (template: WorkflowTemplate) => {
    try {
      setIsImporting(template.id);
      const res = await fetch('/api/automations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          templateId: template.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import template');

      showToast(
        `Template "${template.name}" imported successfully as active workflow!`,
        'success',
        '/automations'
      );
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setIsImporting(null);
    }
  };

  // Duplicate Action
  const handleDuplicate = async (template: WorkflowTemplate) => {
    try {
      const res = await fetch('/api/automations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          templateId: template.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate template');

      showToast(`Duplicated "${template.name}" as custom template.`, 'success');
      fetchWorkflowTemplates();
    } catch (err: any) {
      showToast(err.message || 'Duplicate failed', 'error');
    }
  };

  // Dispatch Meta HSM Test
  const handleSendHsmTest = async () => {
    try {
      setHsmSending(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: hsmTestPhone,
          type: 'template',
          templateName: selectedHsmTemplate,
          languageCode: 'en_US',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Template message "${selectedHsmTemplate}" sent to ${hsmTestPhone}!`, 'success');
      } else {
        showToast(data.error || 'Failed to dispatch HSM test', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error dispatching HSM template', 'error');
    } finally {
      setHsmSending(false);
    }
  };

  const currentHsm = hsmTemplates.find((t) => t.name === selectedHsmTemplate) || hsmTemplates[0];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Automation Templates"
          subtitle="Pre-built test automations & verified DAG workflows for engine validation"
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div
              className={cn(
                'p-4 rounded-2xl border flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200',
                toastMessage.type === 'success'
                  ? 'bg-emerald-900 text-white border-emerald-800'
                  : 'bg-red-900 text-white border-red-800'
              )}
            >
              <div className="flex items-center gap-3">
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span className="text-xs font-bold">{toastMessage.text}</span>
              </div>

              {toastMessage.actionUrl && (
                <button
                  onClick={() => router.push(toastMessage.actionUrl!)}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Workflows</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Page Title & Navigation Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <FileCode2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Automation Templates
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Pre-built test automations & verified DAG workflows for engine validation
                  </p>
                </div>
              </div>
            </div>

            {/* Main Tabs Switcher */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl self-start md:self-auto">
              <button
                onClick={() => setActiveTab('workflows')}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
                  activeTab === 'workflows'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Workflow Templates ({templates.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('meta_hsm')}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
                  activeTab === 'meta_hsm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Meta HSM Templates</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: WORKFLOW TEMPLATES LIBRARY */}
          {/* ========================================================================= */}
          {activeTab === 'workflows' && (
            <div className="space-y-6">
              {/* Category Filter Bar & Search */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates by keyword, purpose, or node type..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Showing <b>{templates.length}</b> verified templates</span>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => setSelectedCategory(cat.label)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs border',
                        selectedCategory === cat.label
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  <div className="text-xs font-bold text-slate-500">Loading templates library...</div>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No templates found</div>
                  <div className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search query or switching to another category.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {templates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onPreview={(t) => setPreviewTemplate(t)}
                      onImport={handleImport}
                      onRunTest={(t) => setTestRunnerTemplate(t)}
                      onDuplicate={handleDuplicate}
                      isImporting={isImporting === tpl.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: META HSM MESSAGE TEMPLATES */}
          {/* ========================================================================= */}
          {activeTab === 'meta_hsm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* HSM List */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900">Official Meta HSM Templates</h3>
                  <button
                    onClick={fetchHsmTemplates}
                    disabled={hsmLoading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', hsmLoading && 'animate-spin')} />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {hsmTemplates.map((tmpl) => (
                    <div
                      key={tmpl.name}
                      onClick={() => setSelectedHsmTemplate(tmpl.name)}
                      className={cn(
                        'p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3',
                        selectedHsmTemplate === tmpl.name
                          ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{tmpl.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {tmpl.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{tmpl.body}</p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 font-bold">
                        {tmpl.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HSM Dispatch Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                  <h3 className="text-sm font-black text-slate-900">Dispatch Live HSM Test</h3>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Recipient Phone Number
                    </label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-900 transition-colors">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={hsmTestPhone}
                        onChange={(e) => setHsmTestPhone(e.target.value)}
                        className="text-xs font-mono font-semibold text-slate-800 bg-transparent outline-none w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendHsmTest}
                    disabled={hsmSending}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>{hsmSending ? 'Dispatching...' : `Send Template "${selectedHsmTemplate}"`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* WhatsApp Phone Mockup Preview */}
                {currentHsm && (
                  <div className="flex justify-center">
                    <PhoneMockup
                      businessName="TriPix Verified"
                      templateName={currentHsm.name}
                      bodyText={currentHsm.body}
                      headerText={currentHsm.header}
                      footerText={currentHsm.footer}
                      messageType="button"
                      buttons={currentHsm.buttons?.map((b: any) => ({
                        id: b.id || 'btn',
                        title: b.text || b.title,
                      }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals and Drawers */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onImport={handleImport}
        onRunTest={(t) => setTestRunnerTemplate(t)}
        onDuplicate={handleDuplicate}
        isImporting={isImporting === previewTemplate?.id}
      />

      <TemplateTestRunnerDrawer
        template={testRunnerTemplate}
        onClose={() => setTestRunnerTemplate(null)}
        onImportAfterTest={handleImport}
      />
    </div>
  );
}
