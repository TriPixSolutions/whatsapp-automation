-- ==============================================================================
-- WhatsApp Automation SaaS - PostgreSQL Database Schema (Supabase)
-- Tailored for Luxury Brands & High-Ticket Lead Generation
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKSPACES
-- Stores agency or brand WhatsApp Business Account configurations
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    meta_access_token TEXT,
    phone_number_id TEXT,
    waba_id TEXT,
    webhook_verify_token TEXT DEFAULT md5(random()::text),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CONTACTS (Audience)
-- Audience registry with tags and opt-in status per workspace
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    optin_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_phone UNIQUE(workspace_id, phone_number)
);

-- 3. CAMPAIGNS
-- Bulk broadcast jobs targeting segmented contacts via Meta templates
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    template_name TEXT NOT NULL,
    target_tag TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 4. MESSAGES LOG
-- Complete ledger of inbound and outbound WhatsApp messages and delivery statuses
CREATE TABLE IF NOT EXISTS public.messages_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    message_meta_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    type TEXT NOT NULL CHECK (type IN ('text', 'template', 'interactive')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    payload JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. AUTOMATION FLOWS
-- Rule-based instant responder (e.g. IF user replies 'Show me' -> Send Interactive 3-Button Card)
CREATE TABLE IF NOT EXISTS public.automation_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    trigger_keyword TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('text', 'buttons', 'list')),
    action_payload JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON public.contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON public.contacts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON public.campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_messages_workspace ON public.messages_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON public.messages_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_meta_id ON public.messages_log(message_meta_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages_log(status);
CREATE INDEX IF NOT EXISTS idx_automations_workspace ON public.automation_flows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automation_flows(workspace_id, lower(trigger_keyword));

-- Row Level Security (RLS) Policies
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage data within their workspace
-- Note: In multi-tenant environments, tie workspace_id to auth.uid() or use service_role key for workers
CREATE POLICY "Allow public read for authenticated users on workspaces" 
    ON public.workspaces FOR ALL USING (true);

CREATE POLICY "Allow public access on contacts" 
    ON public.contacts FOR ALL USING (true);

CREATE POLICY "Allow public access on campaigns" 
    ON public.campaigns FOR ALL USING (true);

CREATE POLICY "Allow public access on messages_log" 
    ON public.messages_log FOR ALL USING (true);

CREATE POLICY "Allow public access on automation_flows" 
    ON public.automation_flows FOR ALL USING (true);
