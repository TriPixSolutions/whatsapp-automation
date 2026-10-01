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
