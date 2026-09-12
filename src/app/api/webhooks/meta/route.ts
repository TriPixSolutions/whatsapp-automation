import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, mockStore, isSupabaseConfigured } from '@/lib/supabase/server';
import { MetaWhatsAppClient } from '@/lib/meta/api';

/**
 * GET /api/webhooks/meta
 * Handles Meta Webhook Verification (hub.challenge)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[Meta Webhook GET] Verification attempt:', { mode, token, challengePresent: Boolean(challenge) });

  if (mode === 'subscribe') {
    const defaultToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'apex_luxury_secret_token_2025';

    // Verify token against default or database workspaces
    let isVerified = token === defaultToken;

    if (!isVerified && isSupabaseConfigured) {
      const supabase = getAdminClient();
      if (supabase) {
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id, webhook_verify_token')
          .eq('webhook_verify_token', token)
          .maybeSingle();

        if (workspace) {
          isVerified = true;
        }
      }
    }

    if (isVerified && challenge) {
      console.log('[Meta Webhook GET] Verification successful. Returning challenge.');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  console.warn('[Meta Webhook GET] Verification failed. Token mismatch.');
  return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 });
}

/**
 * POST /api/webhooks/meta
 * Ingestion engine for inbound WhatsApp messages and status delivery receipts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Meta Webhook POST] Received event payload:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: 'ignored', reason: 'no_value' }, { status: 200 });
    }

    const phoneNumberId = value.metadata?.phone_number_id;
    const supabase = getAdminClient();

    // 1. Resolve Workspace
    let workspaceId = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
    let accessToken = process.env.META_ACCESS_TOKEN || 'EAAG_SAMPLE_TOKEN';

    if (supabase && phoneNumberId) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id, meta_access_token, phone_number_id')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle();

      if (ws) {
        workspaceId = ws.id;
        accessToken = ws.meta_access_token || accessToken;
      }
    }

    // 2. Handle Message Status Updates (delivered, read, sent, failed)
    if (value.statuses && value.statuses.length > 0) {
      const statusUpdate = value.statuses[0];
      const messageMetaId = statusUpdate.id;
      const statusName = statusUpdate.status; // 'sent' | 'delivered' | 'read' | 'failed'

      console.log(`[Meta Webhook] Status update: ${messageMetaId} -> ${statusName}`);

      if (supabase) {
        await supabase
          .from('messages_log')
          .update({ status: statusName })
          .eq('message_meta_id', messageMetaId);
      } else {
        const localMsg = mockStore.messages.find((m) => m.message_meta_id === messageMetaId);
        if (localMsg) localMsg.status = statusName as any;
      }

      return NextResponse.json({ status: 'status_logged', messageMetaId, statusName }, { status: 200 });
    }

    // 3. Handle Inbound Messages
    if (value.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const senderPhone = `+${message.from}`;
      const messageType = message.type; // 'text' | 'interactive' | 'button'
      const messageMetaId = message.id;

      let inboundText = '';
      let buttonReplyId = '';

      if (messageType === 'text') {
        inboundText = message.text?.body?.trim() || '';
      } else if (messageType === 'interactive') {
        if (message.interactive?.type === 'button_reply') {
          inboundText = message.interactive.button_reply?.title || '';
          buttonReplyId = message.interactive.button_reply?.id || '';
        } else if (message.interactive?.type === 'list_reply') {
          inboundText = message.interactive.list_reply?.title || '';
          buttonReplyId = message.interactive.list_reply?.id || '';
        }
      } else if (messageType === 'button') {
        inboundText = message.button?.text || '';
        buttonReplyId = message.button?.payload || '';
      }

      console.log(`[Meta Webhook] Inbound from ${senderPhone}: "${inboundText}" (Type: ${messageType})`);

      // Resolve contact in database
      let contactId: string | null = null;
      if (supabase) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('phone_number', senderPhone)
          .maybeSingle();

        if (existingContact) {
          contactId = existingContact.id;
        } else {
          // Auto-register inbound lead
          const { data: newContact } = await supabase
            .from('contacts')
            .insert({
              workspace_id: workspaceId,
              phone_number: senderPhone,
              first_name: value.contacts?.[0]?.profile?.name || 'High-Ticket Lead',
              tags: ['inbound_lead', 'whatsapp_direct'],
              optin_status: true,
            })
            .select('id')
            .single();

          if (newContact) contactId = newContact.id;
        }

        // Log inbound message to messages_log
        await supabase.from('messages_log').insert({
          workspace_id: workspaceId,
          contact_id: contactId,
          message_meta_id: messageMetaId,
          direction: 'inbound',
          type: messageType === 'interactive' ? 'interactive' : 'text',
          status: 'delivered',
          payload: {
            text: inboundText,
            buttonId: buttonReplyId,
            raw: message,
          },
        });
      } else {
        // Mock store update
        const mockContact = mockStore.contacts.find((c) => c.phone_number === senderPhone) || mockStore.contacts[0];
        contactId = mockContact.id;
        mockStore.messages.unshift({
          id: `msg_in_${Date.now()}`,
          workspace_id: workspaceId,
          contact_id: contactId,
          message_meta_id: messageMetaId,
          direction: 'inbound',
          type: 'text',
          status: 'delivered',
          payload: { text: inboundText, buttonId: buttonReplyId },
          created_at: new Date().toISOString(),
        });
      }

      // 4. Trigger Automation Engine
      // Check if inbound text or button payload matches any automation flow
      let matchedFlow: any = null;

      if (supabase) {
        const { data: flows } = await supabase
          .from('automation_flows')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('is_active', true);

        if (flows) {
          matchedFlow = flows.find(
            (f) =>
              f.trigger_keyword.toLowerCase() === inboundText.toLowerCase() ||
              (buttonReplyId && f.trigger_keyword.toLowerCase() === buttonReplyId.toLowerCase())
          );
        }
      } else {
        matchedFlow = mockStore.automations.find(
          (f) =>
            f.is_active &&
            (f.trigger_keyword.toLowerCase() === inboundText.toLowerCase() ||
              (buttonReplyId && f.trigger_keyword.toLowerCase() === buttonReplyId.toLowerCase()))
        );
      }

      // 5. Fire Instant Automation Response
      if (matchedFlow) {
        console.log(`[Automation Engine] Trigger matched: "${matchedFlow.trigger_keyword}". Action: ${matchedFlow.action_type}`);

        let outboundResult: any = null;

        if (matchedFlow.action_type === 'buttons') {
          const payload = matchedFlow.action_payload;
          outboundResult = await MetaWhatsAppClient.sendInteractiveButtons({
            phoneNumberId: phoneNumberId || process.env.META_PHONE_NUMBER_ID || '109823485764321',
            accessToken,
            to: senderPhone,
            headerText: payload.header || 'Passion Fruit Private Showcase',
            bodyText: payload.body || 'Select an option below:',
            footerText: payload.footer || 'Confidential • By Private Invitation',
            buttons: payload.buttons || [
              { id: 'btn_specs', title: 'Product Specs' },
              { id: 'btn_pricing', title: 'Pricing' },
              { id: 'btn_agent', title: 'Talk to Agent' },
            ],
          });
        } else if (matchedFlow.action_type === 'text') {
          outboundResult = await MetaWhatsAppClient.sendText({
            phoneNumberId: phoneNumberId || process.env.META_PHONE_NUMBER_ID || '109823485764321',
            accessToken,
            to: senderPhone,
            text: matchedFlow.action_payload.body || 'Thank you for your response.',
          });
        }

        // Log automated outbound response
        if (outboundResult && outboundResult.success) {
          const outboundPayload = {
            triggeredBy: inboundText,
            flowId: matchedFlow.id,
            actionPayload: matchedFlow.action_payload,
          };

          if (supabase) {
            await supabase.from('messages_log').insert({
              workspace_id: workspaceId,
              contact_id: contactId,
              message_meta_id: outboundResult.metaMessageId,
              direction: 'outbound',
              type: matchedFlow.action_type === 'buttons' ? 'interactive' : 'text',
              status: 'sent',
              payload: outboundPayload,
            });
          } else {
            mockStore.messages.unshift({
              id: `msg_auto_${Date.now()}`,
              workspace_id: workspaceId,
              contact_id: contactId,
              message_meta_id: outboundResult.metaMessageId,
              direction: 'outbound',
              type: matchedFlow.action_type === 'buttons' ? 'interactive' : 'text',
              status: 'sent',
              payload: outboundPayload,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      return NextResponse.json(
        {
          status: 'success',
          inboundMessageId: messageMetaId,
          automationTriggered: Boolean(matchedFlow),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook POST Error]:', error);
    // Return 200 to prevent Meta from flooding with retry attempts
    return NextResponse.json({ status: 'error', message: error.message }, { status: 200 });
  }
}
