import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UsersDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pf_auth')?.value;
  const roleCookie = cookieStore.get('pf_role')?.value;
  const userId = cookieStore.get('pf_user_id')?.value;

  if (authCookie !== 'authenticated') {
    return false;
  }

  // Double check database record if userId is available
  if (userId) {
    const user = UsersDB.getById(userId);
    if (user && user.role === 'super_admin') {
      return true;
    }
  }

  return roleCookie === 'super_admin';
}

export async function GET() {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required.' }, { status: 403 });
    }

    const allUsers = UsersDB.getAll();
    const pendingRequests = allUsers.filter((u) => u.status === 'pending_approval');
    const metrics = UsersDB.getAdminMetrics();

    return NextResponse.json({
      success: true,
      users: allUsers,
      pendingRequests,
      metrics,
    });
  } catch (error: any) {
    console.error('Super admin fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await verifySuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (action === 'approve') {
      const updated = UsersDB.approveUser(userId, 'Super Admin');
      if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, user: updated, message: `${updated.name} has been approved.` });
    }

    if (action === 'reject') {
      const updated = UsersDB.rejectUser(userId);
      if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, user: updated, message: `${updated.name} has been rejected.` });
    }

    if (action === 'role' && role) {
      const updated = UsersDB.updateRole(userId, role);
      if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, user: updated, message: `Role updated to ${role}.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Super admin action error:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
