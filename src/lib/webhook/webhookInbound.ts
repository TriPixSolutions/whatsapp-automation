import { ContactsDB, MessagesDB, AutomationsDB, SettingsDB } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';
import { handleWhatsAppCheckoutAction } from './webhookCheckoutHandler';
import { handleAiInboundReply } from './webhookAiAssistant';

export interface MetaMessageObject {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { text: string; payload: string };
}

function parseMessageContent(msg: MetaMessageObject) {
  let content = '';
  let triggerText = '';
  let interactionPayload: any = null;

  if (msg.type === 'text') {
    content = msg.text?.body || '';
    triggerText = content;
  } else if (msg.type === 'interactive') {
    const inter = msg.interactive;
    if (inter?.type === 'button_reply') {
      content = inter.button_reply?.title || '';
      triggerText = inter.button_reply?.id || inter.button_reply?.title || '';
      interactionPayload = inter.button_reply;
    } else if (inter?.type === 'list_reply') {
      content = inter.list_reply?.title || '';
      triggerText = inter.list_reply?.id || inter.list_reply?.title || '';
      interactionPayload = inter.list_reply;
    }
  } else if (msg.type === 'button') {
    content = msg.button?.text || '';
    triggerText = msg.button?.payload || content;
  } else {
    content = `[${msg.type.toUpperCase()}]`;
    triggerText = content;
  }

  return { content, triggerText, interactionPayload };
}

async function dispatchAutomationReply(fromPhone: string, contactId: string, matchedFlow: any) {
  const settings = SettingsDB.get();
  const { phoneNumberId, accessToken } = settings;
  const isLive = Boolean(phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN'));
  const payload = matchedFlow.actionPayload as any;

  let sendResult: any = { success: true };
  if (isLive) {
    if (matchedFlow.actionType === 'text') {
      sendResult = await MetaWhatsAppClient.sendText({
        phoneNumberId, accessToken, to: fromPhone, text: payload.text || 'Hello!',
      });
    } else if (matchedFlow.actionType === 'buttons') {
      sendResult = await MetaWhatsAppClient.sendInteractiveButtons({
        phoneNumberId, accessToken, to: fromPhone,
        headerText: payload.header, bodyText: payload.body || 'Select:', footerText: payload.footer,
        buttons: payload.buttons || [{ id: 'btn_1', title: 'Start' }],
      });
    } else if (matchedFlow.actionType === 'list') {
      sendResult = await MetaWhatsAppClient.sendInteractiveList({
        phoneNumberId, accessToken, to: fromPhone,
        headerText: payload.header, bodyText: payload.body || 'Options:', footerText: payload.footer,
        buttonText: payload.buttonText || 'View Options', sections: payload.sections || [],
      });
    }
  }

  const outboundMetaId = sendResult?.messageId || `wamid.bot_${Date.now()}`;
  const outboundContent = payload.body || payload.text || `[${matchedFlow.actionType.toUpperCase()}]`;

  MessagesDB.create({
    metaMessageId: outboundMetaId,
    phoneNumber: fromPhone,
    contactId,
    direction: 'outbound',
    type: matchedFlow.actionType as any,
    status: sendResult?.success ? 'sent' : 'failed',
    content: outboundContent,
    payload: matchedFlow.actionPayload,
    errorMessage: sendResult?.error,
  });

  AutomationsDB.incrementExecution(matchedFlow.id);
}

export async function handleWebhookInboundMessages(messages: MetaMessageObject[], contactsList?: any[]) {
  const profileContact = contactsList?.[0];
  const senderName = profileContact?.profile?.name || '';
  const [firstName, ...restName] = senderName.split(' ');

  for (const message of messages) {
    const fromPhone = message.from;
    const { content, triggerText, interactionPayload } = parseMessageContent(message);

    const contact = ContactsDB.upsert({
      phoneNumber: fromPhone,
      firstName: firstName || '',
      lastName: restName.join(' ') || '',
      optinStatus: true,
    });

    MessagesDB.create({
      metaMessageId: message.id,
      phoneNumber: fromPhone,
      contactId: contact.id,
      direction: 'inbound',
      type: message.type === 'interactive' ? 'interactive' : 'text',
      status: 'delivered',
      content,
      payload: { rawType: message.type, interaction: interactionPayload, timestamp: message.timestamp },
    });

    // 1. WhatsApp In-Chat Checkout Flow Interceptor
    const handledByCheckout = await handleWhatsAppCheckoutAction(fromPhone, triggerText, contact);
    if (handledByCheckout) continue;

    // 2. Automation Flow Trigger Engine
    const matchedFlow = AutomationsDB.findMatch(triggerText);
    if (matchedFlow) {
      await dispatchAutomationReply(fromPhone, contact.id, matchedFlow);
    } else if (message.type === 'text' && triggerText) {
      // 3. AI Sales & Support Autonomous Inbound Assistant
      await handleAiInboundReply(fromPhone, contact.id, triggerText);
    }
  }
}
