import { getAdminClient } from '@/lib/supabase/server';

export function database() {
  const client = getAdminClient();
  if (!client) {
    throw new Error(
      'Database is not configured. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in the deployment environment, then rebuild and restart the application.',
    );
  }
  return client;
}

export function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Database operation failed: ${result.error.message}`);
  return result.data;
}
