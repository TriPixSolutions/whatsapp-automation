'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Activity,
  UserCheck,
  RefreshCw,
  Search,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronDown,
  LogOut,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRecord, UserRole, UserStatus, AdminMetrics } from '@/lib/db/types';

export default function SuperAdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserRecord[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalApprovedUsers: 0,
    totalPendingRequests: 0,
    totalMessagesSent: 0,
    totalMetaAdsSpend: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadAdminData = async () => {
    try {
      const res = await fetch('/api/super-admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setPendingRequests(data.pendingRequests || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        if (res.status === 401 || res.status === 403) {
          router.push('/auth/login');
        }
      }
    } catch (e) {
      console.warn('Failed to load super admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(`${action}_${userId}`);
    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(action === 'approve' ? 'User approved successfully!' : 'User request rejected.');
        loadAdminData();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'role', userId, role }),
      });
      if (res.ok) {
        showToast(`Role updated to ${role}`);
        loadAdminData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F6FB] font-sans text-[#0D0F2D] selection:bg-[#7C3AED] selection:text-white">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Super Admin Navigation Bar */}
      <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white text-base shadow-sm font-bold">
              🍇
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-[#0D0F2D]">
                  Passion Fruit
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wide">
                  Super Admin
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#7C3AED] bg-slate-100 hover:bg-purple-50 px-3 py-1.5 rounded-xl transition-all"
          >
            <span>Switch to User Dashboard</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            SA
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Page Title & Live Sync Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0D0F2D] flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-[#7C3AED]" />
              Super Admin Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Global authorization hub, user onboarding approval queues, and system-wide telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all shadow-2xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* PHASE 2 REQUIREMENT: GLOBAL SAAS METRICS & ANALYTICS KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Approved Users */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Approved Users</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#0D0F2D]">{metrics.totalApprovedUsers}</div>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active platform accounts
              </p>
            </div>
          </div>

          {/* Card 2: Total Pending Requests */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/90 shadow-xs space-y-3 bg-amber-50/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pending Requests</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center relative">
                <Clock className="w-4 h-4" />
                {metrics.totalPendingRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-ping" />
                )}
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#0D0F2D]">{metrics.totalPendingRequests}</div>
              <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                Awaiting your authorization
              </p>
            </div>
          </div>

          {/* Card 3: Total Messages Sent (System-wide) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">System Messages Sent</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#0D0F2D]">{metrics.totalMessagesSent}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Official Meta Cloud API v18.0</p>
            </div>
          </div>

          {/* Card 4: Total Meta Ads Spend (Aggregated) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Meta Ads Spend</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#0D0F2D]">
                ${metrics.totalMetaAdsSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                Aggregated Click-to-WhatsApp Ads
              </p>
            </div>
          </div>
        </div>

        {/* PHASE 2 REQUIREMENT: APPROVAL WORKFLOW (USER MANAGEMENT DATA TABLE) */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0D0F2D]">Pending Access Requests</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendingRequests.length} waiting
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Users who registered and clicked &quot;Request Access&quot;. Approve them to grant dashboard access.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#0D0F2D]">All requests caught up!</p>
              <p className="text-xs text-slate-500">
                No users are currently waiting for administrator approval.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Organization / Use</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Requested At</th>
                    <th className="py-3 px-4 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{req.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{req.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">{req.company || 'Enterprise Organization'}</p>
                          <p className="text-[11px] text-slate-500 max-w-xs truncate">
                            {req.intendedUse || 'WhatsApp broadcast campaigns & shared inbox'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-600 font-medium px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                          {req.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'Recently'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={actionLoading === `approve_${req.id}`}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={actionLoading === `reject_${req.id}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl font-semibold text-xs transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ALL USERS DIRECTORY */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0D0F2D]">All Platform Users</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete directory of registered accounts, roles, and authorization states.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name, email, company..."
                className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {u.company || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={u.id === 'user_super_admin_default'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-[11px] font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Agent</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                          u.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : u.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            u.status === 'approved'
                              ? 'bg-emerald-500'
                              : u.status === 'pending_approval'
                              ? 'bg-amber-500'
                              : u.status === 'rejected'
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          )}
                        />
                        {u.status === 'pending_approval' ? 'Pending Approval' : u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.status !== 'approved' && (
                        <button
                          onClick={() => handleAction(u.id, 'approve')}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors mr-1.5"
                        >
                          Approve
                        </button>
                      )}
                      {u.status === 'approved' && u.id !== 'user_super_admin_default' && (
                        <button
                          onClick={() => handleAction(u.id, 'reject')}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* PHASE 2 REQUIREMENT: RECENT PLATFORM ACTIVITY / SOFTWARE UPDATES LOG */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-[#0D0F2D]">
                Platform Activity &amp; Audit Log
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Real-Time Ingress</span>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentActivity.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    {act.type === 'user_approved' ? (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : act.type === 'access_request' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0D0F2D]">{act.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
