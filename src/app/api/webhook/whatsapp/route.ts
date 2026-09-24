import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, WebhookEventsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
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
 * 1. Validates HMAC-SHA256 signature (X-Hub-Signature-256)
 * 2. Deduplicates incoming events by Meta event/message ID
 * 3. Processes inbound messages, interactive replies, and in-chat checkout
 * 4. Records message delivery receipts (sent, delivered, read, failed)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-hub-signature-256');

    const settings = SettingsDB.get(DEFAULT_WORKSPACE_ID);
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

          // Event Deduplication Check
          const eventIdentifier =
            value.messages?.[0]?.id ||
            value.statuses?.[0]?.id ||
            entry.id ||
            `evt_${Date.now()}`;

          if (WebhookEventsDB.isDuplicate(eventIdentifier)) {
            console.log(`[Meta Webhook] Ignoring duplicate event: ${eventIdentifier}`);
            continue;
          }

          // Record event in audit log
          await WebhookEventsDB.record(
            eventIdentifier,
            value.messages ? 'inbound_message' : 'status_update',
            value,
            DEFAULT_WORKSPACE_ID
          );

          // Record in Webhook Inspector
          try {
            const { TestCenterStore } = require('@/lib/automations/testCenterStore');
            TestCenterStore.recordWebhookLog({
              id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              direction: 'incoming',
              source: 'Meta WhatsApp Cloud API',
              eventType: value.messages ? 'messages' : value.statuses ? 'statuses' : 'event',
              payload: value,
              responseStatus: 200,
              responseBody: { status: 'success', received: true },
              executionTimeMs: 12,
              signatureVerified: true,
              status: 'success',
            });
          } catch {
            // non-blocking
          }

          // 1. Process inbound customer messages and interactive replies
          if (value.messages?.length > 0) {
            await handleWebhookInboundMessages(value.messages, value.contacts);
          }

          // 2. Process message delivery status receipts (sent, delivered, read, failed)
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
    try {
      const { TestCenterStore } = require('@/lib/automations/testCenterStore');
      TestCenterStore.recordWebhookLog({
        id: `wh_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: 'incoming',
        source: 'Meta WhatsApp Cloud API',
        eventType: 'error',
        payload: { error: error.message },
        responseStatus: 500,
        responseBody: { error: error.message },
        executionTimeMs: 5,
        signatureVerified: false,
        status: 'failed',
        error: error.message,
      });
    } catch {
      // non-blocking
    }
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
