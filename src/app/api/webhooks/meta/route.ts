import { NextRequest } from 'next/server';
import { GET as canonicalGet, POST as canonicalPost } from '@/app/api/webhook/whatsapp/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Legacy Webhook Route Alias: /api/webhooks/meta -> /api/webhook/whatsapp
 * Preserves zero broken routes for existing Meta Apps while consolidating onto ONE canonical webhook engine.
 */
export async function GET(request: NextRequest) {
  return canonicalGet(request);
}

export async function POST(request: NextRequest) {
  return canonicalPost(request);
}
