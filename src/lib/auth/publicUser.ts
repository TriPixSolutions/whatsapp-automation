import type { UserRecord } from '@/lib/db/types';

export function publicUser(user: UserRecord) {
  const { passwordHash, password_hash, ...profile } = user;
  return profile;
}
