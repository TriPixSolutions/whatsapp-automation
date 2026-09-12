'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  DollarSign,
  Activity,
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
  LogOut,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRecord, UserRole, AdminMetrics } from '@/lib/db/types';

export default function SuperAdminControlPage() {
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
  const [authorized, setAuthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Strict client-side database role check before showing UI
  const verifyAccessAndLoadData = useCallback(async () => {
    try {
      // First verify role from /api/auth/me
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData.authenticated || !authData.user) {
        router.push('/auth/login?redirect=/super-admin-control');
        return;
      }

      if (authData.user.role !== 'super_admin') {
        // Barred: not super_admin. Redirect back.
        router.push(authData.user.status === 'approved' ? '/dashboard' : '/onboarding');
        return;
      }

      setAuthorized(true);

      // Now fetch secure super admin metrics and users
      const res = await fetch('/api/super-admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setPendingRequests(data.pendingRequests || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      console.warn('Super admin access verification error:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    verifyAccessAndLoadData();
    const interval = setInterval(verifyAccessAndLoadData, 5000);
    return () => clearInterval(interval);
  }, [verifyAccessAndLoadData]);

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
        showToast(action === 'approve' ? 'User access approved successfully!' : 'User request rejected.');
        verifyAccessAndLoadData();
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
        verifyAccessAndLoadData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSignOut = () => {
    document.cookie = 'pf_auth=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pf_user_id=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pf_status=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pf_role=; path=/; max-age=0; SameSite=Lax';
    try {
      localStorage.removeItem('pf_session');
    } catch (e) {}
    router.push('/auth/login');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company && u.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center justify-center font-mono">
        <RefreshCw className="w-8 h-8 text-[#A855F7] animate-spin mb-4" />
        <span className="text-xs text-slate-400">Verifying Super Admin Authorization...</span>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0D13] text-slate-100 font-sans selection:bg-[#9333EA] selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Console Navigation */}
      <header className="border-b border-white/10 bg-[#0E121B]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
              <ShieldAlert className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">Passion Fruit</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Super Admin Control
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Global SaaS Control Plane &amp; Access Gate</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Live Engine Connected</span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              <span>User Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Security Isolation Notice */}
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-purple-200 block">Isolated Super Admin Control Room</span>
            <p className="text-purple-300/80 leading-relaxed">
              This route is protected by strict server-side and database role verification (`role === &apos;super_admin&apos;`). Normal users cannot access this console.
            </p>
          </div>
        </div>

        {/* 1. Master SaaS KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-[#141824] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Approved Users</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-white">{metrics.totalApprovedUsers}</div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              Active workspace tenants
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-[#141824] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pending Requests</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-amber-300">{metrics.totalPendingRequests}</div>
            <span className="text-[11px] text-amber-400 font-medium">Awaiting Super Admin review</span>
          </div>

          <div className="p-5 rounded-3xl bg-[#141824] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Messages Sent</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-white">{metrics.totalMessagesSent}</div>
            <span className="text-[11px] text-purple-400 font-medium">Meta Cloud API v18.0 dispatches</span>
          </div>

          <div className="p-5 rounded-3xl bg-[#141824] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Meta Ads Spend</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-white">
              ${metrics.totalMetaAdsSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-blue-400 font-medium">Aggregated across all tenants</span>
          </div>
        </div>

        {/* 2. Pending Access Approval Queue */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Access Request Queue</span>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Review and accept onboarding requests to grant immediate access to the Passion Fruit dashboard.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#141824] border border-white/10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-400">There are no pending approval requests at this moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl bg-[#141824] border border-amber-500/30 shadow-xl shadow-amber-950/10 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        {req.name ? req.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">{req.name || 'Anonymous User'}</span>
                        <span className="text-xs text-slate-400 font-mono">{req.email}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      Pending Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-black/30 border border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Company</span>
                      <span className="text-slate-300 font-medium">{req.company || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Requested At</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Accept / Approve Action */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actionLoading === `approve_${req.id}`}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `approve_${req.id}` ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Accept / Approve Access</span>
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={actionLoading === `reject_${req.id}`}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Global User Directory & Role Assignment */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Global User Directory</h2>
              <p className="text-xs text-slate-400">All provisioned user accounts and assigned database roles.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search email, name..."
                className="text-xs pl-9 pr-4 py-2 rounded-xl bg-[#141824] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-[#141824] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center text-white font-bold text-[11px]">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="text-white block font-bold">{u.name || 'User'}</span>
                            <span className="text-slate-400 text-[11px] font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{u.company || '—'}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-purple-300 font-medium focus:outline-none focus:border-purple-500"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="agent">Agent</option>
                          <option value="user">User</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            u.status === 'approved' && 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
                            u.status === 'pending_approval' && 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
                            u.status === 'new_user' && 'bg-slate-500/10 border border-slate-500/20 text-slate-400',
                            u.status === 'unrequested' && 'bg-slate-500/10 border border-slate-500/20 text-slate-400',
                            u.status === 'rejected' && 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          )}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.status !== 'approved' ? (
                          <button
                            onClick={() => handleAction(u.id, 'approve')}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-medium flex items-center justify-end gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Live Audit Log */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Live Audit Stream</span>
          </h2>
          <div className="rounded-3xl bg-[#141824] border border-white/10 p-5 space-y-3">
            {metrics.recentActivity.length === 0 ? (
              <span className="text-xs text-slate-500">No recent activity recorded.</span>
            ) : (
              metrics.recentActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-none">
                  <div>
                    <span className="font-bold text-slate-200 block">{act.title}</span>
                    <span className="text-slate-400 text-[11px]">{act.description}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
