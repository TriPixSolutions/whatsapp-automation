import { cookies } from 'next/headers';
import { UsersDB, UserRecord, UserRole } from '@/lib/db';

export interface AuthUserOptions {
  allowPending?: boolean;
}

/**
 * Robust server-side user authorization resolver.
 * Handles:
 * 1. Standard authenticated cookies (pf_auth, pf_user_id, pf_status, pf_role)
 * 2. Super admin session overrides (pf_admin_auth, role === 'super_admin')
 * 3. Real-time database verification so Superadmin approvals take effect immediately without re-login.
 */
export async function getAuthorizedUser(options: AuthUserOptions = {}): Promise<UserRecord | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pf_auth')?.value;
    const adminAuth = cookieStore.get('pf_admin_auth')?.value;
    const rawUserId = cookieStore.get('pf_user_id')?.value;
    const rawStatus = cookieStore.get('pf_status')?.value;
    const rawRole = cookieStore.get('pf_role')?.value;

    const userId = rawUserId ? decodeURIComponent(rawUserId).trim() : '';
    const role = rawRole ? decodeURIComponent(rawRole).trim() : '';

    const isAuthenticated = authCookie === 'authenticated' || adminAuth === 'true';
    const isSuperAdmin = role === 'super_admin' || adminAuth === 'true';

    // 1. If completely unauthenticated with no user identifier and not super admin, block
    if (!isAuthenticated && !userId && !isSuperAdmin) {
      return null;
    }

    // 2. Look up user by ID in UsersDB first
    let user = userId ? UsersDB.getById(userId) : null;

    // 3. Fallback for Super Admin
    if (!user && isSuperAdmin) {
      user = UsersDB.getById('user_super_admin_default');
    }

    // 4. Fallback: Search all users in database
    if (!user) {
      const allUsers = UsersDB.getAll();
      if (isSuperAdmin) {
        user = allUsers.find((u) => u.role === 'super_admin') || null;
      } else if (userId) {
        user = allUsers.find((u) => u.id === userId) || null;
      }
    }

    // 5. If user found in database, evaluate authorization against real-time DB state
    if (user) {
      if (user.role === 'super_admin') {
        return user;
      }
      if (user.status === 'rejected') {
        return null;
      }
      if (!options.allowPending && user.status !== 'approved') {
        return null;
      }
      return user;
    }

    // 6. Resilient rehydration for Vercel Serverless ephemeral instances
    if (!user && (isAuthenticated || isSuperAdmin)) {
      const effectiveId = userId || (isSuperAdmin ? 'user_super_admin_default' : `usr_${Date.now()}`);
      user = {
        id: effectiveId,
        email: isSuperAdmin ? 'admin@passionfruit.io' : `${effectiveId}@user.local`,
        name: isSuperAdmin ? 'Super Admin' : 'Workspace Member',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'email',
        role: (isSuperAdmin ? 'super_admin' : (role as UserRole) || 'user'),
        status: isSuperAdmin ? 'approved' : 'pending_approval',
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

      if (!options.allowPending && user.status !== 'approved' && !isSuperAdmin) {
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error('[auth-server] Error verifying authorization:', error);
    return null;
  }
}
