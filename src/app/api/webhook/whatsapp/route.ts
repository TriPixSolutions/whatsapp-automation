import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, ContactsDB, MessagesDB, AutomationsDB } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';

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
 * The Main Entry Point for Meta Cloud API Webhooks:
 * 1. Parses incoming customer text, button clicks, and list selections
 * 2. Saves contact and inbound message to Database
 * 3. Triggers the Automation Engine to find matching flows and reply automatically
 * 4. Updates message delivery receipts (sent, delivered, read, failed) in real time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      const settings = SettingsDB.get();

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          const value = change.value;
          if (!value) continue;

          // -------------------------------------------------------------------
          // A. HANDLE INCOMING MESSAGES & USER INTERACTIONS
          // -------------------------------------------------------------------
          if (value.messages && value.messages.length > 0) {
            const profileContact = value.contacts?.[0];
            const senderName = profileContact?.profile?.name || '';

            for (const message of value.messages) {
              const fromPhone = message.from; // Sender's phone number
              const messageId = message.id;
              const timestamp = message.timestamp;
              const messageType = message.type;

              // 1. Determine message content and trigger text
              let content = '';
              let triggerText = '';
              let interactionPayload: any = null;

              if (messageType === 'text') {
                content = message.text?.body || '';
                triggerText = content;
              } else if (messageType === 'interactive') {
                const interactive = message.interactive;
                if (interactive?.type === 'button_reply') {
                  content = interactive.button_reply.title;
                  triggerText = interactive.button_reply.id || interactive.button_reply.title;
                  interactionPayload = interactive.button_reply;
                } else if (interactive?.type === 'list_reply') {
                  content = interactive.list_reply.title;
                  triggerText = interactive.list_reply.id || interactive.list_reply.title;
                  interactionPayload = interactive.list_reply;
                }
              } else if (messageType === 'button') {
                content = message.button?.text || '';
                triggerText = message.button?.payload || content;
              } else {
                content = `[${messageType.toUpperCase()}]`;
                triggerText = content;
              }

              console.log(`[Meta Webhook] Inbound message from ${fromPhone}: "${content}" (trigger: "${triggerText}")`);

              // 2. Upsert Contact in Database
              const [firstName, ...restName] = senderName.split(' ');
              const contact = ContactsDB.upsert({
                phoneNumber: fromPhone,
                firstName: firstName || '',
                lastName: restName.join(' ') || '',
                optinStatus: true,
              });

              // 3. Save Inbound Message in Database
              MessagesDB.create({
                metaMessageId: messageId,
                phoneNumber: fromPhone,
                contactId: contact.id,
                direction: 'inbound',
                type: messageType === 'interactive' ? 'interactive' : 'text',
                status: 'delivered',
                content,
                payload: {
                  rawType: messageType,
                  interaction: interactionPayload,
                  timestamp,
                },
              });

              // 4. TRIGGER AUTOMATION ENGINE
              // Check if an active AutomationFlow matches the trigger keyword or button click
              const matchedFlow = AutomationsDB.findMatch(triggerText);

              if (matchedFlow) {
                console.log(`[Automation Engine] Trigger matched flow: "${matchedFlow.name}" for ${fromPhone}`);

                // Send automated reply via Meta Cloud API if configured
                const { phoneNumberId, accessToken } = settings;

                if (phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN')) {
                  try {
                    let sendResult;

                    if (matchedFlow.actionType === 'text') {
                      const payload = matchedFlow.actionPayload as any;
                      sendResult = await MetaWhatsAppClient.sendText({
                        phoneNumberId,
                        accessToken,
                        to: fromPhone,
                        text: payload.text || 'Hello! How can we assist you today?',
                      });
                    } else if (matchedFlow.actionType === 'buttons') {
                      const payload = matchedFlow.actionPayload as any;
                      sendResult = await MetaWhatsAppClient.sendInteractiveButtons({
                        phoneNumberId,
                        accessToken,
                        to: fromPhone,
                        headerText: payload.header,
                        bodyText: payload.body || 'Select an option below:',
                        footerText: payload.footer,
                        buttons: payload.buttons || [{ id: 'btn_1', title: 'Get Started' }],
                      });
                    } else if (matchedFlow.actionType === 'list') {
                      const payload = matchedFlow.actionPayload as any;
                      sendResult = await MetaWhatsAppClient.sendInteractiveList({
                        phoneNumberId,
                        accessToken,
                        to: fromPhone,
                        headerText: payload.header,
                        bodyText: payload.body || 'Browse our catalog below:',
                        footerText: payload.footer,
                        buttonText: payload.buttonText || 'View Options',
                        sections: payload.sections || [],
                      });
                    } else if (matchedFlow.actionType === 'carousel') {
                      const payload = matchedFlow.actionPayload as any;
                      sendResult = await MetaWhatsAppClient.sendCarouselTemplate({
                        phoneNumberId,
                        accessToken,
                        to: fromPhone,
                        bodyText: payload.bodyText || 'Explore our featured items:',
                        cards: payload.cards || [],
                      });
                    }

                    // Save Automated Outbound Response in Database
                    const outboundMetaId = sendResult?.messageId || `wamid.bot_${Date.now()}`;
                    const outboundContent =
                      (matchedFlow.actionPayload as any).body ||
                      (matchedFlow.actionPayload as any).text ||
                      `[${matchedFlow.actionType.toUpperCase()}]`;

                    MessagesDB.create({
                      metaMessageId: outboundMetaId,
                      phoneNumber: fromPhone,
                      contactId: contact.id,
                      direction: 'outbound',
                      type: matchedFlow.actionType as any,
                      status: sendResult?.success ? 'sent' : 'failed',
                      content: outboundContent,
                      payload: matchedFlow.actionPayload,
                      errorMessage: sendResult?.error,
                    });

                    // Increment Flow Execution Counter
                    AutomationsDB.incrementExecution(matchedFlow.id);
                  } catch (flowErr) {
                    console.error('[Automation Engine] Error executing flow reply:', flowErr);
                  }
                } else {
                  // Save simulated reply into DB when Meta token is not yet connected
                  const outboundContent =
                    (matchedFlow.actionPayload as any).body ||
                    (matchedFlow.actionPayload as any).text ||
                    `[${matchedFlow.actionType.toUpperCase()}]`;

                  MessagesDB.create({
                    metaMessageId: `wamid.local_${Date.now()}`,
                    phoneNumber: fromPhone,
                    contactId: contact.id,
                    direction: 'outbound',
                    type: matchedFlow.actionType as any,
                    status: 'sent',
                    content: outboundContent,
                    payload: matchedFlow.actionPayload,
                  });

                  AutomationsDB.incrementExecution(matchedFlow.id);
                }
              }
            }
          }

          // -------------------------------------------------------------------
          // B. HANDLE DELIVERY STATUS RECEIPTS (sent, delivered, read, failed)
          // -------------------------------------------------------------------
          if (value.statuses && value.statuses.length > 0) {
            for (const statusObj of value.statuses) {
              const metaId = statusObj.id;
              const statusValue = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'

              console.log(`[Meta Webhook] Status update for ${metaId}: ${statusValue}`);
              MessagesDB.updateStatus(metaId, statusValue as any);
            }
          }
        }
      }

      // Meta requires an immediate HTTP 200 acknowledgment
      return NextResponse.json({ status: 'success', received: true }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook] Error processing webhook payload:', error);
    // Return HTTP 200 so Meta does not back off or disable the webhook
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
