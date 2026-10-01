-- ==============================================================================
-- WhatsApp Automation SaaS - Production Multi-Tenant Schema (Supabase PostgreSQL)
-- Multi-Tenant SaaS Architecture:
-- Users -> Workspaces -> Meta Connections -> Contacts -> Conversations -> Messages -> Automations -> Campaigns
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'employee', 'user')),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('new_user', 'pending_approval', 'approved', 'rejected')),
    company TEXT,
    intended_use TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. WORKSPACES (Tenant Root)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    custom_subdomain TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'enterprise')),
    monthly_message_quota INT NOT NULL DEFAULT 50000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. WORKSPACE MEMBERS (RBAC & Multi-Tenant Membership)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'manager', 'employee')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_concurrent_chats INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

-- 5. META CONNECTIONS (WhatsApp Business Account per Workspace)
CREATE TABLE IF NOT EXISTS public.meta_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    waba_id TEXT NOT NULL,
    business_id TEXT,
    app_id TEXT,
    app_secret_encrypted TEXT,
    access_token_encrypted TEXT NOT NULL,
    webhook_verify_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
    catalog_id TEXT,
    ad_account_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_meta UNIQUE (workspace_id)
);

-- 6. PHONE NUMBERS (Registered WhatsApp Phone Numbers)
CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    phone_number_id TEXT NOT NULL UNIQUE,
    display_phone_number TEXT NOT NULL,
    verified_name TEXT,
    quality_rating TEXT DEFAULT 'GREEN',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CRM COMPANIES (B2B Accounts & Organizations)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. CONTACTS (Unified Customer Audience & CRM Leads)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    phone_normalized TEXT NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    email TEXT,
    company_name TEXT,
    lead_source TEXT DEFAULT 'direct',
    lead_score INT NOT NULL DEFAULT 50,
    stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'qualified', 'opportunity', 'customer')),
    assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    optin_status BOOLEAN NOT NULL DEFAULT TRUE,
    custom_fields JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_contact_phone UNIQUE (workspace_id, phone_normalized)
);

-- 9. CONTACT TAGS
CREATE TABLE IF NOT EXISTS public.contact_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_contact_tag UNIQUE (contact_id, tag)
);

-- 10. CONVERSATIONS (24-Hour Policy Window Tracking & Team Inbox)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    last_inbound_at TIMESTAMPTZ,
    last_outbound_at TIMESTAMPTZ,
    window_expires_at TIMESTAMPTZ,
    state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'closed', 'expired', 'archived')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    unread_count INT NOT NULL DEFAULT 0,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_conversation_contact UNIQUE (workspace_id, contact_id)
);

-- 11. MESSAGES (Ledger of Inbound & Outbound WhatsApp Communication)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    meta_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'template', 'button', 'list', 'carousel', 'catalog', 'interactive', 'location', 'contact_card', 'flow')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    content TEXT NOT NULL DEFAULT '',
    media_url TEXT,
    payload JSONB DEFAULT '{}'::JSONB,
    error_code INT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. MESSAGE STATUSES (Audit Receipts)
CREATE TABLE IF NOT EXISTS public.message_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    meta_message_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    error_code INT,
    error_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. TEMPLATES (Meta-Approved Templates)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en_US',
    category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED', 'PAUSED')),
    header JSONB,
    body TEXT NOT NULL,
    footer TEXT,
    buttons JSONB DEFAULT '[]'::JSONB,
    meta_template_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_template UNIQUE (workspace_id, name, language)
);

-- 14. CAMPAIGNS (Bulk Broadcast Jobs)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_name TEXT NOT NULL,
    target_tag TEXT DEFAULT 'all',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'paused', 'failed', 'stopped')),
    total_recipients INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    delivered_count INT NOT NULL DEFAULT 0,
    read_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    variables JSONB DEFAULT '{}'::JSONB,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. CAMPAIGN CONTACTS
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    meta_message_id TEXT,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    CONSTRAINT uq_campaign_contact UNIQUE (campaign_id, contact_id)
);

-- 16. AUTOMATIONS (Visual Workflow Definitions)
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_value TEXT NOT NULL DEFAULT '',
    graph_data JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    execution_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. AUTOMATION STEPS / NODES
CREATE TABLE IF NOT EXISTS public.automation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    step_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_automation_step_order UNIQUE (automation_id, step_order)
);

