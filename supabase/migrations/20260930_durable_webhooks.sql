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
