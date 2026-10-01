-- Custom server-signed sessions are not Supabase Auth sessions. Only the backend
-- service role may use the broad policies; browser roles must not inherit them.
BEGIN;
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE 'Service Role Full Access%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO service_role',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;
COMMIT;
