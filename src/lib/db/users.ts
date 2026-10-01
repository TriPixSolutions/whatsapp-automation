import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { database, checked } from './client';
import type { UserRecord } from './types';

function mapUser(row: any, membership: any): UserRecord {
  return {
    id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash,
    avatarUrl: row.avatar_url, role: membership.role, status: row.status,
    workspaceId: membership.workspace_id, workspace_id: membership.workspace_id,
    company: row.company, intendedUse: row.intended_use,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function withMembership(row: any, workspaceId?: string): Promise<UserRecord | null> {
  if (!row) return null;
  let query = database().from('workspace_members').select('*').eq('user_id', row.id).eq('is_active', true);
  if (workspaceId) query = query.eq('workspace_id', workspaceId);
  const memberships = checked(await query.order('created_at').limit(1));
  return memberships?.[0] ? mapUser(row, memberships[0]) : null;
}

export const UsersDB = {
  async getById(id: string, workspaceId?: string): Promise<UserRecord | null> {
    return withMembership(checked(await database().from('users').select('*').eq('id', id).maybeSingle()), workspaceId);
  },
  async getByEmail(email: string): Promise<UserRecord | null> {
    return withMembership(checked(await database().from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle()));
  },
  async verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
    const user = await this.getByEmail(email);
    return user?.passwordHash && verifyPassword(password, user.passwordHash) ? user : null;
  },
  async create(data: Partial<UserRecord> & { email: string; password?: string }): Promise<UserRecord> {
    const db = database();
    const id = randomUUID();
    const workspaceId = data.workspaceId || randomUUID();
    const now = new Date().toISOString();
    const row = {
      id, email: data.email.toLowerCase().trim(), name: data.name || data.email.split('@')[0],
      password_hash: data.password ? hashPassword(data.password) : null,
      avatar_url: data.avatarUrl || null, role: 'owner', status: 'approved',
      company: data.company || '', created_at: now, updated_at: now,
    };
    // Create only new isolated owner workspaces here; inviting members is a separate operation.
    checked(await db.from('users').insert(row));
    let workspaceCreated = false;
    try {
      checked(await db.from('workspaces').insert({ id: workspaceId, name: data.company || `${row.name}'s workspace`, owner_id: id }));
      workspaceCreated = true;
      const membership = { user_id: id, workspace_id: workspaceId, role: 'owner', is_active: true };
      checked(await db.from('workspace_members').insert(membership));
      return mapUser(row, membership);
    } catch (error) {
      // Do not leave an apparently successful account when provisioning failed.
      if (workspaceCreated) await db.from('workspaces').delete().eq('id', workspaceId).eq('owner_id', id);
      await db.from('users').delete().eq('id', id);
      throw error;
    }
  },
  async getAll(): Promise<UserRecord[]> {
    const rows = checked(await database().from('users').select('*')) || [];
    const users = await Promise.all(rows.map(row => withMembership(row)));
    return users.filter((user): user is UserRecord => user !== null);
  },
  async requestAccess(id: string, details?: { company?: string; intendedUse?: string }): Promise<UserRecord | null> {
    checked(await database().from('users').update({ status: 'pending_approval', company: details?.company,
      intended_use: details?.intendedUse, updated_at: new Date().toISOString() }).eq('id', id));
    return this.getById(id);
  },
};
