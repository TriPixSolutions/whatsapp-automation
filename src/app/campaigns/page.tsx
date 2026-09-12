'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PhoneMockup } from '@/components/PhoneMockup';
import {
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  CheckCheck,
  AlertCircle,
  Loader2,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Campaign } from '@/types';

const META_TEMPLATES = [
  {
    id: 'teaser_alert',
    name: 'teaser_alert',
    category: 'MARKETING',
    bodyText: 'Something big is coming soon. Are you ready?',
    header: 'Passion Fruit Private Showcase',
    footer: 'Official WhatsApp Business Verified',
    ctaButton: 'Discover Collection',
    type: 'broadcast',
  },
  {
    id: 'shopify_abandoned_cart',
    name: 'shopify_abandoned_cart',
    category: 'E-COMMERCE',
    bodyText: 'Hi {{1}}! You left your {{2}} in your cart. Complete your purchase now and enjoy 10% off with code PASSION10.',
    header: 'Complete Your Order',
    footer: 'Limited Time Offer • 1-Tap WhatsApp Checkout',
    ctaButton: 'Resume Checkout',
    type: 'commerce',
  },
  {
    id: 'order_confirmation',
    name: 'order_confirmation',
    category: 'TRANSACTIONAL',
    bodyText: 'Thank you for your order {{1}}! Your item {{2}} has been confirmed and dispatched via Express Courier.',
    header: 'Order Shipped #{{3}}',
    footer: 'Real-time Tracking Active',
    ctaButton: 'Track Live Delivery',
    type: 'transactional',
  },
  {
    id: 'catalog_showcase',
    name: 'catalog_showcase',
    category: 'COMMERCE',
    bodyText: 'Explore our latest Passion Fruit WhatsApp Catalog collection. Tap below to browse products and place your order directly in chat.',
    header: 'Digital Catalog Lookbook',
    footer: 'Free Insured Worldwide Delivery',
    ctaButton: 'View Catalog Items',
    type: 'commerce',
  },
];

