import { ContactsDB, MessagesDB, AutomationsDB, ConversationsDB, SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { handleAiInboundReply } from './webhookAiAssistant';
import { FollowUpEngine } from '@/lib/followup/followupEngine';
import { getAdminClient } from '@/lib/supabase/server';

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
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  video?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; filename: string; mime_type: string; sha256: string; caption?: string };
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
  } else if (msg.type === 'image') {
    content = msg.image?.caption || '[Image]';
    triggerText = content;
    interactionPayload = msg.image;
  } else if (msg.type === 'video') {
    content = msg.video?.caption || '[Video]';
    triggerText = content;
    interactionPayload = msg.video;
  } else if (msg.type === 'audio') {
    content = '[Audio Message]';
    triggerText = content;
    interactionPayload = msg.audio;
  } else if (msg.type === 'document') {
    content = msg.document?.filename || msg.document?.caption || '[Document]';
    triggerText = content;
    interactionPayload = msg.document;
  } else {
    content = `[${msg.type.toUpperCase()}]`;
    triggerText = content;
  }

  return { content, triggerText, interactionPayload };
}

async function dispatchAutomationReply(fromPhone: string, contactId: string, matchedFlow: any) {
  const payload = matchedFlow.actionPayload as any;

  if (matchedFlow.actionType === 'text') {
    await WhatsAppMessageService.send({
      to: fromPhone,
      type: 'text',
      text: payload.text || 'Hello!',
    });
  } else if (matchedFlow.actionType === 'buttons') {
    await WhatsAppMessageService.send({
      to: fromPhone,
      type: 'button',
      headerText: payload.header,
      bodyText: payload.body || 'Select an option:',
      footerText: payload.footer,
      buttons: payload.buttons || [{ id: 'btn_1', title: 'Start' }],
    });
  } else if (matchedFlow.actionType === 'list') {
    await WhatsAppMessageService.send({
      to: fromPhone,
      type: 'list',
      headerText: payload.header,
      bodyText: payload.body || 'Options:',
      footerText: payload.footer,
      buttonText: payload.buttonText || 'View Options',
      sections: payload.sections || [],
    });
  }

  AutomationsDB.incrementExecution(matchedFlow.id);
}

