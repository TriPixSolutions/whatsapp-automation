import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/server';
import { getSessionSecret } from '@/lib/auth/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let databaseReady = false;
  let sessionsReady = false;
  try {
    const client = getAdminClient();
    if (client) {
      const { error } = await client.from('workspaces').select('id').limit(1).abortSignal(AbortSignal.timeout(5000));
      databaseReady = !error;
    }
  } catch { /* Report unavailable without exposing database details. */ }
  try {
    getSessionSecret();
    sessionsReady = true;
  } catch { /* A missing signing secret is a setup error. */ }
  const healthy = databaseReady && sessionsReady;
  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    services: { database: { status: databaseReady ? 'up' : 'down' }, sessions: { status: sessionsReady ? 'up' : 'down' } },
  }, { status: healthy ? 200 : 503 });
}