-- 18. SCHEDULED JOBS (Follow-Ups & Timed Sequences)
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('follow_up', 'campaign_batch', 'window_check', 'sync')),
    reference_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'cancelled', 'failed')),
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 19. WEBHOOK EVENTS (Deduplication & Audit Trail)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    meta_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_webhook_event UNIQUE (workspace_id, meta_event_id)
);

-- 20. LEAD SOURCES
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('meta_leads', 'manual', 'api', 'imported', 'ctwa')),
    config JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 21. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.lead_sources(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 22. MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    meta_media_id TEXT,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    sha256_hash TEXT,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 23. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 24. DATA DELETIONS (Meta Compliance)
CREATE TABLE IF NOT EXISTS public.data_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confirmation_code TEXT UNIQUE NOT NULL,
    user_id TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    details TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 25. INTEGRATIONS (Store Connections)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce')),
    store_name TEXT,
    site_url TEXT,
    access_token_encrypted TEXT,
    consumer_key_encrypted TEXT,
    consumer_secret_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_platform UNIQUE (workspace_id, platform)
);

-- 26. CONTACT ACTIVITIES (Unified Activity Timeline)
CREATE TABLE IF NOT EXISTS public.contact_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('message_sent', 'message_received', 'tag_added', 'tag_removed', 'stage_changed', 'agent_assigned', 'note_added', 'flow_triggered')),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 27. CONTACT NOTES (Internal Agent Collaboration)
CREATE TABLE IF NOT EXISTS public.contact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT 'Support Agent',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 28. CANNED RESPONSES (Team Inbox Quick Replies)
CREATE TABLE IF NOT EXISTS public.canned_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    shortcut TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_canned_shortcut UNIQUE (workspace_id, shortcut)
);

-- 29. API KEYS (External Developer & Integration Access)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{messages:send,contacts:read}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_used_at TIMESTAMPTZ
);

-- ==============================================================================
-- COMPOSITE & TRIGRAM INDEXES FOR HIGH-THROUGHPUT QUERIES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_conn_ws ON public.meta_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_ws ON public.phone_numbers(workspace_id);

