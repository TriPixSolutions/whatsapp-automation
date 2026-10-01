import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, WebhookEventsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { verifyMetaSignature } from '@/lib/crypto';
import { handleWebhookVerification } from '@/lib/webhook/webhookVerification';
import { handleWebhookInboundMessages } from '@/lib/webhook/webhookInbound';
import { handleWebhookStatuses } from '@/lib/webhook/webhookStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleWebhookVerification(request);
}

async function processEvent(key: string, type: string, payload: unknown, workspaceId: string, run: () => Promise<void> | void, signatureVerified: boolean) {
  const claim = await WebhookEventsDB.claim(key, type, payload, workspaceId);
  if (claim.state === 'processed') return;
  if (claim.state === 'busy') throw new Error('Webhook event is already processing; retry later');
  const startedAt = Date.now();
  try {
    await run();
    await WebhookEventsDB.complete(key, workspaceId, claim.claimToken);
    try {
      const { TestCenterStore } = await import('@/lib/automations/testCenterStore');
      TestCenterStore.recordWebhookLog({
        id: key, workspaceId, timestamp: new Date().toISOString(), direction: 'incoming',
        source: 'Meta WhatsApp Cloud API', eventType: type, payload,
        responseStatus: 200, responseBody: { received: true },
        executionTimeMs: Date.now() - startedAt, signatureVerified, status: 'success',
      });
    } catch {
      // Inspector telemetry must not cause a successful delivery to be retried.
    }
  } catch (error) {
    await WebhookEventsDB.fail(key, workspaceId, claim.claimToken, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }
  if (!body || body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ status: 'ignored' });
  }
  if (!Array.isArray(body.entry)) {
    return NextResponse.json({ error: 'Invalid webhook entries' }, { status: 400 });
  }

  const signature = request.headers.get('x-hub-signature-256');
  const requireSignature = process.env.NODE_ENV === 'production' || process.env.STRICT_WEBHOOK_AUTH === 'true';
  if (!signature && requireSignature) {
    return NextResponse.json({ error: 'Missing X-Hub-Signature-256 header' }, { status: 401 });
  }

  // Validate every destination before processing any item in a batched webhook.
  const changes: { value: any; workspaceId: string }[] = [];
  for (const entry of body.entry) {
    if (!Array.isArray(entry?.changes)) {
      return NextResponse.json({ error: 'Invalid webhook changes' }, { status: 400 });
    }
    for (const change of entry.changes) {
      const value = change?.value;
      if (!value) continue;
      const phoneId = value.metadata?.phone_number_id;
      const settings = phoneId ? await SettingsDB.getByPhoneNumberId(phoneId) : await SettingsDB.getByWabaId(entry.id);
      if (!settings || (phoneId && settings.phoneNumberId !== phoneId) || (!phoneId && settings.wabaId !== entry.id)) {
        return NextResponse.json({ error: 'Unknown WhatsApp connection' }, { status: 404 });
      }
      if (signature) {
        const secret = settings.appSecret || process.env.META_APP_SECRET;
        if (!secret) {
          return NextResponse.json({ error: 'Webhook app secret is not configured' }, { status: 503 });
        }
        if (!verifyMetaSignature(rawBody, signature, secret)) {
          return NextResponse.json({ error: 'Invalid HMAC-SHA256 signature' }, { status: 401 });
        }
      }
      if ((value.messages !== undefined && !Array.isArray(value.messages)) ||
          (value.statuses !== undefined && !Array.isArray(value.statuses))) {
        return NextResponse.json({ error: 'Invalid webhook events' }, { status: 400 });
      }
      changes.push({ value, workspaceId: settings.id === 'default' ? DEFAULT_WORKSPACE_ID : settings.id });
    }
  }

  try {
    for (const { value, workspaceId } of changes) {
      for (const message of value.messages || []) {
        if (!message?.id || !message.from || !message.type) continue;
        await processEvent(`${workspaceId}:message:${message.id}`, 'inbound_message', message, workspaceId,
          () => handleWebhookInboundMessages([message], value.contacts, workspaceId), Boolean(signature));
      }
      for (const status of value.statuses || []) {
        if (!status?.id || !status.status) continue;
        // One outgoing message produces distinct sent, delivered and read events.
        await processEvent(`${workspaceId}:status:${status.id}:${status.status}`, 'status_update', status, workspaceId,
          () => handleWebhookStatuses([status], workspaceId), Boolean(signature));
      }
    }
    return NextResponse.json({ status: 'success', received: true });
  } catch (error) {
    console.error('[Meta Webhook] Processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
