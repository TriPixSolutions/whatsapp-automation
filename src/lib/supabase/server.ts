import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  !supabaseUrl.includes('placeholder-project') && 
  serviceRoleKey && 
  !serviceRoleKey.includes('placeholder')
);

// Cached singleton client across warm Serverless Lambdas to prevent connection pool exhaustion
let cachedAdminClient: SupabaseClient | null = null;

export const getAdminClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    });
  }
  return cachedAdminClient;
};

// Fallback in-memory store for legacy testing routes
export const mockStore: {
  workspace: any;
  contacts: any[];
  campaigns: any[];
  messages: any[];
  automations: any[];
} = {
  workspace: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Passion Fruit Enterprise Agency',
    meta_access_token: process.env.META_ACCESS_TOKEN || '',
    phone_number_id: process.env.META_PHONE_NUMBER_ID || '',
    waba_id: process.env.META_WABA_ID || '',
    webhook_verify_token: process.env.META_WEBHOOK_VERIFY_TOKEN || 'apex_luxury_secret_token_2025',
    created_at: new Date().toISOString(),
  },
  contacts: [],
  campaigns: [],
  messages: [],
  automations: [],
};
