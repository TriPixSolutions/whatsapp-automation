import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  !supabaseUrl.includes('placeholder-project') && 
  serviceRoleKey && 
  !serviceRoleKey.includes('placeholder')
);

export const getAdminClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// In-Memory mock store for zero-setup demo & local preview
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
    meta_access_token: process.env.META_ACCESS_TOKEN || 'EAAG_SAMPLE_TOKEN',
    phone_number_id: process.env.META_PHONE_NUMBER_ID || '109823485764321',
    waba_id: process.env.META_WABA_ID || '102938475610293',
    webhook_verify_token: process.env.META_WEBHOOK_VERIFY_TOKEN || 'apex_luxury_secret_token_2025',
    created_at: new Date().toISOString(),
  },
  contacts: [],
  campaigns: [],
  messages: [],
  automations: [
    {
      id: '00000000-0000-0000-0000-000000000031',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      trigger_keyword: 'Show me',
      action_type: 'buttons' as const,
      action_payload: {
        header: 'Passion Fruit Showcase',
        body: 'Something big is coming soon. Are you ready? Discover our confidential collection below:',
        footer: 'Confidential • By Private Invitation',
        buttons: [
          { id: 'btn_specs', title: 'Product Specs' },
          { id: 'btn_pricing', title: 'Pricing' },
          { id: 'btn_agent', title: 'Talk to Agent' },
        ],
      },
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
};
