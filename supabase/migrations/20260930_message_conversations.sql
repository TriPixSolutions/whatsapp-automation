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
