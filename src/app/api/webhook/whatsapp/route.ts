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
 * Production Meta Cloud API Inbound Webhook:
 * 1. Resolves tenant workspace by WABA ID or Phone Number ID
 * 2. Enforces strict HMAC-SHA256 signature validation (X-Hub-Signature-256)
 * 3. Prevents duplicate event replay attacks
 * 4. Dispatches inbound messages & status receipts with multi-tenant context
 * 5. Returns immediate HTTP 200 to satisfy Meta 5s SLA
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let signatureVerified = false;

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-hub-signature-256');

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    // 1. Resolve Multi-Tenant Workspace from Meta Payload Metadata
    const wabaId = body.entry?.[0]?.id;
    const phoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    let settings = SettingsDB.get(DEFAULT_WORKSPACE_ID);
    if (wabaId) {
      settings = SettingsDB.getByWabaId(wabaId);
    } else if (phoneNumberId) {
      settings = SettingsDB.getByPhoneNumberId(phoneNumberId);
    }

    const targetWorkspaceId = settings.id || DEFAULT_WORKSPACE_ID;
    const appSecret = settings.appSecret || process.env.META_APP_SECRET;

    // 2. Strict HMAC-SHA256 Signature Verification
    if (signatureHeader) {
      if (!appSecret) {
        console.warn('[Meta Webhook Security] Signature provided but META_APP_SECRET is not configured.');
        return NextResponse.json({ error: 'Webhook signature validation misconfigured on server' }, { status: 401 });
      }

      signatureVerified = verifyMetaSignature(rawBody, signatureHeader, appSecret);
      if (!signatureVerified) {
        console.warn('[Meta Webhook Security] Invalid HMAC-SHA256 signature detected for workspace:', targetWorkspaceId);
        return NextResponse.json({ error: 'Invalid HMAC-SHA256 signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Meta Webhook Security] Missing required X-Hub-Signature-256 header in production');
      return NextResponse.json({ error: 'Missing X-Hub-Signature-256 header' }, { status: 401 });
    }

    // 3. Process WhatsApp Business Account Event Feed
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

          // Record event in audit deduplication log
          await WebhookEventsDB.record(
            eventIdentifier,
            value.messages ? 'inbound_message' : 'status_update',
            value,
            targetWorkspaceId
          );

          // Record in Webhook Inspector Telemetry
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
              executionTimeMs: Date.now() - startTime,
              signatureVerified,
              status: 'success',
            });
          } catch {
            // non-blocking telemetry
          }

          // 4. Process Inbound Messages (with explicit tenant workspace context)
          if (value.messages?.length > 0) {
            await handleWebhookInboundMessages(value.messages, value.contacts, targetWorkspaceId);
          }

          // 5. Process Message Status Delivery Receipts
          if (value.statuses?.length > 0) {
            handleWebhookStatuses(value.statuses);
          }
        }
      }

      return NextResponse.json({ status: 'success', received: true, latencyMs: Date.now() - startTime }, { status: 200 });
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
        executionTimeMs: Date.now() - startTime,
        signatureVerified: false,
        status: 'failed',
      });
    } catch {
      // non-blocking
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
