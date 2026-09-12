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
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Campaign } from '@/types';

const META_TEMPLATES = [
  {
    id: 'teaser_alert',
    name: 'teaser_alert',
    category: 'MARKETING',
    bodyText: 'Something big is coming soon. Are you ready?',
    header: 'AURA Private Showcase',
    footer: 'Confidential • By Invitation Only',
    ctaButton: 'Discover Collection',
  },
  {
    id: 'vip_invitation',
    name: 'vip_invitation',
    category: 'MARKETING',
    bodyText: 'You are cordially invited to the private vernissage of our bespoke luxury collection.',
    header: 'Exclusive Vernissage',
    footer: 'R.S.V.P. Required',
    ctaButton: 'Confirm Attendance',
  },
  {
    id: 'private_drop',
    name: 'private_drop',
    category: 'MARKETING',
    bodyText: 'A limited edition release is now available exclusively to tier-1 patrons.',
    header: 'Private Vault Drop',
    footer: 'Allocations Limited',
    ctaButton: 'Enter Vault',
  },
];

export default function CampaignsPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState('teaser_alert');
  const [campaignName, setCampaignName] = useState('Exclusive Teaser Drop - Fall Collection');
  const [targetTag, setTargetTag] = useState('teaser_list');
  const [variable1, setVariable1] = useState('Fall Collection');
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
          variables: { '1': variable1 },
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
    <div className="min-h-screen bg-[#07090E] pl-64 flex flex-col">
      <Sidebar />
      <Header
        title="Meta Template Broadcasts & Campaigns"
        subtitle="Schedule and dispatch high-throughput campaigns via Hostinger BullMQ queue"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Main Builder & Phone Mockup Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Campaign Dispatch Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-[#0B0F17]/90 border border-white/10 p-6 space-y-6 shadow-luxury-md">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#E6C687]" />
                  Campaign Configuration
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Select an approved Meta Cloud API template and map dynamic audience tags
                </p>
              </div>

              <form onSubmit={handleDispatch} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                {/* Template Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Meta-Approved Template
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Meta Approved
                    </span>
                  </div>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-mono"
                  >
                    {META_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Target Audience Tag</label>
                    <select
                      value={targetTag}
                      onChange={(e) => setTargetTag(e.target.value)}
                      className="w-full bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="teaser_list">teaser_list (Test Flow 1)</option>
                      <option value="vip">vip (All VIP Clients)</option>
                      <option value="private-aviation">private-aviation</option>
                      <option value="haute-horlogerie">haute-horlogerie</option>
                      <option value="luxury-villas">luxury-villas</option>
                      <option value="all">All Opted-In Contacts</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Rate Limiting Pacing</label>
                    <div className="flex items-center gap-2 bg-[#111622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#E6C687]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>50ms / message (20 req/s)</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Parameter Mapping */}
                <div className="p-4 rounded-xl bg-[#07090E] border border-white/5 space-y-3">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Template Variable Mapping ({'{{1}}'})
                  </span>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Parameter 1: Collection / Drop Name</label>
                    <input
                      type="text"
                      value={variable1}
                      onChange={(e) => setVariable1(e.target.value)}
                      placeholder="Fall Collection"
                      className="w-full bg-[#111622] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Dispatch Button */}
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C5A035] to-[#AA820A] text-black font-semibold text-xs uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-50 shadow-gold-glow flex items-center justify-center gap-2"
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pushing Job to Hostinger BullMQ Queue...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Broadcast Campaign</span>
                    </>
                  )}
                </button>
              </form>

              {/* Status Alert */}
              {dispatchStatus && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl text-xs font-mono flex items-center gap-2',
                    dispatchStatus.success
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
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
              <span className="text-[11px] uppercase tracking-widest text-[#E6C687] font-semibold">
                Live WhatsApp Device Preview
              </span>
            </div>
            <PhoneMockup
              businessName="AURA Concierge"
              templateName={activeTemplate.name}
              bodyText={activeTemplate.bodyText}
              headerText={activeTemplate.header}
              footerText={activeTemplate.footer}
              showInboundReply={false}
            />
          </div>
        </div>

        {/* Campaign History */}
        <div className="rounded-2xl bg-[#0B0F17]/90 border border-white/10 p-6 space-y-4 shadow-luxury-md">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E6C687]" />
            Recent Broadcast Campaigns (campaigns table)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#07090E]">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-[10px] uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="p-3.5">Campaign Name</th>
                  <th className="p-3.5">Template</th>
                  <th className="p-3.5">Target Tag</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Sent / Total</th>
                  <th className="p-3.5 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-sans font-medium text-white">{camp.campaign_name}</td>
                    <td className="p-3.5 text-[#E6C687]">{camp.template_name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 text-[10px]">
                        {camp.target_tag}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase',
                          camp.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        )}
                      >
                        <CheckCheck className="w-3 h-3" />
                        {camp.status}
                      </span>
                    </td>
                    <td className="p-3.5">{camp.sent_count || camp.total_recipients} / {camp.total_recipients}</td>
                    <td className="p-3.5 text-right text-zinc-500 font-sans">
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
