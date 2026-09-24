-- ==============================================================================
-- WhatsApp Automation SaaS - Production Seed Data (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Default Workspace
INSERT INTO public.workspaces (id, name, subdomain, custom_subdomain)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'TriPix Solutions Workspace',
    'default',
    'app'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Default Super Admin User
-- Password default: pbkdf2 hash of admin configured credential or placeholder
INSERT INTO public.users (id, email, password_hash, name, role, status, company)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@tripixsolutions.com',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', -- initial seeded hash
    'System Administrator',
    'super_admin',
    'approved',
    'TriPix Solutions'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Workspace Membership
INSERT INTO public.workspace_members (workspace_id, user_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'owner'
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 4. Initial Meta-Approved Templates
INSERT INTO public.templates (workspace_id, name, language, category, status, body, footer, buttons)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'teaser_alert',
    'en_US',
    'MARKETING',
    'APPROVED',
    'Hi {{1}}! Something special is waiting for you. Discover our exclusive catalog collection today.',
    'Official WhatsApp Verified',
    '[{"type": "QUICK_REPLY", "text": "Discover Collection"}, {"type": "QUICK_REPLY", "text": "Talk to Concierge"}]'::JSONB
),
(
    '00000000-0000-0000-0000-000000000001',
    'order_confirmation',
    'en_US',
    'UTILITY',
    'APPROVED',
    'Thank you for your order {{1}}! Your item {{2}} is confirmed and being prepared for express dispatch.',
    'Order Tracking Active',
    '[{"type": "URL", "text": "Track Order"}]'::JSONB
),
(
    '00000000-0000-0000-0000-000000000001',
    'welcome_lead',
    'en_US',
    'MARKETING',
    'APPROVED',
    'Hello {{1}}! Welcome to TriPix Solutions. How may our sales and support team assist you today?',
    'Tap below to get started',
    '[{"type": "QUICK_REPLY", "text": "View Products"}, {"type": "QUICK_REPLY", "text": "Speak with Agent"}]'::JSONB
)
ON CONFLICT (workspace_id, name, language) DO NOTHING;

-- 5. Default Lead Source
INSERT INTO public.lead_sources (workspace_id, name, source_type)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Click-to-WhatsApp Ads',
    'ctwa'
)
ON CONFLICT DO NOTHING;
