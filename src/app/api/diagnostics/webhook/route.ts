import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { database, checked } from '@/lib/db/client';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['owner', 'admin', 'super_admin'].includes(user.role)) return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const events = checked(await database().from('webhook_events')
      .select('id,event_type,status,created_at').eq('workspace_id', user.workspaceId!)
      .order('created_at', { ascending: false }).limit(20));
    return NextResponse.json({ events }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Webhook diagnostics unavailable' }, { status: 503 }); }
}
