-- ==============================================================================
-- WhatsApp Automation SaaS - Seed Data Script
-- Populates the test workspace, 3 luxury contacts, and interactive automation flow
-- ==============================================================================

-- 1. Create Test Luxury Workspace
INSERT INTO public.workspaces (
    id,
    name,
    meta_access_token,
    phone_number_id,
    waba_id,
    webhook_verify_token
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'AURA Private Luxury Agency',
    'EAAG_SAMPLE_TOKEN_REPLACE_WITH_REAL_META_GRAPH_API_USER_TOKEN',
    '109823485764321',
    '102938475610293',
    'apex_luxury_secret_token_2025'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    webhook_verify_token = EXCLUDED.webhook_verify_token;

-- 2. Seed 3 High-Ticket Test Contacts
INSERT INTO public.contacts (
    id,
    workspace_id,
    phone_number,
    first_name,
    last_name,
    tags,
    optin_status
) VALUES 
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    '+971501234567',
    'Julian',
    'Vance',
    ARRAY['vip', 'teaser_list', 'private-aviation'],
    TRUE
),
(
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    '+447700900123',
    'Lady Eleanor',
    'Sterling',
    ARRAY['vip', 'teaser_list', 'haute-horlogerie'],
    TRUE
),
(
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000001',
    '+14155552671',
    'Marcus',
    'Castile',
    ARRAY['vip', 'teaser_list', 'luxury-villas'],
    TRUE
) ON CONFLICT (workspace_id, phone_number) DO UPDATE SET
    tags = EXCLUDED.tags,
    optin_status = EXCLUDED.optin_status;

-- 3. Seed Initial Teaser Campaign (Test Flow 1)
INSERT INTO public.campaigns (
    id,
    workspace_id,
    campaign_name,
    template_name,
    target_tag,
    status,
    total_recipients,
    sent_count,
    failed_count
) VALUES (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    'Exclusive Teaser Drop - Fall Collection',
    'teaser_alert',
    'teaser_list',
    'pending',
    3,
    0,
    0
) ON CONFLICT (id) DO NOTHING;

-- 4. Seed Inbound Interactive Automation Flow (Test Flow 2)
-- Rule: When user replies 'Show me', instantly trigger 3 Quick Reply buttons:
-- [Product Specs, Pricing, Talk to Agent]
INSERT INTO public.automation_flows (
    id,
    workspace_id,
    trigger_keyword,
    action_type,
    action_payload,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000001',
    'Show me',
    'buttons',
    '{
        "header": "AURA Private Showcase",
        "body": "Something big is coming soon. Are you ready? Discover our confidential collection below:",
        "footer": "Confidential • By Private Invitation",
        "buttons": [
            { "id": "btn_specs", "title": "Product Specs" },
            { "id": "btn_pricing", "title": "Pricing" },
            { "id": "btn_agent", "title": "Talk to Agent" }
        ]
    }'::JSONB,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 5. Seed Messages Log for initial analytics rendering
INSERT INTO public.messages_log (
    workspace_id,
    contact_id,
    message_meta_id,
    direction,
    type,
    status,
    payload,
    created_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'wamid.HBgLMzk3MTUwMTIzNDU2NxUCABEYEjA5ODcyMzQ=',
    'outbound',
    'template',
    'delivered',
    '{"template": "teaser_alert", "text": "Something big is coming soon. Are you ready?"}'::JSONB,
    NOW() - INTERVAL '2 hours'
),
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'wamid.HBgLMzk3MTUwMTIzNDU2NxUCABEYEjEwOTgyMzQ=',
    'inbound',
    'text',
    'delivered',
    '{"text": "Show me"}'::JSONB,
    NOW() - INTERVAL '1 hour 50 minutes'
),
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'wamid.HBgLMzk3MTUwMTIzNDU2NxUCABEYEjIxOTgyMzQ=',
    'outbound',
    'interactive',
    'read',
    '{"interactive": "3_buttons_dispatched", "buttons": ["Product Specs", "Pricing", "Talk to Agent"]}'::JSONB,
    NOW() - INTERVAL '1 hour 49 minutes'
);