export default function CampaignsPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState('teaser_alert');
  const [campaignName, setCampaignName] = useState('Exclusive Teaser Drop - Fall Collection');
  const [targetTag, setTargetTag] = useState('teaser_list');
  const [var1, setVar1] = useState('Julian');
  const [var2, setVar2] = useState('Grand Complication Watch');
  const [var3, setVar3] = useState('PF-9824');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<any>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '00000000-0000-0000-0000-000000000021',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      campaign_name: 'Exclusive Teaser Drop - Fall Collection',
      template_name: 'teaser_alert',
      target_tag: 'teaser_list',
      status: 'completed',
      total_recipients: 3,
      sent_count: 3,
      failed_count: 0,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      completed_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
    },
  ]);

  const activeTemplate = META_TEMPLATES.find((t) => t.id === selectedTemplateId) || META_TEMPLATES[0];

  const computedPreviewBody = activeTemplate.bodyText
    .replace('{{1}}', var1 || 'Customer')
    .replace('{{2}}', var2 || 'Item')
    .replace('{{3}}', var3 || '1001');

  const computedPreviewHeader = activeTemplate.header.replace('{{3}}', var3 || '1001');

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setDispatchStatus(null);

    try {
      const res = await fetch('/api/campaigns/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: `camp_${Date.now()}`,
          workspaceId: '00000000-0000-0000-0000-000000000001',
          templateName: activeTemplate.name,
          targetTag,
          variables: { '1': var1, '2': var2, '3': var3 },
        }),
      });

      const data = await res.json();
      setDispatchStatus(data);

      if (res.ok && data.success) {
        setCampaigns((prev) => [
          {
            id: `camp_${Date.now()}`,
            workspace_id: '00000000-0000-0000-0000-000000000001',
            campaign_name: campaignName,
            template_name: activeTemplate.name,
            target_tag: targetTag,
            status: 'completed',
            total_recipients: 3,
            sent_count: 3,
            failed_count: 0,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setDispatchStatus({ error: err.message });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pl-64 flex flex-col font-sans">
      <Sidebar />
      <Header
        title="Send WhatsApp Broadcasts & Product Offers"
        subtitle="Reach 1,000s of customers with official Meta templates, order alerts, and catalog showcases"
      />

      <main className="p-8 space-y-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Campaign Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-6 shadow-zap-sm">
              <div className="border-b border-[#E5E7EB] pb-4">
                <h3 className="text-base font-bold text-[#222222] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0066FF]" />
                  WhatsApp Broadcast & Campaign Setup
                </h3>
                <p className="text-xs text-[#777777] mt-1">
                  Send official Meta Cloud API templates with personalized customer names and safe delivery rate protection
                </p>
              </div>

              <form onSubmit={handleDispatch} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#222222]">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#222222]">
                      Meta Template Selection
                    </label>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Meta Approved
                    </span>
                  </div>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF] font-mono"
                  >
                    {META_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} [{tpl.category}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#222222]">Target Segment Tag</label>
                    <select
                      value={targetTag}
                      onChange={(e) => setTargetTag(e.target.value)}
                      className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                    >
                      <option value="teaser_list">teaser_list (Test Flow 1)</option>
                      <option value="vip">vip (All High-Value Patrons)</option>
                      <option value="ctwa-instagram">ctwa-instagram (Ad Leads)</option>
                      <option value="haute-horlogerie">haute-horlogerie</option>
                      <option value="all">All Opted-In Audience</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#222222]">Rate Limiting Pacing</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0066FF]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>50ms / message (20 msgs/sec)</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Variable Mapper (Wati Variable Feature) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    Wati Dynamic Template Variable Substitution
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#555555]">{'{{1}}'} Customer Name</label>
                      <input
                        type="text"
                        value={var1}
                        onChange={(e) => setVar1(e.target.value)}
                        placeholder="Julian"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#555555]">{'{{2}}'} Item / Category</label>
                      <input
                        type="text"
                        value={var2}
                        onChange={(e) => setVar2(e.target.value)}
                        placeholder="Grand Complication"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#555555]">{'{{3}}'} Order ID / Code</label>
                      <input
                        type="text"
                        value={var3}
                        onChange={(e) => setVar3(e.target.value)}
                        placeholder="PF-9824"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#222222] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isDispatching}
                  className="w-full py-3 rounded-xl gradient-button text-white font-semibold text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pushing to Hostinger BullMQ Queue...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch WhatsApp Broadcast</span>
                    </>
                  )}
                </button>
              </form>

              {dispatchStatus && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl text-xs font-mono flex items-center gap-2',
                    dispatchStatus.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  )}
                >
                  {dispatchStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>
                    {dispatchStatus.message || dispatchStatus.error} (Job: {dispatchStatus.jobId})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Live Template Visual Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-widest text-[#0066FF] font-bold font-mono">
                Live WhatsApp Device Preview
              </span>
            </div>
            <PhoneMockup
              businessName="Passion Fruit Concierge"
              templateName={activeTemplate.name}
              bodyText={computedPreviewBody}
              headerText={computedPreviewHeader}
              footerText={activeTemplate.footer}
              buttons={[{ id: 'btn_cta', title: activeTemplate.ctaButton }]}
              showInboundReply={false}
            />
          </div>
        </div>

        {/* Campaign History */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 space-y-4 shadow-zap-sm">
          <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0066FF]" />
            Recent Broadcast Campaigns (campaigns table)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs text-[#555555]">
              <thead className="bg-slate-50 text-[10px] uppercase text-[#777777] tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3.5">Campaign Name</th>
                  <th className="p-3.5">Template</th>
                  <th className="p-3.5">Target Tag</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Sent / Total</th>
                  <th className="p-3.5 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-sans font-semibold text-[#222222]">{camp.campaign_name}</td>
                    <td className="p-3.5 text-[#0066FF]">{camp.template_name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[#555555] text-[10px]">
                        {camp.target_tag}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold',
                          camp.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        )}
                      >
                        <CheckCheck className="w-3 h-3" />
                        {camp.status}
                      </span>
                    </td>
                    <td className="p-3.5">{camp.sent_count || camp.total_recipients} / {camp.total_recipients}</td>
                    <td className="p-3.5 text-right text-[#777777] font-sans">
                      {new Date(camp.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
