import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB } from '@/lib/db';

/**
 * Handles Meta WhatsApp Webhook Handshake Verification (GET)
 * Meta sends: hub.mode=subscribe, hub.verify_token={TOKEN}, hub.challenge={CHALLENGE}
 */
export async function handleWebhookVerification(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const settings = token ? await SettingsDB.getByVerifyToken(token) : null;
  const configuredToken = settings?.verifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe') {
    if (configuredToken && token === configuredToken && challenge !== null) {
      console.log('[Meta Webhook] Verification handshake successful. Returning challenge.');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[Meta Webhook] Verification token mismatch or missing challenge');
    return new NextResponse('Verification token mismatch', { status: 403 });
  }

  return new NextResponse('Invalid webhook mode', { status: 400 });
}
