import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB } from '@/lib/db';
import { verifyMetaSignature } from '@/lib/crypto';
import { handleWebhookVerification } from '@/lib/webhook/webhookVerification';
import { handleWebhookInboundMessages } from '@/lib/webhook/webhookInbound';
import { handleWebhookStatuses } from '@/lib/webhook/webhookStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/webhook/whatsapp
 * Meta WhatsApp Webhook Handshake Verification
 */
export async function GET(request: NextRequest) {
  return handleWebhookVerification(request);
}

/**
 * POST /api/webhook/whatsapp
 * Meta Cloud API Inbound Webhook:
 * 1. Validates HMAC-SHA256 signature
 * 2. Processes inbound messages, interactive buttons, and in-chat checkout
 * 3. Records message delivery receipts (sent, delivered, read, failed)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-hub-signature-256');

    const settings = SettingsDB.get();
    const appSecret = settings.appSecret || process.env.META_APP_SECRET;

    if (appSecret && appSecret !== 'your_meta_app_secret') {
      const isValid = verifyMetaSignature(rawBody, signatureHeader, appSecret);
      if (!isValid) {
        console.warn('[Meta Webhook Security] Invalid HMAC-SHA256 signature detected');
        return NextResponse.json({ error: 'Invalid HMAC-SHA256 signature' }, { status: 401 });
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          // Process inbound customer messages and interactive replies
          if (value.messages?.length > 0) {
            await handleWebhookInboundMessages(value.messages, value.contacts);
          }

          // Process message delivery status receipts
          if (value.statuses?.length > 0) {
            handleWebhookStatuses(value.statuses);
          }
        }
      }

      return NextResponse.json({ status: 'success', received: true }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
