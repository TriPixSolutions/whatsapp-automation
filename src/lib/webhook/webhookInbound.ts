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

    const isButtonClick =
      (message.type === 'interactive' &&
        (message.interactive?.type === 'button_reply' || message.interactive?.type === 'list_reply')) ||
      message.type === 'button';
    const buttonId = interactionPayload?.id || message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || message.button?.payload || triggerText;
    const buttonTitle = interactionPayload?.title || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || message.button?.text || content;

    console.log(`[PHONE NORMALIZED] raw: "${message.from}" ➔ normalized: "${fromPhone}"`);

    // 10. Log Before and After Button Click Processing
    console.log(`[BUTTON CLICK PROCESSING: BEFORE] rawType: "${message.type}", isButtonClick: ${isButtonClick}, buttonId: "${buttonId}", buttonTitle: "${buttonTitle}"`);
    if (isButtonClick) {
      console.log(`[BUTTON PAYLOAD] Button action received:\n` +
        `  - buttonId: "${buttonId}"\n` +
        `  - buttonTitle: "${buttonTitle}"\n` +
        `  - fromPhone: "${fromPhone}"\n` +
        `  - rawType: "${message.type}"\n` +
        `  - interactiveType: "${message.interactive?.type || 'none'}"\n` +
        `  - messageId: "${message.id}"`);
      console.log(`[BUTTON CLICK RECEIVED] Button ID: "${buttonId}", Title: "${buttonTitle}", From: "${fromPhone}"`);
      console.log(`[BUTTON ID] "${buttonId}"`);
      console.log(`[BUTTON TITLE] "${buttonTitle}"`);
    }
    console.log(`[BUTTON CLICK PROCESSING: AFTER] Parsed button context: buttonId="${buttonId}", buttonTitle="${buttonTitle}"`);

    // 4. PRIORITY 1: Check if customer has an active paused/waiting workflow execution session
    let advancedWorkflowHandled = false;
    try {
      const { AdvancedWorkflowEngine } = await import('@/lib/automations/advancedWorkflowEngine');
      const { TestCenterStore } = await import('@/lib/automations/testCenterStore');

      // 8. Log Before and After Session Lookup
      console.log(`[SESSION LOOKUP: BEFORE] Searching active workflow session for phone: "${fromPhone}", workspaceId: "${workspaceId}", isButtonClick: ${isButtonClick}`);
      const waitingSession = TestCenterStore.getActiveSession(fromPhone, workspaceId);
      console.log(`[SESSION LOOKUP: AFTER] Session lookup result: ${waitingSession ? `FOUND (Session ID: "${waitingSession.id}", Workflow: "${waitingSession.workflowId}", Node: "${waitingSession.currentNodeId}", WaitingFor: "${waitingSession.waitingFor}")` : 'NOT FOUND (No active waiting session)'}`);

      // If customer sent a top-level trigger keyword (e.g. "hello", "hi", "start") as text, prioritize fresh workflow trigger over stale button session
      const matchingNewFlows = !isButtonClick && triggerText
        ? AdvancedWorkflowEngine.matchWorkflows('keyword', { text: triggerText }, workspaceId)
        : [];

      if (waitingSession) {
        if (matchingNewFlows.length > 0 && !isButtonClick) {
          console.log(`[SESSION RESET] Incoming text "${triggerText}" matches fresh workflow trigger [${matchingNewFlows.map(w => w.name).join(', ')}]. Clearing previous waiting session "${waitingSession.id}".`);
          TestCenterStore.clearSession(fromPhone, workspaceId);
        } else {
          console.log(`[SESSION FOUND] Session ID: "${waitingSession.id}", Workflow: "${waitingSession.workflowId}", Node: "${waitingSession.currentNodeId}", Phone: "${fromPhone}", WaitingFor: "${waitingSession.waitingFor}"`);

          let resumeAction: 'button_click' | 'carousel_click' | 'reply' | 'delay_expired' = 'reply';
          const cardIndex = interactionPayload?.cardIndex;
          const cardButtonId = interactionPayload?.cardButtonId || buttonId;

          if (isButtonClick || waitingSession.waitingFor === 'button_click') {
            resumeAction = 'button_click';
          } else if (waitingSession.waitingFor === 'carousel_selection') {
            resumeAction = 'carousel_click';
          } else if (waitingSession.waitingFor === 'reply') {
            resumeAction = 'reply';
          }

          // 9. Log Before and After Workflow Resume
          console.log(`[WORKFLOW RESUME: BEFORE] Resuming workflow "${waitingSession.workflowId}" from node "${waitingSession.currentNodeId}" with action "${resumeAction}" (buttonId: "${buttonId}", buttonTitle: "${buttonTitle}", sessionPhone: "${waitingSession.phoneNumber}")`);

          const resumedLog = await AdvancedWorkflowEngine.resumeWorkflowExecution(waitingSession, {
            action: resumeAction,
            buttonId,
            buttonTitle,
            cardIndex,
            cardButtonId,
            text: content || triggerText,
          });

          console.log(`[WORKFLOW RESUME: AFTER] Resume result for workflow "${waitingSession.workflowId}": ${resumedLog ? `SUCCESS (status: "${resumedLog.status}", steps: ${resumedLog.steps?.length || 0})` : 'FAILED / NULL (Branch not resolved or node not found)'}`);

          if (resumedLog) {
            console.log(`[Webhook Inbound] Successfully resumed waiting workflow "${waitingSession.workflowId}" for ${fromPhone}`);
            advancedWorkflowHandled = true;
            continue; // Successfully handled by active workflow session!
          } else {
            console.error(`[RESUME FAILED] Failed to resume workflow "${waitingSession.workflowId}" for phone "${fromPhone}". Clearing stale session.`);
            TestCenterStore.clearSession(fromPhone, workspaceId);
          }
        }
      }
    } catch (err: any) {
      console.error('[Advanced Workflow Webhook Error]:', err);
    }

    // 5. PRIORITY 2: Interactive Chatbot Branch Execution (Legacy flows)
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

    // 6. PRIORITY 3: If not waiting in a workflow, match incoming message to new workflow triggers
    try {
      const { AdvancedWorkflowEngine } = await import('@/lib/automations/advancedWorkflowEngine');
      if (!advancedWorkflowHandled) {
        let triggerType: any = 'keyword';
        if (message.type === 'interactive') {
          if (message.interactive?.list_reply || (interactionPayload && interactionPayload.description)) {
            triggerType = 'list_selection';
          } else {
            triggerType = 'button_click';
          }
        }

        console.log(`[TRIGGER MATCHING: BEFORE] Matching active workflows for triggerType: "${triggerType}", triggerText: "${triggerText}", workspaceId: "${workspaceId}"`);
        let advancedMatches = AdvancedWorkflowEngine.matchWorkflows(
          triggerType,
          { text: triggerText, buttonId: interactionPayload?.id, ...interactionPayload },
          workspaceId
        );

        // Fallback: If no keyword matched for regular text, check for incoming_message triggers
        if (advancedMatches.length === 0 && triggerType === 'keyword') {
          console.log(`[TRIGGER MATCHING: FALLBACK] Checking fallback incoming_message triggers for text: "${triggerText}"`);
          advancedMatches = AdvancedWorkflowEngine.matchWorkflows(
            'incoming_message',
            { text: triggerText, from: fromPhone },
            workspaceId
          );
        }
        console.log(`[TRIGGER MATCHING: AFTER] Matched ${advancedMatches.length} workflow(s): [${advancedMatches.map(w => `${w.name} (${w.id})`).join(', ')}]`);

        if (advancedMatches.length > 0) {
          for (const matchedWf of advancedMatches) {
            console.log(`[WORKFLOW EXECUTION: DISPATCH] Executing matched workflow "${matchedWf.name}" (${matchedWf.id}) for ${fromPhone}`);
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
