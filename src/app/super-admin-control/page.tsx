'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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
  Sparkles,
  LogOut,
  Radio,
  Building,
  Mail,
  Layers,
  Database,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRecord, UserRole, AdminMetrics } from '@/lib/db/types';
import PassionFruitLogo from '@/components/PassionFruitLogo';

export default function SuperAdminControlPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserRecord[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalApprovedUsers: 0,
    totalPendingRequests: 0,
    totalMessagesSent: 0,
    totalMetaAdsSpend: 0,
    totalContacts: 0,
    totalCampaigns: 0,
    totalAutomations: 0,
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

  // Strict client-side database role check before showing UI
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
        // Not a super_admin. Redirect back to appropriate user route.
        router.push(authData.user.status === 'approved' ? '/dashboard' : '/onboarding');
        return;
      }

      setAuthorized(true);

      // Fetch real database records and metrics
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin mb-3" />
        <span className="text-xs text-slate-500 font-medium">Verifying Super Admin Authorization...</span>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0D0F2D] font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar Header (Clean White Theme) */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <PassionFruitLogo size="sm" showSubtitle={false} />
            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7C3AED] text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin Control</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Live Database Connected</span>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-xs font-bold text-slate-700 hover:text-[#7C3AED] transition-all"
            >
              <span>User Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Clean Hero Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Master Admin Console
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Real-time platform access management, user permissions, and live system analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-600 block">Total Tenants</span>
              <span className="text-lg font-black text-purple-900">{users.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Review</span>
              <span className="text-lg font-black text-amber-900">{pendingRequests.length}</span>
            </div>
          </div>
        </div>

        {/* 1. Master SaaS KPI Cards (White Theme with Real Database Values) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Approved Users */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Users</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-slate-900">{metrics.totalApprovedUsers}</div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full dashboard access granted</span>
            </p>
          </div>

          {/* Card 2: Pending Requests */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-amber-600">{metrics.totalPendingRequests}</div>
            <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <span>Awaiting Super Admin 1-tap review</span>
            </p>
          </div>

          {/* Card 3: Real Messages Sent */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Messages Sent</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-slate-900">{metrics.totalMessagesSent}</div>
            <p className="text-[11px] text-purple-600 font-semibold">
              Real dispatches via Meta Cloud API v18.0
            </p>
          </div>

          {/* Card 4: Meta API Usage Cost */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta API Usage</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-slate-900">
              ${metrics.totalMetaAdsSpend.toFixed(2)}
            </div>
            <p className="text-[11px] text-blue-600 font-semibold">
              Live cost calculated from real volume
            </p>
          </div>
        </div>

        {/* 2. Pending Access Approval Queue */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Access Request Queue</span>
                {pendingRequests.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-mono text-xs font-bold">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Newly registered users requesting permission to access the workspace.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 text-center space-y-2 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">All Access Requests Cleared</h3>
              <p className="text-xs text-slate-500">There are no pending approval requests at this moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm">
                        {req.name ? req.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">{req.name || 'Anonymous User'}</span>
                        <span className="text-xs text-slate-500 font-mono">{req.email}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Pending Review
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Company</span>
                      <span className="text-slate-800 font-semibold">{req.company || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested Time</span>
                      <span className="text-slate-800 font-mono text-[11px]">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    {req.intendedUse && (
                      <div className="col-span-2 pt-1">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Intended Use</span>
                        <span className="text-slate-700">{req.intendedUse}</span>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Approve / Reject Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actionLoading === `approve_${req.id}`}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                      className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                      title="Reject request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Global User Directory (Clean White Table) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">User Directory &amp; RBAC Roles</h2>
              <p className="text-xs text-slate-500">Live list of registered tenants with granular role management.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, email, company..."
                className="text-xs pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] w-full sm:w-72 shadow-2xs"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Access Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="text-slate-900 block font-bold">{u.name || 'User'}</span>
                            <span className="text-slate-500 text-[11px] font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{u.company || '—'}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-[#7C3AED] font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7C3AED] cursor-pointer shadow-2xs"
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
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1',
                            u.status === 'approved' && 'bg-emerald-50 border border-emerald-200 text-emerald-700',
                            u.status === 'pending_approval' && 'bg-amber-50 border border-amber-200 text-amber-700',
                            u.status === 'new_user' && 'bg-slate-100 border border-slate-200 text-slate-700',
                            u.status === 'unrequested' && 'bg-slate-100 border border-slate-200 text-slate-700',
                            u.status === 'rejected' && 'bg-rose-50 border border-rose-200 text-rose-700'
                          )}
                        >
                          {u.status === 'approved' && <Check className="w-3 h-3" />}
                          {u.status === 'pending_approval' && <Clock className="w-3 h-3" />}
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.status !== 'approved' ? (
                          <button
                            onClick={() => handleAction(u.id, 'approve')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved</span>
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

        {/* 4. Live Audit Log (Clean White Theme) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C3AED]" />
              <span>Real-Time Audit Stream</span>
            </h2>
            <span className="text-xs text-slate-400">Strictly real database events</span>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-xs">
            {metrics.recentActivity.length === 0 ? (
              <span className="text-xs text-slate-400">No activity recorded yet.</span>
            ) : (
              metrics.recentActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-xs py-2.5 border-b border-slate-100 last:border-none">
                  <div>
                    <span className="font-bold text-slate-800 block">{act.title}</span>
                    <span className="text-slate-500 text-[11px]">{act.description}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-4">
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
