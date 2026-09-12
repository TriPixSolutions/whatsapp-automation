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
  contacts: [
    {
      id: '00000000-0000-0000-0000-000000000011',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+971501234567',
      first_name: 'Julian',
      last_name: 'Vance',
      tags: ['vip', 'teaser_list', 'private-aviation'],
      optin_status: true,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+447700900123',
      first_name: 'Lady Eleanor',
      last_name: 'Sterling',
      tags: ['vip', 'teaser_list', 'haute-horlogerie'],
      optin_status: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      phone_number: '+14155552671',
      first_name: 'Marcus',
      last_name: 'Castile',
      tags: ['vip', 'teaser_list', 'luxury-villas'],
      optin_status: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  campaigns: [
    {
      id: '00000000-0000-0000-0000-000000000021',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      campaign_name: 'Exclusive Teaser Drop - Fall Collection',
      template_name: 'teaser_alert',
      target_tag: 'teaser_list',
      status: 'completed' as 'pending' | 'processing' | 'completed' | 'failed',
      total_recipients: 3,
      sent_count: 3,
      failed_count: 0,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      completed_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
    },
  ],
  messages: [
    {
      id: 'msg-1',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      contact_id: '00000000-0000-0000-0000-000000000011',
      message_meta_id: 'wamid.sim_teaser_01',
      direction: 'outbound' as const,
      type: 'template' as const,
      status: 'delivered' as const,
      payload: {
        template: 'teaser_alert',
        text: 'Something big is coming soon. Are you ready?',
      },
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg-2',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      contact_id: '00000000-0000-0000-0000-000000000011',
      message_meta_id: 'wamid.sim_reply_02',
      direction: 'inbound' as const,
      type: 'text' as const,
      status: 'delivered' as const,
      payload: {
        text: 'Show me',
      },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'msg-3',
      workspace_id: '00000000-0000-0000-0000-000000000001',
      contact_id: '00000000-0000-0000-0000-000000000011',
      message_meta_id: 'wamid.sim_buttons_03',
      direction: 'outbound' as const,
      type: 'interactive' as const,
      status: 'read' as const,
      payload: {
        header: 'Passion Fruit Showcase',
        body: 'Something big is coming soon. Are you ready? Discover our confidential collection below:',
        buttons: ['Product Specs', 'Pricing', 'Talk to Agent'],
      },
      created_at: new Date(Date.now() - 3590000).toISOString(),
    },
  ],
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
