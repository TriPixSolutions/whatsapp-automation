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

async function processEvent(
  key: string,
  type: string,
  payload: unknown,
  workspaceId: string,
  run: () => Promise<void> | void,
  signatureVerified: boolean
) {
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
        id: key,
        workspaceId,
        timestamp: new Date().toISOString(),
        direction: 'incoming',
        source: 'Meta WhatsApp Cloud API',
        eventType: type,
        payload,
        responseStatus: 200,
        responseBody: { received: true },
        executionTimeMs: Date.now() - startedAt,
        signatureVerified,
        status: 'success',
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
  const receivedAt = new Date().toISOString();
  const signature = request.headers.get('x-hub-signature-256');
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  console.log(`[1] WEBHOOK RECEIVED: timestamp=${receivedAt} ip=${clientIp} userAgent="${userAgent}" hasSignature=${Boolean(signature)}`);

  const rawBody = await request.text();
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error('FAILED AT STEP 1: Malformed JSON payload received from webhook POST.');
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }

  if (!body || body.object !== 'whatsapp_business_account') {
    console.log(`[Meta Webhook] Ignored non-WhatsApp object: ${body?.object}`);
    return NextResponse.json({ status: 'ignored' });
  }

  if (!Array.isArray(body.entry)) {
    console.error('FAILED AT STEP 1: Invalid webhook payload: body.entry is not an array.');
    return NextResponse.json({ error: 'Invalid webhook entries' }, { status: 400 });
  }

  const requireSignature = process.env.NODE_ENV === 'production' || process.env.STRICT_WEBHOOK_AUTH === 'true';
  if (!signature && requireSignature) {
    console.error('FAILED AT STEP 2: Missing X-Hub-Signature-256 header on incoming webhook request.');
    return NextResponse.json({ error: 'Missing X-Hub-Signature-256 header' }, { status: 401 });
  }

  // Validate every destination before processing any item in a batched webhook.
  const changes: { value: any; workspaceId: string; phoneId: string; wabaId: string }[] = [];
  for (const entry of body.entry) {
    if (!Array.isArray(entry?.changes)) {
      console.error('FAILED AT STEP 1: Invalid webhook payload: entry.changes is not an array.');
      return NextResponse.json({ error: 'Invalid webhook changes' }, { status: 400 });
    }

    const wabaId = (entry?.id || '').toString().trim();

    for (const change of entry.changes) {
      const value = change?.value;
      if (!value) continue;

      const phoneId = (value.metadata?.phone_number_id || '').toString().trim();

      // Deterministic Workspace Resolution
      const settings = phoneId ? await SettingsDB.getByPhoneNumberId(phoneId) : await SettingsDB.getByWabaId(wabaId);
      if (!settings || (phoneId && settings.phoneNumberId !== phoneId) || (!phoneId && settings.wabaId !== wabaId)) {
        console.error(`FAILED AT STEP 3/4: Destination resolution failed for phone_number_id="${phoneId}", waba_id="${wabaId}". Unknown WhatsApp connection.`);
        return NextResponse.json({ error: 'Unknown WhatsApp connection' }, { status: 404 });
      }

      const workspaceId = settings.id === 'default' ? DEFAULT_WORKSPACE_ID : settings.id;
      console.log(`[3] PHONE NUMBER RESOLVED: phone_number_id=${phoneId || '(WABA event)'}`);
      console.log(`[4] WORKSPACE RESOLVED: workspaceId=${workspaceId} (${settings.name})`);

      // Signature Verification
      if (signature) {
        const secret = (settings.appSecret || process.env.META_APP_SECRET || '').trim();
        if (!secret || secret.startsWith('enc:gcm:')) {
          console.error(`FAILED AT STEP 2: Webhook app secret is not configured or failed decryption for workspace ${workspaceId}.`);
          return NextResponse.json({ error: 'Webhook app secret is not configured' }, { status: 503 });
        }

        const isSignatureValid = verifyMetaSignature(rawBody, signature, secret);
        if (!isSignatureValid) {
          console.error(`[WEBHOOK_SIGNATURE_FAILED] FAILED AT STEP 2: Invalid HMAC-SHA256 signature for phone ${phoneId}, workspace ${workspaceId}.`);
          return NextResponse.json({ error: 'Invalid HMAC-SHA256 signature' }, { status: 401 });
        }
        console.log(`[2] SIGNATURE VALID: HMAC-SHA256 signature verified successfully for workspace ${workspaceId}`);
      }

      if (
        (value.messages !== undefined && !Array.isArray(value.messages)) ||
        (value.statuses !== undefined && !Array.isArray(value.statuses))
      ) {
        console.error('FAILED AT STEP 1: Webhook messages or statuses field is not an array.');
        return NextResponse.json({ error: 'Invalid webhook events' }, { status: 400 });
      }

      // Log event normalization for messages
      for (const msg of value.messages || []) {
        if (!msg?.id || !msg.from || !msg.type) continue;
        const rawFrom = (msg.from || '').toString().trim();
        const maskedSender = rawFrom.length > 7
          ? `${rawFrom.slice(0, 3)}••••••${rawFrom.slice(-4)}`
          : rawFrom;
        const textBody = msg.type === 'text' ? msg.text?.body || '' : (msg.button?.text || msg.interactive?.button_reply?.title || '');
        console.log(`[5] EVENT NORMALIZED: [WHATSAPP_WEBHOOK_RECEIVED] messageId=${msg.id} phoneNumberId=${phoneId} wabaId=${wabaId} senderPhone=${maskedSender} type=${msg.type} text="${textBody}" workspaceId=${workspaceId}`);
      }

      changes.push({ value, workspaceId, phoneId, wabaId });
    }
  }

  try {
    for (const { value, workspaceId } of changes) {
      for (const message of value.messages || []) {
        if (!message?.id || !message.from || !message.type) continue;
        await processEvent(
          `${workspaceId}:message:${message.id}`,
          'inbound_message',
          message,
          workspaceId,
          () => handleWebhookInboundMessages([message], value.contacts, workspaceId),
          Boolean(signature)
        );
      }
      for (const status of value.statuses || []) {
        if (!status?.id || !status.status) continue;
        // One outgoing message produces distinct sent, delivered and read events.
        await processEvent(
          `${workspaceId}:status:${status.id}:${status.status}`,
          'status_update',
          status,
          workspaceId,
          () => handleWebhookStatuses([status], workspaceId),
          Boolean(signature)
        );
      }
    }
    return NextResponse.json({ status: 'success', received: true });
  } catch (error: any) {
    console.error('[Meta Webhook] Processing failed:', error);
    return NextResponse.json({ error: error?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
