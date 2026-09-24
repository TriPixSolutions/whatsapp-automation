'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Building2,
  Smartphone,
  FileText,
  Users,
  Code2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type SettingsSection = 'workspace' | 'whatsapp' | 'templates' | 'team' | 'api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Agent' | 'Support Agent';
  status: 'Active' | 'Invited';
}

interface MetaTemplate {
  name: string;
  category: 'MARKETING' | 'UTILITY';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  language: string;
  body: string;
}

const APPROVED_TEMPLATES: MetaTemplate[] = [
  {
    name: 'teaser_alert',
    category: 'MARKETING',
    status: 'APPROVED',
    language: 'en_US',
    body: 'Hello {{1}}! We have an exclusive VIP update regarding your inquiry. Reply to speak with our specialist.',
  },
  {
    name: 'welcome_lead',
    category: 'UTILITY',
    status: 'APPROVED',
    language: 'en_US',
    body: 'Hello {{1}}! Thank you for your inquiry. Here are our complete product specifications and collection catalog.',
  },
  {
    name: 'followup_reminder',
    category: 'MARKETING',
    status: 'APPROVED',
    language: 'en_US',
    body: 'Quick reminder: Your reserved 10% coupon code expires tonight. Would you like free doorstep delivery?',
  },
  {
    name: 'vip_offer',
    category: 'MARKETING',
    status: 'APPROVED',
    language: 'en_US',
    body: 'Exclusive 15% VIP Flash Sale for our valued customers today only. Use promo code VIP15 to claim.',
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
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('workspace');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Workspace State
  const [companyName, setCompanyName] = useState('TriPix Solutions Workspace');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [adminUsername, setAdminUsername] = useState('Admin');
  const [adminPassword, setAdminPassword] = useState('');

  // 2. WhatsApp Connection State
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'needs_attention' | 'disconnected'>('disconnected');
  const [isTestingConn, setIsTestingConn] = useState(false);

  // 4. Team Members State
  const [team, setTeam] = useState<TeamMember[]>([
    { id: '1', name: 'System Administrator', email: 'admin@tripixsolutions.com', role: 'Admin', status: 'Active' },
    { id: '2', name: 'Sarah Jenkins', email: 'sarah.j@brand.com', role: 'Sales Agent', status: 'Active' },
    { id: '3', name: 'Marcus Vance', email: 'marcus.v@brand.com', role: 'Sales Agent', status: 'Active' },
  ]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Sales Agent' | 'Support Agent'>('Sales Agent');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 5. API & Webhook State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('tripix_verify_token_2026');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookVerified, setWebhookVerified] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  // Load settings and connection status from real backend
  const loadSettings = useCallback(async () => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook/whatsapp`);
    }

    try {
      const [settingsRes, connRes] = await Promise.all([
        fetch('/api/settings').catch(() => null),
        fetch('/api/meta/connection').catch(() => null),
      ]);

      if (settingsRes?.ok) {
        const s = await settingsRes.json();
        if (s.name) setCompanyName(s.name);
        if (s.wabaId) setWabaId(s.wabaId);
        if (s.phoneNumberId) setPhoneNumberId(s.phoneNumberId);
        if (s.accessToken) setAccessToken(s.accessToken);
        if (s.verifyToken) setVerifyToken(s.verifyToken);
        if (s.adminUsername) setAdminUsername(s.adminUsername);
        if (s.adminPassword) setAdminPassword(s.adminPassword);
      }

      if (connRes?.ok) {
        const c = await connRes.json();
        if (c.connectionStatus === 'connected') {
          setConnectionStatus('connected');
        } else if (c.connectionStatus === 'error') {
          setConnectionStatus('needs_attention');
        } else {
          setConnectionStatus('disconnected');
        }
      }
    } catch (e) {
      console.warn('Error loading settings:', e);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save Settings
  const handleSaveSettings = async (extra?: any) => {
    try {
      const payload = {
        name: companyName,
        wabaId,
        phoneNumberId,
        accessToken,
        verifyToken,
        adminUsername,
        adminPassword,
        ...extra,
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Settings saved successfully!');
        loadSettings();
      }
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    }
  };

  // Live Test Connection
  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await fetch('/api/meta/connection/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumberId, wabaId, accessToken }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.verified) {
        setConnectionStatus('connected');
        showToast('Meta WhatsApp connection verified live!');
      } else {
        setConnectionStatus('needs_attention');
        alert(data.error || 'Connection verification failed with Meta API.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error verifying connection.');
    } finally {
      setIsTestingConn(false);
    }
  };

  // Live Webhook Test Handshake
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await fetch(`/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=${encodeURIComponent(verifyToken)}`);
      if (res.ok) {
        const text = await res.text();
        if (text === 'test_challenge_123') {
          setWebhookVerified(true);
          showToast('Webhook verification handshake successful!');
        } else {
          alert('Challenge response mismatch.');
        }
      } else {
        alert('Webhook challenge returned error. Check verify token.');
      }
    } catch (err: any) {
      alert(err.message || 'Error pinging webhook.');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Invite Team Member
  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `mem_${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Active',
    };

    setTeam([...team, newMember]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    showToast(`Team member ${newMember.name} added!`);
  };

  const sectionsList: { id: SettingsSection; title: string; subtitle: string; icon: any }[] = [
    { id: 'workspace', title: 'Workspace', subtitle: 'Company profile & timezone', icon: Building2 },
    { id: 'whatsapp', title: 'WhatsApp Connection', subtitle: 'Meta Cloud API keys & status', icon: Smartphone },
    { id: 'templates', title: 'Templates', subtitle: 'Approved Meta message templates', icon: FileText },
    { id: 'team', title: 'Team Members', subtitle: 'Sales agents & roles', icon: Users },
    { id: 'api', title: 'API & Webhooks', subtitle: 'Callback URL & verify tokens', icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 md:pb-8 flex flex-col font-sans">
      <Sidebar />
      <div className="md:pl-60 flex-1 flex flex-col">
        <Header
          title="Settings"
          subtitle="Configure your workspace identity, Meta WhatsApp keys, templates, and team"
        />

        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Sidebar Navigation (4 Cols) */}
            <aside className="md:col-span-4 bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1.5">
              {sectionsList.map((sec) => {
                const isActive = activeSection === sec.id;
                const Icon = sec.icon;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer',
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{sec.title}</p>
                        <p className={cn('text-[10px] mt-0.5', isActive ? 'text-slate-300' : 'text-slate-400')}>
                          {sec.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                  </button>
                );
              })}
            </aside>

            {/* Main Content Area (8 Cols) */}
            <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              {/* SECTION 1: WORKSPACE */}
              {activeSection === 'workspace' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Workspace Profile</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your company brand name and time zone for scheduled follow-ups and broadcast pacing.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveSettings();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Company / Brand Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Default Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Admin Access Credentials */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-bold text-slate-900">Administrator Credentials</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Admin Username</label>
                          <input
                            type="text"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Admin Password</label>
                          <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Save Workspace Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECTION 2: WHATSAPP CONNECTION */}
              {activeSection === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp Official Connection</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage your official Meta Cloud API v18.0 credentials and check live connection health.
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                        connectionStatus === 'connected' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                        connectionStatus === 'needs_attention' && 'bg-amber-50 text-amber-800 border-amber-200',
                        connectionStatus === 'disconnected' && 'bg-slate-100 text-slate-600 border-slate-200'
                      )}
                    >
                      {connectionStatus === 'connected' && 'Connected & Live'}
                      {connectionStatus === 'needs_attention' && 'Needs Attention'}
                      {connectionStatus === 'disconnected' && 'Disconnected'}
                    </span>
                  </div>

                  {/* 6-Step Wizard Promo Card */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-950">Need Help Connecting?</h3>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Use our guided 6-step wizard to link Meta Business, verify webhooks, and test message dispatch.
                      </p>
                    </div>
                    <Link
                      href="/setup"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <span>Launch Connection Wizard</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveSettings();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        WhatsApp Business Account (WABA) ID
                      </label>
                      <input
                        type="text"
                        value={wabaId}
                        onChange={(e) => setWabaId(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        System User Access Token
                      </label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingConn}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {isTestingConn ? 'Probing Meta...' : 'Test Connection Live'}
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Save Credentials
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECTION 3: TEMPLATES */}
              {activeSection === 'templates' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Approved Meta Message Templates</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Meta WhatsApp policy requires approved templates to initiate conversations or re-engage after 24 hours.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {APPROVED_TEMPLATES.map((tpl) => (
                      <div key={tpl.name} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs font-mono">{tpl.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {tpl.category}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {tpl.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">{tpl.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: TEAM MEMBERS */}
              {activeSection === 'team' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Team Members &amp; Sales Agents</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage agents assigned to handle hot leads in your Priority Leads dashboard.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {team.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">{member.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{member.email}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {member.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{member.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {showInviteModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-slate-900">Add Team Member</h3>
                        <form onSubmit={handleInviteMember} className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                            <input
                              type="text"
                              required
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                            <input
                              type="email"
                              required
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value as any)}
                              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                            >
                              <option value="Sales Agent">Sales Agent</option>
                              <option value="Support Agent">Support Agent</option>
                            </select>
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowInviteModal(false)}
                              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                            >
                              Add Member
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 5: API & WEBHOOKS */}
              {activeSection === 'api' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-600" />
                      <span>API &amp; Webhook Endpoints</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your Meta webhook parameters to receive real-time message statuses and customer replies.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">Webhook Callback URL:</span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-slate-900 truncate">{webhookUrl}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(webhookUrl)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-100 shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">Webhook Verify Token:</span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-slate-900 truncate">{verifyToken}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(verifyToken)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-100 shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Test Handshake Verification</span>
                        <span className="text-[11px] text-slate-500">
                          Verify that your endpoint properly responds to Meta&apos;s cryptographic challenge
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {isTestingWebhook ? 'Pinging...' : 'Test Webhook'}
                      </button>
                    </div>

                    {webhookVerified && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Webhook handshake verified and active!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
