// Read-only setup probe. Never prints credentials or contacts.
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
(async () => {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let ready = Boolean(secret && secret.length >= 32 && url && key);
  ready = ready && Boolean(process.env.WORKER_SECRET && process.env.WORKER_SECRET.length >= 32);
  console.log('Worker authentication:', process.env.WORKER_SECRET?.length >= 32 ? 'configured' : 'missing');
  console.log('Session signing:', secret?.length >= 32 ? 'configured' : 'missing');
  if (!url || !key) { console.log('Database: URL or service-role key missing'); process.exitCode = 1; return; }
  try {
    const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: key }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const table of ['users', 'workspaces', 'workspace_members', 'meta_connections', 'phone_numbers', 'contacts', 'contact_tags', 'contact_notes', 'contact_activities', 'messages', 'message_statuses', 'conversations', 'conversation_events', 'workflow_definitions', 'workflow_sessions', 'workflow_executions', 'webhook_events', 'campaigns', 'campaign_contacts', 'scheduled_jobs']) {
      const { error } = await db.from(table).select('*', { head: true }).abortSignal(AbortSignal.timeout(8000));
      console.log(`${table}: ${error ? 'unavailable' : 'available'}`);
      if (error) ready = false;
    }
  } catch (error) {
    ready = false;
    console.log('Database unavailable:', error.cause?.code || error.name);
  }
  process.exitCode = ready ? 0 : 1;
})();
