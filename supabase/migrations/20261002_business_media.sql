-- Additive migration; preserves customer data and provider identifiers.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deal_value NUMERIC NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS companies_workspace_created_idx ON public.companies(workspace_id,created_at DESC);
CREATE INDEX IF NOT EXISTS messages_workspace_created_idx ON public.messages(workspace_id,created_at DESC);
CREATE INDEX IF NOT EXISTS conversation_events_workspace_created_idx ON public.conversation_events(workspace_id,created_at DESC);
CREATE INDEX IF NOT EXISTS leads_workspace_created_idx ON public.leads(workspace_id,created_at DESC);
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('workspace-media','workspace-media',false,16777216,ARRAY['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/ogg','application/pdf'])
ON CONFLICT (id) DO NOTHING;
-- Custom signed application sessions have no Supabase auth.uid(); only server-authorized
-- service-role access is allowed. No anonymous/authenticated storage policy is granted.
