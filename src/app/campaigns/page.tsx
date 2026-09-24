'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup, PhoneMockupProps } from '@/components/PhoneMockup';
import {
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Plus,
  Clock,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  MapPin,
  User,
  List,
  Layers,
  ShoppingBag,
  Tag,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type BroadcastAudience = 'all' | 'leads' | 'customers' | 'custom';

export type BroadcastMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'button'
  | 'list'
  | 'carousel'
  | 'template'
  | 'catalog'
  | 'whatsapp_flow'
  | 'coupon';

export default function BroadcastPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 1. Audience State
  const [selectedAudience, setSelectedAudience] = useState<BroadcastAudience>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [contacts, setContacts] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['all']);

  // 2. Message Builder State
  const [campaignName, setCampaignName] = useState('Product Announcement');
  const [messageType, setMessageType] = useState<BroadcastMessageType>('text');
  const [bodyText, setBodyText] = useState('Hello {{name}}! We are pleased to share our latest product updates with you.');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('TriPix Official Support');
  const [mediaUrl, setMediaUrl] = useState('');
  const [couponCode, setCouponCode] = useState('SAVE15');
  const [buttons, setButtons] = useState<{ id: string; title: string }[]>([
    { id: 'btn_1', title: 'View Catalog' },
    { id: 'btn_2', title: 'Contact Us' },
  ]);

  // 3. Dispatch & History State
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [pastCampaigns, setPastCampaigns] = useState<any[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Load real data
  const loadData = useCallback(async () => {
    try {
      setLoadingPast(true);
      const [contactsRes, campsRes] = await Promise.all([
        fetch('/api/contacts').catch(() => null),
        fetch('/api/campaigns/dispatch').catch(() => null),
      ]);

      if (contactsRes?.ok) {
        const cData = await contactsRes.json();
        if (Array.isArray(cData)) {
          setContacts(cData);
          const tags = Array.from(new Set(['all', ...cData.flatMap((c: any) => c.tags || [])]));
          setAvailableTags(tags as string[]);
        }
      }

      if (campsRes?.ok) {
        const campData = await campsRes.json();
        if (Array.isArray(campData)) {
          setPastCampaigns(campData);
        }
      }
    } catch (e) {
      console.warn('Error loading broadcast data:', e);
    } finally {
      setLoadingPast(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute recipient count strictly from real database
  const recipientCount = (() => {
    if (selectedAudience === 'all') return contacts.length;
    if (selectedAudience === 'leads') {
      return contacts.filter((c) => (c.tags || []).includes('Lead') || c.stage === 'New Lead').length;
    }
    if (selectedAudience === 'customers') {
      return contacts.filter((c) => (c.tags || []).includes('Customer') || c.stage === 'Won').length;
    }
    return contacts.filter((c) => (c.tags || []).includes(selectedTag)).length;
  })();

  const handleInsertVariable = (variable: string) => {
    setBodyText((prev) => `${prev} {{${variable}}}`);
  };

  const handleLaunchBroadcast = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/campaigns/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          targetAudience: selectedAudience,
          targetTag: selectedTag,
          messageType,
          bodyText,
          headerText,
          footerText,
          mediaUrl,
          couponCode,
          buttons,
        }),
      });

      if (res.ok) {
        setDispatchSuccess(true);
        loadData();
        setTimeout(() => {
          setCurrentStep(1);
          setDispatchSuccess(false);
        }, 2000);
      }
    } catch (e) {
      console.warn('Dispatch failed:', e);
    } finally {
      setIsDispatching(false);
    }
  };

  const messageTypeOptions: { type: BroadcastMessageType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: 'text', label: 'Text', icon: FileText },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'video', label: 'Video', icon: Video },
    { type: 'audio', label: 'Audio', icon: Music },
    { type: 'document', label: 'Document', icon: FileText },
    { type: 'location', label: 'Location', icon: MapPin },
    { type: 'contact', label: 'Contact', icon: User },
    { type: 'button', label: 'Buttons', icon: CheckCircle2 },
    { type: 'list', label: 'List', icon: List },
    { type: 'carousel', label: 'Carousel', icon: Layers },
    { type: 'template', label: 'Template', icon: FileText },
    { type: 'catalog', label: 'Catalog', icon: ShoppingBag },
    { type: 'whatsapp_flow', label: 'Flow', icon: Send },
    { type: 'coupon', label: 'Coupon', icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Broadcast Campaigns"
        subtitle="Send targeted WhatsApp announcements, catalogs, and media messages with verified delivery tracking"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-12">
        {/* Wizard Steps Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { num: 1, name: 'Target Audience' },
              { num: 2, name: 'Message Builder' },
              { num: 3, name: 'Review & Send' },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.num as any)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer',
                    currentStep === step.num
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {step.num}
                  </span>
                  <span>{step.name}</span>
                </button>
                {idx < 2 && <span className="text-slate-300">/</span>}
              </React.Fragment>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            Recipients: <strong>{recipientCount}</strong> contacts
          </span>
        </div>

        {/* 2-Column Main Builder Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* STEP 1: TARGET AUDIENCE */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
                  <h3 className="text-sm font-bold text-slate-900">Select Target Audience</h3>
                  <p className="text-xs text-slate-500">
                    Choose which contacts will receive this WhatsApp broadcast announcement.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setSelectedAudience('all')}
                    className={cn(
                      'p-4 rounded-xl border text-left cursor-pointer transition-all space-y-1',
                      selectedAudience === 'all'
                        ? 'bg-slate-50 border-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900 block">All Contacts</span>
                    <span className="text-xs font-mono font-bold text-slate-600 block">{contacts.length} recipients</span>
                  </div>

                  <div
                    onClick={() => setSelectedAudience('leads')}
                    className={cn(
                      'p-4 rounded-xl border text-left cursor-pointer transition-all space-y-1',
                      selectedAudience === 'leads'
                        ? 'bg-slate-50 border-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900 block">Active Leads</span>
                    <span className="text-xs font-mono font-bold text-slate-600 block">
                      {contacts.filter((c) => (c.tags || []).includes('Lead')).length} recipients
                    </span>
                  </div>

                  <div
                    onClick={() => setSelectedAudience('customers')}
                    className={cn(
                      'p-4 rounded-xl border text-left cursor-pointer transition-all space-y-1',
                      selectedAudience === 'customers'
                        ? 'bg-slate-50 border-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900 block">Customers</span>
                    <span className="text-xs font-mono font-bold text-slate-600 block">
                      {contacts.filter((c) => (c.tags || []).includes('Customer')).length} recipients
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Proceed to Message Builder</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MESSAGE BUILDER (All 15 Types Supported) */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
                  <h3 className="text-sm font-bold text-slate-900">Configure Broadcast Message</h3>
                  <p className="text-xs text-slate-500">
                    Select the WhatsApp message format and customize content with dynamic variables.
                  </p>
                </div>

                {/* Campaign Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Campaign Title</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                  />
                </div>

                {/* Message Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Message Format</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {messageTypeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = messageType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setMessageType(opt.type)}
                          className={cn(
                            'p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1',
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Media URL for Media Types */}
                {(messageType === 'image' || messageType === 'video' || messageType === 'audio' || messageType === 'document') && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Media File URL ({messageType.toUpperCase()})
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/asset.jpg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                )}

                {/* Coupon Code for Coupon Type */}
                {messageType === 'coupon' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="SAVE20"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                )}

                {/* Header Text */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Header Title (Optional)</label>
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="e.g. VIP Announcement"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                {/* Message Body & Dynamic Variables */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Message Body</label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Insert Variable:</span>
                      {['name', 'phone', 'company'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleInsertVariable(v)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          &#123;&#123;{v}&#125;&#125;
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                {/* Buttons Configuration for Button/Template Message */}
                {(messageType === 'button' || messageType === 'template') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Call to Action Buttons</label>
                    <div className="space-y-1.5">
                      {buttons.map((btn, bIdx) => (
                        <input
                          key={btn.id}
                          type="text"
                          value={btn.title}
                          onChange={(e) => {
                            const updated = [...buttons];
                            updated[bIdx].title = e.target.value;
                            setButtons(updated);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Review & Schedule</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & SEND */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
                  <h3 className="text-sm font-bold text-slate-900">Review & Launch Broadcast</h3>
                  <p className="text-xs text-slate-500">
                    Verify recipient count and message parameters before dispatch.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Campaign Title
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">{campaignName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Message Format
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block uppercase font-mono">
                      {messageType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Target Audience
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block capitalize">
                      {selectedAudience} Audience
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Recipients
                    </span>
                    <span className="text-xs font-bold text-emerald-800 font-mono mt-0.5 block">
                      {recipientCount} Contacts
                    </span>
                  </div>
                </div>

                {dispatchSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">Broadcast queued and dispatched successfully via Meta Cloud API.</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchBroadcast}
                    disabled={isDispatching || recipientCount === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className={cn('w-4 h-4', isDispatching && 'animate-spin')} />
                    <span>{isDispatching ? 'Dispatching Broadcast...' : 'Launch Broadcast Now'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Past Campaigns Log (Strictly Real Data, Zero Dummy) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Broadcast History & Delivery
                </h4>
                <button
                  type="button"
                  onClick={loadData}
                  className="text-slate-400 hover:text-slate-800 p-1"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loadingPast && 'animate-spin')} />
                </button>
              </div>

              {pastCampaigns.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {pastCampaigns.map((camp) => (
                    <div key={camp.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{camp.name || 'Broadcast'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(camp.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Sent</span>
                          <span className="font-mono font-bold text-slate-800">{camp.sentCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Delivered</span>
                          <span className="font-mono font-bold text-emerald-800">{camp.deliveredCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-blue-700 uppercase font-bold block">Read</span>
                          <span className="font-mono font-bold text-blue-800">{camp.readCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-slate-600">No broadcast campaigns sent yet</p>
                  <p className="text-[11px] text-slate-400">
                    Your sent campaigns and delivery receipts will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live WhatsApp Device Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Broadcast Phone Preview
              </span>
              <span className="text-[11px] text-slate-500 font-semibold font-mono uppercase">
                {messageType}
              </span>
            </div>

            <PhoneMockup
              businessName="Your Business"
              headerText={headerText}
              bodyText={bodyText}
              footerText={footerText}
              messageType={messageType}
              mediaUrl={mediaUrl}
              mediaType={messageType === 'video' ? 'video' : messageType === 'audio' ? 'audio' : messageType === 'document' ? 'document' : 'image'}
              couponCode={couponCode}
              buttons={buttons}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
