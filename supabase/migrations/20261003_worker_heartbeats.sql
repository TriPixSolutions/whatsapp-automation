CREATE TABLE IF NOT EXISTS public.worker_heartbeats (
  worker_name TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('online', 'stopping', 'error')),
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_heartbeats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.worker_heartbeats FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.worker_heartbeats TO service_role;

COMMENT ON TABLE public.worker_heartbeats IS 'Service-role-only liveness evidence for background workers.';

ALTER TABLE public.scheduled_jobs DROP CONSTRAINT IF EXISTS scheduled_jobs_job_type_check;
ALTER TABLE public.scheduled_jobs ADD CONSTRAINT scheduled_jobs_job_type_check
  CHECK (job_type IN ('follow_up', 'campaign_batch', 'window_check', 'sync', 'workflow_trigger'));
