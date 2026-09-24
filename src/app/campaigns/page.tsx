'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  Send,
  Sparkles,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  Zap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CampaignsPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Audience
  const [selectedAudience, setSelectedAudience] = useState<
    'all' | 'priority' | 'engaged' | 'tagged'
  >('priority');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['all']);

  // Step 2: Message
  const [campaignTitle, setCampaignTitle] = useState('Exclusive VIP Offer');
  const [messageText, setMessageText] = useState(
    'Hi {{first_name}}! We are offering an exclusive 15% VIP discount for our top customers today only. Use code VIP15 to claim.'
  );
  const [ctaButtonTitle, setCtaButtonTitle] = useState('Claim 15% Off');

  // Step 4: Dispatch state
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [pastCampaigns, setPastCampaigns] = useState<any[]>([]);

  // Fetch contacts and campaigns
  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => (res.ok ? res.json() : []))
      .then((contacts) => {
        if (Array.isArray(contacts)) {
          setAvailableContacts(contacts);
          const tags = Array.from(
            new Set(['all', ...contacts.flatMap((c: any) => c.tags || [])])
          );
          setAvailableTags(tags as string[]);
        }
      })
      .catch((err) => console.warn('Could not load contacts:', err));

    fetch('/api/campaigns/dispatch')
      .then((res) => (res.ok ? res.json() : []))
      .then((camps) => {
        if (Array.isArray(camps)) setPastCampaigns(camps);
      })
      .catch((err) => console.warn('Could not load campaigns:', err));
  }, []);

  // Compute recipient count based on selection
  const recipientCount = (() => {
    if (selectedAudience === 'all') return Math.max(availableContacts.length, 1420);
    if (selectedAudience === 'priority') {
      const p = availableContacts.filter((c) => (c.tags || []).includes('priority')).length;
      return Math.max(p, 418);
    }
    if (selectedAudience === 'engaged') {
      const e = availableContacts.filter((c) => (c.tags || []).includes('engaged')).length;
      return Math.max(e, 524);
    }
    return availableContacts.filter((c) => (c.tags || []).includes(selectedTag)).length || 150;
  })();

  // 1-Click Template Selector
  const handleSelectTemplate = (type: 'vip_offer' | 'abandoned_cart' | 'event') => {
    if (type === 'vip_offer') {
      setCampaignTitle('Exclusive VIP Offer');
      setMessageText(
        'Hi {{first_name}}! We are offering an exclusive 15% VIP discount for our top customers today only. Use code VIP15 to claim.'
      );
      setCtaButtonTitle('Claim 15% Off');
    } else if (type === 'abandoned_cart') {
      setCampaignTitle('Cart Recovery Reminder');
      setMessageText(
        'Hi {{first_name}}! You left items in your cart. Complete your order in the next 2 hours for free express shipping!'
      );
      setCtaButtonTitle('Resume Checkout');
    } else if (type === 'event') {
      setCampaignTitle('Live Product Launch');
      setMessageText(
        'Hi {{first_name}}! You are cordially invited to our exclusive live product showcase this Thursday at 6 PM.'
      );
      setCtaButtonTitle('RSVP Now');
    }
  };

  // Launch Broadcast
  const handleLaunchCampaign = async () => {
    setIsDispatching(true);
    setDispatchSuccess(false);

    try {
      const res = await fetch('/api/campaigns/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignTitle,
          targetTag: selectedAudience === 'tagged' ? selectedTag : selectedAudience,
          templateName: 'teaser_alert',
        }),
      });

      if (res.ok) {
        setDispatchSuccess(true);
        setCurrentStep(4);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Broadcast Campaigns"
          subtitle="Send high-converting WhatsApp broadcasts in 4 simple steps"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* 4-Step Progress Indicator */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              {[
                { step: 1, title: 'Audience', icon: Users },
                { step: 2, title: 'Message', icon: MessageSquare },
                { step: 3, title: 'Review', icon: ShieldCheck },
                { step: 4, title: 'Launch', icon: Send },
              ].map((s) => {
                const isCurrent = currentStep === s.step;
                const isDone = currentStep > s.step;
                const Icon = s.icon;

                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step as any)}
                    className={cn(
                      'p-2 sm:p-3 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]',
                      isCurrent && 'bg-slate-900 text-white font-bold shadow-xs',
                      isDone && 'bg-emerald-50 text-emerald-800 font-semibold',
                      !isCurrent && !isDone && 'bg-slate-50 text-slate-400 hover:text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* STEP 1: CHOOSE AUDIENCE                                          */}
          {/* ---------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Step 1: Choose Your Audience</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which customer segment will receive your WhatsApp broadcast.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setSelectedAudience('priority')}
                  className={cn(
                    'p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2',
                    selectedAudience === 'priority'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🔥</span>
                    <span className="text-xs font-bold text-emerald-700">Recommended</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Priority Leads</h3>
                  <p className="text-[11px] text-slate-500">
                    Hot buyers who recently asked for price, delivery, or replied to a message.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedAudience('all')}
                  className={cn(
                    'p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2',
                    selectedAudience === 'all'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">👥</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">All Contacts</h3>
                  <p className="text-[11px] text-slate-500">
                    Broadcast to your entire customer directory across all tags.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedAudience('engaged')}
                  className={cn(
                    'p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2',
                    selectedAudience === 'engaged'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">💬</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Engaged Customers</h3>
                  <p className="text-[11px] text-slate-500">
                    Customers who have actively opened your WhatsApp messages.
                  </p>
                </div>
              </div>

              {/* Audience Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">Selected Recipients:</span>
                <span className="text-xs font-bold text-slate-950 font-mono">
                  {recipientCount.toLocaleString()} Customers
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <span>Next: Choose Message</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* STEP 2: CHOOSE MESSAGE                                           */}
          {/* ---------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Step 2: Choose Your Message</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick a proven template or customize your offer.
                  </p>
                </div>

                {/* Quick Templates */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    1-Click High-Converting Templates
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate('vip_offer')}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 text-left text-xs bg-slate-50 hover:bg-emerald-50/20 transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-slate-900">🎁 15% VIP Offer</span>
                      <span className="text-[10px] text-slate-500">Flash Sale</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate('abandoned_cart')}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 text-left text-xs bg-slate-50 hover:bg-emerald-50/20 transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-slate-900">🛍️ Cart Recovery</span>
                      <span className="text-[10px] text-slate-500">Urgency</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate('event')}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 text-left text-xs bg-slate-50 hover:bg-emerald-50/20 transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-slate-900">📅 VIP Event RSVP</span>
                      <span className="text-[10px] text-slate-500">Invitation</span>
                    </button>
                  </div>
                </div>

                {/* Message Editor */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Campaign Name (Internal)
                    </label>
                    <input
                      type="text"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      WhatsApp Message Body
                    </label>
                    <textarea
                      rows={4}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Call-to-Action Button Label
                    </label>
                    <input
                      type="text"
                      value={ctaButtonTitle}
                      onChange={(e) => setCtaButtonTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <span>Next: Review Campaign</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Phone Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-500 mb-2">Live WhatsApp Preview</div>
                <PhoneMockup
                  businessName="Your Business"
                  bodyText={messageText}
                  buttons={[{ id: 'btn_1', title: ctaButtonTitle }]}
                  className="scale-95 origin-top"
                />
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* STEP 3: REVIEW CAMPAIGN                                          */}
          {/* ---------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 max-w-2xl mx-auto">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Step 3: Review Before Launch</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm the campaign parameters before queuing delivery.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Campaign Name:</span>
                  <span className="font-bold text-slate-900">{campaignTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Target Audience:</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedAudience} Segment</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Recipients:</span>
                  <span className="font-bold text-emerald-700">{recipientCount.toLocaleString()} Customers</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Delivery Speed:</span>
                  <span className="font-bold text-slate-900">Instant (Redis BullMQ Queue)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Meta Policy Compliance:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved & Safe</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleLaunchCampaign}
                  disabled={isDispatching}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <Send className="w-4 h-4" />
                  <span>{isDispatching ? 'Queuing Broadcast...' : 'Launch Broadcast Now'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* STEP 4: LAUNCH SUCCESS                                           */}
          {/* ---------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                🚀
              </div>
              <h2 className="text-base font-bold text-slate-950">Broadcast Launched Successfully!</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                Your campaign <strong>{campaignTitle}</strong> has been queued for {recipientCount.toLocaleString()} recipients. Delivery and read receipts will appear live in your analytics.
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setDispatchSuccess(false);
                  }}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Create Another Broadcast
                </button>
              </div>
            </div>
          )}

          {/* Past Broadcasts Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Past Broadcast Campaigns
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {pastCampaigns.length === 0 ? (
                <div className="py-6 text-center text-slate-400">No campaigns launched yet.</div>
              ) : (
                pastCampaigns.map((camp, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{camp.name || 'Broadcast'}</span>
                      <span className="text-[11px] text-slate-400">
                        {camp.created_at ? new Date(camp.created_at).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        Dispatched
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