export async function handleWebhookInboundMessages(
  messages: MetaMessageObject[],
  contactsList?: any[],
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  const profileContact = contactsList?.[0];
  const senderName = profileContact?.profile?.name || '';
  const [firstName, ...restName] = senderName.split(' ');

  for (const message of messages) {
    const fromPhone = message.from.startsWith('+') ? message.from : `+${message.from}`;
    const { content, triggerText, interactionPayload } = parseMessageContent(message);

    // 1. Initial contact lookup or creation
    let contact = ContactsDB.getByPhone(fromPhone, workspaceId);
    if (!contact) {
      contact = ContactsDB.upsert(
        {
          phoneNumber: fromPhone,
          firstName: firstName || '',
          lastName: restName.join(' ') || '',
          optinStatus: true,
        },
        workspaceId
      );
    }

    // 1b. Buying Intent Recognition & Automatic Priority Lead Escalation
    const lowerContent = (content || '').toLowerCase().trim();
    const isPriceInquiry = /\b(price|pricing|cost|how much|rate|quote|price\?)\b/i.test(lowerContent);
    const isDeliveryInquiry = /\b(delivery|shipping|dispatch|courier|ship|delivery\?)\b/i.test(lowerContent);
    const isAvailableInquiry = /\b(available|in stock|stock|inventory|available\?)\b/i.test(lowerContent);
    const isOrderInquiry = /\b(order|how to order|buy|purchase|book|how to order\?)\b/i.test(lowerContent);
    const isHighIntent = isPriceInquiry || isDeliveryInquiry || isAvailableInquiry || isOrderInquiry;

    const updatedTags = new Set(contact.tags || []);
    updatedTags.add('replied');
    updatedTags.add('engaged');

    if (isHighIntent) {
      updatedTags.add('priority');
      if (isPriceInquiry) updatedTags.add('price_inquiry');
      if (isDeliveryInquiry) updatedTags.add('delivery_inquiry');
      if (isOrderInquiry) updatedTags.add('order_inquiry');
      if (isAvailableInquiry) updatedTags.add('available_inquiry');
    }

    contact = ContactsDB.upsert(
      {
        ...contact,
        phoneNumber: fromPhone,
        tags: Array.from(updatedTags),
      },
      workspaceId
    );

    // Update leads table status in Supabase if a record exists
    const supabase = getAdminClient();
    if (supabase) {
      try {
        await supabase
          .from('leads')
          .update({
            status: isHighIntent ? 'priority' : 'engaged',
            updated_at: new Date().toISOString(),
          })
          .eq('phone_number', fromPhone)
          .eq('workspace_id', workspaceId);
      } catch {
        // non-blocking
      }
    }

    // 2. Persist inbound message to database
    MessagesDB.create(
      {
        metaMessageId: message.id,
        phoneNumber: fromPhone,
        contactId: contact.id,
        direction: 'inbound',
        type: message.type === 'interactive' ? 'interactive' : (message.type as any) || 'text',
        status: 'delivered',
        content,
        payload: { rawType: message.type, interaction: interactionPayload, timestamp: message.timestamp },
      },
      workspaceId
    );

    // 2b. Open 24-Hour WhatsApp Policy Window & Track Conversation
    ConversationsDB.recordInbound(fromPhone, contact.id, workspaceId);

    // 3. Customer replied: automatically cancel pending scheduled follow-ups!
    await FollowUpEngine.cancelPendingOnReply(fromPhone);

    // 4. Interactive Chatbot Branch Execution (Yes/No buttons or dynamic options)
    let branchHandled = false;
    const activeFlows = AutomationsDB.list(workspaceId);
    for (const flow of activeFlows) {
      if (!flow.isActive) continue;
      const payload = flow.actionPayload as any;

      if (Array.isArray(payload?.chatbotNodes)) {
        for (const node of payload.chatbotNodes) {
          if (Array.isArray(node.options)) {
            const matchedOption = node.options.find(
              (opt: any) =>
                opt.id === triggerText ||
                opt.label?.toLowerCase() === triggerText.toLowerCase() ||
                (triggerText.toLowerCase().includes('yes') && opt.id.includes('yes')) ||
                (triggerText.toLowerCase().includes('no') && opt.id.includes('no'))
            );
            if (matchedOption && matchedOption.replyText) {
              await WhatsAppMessageService.send({
                to: fromPhone,
                type: 'text',
                text: matchedOption.replyText,
              });
              AutomationsDB.incrementExecution(flow.id);
              branchHandled = true;
              break;
            }
          }
        }
      }

      if (!branchHandled && payload?.branches && payload.branches[triggerText]) {
        const branchAction = payload.branches[triggerText];
        await WhatsAppMessageService.send({
          to: fromPhone,
          type: branchAction.type || 'text',
          text: branchAction.text || branchAction.body || '',
        });
        AutomationsDB.incrementExecution(flow.id);
        branchHandled = true;
        break;
      }
      if (branchHandled) break;
    }
    if (branchHandled) continue;

    // 5b. Advanced Workflow Engine 2.0 (DAG Workflows, Buttons, Carousels, Triggers)
    let advancedWorkflowHandled = false;
    try {
      const { AdvancedWorkflowEngine } = await import('@/lib/automations/advancedWorkflowEngine');
      const triggerType = message.type === 'interactive' && interactionPayload?.title
        ? 'button_click'
        : 'keyword';

      const advancedMatches = AdvancedWorkflowEngine.matchWorkflows(
        triggerType,
        { text: triggerText, buttonId: interactionPayload?.id, ...interactionPayload },
        workspaceId
      );

      if (advancedMatches.length > 0) {
        for (const matchedWf of advancedMatches) {
          await AdvancedWorkflowEngine.executeWorkflow(matchedWf, {
            workflowId: matchedWf.id,
            workspaceId,
            phoneNumber: fromPhone,
            contactId: contact.id,
            triggerType,
            triggerPayload: { text: triggerText, ...interactionPayload },
            isTestSimulation: false,
          });
        }
        advancedWorkflowHandled = true;
      }
    } catch (advErr) {
      console.warn('[Webhook Inbound] AdvancedWorkflowEngine error:', advErr);
    }
    if (advancedWorkflowHandled) continue;

    // 6. Automation Flow Trigger Engine (Keyword / Trigger Match)
    const matchedFlow = AutomationsDB.findMatch(triggerText, workspaceId);
    if (matchedFlow) {
      await dispatchAutomationReply(fromPhone, contact.id, matchedFlow);
    } else if (message.type === 'text' && triggerText) {
      // 7. AI Sales & Support Autonomous Inbound Assistant
      await handleAiInboundReply(fromPhone, contact.id, triggerText);
    }
  }
}
