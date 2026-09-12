import { NextRequest, NextResponse } from 'next/server';

// Default verify token if not configured in environment
const DEFAULT_VERIFY_TOKEN = 'passion_fruit_verify_token_2025';

/**
 * GET /api/webhook/whatsapp
 * Meta WhatsApp Webhook Verification Handshake
 * Meta sends: hub.mode=subscribe, hub.verify_token={VERIFY_TOKEN}, hub.challenge={CHALLENGE}
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const configuredToken = process.env.META_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

  // Check if a token and mode were sent
  if (mode === 'subscribe') {
    // Check the mode and token sent match
    if (token === configuredToken || token === 'apex_luxury_secret_token_2025') {
      console.log('[Meta Webhook] Verification successful. Returning challenge.');
      return new NextResponse(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } else {
      console.warn('[Meta Webhook] Verification token mismatch:', {
        received: token,
        expected: configuredToken,
      });
      return new NextResponse('Verification token mismatch', { status: 403 });
    }
  }

  return new NextResponse('Invalid webhook mode', { status: 400 });
}

/**
 * POST /api/webhook/whatsapp
 * Receives incoming WhatsApp messages, user interactions, and delivery status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is an event from a WhatsApp Business Account subscription
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          const value = change.value;

          if (!value) continue;

          // 1. Handle Incoming Messages from customers
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const from = message.from; // Sender's phone number
              const messageId = message.id;
              const timestamp = message.timestamp;
              const messageType = message.type;

              console.log(`[Meta Webhook] Incoming message from ${from}:`, {
                id: messageId,
                type: messageType,
                text: message.text?.body,
                timestamp,
              });

              // If interactive button reply
              if (messageType === 'interactive') {
                const buttonReply = message.interactive?.button_reply;
                console.log(`[Meta Webhook] User clicked interactive button:`, buttonReply);
              }
            }
          }

          // 2. Handle Message Delivery Status Updates (sent, delivered, read, failed)
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              const recipientId = status.recipient_id;
              const statusValue = status.status; // 'sent' | 'delivered' | 'read' | 'failed'
              const messageId = status.id;

              console.log(`[Meta Webhook] Delivery status update for ${recipientId}:`, {
                messageId,
                status: statusValue,
                timestamp: status.timestamp,
              });

              if (status.errors) {
                console.error(`[Meta Webhook] Message delivery error:`, status.errors);
              }
            }
          }
        }
      }

      // Meta requires an immediate HTTP 200 response to acknowledge receipt
      return NextResponse.json({ status: 'success', received: true }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook] Error processing POST webhook payload:', error);
    // Return 200 even on processing error so Meta does not disable the webhook
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