-- Contacts Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_ws ON public.contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_normalized ON public.contacts(workspace_id, phone_normalized);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON public.contacts(workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON public.contacts USING gin (first_name gin_trgm_ops, last_name gin_trgm_ops, phone_normalized gin_trgm_ops);

-- Conversations Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_inbox ON public.conversations(workspace_id, state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON public.conversations(workspace_id, assigned_agent_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_window ON public.conversations(window_expires_at) WHERE state = 'open';

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_stream ON public.messages(workspace_id, conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_meta_lookup ON public.messages(meta_message_id) WHERE meta_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(workspace_id, status);

-- Message Statuses & Webhook Events
CREATE INDEX IF NOT EXISTS idx_message_statuses_meta_id ON public.message_statuses(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_dedup ON public.webhook_events(workspace_id, meta_event_id);

-- Activities & Notes Indexes
CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.contact_activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_contact ON public.contact_notes(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_ws ON public.companies(workspace_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access (For server APIs & Background Queue Workers)
CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Workspaces" ON public.workspaces FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Members" ON public.workspace_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Meta" ON public.meta_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Phones" ON public.phone_numbers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Companies" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Contacts" ON public.contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Tags" ON public.contact_tags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Activities" ON public.contact_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Notes" ON public.contact_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Conversations" ON public.conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Statuses" ON public.message_statuses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Templates" ON public.templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Campaigns" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access CampaignContacts" ON public.campaign_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Automations" ON public.automations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Steps" ON public.automation_steps FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Jobs" ON public.scheduled_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access WebhookEvents" ON public.webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Canned" ON public.canned_responses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access ApiKeys" ON public.api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Media" ON public.media_assets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Audit" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Deletions" ON public.data_deletions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Integrations" ON public.integrations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated Tenant Client Isolation Policies
CREATE POLICY "Tenant User Access Workspaces" ON public.workspaces FOR SELECT USING (
  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR owner_id = auth.uid()
);
CREATE POLICY "Tenant User Access Companies" ON public.companies FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Contacts" ON public.contacts FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Messages" ON public.messages FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Conversations" ON public.conversations FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Activities" ON public.contact_activities FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Notes" ON public.contact_notes FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Automations" ON public.automations FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Campaigns" ON public.campaigns FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Phase 3 conversation persistence functions
BEGIN;
CREATE TABLE IF NOT EXISTS public.conversation_events (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, event_id)
);
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_conversation_event(
  p_workspace_id UUID, p_contact_id UUID, p_phone_number TEXT,
  p_direction TEXT, p_event_id TEXT, p_occurred_at TIMESTAMPTZ
) RETURNS SETOF public.conversations LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public AS $$
DECLARE inserted_count INTEGER;
occurred_at TIMESTAMPTZ := LEAST(COALESCE(p_occurred_at, now()), now());
BEGIN
  IF p_direction NOT IN ('inbound', 'outbound') OR p_event_id IS NULL OR p_event_id = '' THEN
    RAISE EXCEPTION 'Invalid conversation event';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = p_contact_id AND workspace_id = p_workspace_id) THEN
    RAISE EXCEPTION 'Contact does not belong to workspace';
  END IF;
  INSERT INTO public.conversation_events(workspace_id, event_id, contact_id)
    VALUES(p_workspace_id, p_event_id, p_contact_id) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RETURN QUERY SELECT * FROM public.conversations WHERE workspace_id = p_workspace_id AND contact_id = p_contact_id;
    RETURN;
  END IF;
  RETURN QUERY INSERT INTO public.conversations AS current (
    workspace_id, contact_id, phone_number, last_inbound_at, last_outbound_at,
    window_expires_at, unread_count, state, updated_at
  ) VALUES (
    p_workspace_id, p_contact_id, p_phone_number,
    CASE WHEN p_direction = 'inbound' THEN occurred_at END,
    CASE WHEN p_direction = 'outbound' THEN occurred_at END,
    CASE WHEN p_direction = 'inbound' THEN occurred_at + interval '24 hours' END,
    CASE WHEN p_direction = 'inbound' THEN 1 ELSE 0 END,
    CASE WHEN p_direction = 'inbound' THEN 'open' ELSE 'closed' END, now()
  ) ON CONFLICT (workspace_id, contact_id) DO UPDATE SET
    phone_number = EXCLUDED.phone_number,
    last_inbound_at = GREATEST(current.last_inbound_at, EXCLUDED.last_inbound_at),
    last_outbound_at = GREATEST(current.last_outbound_at, EXCLUDED.last_outbound_at),
    window_expires_at = GREATEST(current.window_expires_at, EXCLUDED.window_expires_at),
    unread_count = current.unread_count + CASE WHEN p_direction = 'inbound' THEN 1 ELSE 0 END,
    state = CASE WHEN p_direction = 'inbound' THEN 'open' ELSE current.state END,
    updated_at = now()
  RETURNING *;
END $$;

CREATE OR REPLACE FUNCTION public.inbox_conversations(p_workspace_id UUID, p_limit INTEGER DEFAULT 100)
RETURNS TABLE(phone_number TEXT, contact_name TEXT, last_message TEXT, last_time TIMESTAMPTZ, unread_count INTEGER, status TEXT)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH latest AS (
    SELECT DISTINCT ON (m.phone_number) m.* FROM public.messages m
    WHERE m.workspace_id = p_workspace_id ORDER BY m.phone_number, m.created_at DESC, m.id DESC
  )
  SELECT latest.phone_number, COALESCE(NULLIF(trim(c.first_name || ' ' || c.last_name), ''), latest.phone_number),
    latest.content, latest.created_at, COALESCE(conv.unread_count, 0), latest.status
  FROM latest
  LEFT JOIN public.contacts c ON c.id = latest.contact_id AND c.workspace_id = p_workspace_id
  LEFT JOIN public.conversations conv ON conv.contact_id = c.id AND conv.workspace_id = p_workspace_id
  ORDER BY latest.created_at DESC LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;
REVOKE ALL ON FUNCTION public.record_conversation_event(UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inbox_conversations(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_conversation_event(UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.inbox_conversations(UUID, INTEGER) TO service_role;
GRANT ALL ON public.conversation_events TO service_role;
COMMIT;

-- Phase 4 durable workflow runtime
BEGIN;
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  definition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_workspace ON public.workflow_definitions(workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('running','waiting','paused','completed','failed','cancelled')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  log_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workspace ON public.workflow_executions(workspace_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.workflow_sessions (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  workflow_id TEXT NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  execution_id TEXT NOT NULL,
  current_node_id TEXT NOT NULL,
  waiting_for TEXT NOT NULL CHECK (waiting_for IN ('button_click','reply','carousel_selection','delay')),
  paused_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  session_data JSONB NOT NULL,
  claimed_at TIMESTAMPTZ,
  claim_token UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, phone_number)
);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_due ON public.workflow_sessions(expires_at) WHERE waiting_for = 'delay';

ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role Full Access Workflow Definitions" ON public.workflow_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Workflow Executions" ON public.workflow_executions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Workflow Sessions" ON public.workflow_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.workflow_definitions, public.workflow_executions, public.workflow_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.claim_due_workflow_delays(p_limit INTEGER, p_claim_token UUID)
RETURNS SETOF public.workflow_sessions LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT id FROM public.workflow_sessions
    WHERE waiting_for = 'delay' AND expires_at <= now()
      AND (claimed_at IS NULL OR claimed_at < now() - interval '5 minutes')
    ORDER BY expires_at FOR UPDATE SKIP LOCKED LIMIT GREATEST(1, LEAST(p_limit, 100))
  )
  UPDATE public.workflow_sessions s SET claimed_at = now(), claim_token = p_claim_token, updated_at = now()
  FROM due WHERE s.id = due.id RETURNING s.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_due_workflow_delays(INTEGER, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_workflow_delays(INTEGER, UUID) TO service_role;
COMMIT;

-- Phase 5 durable webhook claims
BEGIN;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS claim_token UUID;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_webhook_events_state ON public.webhook_events(status, claimed_at);

CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_workspace_id UUID, p_meta_event_id TEXT, p_event_type TEXT, p_payload JSONB, p_claim_token UUID
) RETURNS TEXT LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_status TEXT;
DECLARE current_claimed_at TIMESTAMPTZ;
BEGIN
  INSERT INTO public.webhook_events(workspace_id, meta_event_id, event_type, payload, status,
    claimed_at, claim_token, attempt_count, updated_at)
  VALUES(p_workspace_id, p_meta_event_id, p_event_type, p_payload, 'received',
    now(), p_claim_token, 1, now())
  ON CONFLICT (workspace_id, meta_event_id) DO NOTHING;
  IF FOUND THEN RETURN 'claimed'; END IF;
  SELECT status, claimed_at INTO current_status, current_claimed_at
  FROM public.webhook_events WHERE workspace_id = p_workspace_id AND meta_event_id = p_meta_event_id
  FOR UPDATE;
  IF current_status = 'processed' OR current_status = 'ignored' THEN RETURN 'processed'; END IF;
  IF current_status = 'received' AND current_claimed_at >= now() - interval '5 minutes' THEN RETURN 'busy'; END IF;
  UPDATE public.webhook_events SET status = 'received', event_type = p_event_type, payload = p_payload,
    claimed_at = now(), claim_token = p_claim_token, last_error = null,
    attempt_count = attempt_count + 1, updated_at = now()
  WHERE workspace_id = p_workspace_id AND meta_event_id = p_meta_event_id;
  RETURN 'claimed';
END $$;
REVOKE ALL ON FUNCTION public.claim_webhook_event(UUID, TEXT, TEXT, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event(UUID, TEXT, TEXT, JSONB, UUID) TO service_role;
COMMIT;

-- Phase 5 durable scheduled-job claims
BEGIN;
ALTER TABLE public.scheduled_jobs ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE public.scheduled_jobs ADD COLUMN IF NOT EXISTS claim_token UUID;
ALTER TABLE public.scheduled_jobs ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.scheduled_jobs ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE public.scheduled_jobs ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.scheduled_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_due_claim ON public.scheduled_jobs(job_type, status, scheduled_at, claimed_at);
CREATE OR REPLACE FUNCTION public.claim_due_scheduled_jobs(p_job_type TEXT, p_limit INTEGER, p_claim_token UUID)
RETURNS SETOF public.scheduled_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT id FROM public.scheduled_jobs
    WHERE job_type = p_job_type AND scheduled_at <= now() AND attempt_count < max_attempts
      AND (status = 'pending' OR (status = 'running' AND claimed_at < now() - interval '5 minutes'))
    ORDER BY scheduled_at FOR UPDATE SKIP LOCKED LIMIT GREATEST(1, LEAST(p_limit, 100))
  )
  UPDATE public.scheduled_jobs j SET status = 'running', claimed_at = now(), claim_token = p_claim_token,
    attempt_count = j.attempt_count + 1, updated_at = now()
  FROM due WHERE j.id = due.id RETURNING j.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_due_scheduled_jobs(TEXT, INTEGER, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_scheduled_jobs(TEXT, INTEGER, UUID) TO service_role;
COMMIT;
