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
