'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { SettingsHero } from '@/components/settings/SettingsHero';
import {
  Building2,
  Radio,
  Users,
  Code2,
  ShieldCheck,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Globe,
  Lock,
  ExternalLink,
  Plus,
  Trash2,
  Mail,
  UserCheck,
  Clock,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  MessageSquare,
  Instagram,
  Facebook,
  Shield,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SettingsTab = 'workspace' | 'channels' | 'team' | 'developer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Agent';
  status: 'Active' | 'Pending';
  channels: string[];
  joinedAt: string;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'mem_1',
    name: 'User 1 (You)',
    email: 'admin@passionfruit.io',
    role: 'Admin',
    status: 'Active',
    channels: ['WhatsApp', 'Messenger', 'Instagram'],
    joinedAt: 'Founding Member',
  },
  {
    id: 'mem_2',
    name: 'Sarah Jenkins',
    email: 'sarah.j@brand.com',
    role: 'Manager',
    status: 'Active',
    channels: ['WhatsApp', 'Messenger'],
    joinedAt: '3 days ago',
  },
  {
    id: 'mem_3',
    name: 'Marcus Vance',
    email: 'marcus.v@brand.com',
    role: 'Agent',
    status: 'Active',
    channels: ['WhatsApp'],
    joinedAt: 'Yesterday',
  },
];

