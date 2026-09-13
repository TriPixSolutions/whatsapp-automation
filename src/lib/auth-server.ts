import { cookies } from 'next/headers';
import { UsersDB, UserRecord, UserRole } from '@/lib/db';

/**
 * Robust server-side user authorization resolver.
 * Handles:
 * 1. Standard authenticated cookies (pf_auth, pf_user_id, pf_status, pf_role)
 * 2. Super admin session overrides (pf_admin_auth, role === 'super_admin')
 * 3. Ephemeral serverless container rehydration so authenticated users are never falsely rejected with 403 Forbidden.
 */
export async function getAuthorizedUser(): Promise<UserRecord | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pf_auth')?.value;
    const adminAuth = cookieStore.get('pf_admin_auth')?.value;
    const rawUserId = cookieStore.get('pf_user_id')?.value;
    const rawStatus = cookieStore.get('pf_status')?.value;
    const rawRole = cookieStore.get('pf_role')?.value;

    const userId = rawUserId ? decodeURIComponent(rawUserId).trim() : '';
    const status = rawStatus ? decodeURIComponent(rawStatus).trim() : '';
    const role = rawRole ? decodeURIComponent(rawRole).trim() : '';

    const isAuthenticated = authCookie === 'authenticated' || adminAuth === 'true';
    const isSuperAdmin = role === 'super_admin' || adminAuth === 'true';
    const isApproved = status === 'approved' || isSuperAdmin;

    // 1. If completely unauthenticated with no user identifier and not super admin, block
    if (!isAuthenticated && !userId && !isSuperAdmin) {
      return null;
    }

    // 2. Reject explicitly blocked or unapproved users (unless super admin)
    if (!isSuperAdmin) {
      if (status === 'rejected' || status === 'new_user' || status === 'pending_approval') {
        return null;
      }
    }

    // 3. Look up user by ID in UsersDB
    let user = userId ? UsersDB.getById(userId) : null;

    // 4. Fallback for Super Admin
    if (!user && isSuperAdmin) {
      user = UsersDB.getById('user_super_admin_default');
    }

    // 5. Fallback: Search all users in database
    if (!user) {
      const allUsers = UsersDB.getAll();
      if (isSuperAdmin) {
        user = allUsers.find((u) => u.role === 'super_admin') || null;
      } else if (userId) {
        user = allUsers.find((u) => u.id === userId) || null;
      }
    }

    // 6. Resilient rehydration for Vercel Serverless ephemeral instances:
    // If user has a valid authenticated session cookie but the serverless instance just cold-started,
    // re-create the user record so legitimate users are NEVER blocked with a 403 Forbidden!
    if (!user && (isAuthenticated || isApproved)) {
      const effectiveId = userId || (isSuperAdmin ? 'user_super_admin_default' : `usr_${Date.now()}`);
      user = {
        id: effectiveId,
        email: isSuperAdmin ? 'admin@passionfruit.io' : `${effectiveId}@user.local`,
        name: isSuperAdmin ? 'Super Admin' : 'Workspace Member',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'email',
        role: (isSuperAdmin ? 'super_admin' : (role as UserRole) || 'user'),
        status: 'approved',
        company: 'Workspace',
        intendedUse: 'E-Commerce & WhatsApp Automation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        UsersDB.create(user);
      } catch (e) {
        // ignore duplicate creation error
      }
    }

    return user;
  } catch (error) {
    console.error('[auth-server] Error verifying authorization:', error);
    return null;
  }
}
