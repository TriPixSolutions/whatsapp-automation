-- ==============================================================================
-- WhatsApp Automation SaaS - Production Multi-Tenant Schema (Supabase PostgreSQL)
-- Multi-Tenant SaaS Architecture:
-- Users -> Workspaces -> Meta Connections -> Contacts -> Conversations -> Messages -> Automations -> Campaigns
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. WORKSPACE MEMBERS (RBAC & Multi-Tenant Membership)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'manager', 'employee')),
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

-- 7. CONTACTS (Customer Audience)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    optin_status BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_contact_phone UNIQUE (workspace_id, phone_number)
);

-- 8. CONTACT TAGS
CREATE TABLE IF NOT EXISTS public.contact_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_contact_tag UNIQUE (contact_id, tag)
);

-- 9. CONVERSATIONS (24-Hour Policy Window Tracking)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    last_inbound_at TIMESTAMPTZ,
    last_outbound_at TIMESTAMPTZ,
    window_expires_at TIMESTAMPTZ,
    state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'closed', 'expired', 'archived')),
    assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    unread_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_conversation_contact UNIQUE (workspace_id, contact_id)
);

-- 10. MESSAGES (Ledger of Inbound & Outbound Communication)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    meta_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'template', 'button', 'list', 'carousel', 'catalog', 'interactive')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    content TEXT NOT NULL DEFAULT '',
    media_url TEXT,
    payload JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. MESSAGE STATUSES (Audit Receipts)
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

-- 12. TEMPLATES (Meta-Approved Templates)
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

-- 13. CAMPAIGNS (Bulk Broadcast Jobs)
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

-- 14. CAMPAIGN CONTACTS
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

-- 15. AUTOMATIONS (Workflow Definitions)
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'button_reply', 'list_reply', 'lead_created', 'tag_added', 'inbound_any')),
    trigger_value TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    execution_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. AUTOMATION STEPS
CREATE TABLE IF NOT EXISTS public.automation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN ('trigger', 'condition', 'wait', 'message', 'tag', 'assign', 'webhook', 'end')),
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_automation_step_order UNIQUE (automation_id, step_order)
);

-- 17. SCHEDULED JOBS (Follow-Ups & Timed Sequences)
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

-- 18. WEBHOOK EVENTS (Deduplication & Audit Trail)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    meta_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 19. LEAD SOURCES
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('meta_leads', 'manual', 'api', 'imported', 'ctwa')),
    config JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 20. LEADS
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

-- 21. MEDIA ASSETS
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

-- 22. AUDIT LOGS
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

-- 23. DATA DELETIONS (Meta Compliance)
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

-- 24. INTEGRATIONS (Store Connections)
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

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT MULTI-TENANT QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_conn_ws ON public.meta_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_ws ON public.phone_numbers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ws ON public.contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON public.contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags(workspace_id, tag);
CREATE INDEX IF NOT EXISTS idx_conversations_ws ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_window ON public.conversations(window_expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_ws ON public.messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_meta_id ON public.messages(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_phone ON public.messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_message_statuses_meta_id ON public.message_statuses(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_templates_ws ON public.templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_ws ON public.campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_camp ON public.campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automations_ws ON public.automations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations(workspace_id, trigger_type, lower(trigger_value));
CREATE INDEX IF NOT EXISTS idx_automation_steps_auto ON public.automation_steps(automation_id, step_order);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_sched ON public.scheduled_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_ref ON public.scheduled_jobs(workspace_id, reference_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_meta_id ON public.webhook_events(meta_event_id);
CREATE INDEX IF NOT EXISTS idx_leads_ws ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_media_assets_ws ON public.media_assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_data_deletions_code ON public.data_deletions(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_integrations_ws ON public.integrations(workspace_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to all tables (for background workers & server API handlers)
CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Workspaces" ON public.workspaces FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Members" ON public.workspace_members FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meta" ON public.meta_connections FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Phones" ON public.phone_numbers FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Contacts" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Tags" ON public.contact_tags FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Conversations" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Statuses" ON public.message_statuses FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Templates" ON public.templates FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Campaigns" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Service Role Full Access CampaignContacts" ON public.campaign_contacts FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Automations" ON public.automations FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Steps" ON public.automation_steps FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Jobs" ON public.scheduled_jobs FOR ALL USING (true);
CREATE POLICY "Service Role Full Access WebhookEvents" ON public.webhook_events FOR ALL USING (true);
CREATE POLICY "Service Role Full Access LeadSources" ON public.lead_sources FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Leads" ON public.leads FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Media" ON public.media_assets FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Audit" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Deletions" ON public.data_deletions FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Integrations" ON public.integrations FOR ALL USING (true);

-- Authenticated Tenant Client Isolation Policies (Defense-in-depth for client queries)
CREATE POLICY "Tenant User Access Workspaces" ON public.workspaces FOR SELECT USING (
  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR owner_id = auth.uid()
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
CREATE POLICY "Tenant User Access Automations" ON public.automations FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "Tenant User Access Campaigns" ON public.campaigns FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