const TIMEZONES = [
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: '(GMT+00:00) London, Edinburgh, Dublin' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Paris, Berlin, Rome' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai, Abu Dhabi, Muscat' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore, Kuala Lumpur, Hong Kong' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo, Osaka, Sapporo' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Workspace state
  const [companyName, setCompanyName] = useState('Passion Fruit Luxury');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [logoUrl, setLogoUrl] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Channels state
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [messengerConnected, setMessengerConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);

  // Developer / API credentials state
  const [appId, setAppId] = useState('102938475610293');
  const [wabaId, setWabaId] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('passion_fruit_verify_token_2025');
  const [webhookUrl, setWebhookUrl] = useState('https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp');

  // Team state
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Manager' | 'Agent'>('Agent');
  const [inviteChannels, setInviteChannels] = useState<string[]>(['WhatsApp']);
  const [teamSearch, setTeamSearch] = useState('');

  // Developer Regenerate Webhook Secret modal
  const [showRegenModal, setShowRegenModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook/whatsapp`);
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setCompanyName(data.name);
        if (data.wabaId) setWabaId(data.wabaId);
        if (data.phoneNumberId) setPhoneId(data.phoneNumberId);
        if (data.accessToken) setAccessToken(data.accessToken);
        if (data.verifyToken) setVerifyToken(data.verifyToken);
        if (data.adminUsername) setAdminUsername(data.adminUsername);
        if (data.adminPassword) setAdminPassword(data.adminPassword);

        if (data.phoneNumberId && data.accessToken) {
          setWhatsappConnected(true);
        }
      })
      .catch((err) => console.warn('Could not load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAll = async (extra?: Partial<{
    name: string;
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
    verifyToken: string;
    adminUsername: string;
    adminPassword: string;
  }>) => {
    try {
      const payload = {
        name: companyName,
        wabaId,
        phoneNumberId: phoneId,
        accessToken,
        verifyToken,
        adminUsername,
        adminPassword,
        ...extra,
      };

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      showToast('Settings saved successfully to database!');
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    }
  };

  const handleRegenerateSecret = () => {
    const newSecret = `pf_sec_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    setVerifyToken(newSecret);
    handleSaveAll({ verifyToken: newSecret });
    setShowRegenModal(false);
    showToast('New Webhook Verify Secret generated & saved!');
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `mem_${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Active',
      channels: inviteChannels,
      joinedAt: 'Just now',
    };

    setTeam([...team, newMember]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    showToast(`Invitation sent to ${newMember.email}!`);
  };

  const handleDeleteMember = (id: string) => {
    if (id === 'mem_1') {
      alert('Cannot delete the primary workspace owner.');
      return;
    }
    setTeam(team.filter((m) => m.id !== id));
    showToast('Team member removed.');
  };

  return (
    <div className="flex h-screen bg-[#F4F6FB] overflow-hidden font-sans text-[#0D0F2D]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Settings"
          subtitle="Workspace identity, omnichannel integrations, team roles & API credentials"
        />

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <SettingsHero
              whatsappConnected={whatsappConnected}
              onSave={() => handleSaveAll()}
            />

            {/* Vertical Tabbed Navigation & Content Container */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Vertical Sidebar Navigation */}
              <aside className="w-full md:w-64 shrink-0 space-y-1.5">
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-200 group border',
                    activeTab === 'workspace'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-purple-500/20 border-transparent'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        activeTab === 'workspace'
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-50 text-[#7C3AED] group-hover:bg-purple-100'
                      )}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Workspace</p>
                      <p
                        className={cn(
                          'text-[10px] mt-0.5',
                          activeTab === 'workspace' ? 'text-purple-100' : 'text-slate-500'
                        )}
                      >
                        Company profile &amp; timezone
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform',
                      activeTab === 'workspace' ? 'text-white translate-x-0.5' : 'text-slate-400'
                    )}
                  />
                </button>

                <button
                  onClick={() => setActiveTab('channels')}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-200 group border',
                    activeTab === 'channels'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-purple-500/20 border-transparent'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        activeTab === 'channels'
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-50 text-[#7C3AED] group-hover:bg-purple-100'
                      )}
                    >
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold">Channels</p>
                        <span
                          className={cn(
                            'text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase',
                            activeTab === 'channels'
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 text-[#7C3AED]'
                          )}
                        >
                          Meta
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-[10px] mt-0.5',
                          activeTab === 'channels' ? 'text-purple-100' : 'text-slate-500'
                        )}
                      >
                        WhatsApp, IG, Messenger
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform',
                      activeTab === 'channels' ? 'text-white translate-x-0.5' : 'text-slate-400'
                    )}
                  />
                </button>

                <button
                  onClick={() => setActiveTab('team')}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-200 group border',
                    activeTab === 'team'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-purple-500/20 border-transparent'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        activeTab === 'team'
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-50 text-[#7C3AED] group-hover:bg-purple-100'
                      )}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Team Management</p>
                      <p
                        className={cn(
                          'text-[10px] mt-0.5',
                          activeTab === 'team' ? 'text-purple-100' : 'text-slate-500'
                        )}
                      >
                        Agents, managers &amp; roles
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform',
                      activeTab === 'team' ? 'text-white translate-x-0.5' : 'text-slate-400'
                    )}
                  />
                </button>

                <button
                  onClick={() => setActiveTab('developer')}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-200 group border',
                    activeTab === 'developer'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-purple-500/20 border-transparent'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        activeTab === 'developer'
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-50 text-[#7C3AED] group-hover:bg-purple-100'
                      )}
                    >
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold">Developer &amp; API</p>
                        <span
                          className={cn(
                            'text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase',
                            activeTab === 'developer'
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 text-[#7C3AED]'
                          )}
                        >
                          Keys
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-[10px] mt-0.5',
                          activeTab === 'developer' ? 'text-purple-100' : 'text-slate-500'
                        )}
                      >
                        Masked tokens &amp; webhooks
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform',
                      activeTab === 'developer' ? 'text-white translate-x-0.5' : 'text-slate-400'
                    )}
                  />
                </button>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                {/* 1. WORKSPACE SETTINGS TAB */}
                {activeTab === 'workspace' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-200">
                      <h2 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#7C3AED]" />
                        Workspace Profile &amp; Identity
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Define your brand appearance, official company name, and default timezone.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveAll();
                      }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Company / Brand Name</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Passion Fruit Luxury"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                          />
                          <p className="text-[11px] text-slate-500">
                            Displayed on team invitations, customer greeting headers, and reports.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Default Timezone</label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                          >
                            {TIMEZONES.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-500">
                            Controls the timestamp logs in your Shared Team Inbox and Broadcast schedules.
                          </p>
                        </div>
                      </div>

                      {/* Brand Logo Upload Mock */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Brand Logo</label>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="w-14 h-14 rounded-2xl bg-[#0D0F2D] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                            🍇
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[#0D0F2D]">Passion Fruit Primary Mark</p>
                            <p className="text-[11px] text-slate-500">
                              SVG, PNG or WebP (Recommended 512x512px).
                            </p>
                            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] pt-1">
                              <Upload className="w-3 h-3" />
                              Upload custom logo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={() => showToast('Custom logo uploaded & applied!')}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Super Admin Access Details */}
                      <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                          <h3 className="text-xs font-bold text-[#0D0F2D]">Super Admin Testing Access</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Admin Username
                            </label>
                            <input
                              type="text"
                              value={adminUsername}
                              onChange={(e) => setAdminUsername(e.target.value)}
                              className="w-full text-xs bg-white border border-purple-200/80 rounded-xl px-3 py-2 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Admin Password
                            </label>
                            <input
                              type="password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              className="w-full text-xs bg-white border border-purple-200/80 rounded-xl px-3 py-2 text-slate-800 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save Workspace Settings
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. CHANNELS & INTEGRATIONS TAB */}
                {activeTab === 'channels' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-200">
                      <h2 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
                        <Radio className="w-4 h-4 text-[#7C3AED]" />
                        Omnichannel Integrations
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Connect your Meta customer messaging channels to route all incoming chats into your Shared Team Inbox.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* WhatsApp Business Card */}
                      <div className="p-5 rounded-3xl border border-emerald-200 bg-emerald-50/20 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {whatsappConnected ? 'Connected' : 'Configured'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#0D0F2D]">WhatsApp Business API</h3>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              Official Meta Cloud API v18.0. Direct connection with 3-button interactive flows, carousels, and templates.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-100/80">
                          <button
                            onClick={() => setActiveTab('developer')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            Manage Meta Keys
                          </button>
                        </div>
                      </div>

                      {/* Facebook Messenger Card */}
                      <div className="p-5 rounded-3xl border border-blue-200 bg-blue-50/20 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Facebook className="w-5 h-5" />
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pending Link
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#0D0F2D]">Facebook Messenger</h3>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              Route Facebook Page direct messages and comments into the Shared Team Inbox with one-tap agent replies.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-blue-100/80">
                          <button
                            onClick={() => {
                              setMessengerConnected(true);
                              showToast('Facebook Page OAuth window initialized.');
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            Connect Facebook Page
                          </button>
                        </div>
                      </div>

                      {/* Instagram Direct Card */}
                      <div className="p-5 rounded-3xl border border-pink-200 bg-pink-50/20 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                              <Instagram className="w-5 h-5" />
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Disconnected
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#0D0F2D]">Instagram Direct</h3>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              Handle Instagram DMs, story mentions, and product story inquiries in real-time through shared threads.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-pink-100/80">
                          <button
                            onClick={() => {
                              setInstagramConnected(true);
                              showToast('Instagram Professional Account connected.');
                            }}
                            className="w-full py-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            Connect Instagram
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TEAM MANAGEMENT TAB */}
                {activeTab === 'team' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#7C3AED]" />
                          Team &amp; Agent Management
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Manage assigned chat agents, supervisor permissions, and invited workspace members.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Invite Member
                      </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative max-w-sm">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder="Search team members by name or email..."
                        className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                      />
                    </div>

                    {/* Team Table */}
                    <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                              <th className="py-3 px-4">Member Name</th>
                              <th className="py-3 px-4">Role</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Channels</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {team
                              .filter(
                                (m) =>
                                  m.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
                                  m.email.toLowerCase().includes(teamSearch.toLowerCase())
                              )
                              .map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-bold text-slate-800">{member.name}</p>
                                      <p className="text-[11px] text-slate-500 font-mono">{member.email}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={cn(
                                        'px-2.5 py-1 rounded-full text-[10px] font-bold',
                                        member.role === 'Admin'
                                          ? 'bg-purple-100 text-[#7C3AED]'
                                          : member.role === 'Manager'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-slate-100 text-slate-700'
                                      )}
                                    >
                                      {member.role}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      {member.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1">
                                      {member.channels.map((ch) => (
                                        <span
                                          key={ch}
                                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                                        >
                                          {ch}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {member.id !== 'mem_1' && (
                                      <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        title="Remove member"
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DEVELOPER & API TAB (FOCUS SECTION) */}
                {activeTab === 'developer' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-[#0D0F2D] flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#7C3AED]" />
                          Developer &amp; Meta Cloud API v18.0
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configure your official Meta Business Account credentials and secure webhook ingress.
                        </p>
                      </div>

                      <a
                        href="https://developers.facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-all shrink-0"
                      >
                        Meta Developers Console
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveAll();
                      }}
                      className="space-y-5"
                    >
                      {/* Credentials Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MaskedInputField
                          id="wabaId"
                          label="WhatsApp Business Account (WABA) ID"
                          value={wabaId}
                          placeholder="e.g. 102938475610293"
                          onChange={(val) => setWabaId(val)}
                          helperText="Located in Meta Developer Portal > WhatsApp > API Setup."
                        />

                        <MaskedInputField
                          id="phoneId"
                          label="Meta Phone Number ID"
                          value={phoneId}
                          placeholder="e.g. 109823485764321"
                          onChange={(val) => setPhoneId(val)}
                          helperText="The unique identifier for the WhatsApp phone number sending messages."
                        />
                      </div>

                      <MaskedInputField
                        id="accessToken"
                        label="System User Permanent Access Token"
                        value={accessToken}
                        placeholder="EAAG..."
                        onChange={(val) => setAccessToken(val)}
                        helperText="Paste your permanent Meta System User token with whatsapp_business_messaging permissions."
                      />

                      {/* Webhook Configuration Section */}
                      <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-xs font-bold text-[#0D0F2D] flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-[#7C3AED]" />
                              Webhook Ingress Endpoint
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Paste these into Meta Developers &gt; WhatsApp &gt; Configuration &gt; Webhook.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRegenModal(true)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Regenerate Secret
                          </button>
                        </div>

                        <MaskedInputField
                          id="webhookUrl"
                          label="Callback URL"
                          value={webhookUrl}
                          readOnly
                          helperText="Meta sends incoming customer messages and delivery status receipts to this endpoint."
                        />

                        <MaskedInputField
                          id="verifyToken"
                          label="Verify Token"
                          value={verifyToken}
                          onChange={(val) => setVerifyToken(val)}
                          helperText="Must match the Verify Token entered in your Meta Developers App."
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save Developer Settings
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#0D0F2D] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C3AED]" />
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jessica Taylor"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. jessica@brand.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Admin', 'Manager', 'Agent'] as const).map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setInviteRole(role)}
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border transition-all',
                        inviteRole === role
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {inviteRole === 'Admin'
                    ? 'Full workspace & developer API access.'
                    : inviteRole === 'Manager'
                    ? 'Can view all conversations & reassign chats.'
                    : 'Can only view & reply to assigned customer chats.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Channel Access</label>
                <div className="flex gap-2">
                  {['WhatsApp', 'Messenger', 'Instagram'].map((ch) => {
                    const isChecked = inviteChannels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => {
                          if (isChecked) {
                            if (inviteChannels.length > 1) {
                              setInviteChannels(inviteChannels.filter((c) => c !== ch));
                            }
                          } else {
                            setInviteChannels([...inviteChannels, ch]);
                          }
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
                          isChecked
                            ? 'bg-purple-50 text-[#7C3AED] border-purple-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        )}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Regenerate Webhook Secret */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-[#0D0F2D]">Regenerate Webhook Verify Secret?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Regenerating this token will immediately invalidate your current webhook verify handshake. You will need to copy the new secret and update the Verify Token in your Meta Developers portal.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateSecret}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs"
              >
                Yes, Regenerate Secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MaskedFieldProps {
  id: string;
  label: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  helperText: string;
  canCopy?: boolean;
}

function MaskedInputField({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  placeholder = '',
  helperText,
  canCopy = true,
}: MaskedFieldProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-[#0D0F2D]">
          {label}
        </label>
        {readOnly && (
          <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
            System Managed
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full text-xs font-mono bg-slate-50 border border-slate-200/90 rounded-xl pl-3.5 pr-20 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShow(!show)}
            title={show ? 'Hide token' : 'Reveal token'}
            className="p-1.5 text-slate-400 hover:text-[#7C3AED] hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {canCopy && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy to clipboard"
              className="p-1.5 text-slate-400 hover:text-[#7C3AED] hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-normal">{helperText}</p>
    </div>
  );
}
