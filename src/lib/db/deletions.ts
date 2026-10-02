import { randomUUID } from 'crypto';
import { database, checked } from './client';
export const DataDeletionDB = {
  async create(data: { userId?: string; email?: string; details: string }) {
    const row = checked(await database().from('data_deletions').insert({
      confirmation_code: randomUUID(), user_id: data.userId, email: data.email,
      status: 'pending', details: data.details, completed_at: null,
    }).select('*').single());
    return { confirmationCode: row.confirmation_code, status: row.status, requestedAt: row.requested_at };
  },
  async getByCode(code: string) {
    const row = checked(await database().from('data_deletions').select('confirmation_code,status,requested_at,completed_at').eq('confirmation_code', code).maybeSingle());
    return row ? { confirmationCode: row.confirmation_code, status: row.status, requestedAt: row.requested_at, completedAt: row.completed_at } : null;
  },
};
