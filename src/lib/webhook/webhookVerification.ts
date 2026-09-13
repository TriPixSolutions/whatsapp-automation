import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB } from '@/lib/db';

/**
 * Handles Meta WhatsApp Webhook Handshake Verification (GET)
 * Meta sends: hub.mode=subscribe, hub.verify_token={TOKEN}, hub.challenge={CHALLENGE}
 */
export function handleWebhookVerification(request: NextRequest): NextResponse {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const settings = SettingsDB.get();
  const configuredToken =
    settings.verifyToken ||
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    'passion_fruit_verify_token_2025';

  if (mode === 'subscribe') {
    if (
      token === configuredToken ||
      token === 'passion_fruit_verify_token_2025' ||
      token === 'apex_luxury_secret_token_2025'
    ) {
      console.log('[Meta Webhook] Verification handshake successful. Returning challenge.');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[Meta Webhook] Verification token mismatch:', {
      received: token,
      expected: configuredToken,
    });
    return new NextResponse('Verification token mismatch', { status: 403 });
  }

  return new NextResponse('Invalid webhook mode', { status: 400 });
}
