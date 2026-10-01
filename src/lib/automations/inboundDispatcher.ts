import { ContactsDB, MessagesDB, ConversationsDB, AutomationsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { FollowUpEngine } from '@/lib/followup/followupEngine';
import { getAdminClient } from '@/lib/supabase/server';
import { AdvancedWorkflowEngine } from './advancedWorkflowEngine';
import { TestCenterStore } from './testCenterStore';
import { handleAiInboundReply } from '@/lib/webhook/webhookAiAssistant';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import {
  NormalizedInboundEvent,
  InboundPipelineResult,
  PipelineTraceStep,
} from './normalizedEvent';

export class InboundAutomationDispatcher {
  /**
   * Canonical Inbound Automation Pipeline
   * Processes both Real WhatsApp Webhook messages and Test Center simulated events
   * through the exact same normalization, persistence, session, and trigger architecture.
   */
  static async dispatch(event: NormalizedInboundEvent): Promise<InboundPipelineResult> {
    const trace: PipelineTraceStep[] = [];
    const addTrace = (step: string, status: 'passed' | 'skipped' | 'failed', details?: any) => {
      trace.push({ step, status, details, timestamp: new Date().toISOString() });
    };

    const workspaceId = event.workspaceId || DEFAULT_WORKSPACE_ID;
    const cleanPhone = event.phoneNumber.startsWith('+')
      ? event.phoneNumber
      : `+${event.phoneNumber.replace(/[^0-9]/g, '')}`;

    addTrace('Event Received', 'passed', {
      messageId: event.messageId,
      phoneNumber: cleanPhone,
      workspaceId,
      rawType: event.rawType,
      text: event.text,
      interaction: event.interaction,
      deliveryMode: event.deliveryMode,
    });

    // 1. Ensure Contact exists & identify buying intent
    let contact = await ContactsDB.getByPhone(cleanPhone, workspaceId);
    if (!contact) {
      contact = await ContactsDB.upsert(
        {
          phoneNumber: cleanPhone,
          firstName: event.metadata?.firstName || 'WhatsApp',
          lastName: event.metadata?.lastName || 'User',
          optinStatus: true,
          tags: event.isTestSimulation ? ['simulated_test'] : ['replied', 'engaged'],
        },
        workspaceId
      );
    }

    const contentText = event.text || event.interaction?.title || event.interaction?.id || '';
    const lowerContent = contentText.toLowerCase().trim();
    const isPriceInquiry = /\b(price|pricing|cost|how much|rate|quote|price\?)\b/i.test(lowerContent);
    const isDeliveryInquiry = /\b(delivery|shipping|dispatch|courier|ship|delivery\?)\b/i.test(lowerContent);
    const isAvailableInquiry = /\b(available|in stock|stock|inventory|available\?)\b/i.test(lowerContent);
    const isOrderInquiry = /\b(order|how to order|buy|purchase|book|how to order\?)\b/i.test(lowerContent);
    const isHighIntent = isPriceInquiry || isDeliveryInquiry || isAvailableInquiry || isOrderInquiry;

    if (isHighIntent) {
      const updatedTags = new Set(contact.tags || []);
      updatedTags.add('replied');
      updatedTags.add('engaged');
      updatedTags.add('priority');
      if (isPriceInquiry) updatedTags.add('price_inquiry');
      if (isDeliveryInquiry) updatedTags.add('delivery_inquiry');
      if (isOrderInquiry) updatedTags.add('order_inquiry');
      if (isAvailableInquiry) updatedTags.add('available_inquiry');

      contact = await ContactsDB.upsert(
        { ...contact, phoneNumber: cleanPhone, tags: Array.from(updatedTags) },
        workspaceId
      );

      const supabase = getAdminClient();
      if (supabase) {
        try {
          await supabase
            .from('leads')
            .update({ status: 'priority', updated_at: new Date().toISOString() })
            .eq('phone_number', cleanPhone)
            .eq('workspace_id', workspaceId);
        } catch {
          // non-blocking
        }
      }
    }
    addTrace('Contact & CRM Intent', 'passed', { contactId: contact.id, isHighIntent });

    // 2. Persist Inbound Message to database
    await MessagesDB.create(
      {
        metaMessageId: event.messageId,
        phoneNumber: cleanPhone,
        contactId: contact.id,
        direction: 'inbound',
        type: event.interaction ? 'interactive' : (event.rawType as any) || 'text',
        status: 'delivered',
        content: contentText,
        payload: {
          rawType: event.rawType,
          interaction: event.interaction,
          timestamp: event.timestamp,
          isSimulation: event.isTestSimulation,
        },
      },
      workspaceId
    );

    // 2b. Open 24-Hour Policy Window
    const inboundTimestampMs = Number(event.timestamp) * 1000 || Date.now();
    await ConversationsDB.recordInbound(
      cleanPhone,
      contact.id,
      workspaceId,
      event.messageId,
      new Date(Math.min(inboundTimestampMs, Date.now())).toISOString()
    );
    addTrace('Message Persistence & 24h Window', 'passed', { messageId: event.messageId });

    // 3. Customer replied: cancel pending follow-up jobs
    await FollowUpEngine.cancelPendingOnReply(cleanPhone, workspaceId);
    addTrace('Follow-Up Cancellation', 'passed');

    // 4. Session Evaluation: Check for active waiting or paused workflow session
    let sessionAction: InboundPipelineResult['sessionAction'] = 'none';
    let resumedSessionId: string | undefined;
    const isInteractiveAction = Boolean(event.interaction);
    const buttonId = event.interaction?.id || contentText;
    const buttonTitle = event.interaction?.title || contentText;

    const waitingSession = await TestCenterStore.getActiveSession(cleanPhone, workspaceId);

    if (waitingSession) {
      addTrace('Active Session Found', 'passed', {
        sessionId: waitingSession.id,
        workflowId: waitingSession.workflowId,
        currentNodeId: waitingSession.currentNodeId,
        waitingFor: waitingSession.waitingFor,
      });

      // Handle Scheduled Delay state
      if (waitingSession.waitingFor === 'delay') {
        // Customer messaged during a delay. Evaluate if message matches an interrupt/reset trigger keyword
        const topLevelMatches = contentText
          ? await AdvancedWorkflowEngine.matchWorkflows('keyword', { text: contentText }, workspaceId)
          : [];

        if (topLevelMatches.length > 0 && !isInteractiveAction) {
          // Interrupt the delay and allow the new workflow to start!
          sessionAction = 'interrupted_delay';
          await TestCenterStore.clearSession(cleanPhone, workspaceId, waitingSession.id);
          addTrace('Delay Interrupted by Top-Level Keyword', 'passed', {
            newWorkflows: topLevelMatches.map((w) => w.name),
          });
        } else {
          // Preserve delay session for scheduled runner to advance when due. Message was persisted!
          sessionAction = 'preserved_delay';
          addTrace('Delay Session Preserved', 'passed', {
            message: 'Inbound message recorded in inbox; delay session preserved.',
          });
          return {
            success: true,
            event,
            matchedWorkflowsCount: 0,
            matchedWorkflowNames: [],
            sessionAction: 'preserved_delay',
            executions: [],
            trace,
          };
        }
      } else {
        // Check if top-level keyword should supersede an old waiting session
        const matchingNewFlows = !isInteractiveAction && contentText
          ? await AdvancedWorkflowEngine.matchWorkflows('keyword', { text: contentText }, workspaceId)
          : [];

        if (matchingNewFlows.length > 0 && !isInteractiveAction) {
          sessionAction = 'cleared';
          await TestCenterStore.clearSession(cleanPhone, workspaceId, waitingSession.id);
          addTrace('Session Reset for Fresh Keyword', 'passed', {
            clearedSessionId: waitingSession.id,
            newFlows: matchingNewFlows.map((w) => w.name),
          });
        } else {
          // Resume the active waiting workflow
          let resumeAction: 'button_click' | 'carousel_click' | 'reply' | 'delay_expired' = 'reply';
          if (isInteractiveAction || waitingSession.waitingFor === 'button_click') {
            resumeAction = event.interaction?.kind === 'carousel_button' ? 'carousel_click' : 'button_click';
          } else if (waitingSession.waitingFor === 'carousel_selection') {
            resumeAction = 'carousel_click';
          } else if (waitingSession.waitingFor === 'reply') {
            resumeAction = isInteractiveAction ? 'button_click' : 'reply';
          }

          addTrace('Resuming Workflow Session', 'passed', {
            action: resumeAction,
            buttonId,
            buttonTitle,
            isTestSimulation: event.isTestSimulation,
          });

          const resumedLog = await AdvancedWorkflowEngine.resumeWorkflowExecution(
            waitingSession,
            {
              action: resumeAction,
              buttonId,
              buttonTitle,
              cardIndex: event.interaction?.cardIndex,
              cardButtonId: event.interaction?.cardButtonId || buttonId,
              text: contentText,
            },
            event.isTestSimulation
          );

          if (resumedLog && resumedLog.status !== 'failed') {
            sessionAction = 'resumed';
            resumedSessionId = waitingSession.id;
            addTrace('Workflow Resumed Successfully', 'passed', {
              executionId: resumedLog.id,
              status: resumedLog.status,
              stepsCount: resumedLog.steps?.length || 0,
            });

            return {
              success: true,
              event,
              matchedWorkflowsCount: 1,
              matchedWorkflowNames: [waitingSession.workflowId],
              sessionAction: 'resumed',
              resumedSessionId: waitingSession.id,
              executions: [resumedLog],
              trace,
            };
          } else {
            addTrace('Resume Branch Resolution Failed', 'failed', {
              resumedStatus: resumedLog?.status,
            });
            await TestCenterStore.clearSession(cleanPhone, workspaceId, waitingSession.id);
          }
        }
      }
    } else {
      addTrace('No Active Session', 'passed');
      // If a button or carousel interaction was sent but NO active session exists:
      if (isInteractiveAction) {
        if (event.isTestSimulation) {
          // Test Center must NOT auto-prime or fabricate execution
          const err = `No active workflow session exists for ${cleanPhone}. Please trigger the workflow first so it reaches the interaction node.`;
          addTrace('Interactive Simulation Without Session', 'failed', { error: err });
          return {
            success: false,
            event,
            matchedWorkflowsCount: 0,
            matchedWorkflowNames: [],
            sessionAction: 'none',
            executions: [],
            error: err,
            code: 'NO_ACTIVE_SESSION',
            trace,
          };
        } else {
          // Production inbound button click with no active session
          console.warn(`[InboundDispatcher] Unmatched button click "${buttonId}" from ${cleanPhone} (no active session).`);
        }
      }
    }

    // 5. Trigger Engine: Match incoming event to active workflows
    let triggerType: any = 'keyword';
    if (event.interaction?.kind === 'carousel_button') {
      triggerType = 'carousel_click';
    } else if (event.interaction) {
      triggerType = 'button_click';
    } else if (event.rawType === 'text') {
      triggerType = 'keyword';
    } else {
      triggerType = 'incoming_message';
    }

    const triggerPayload = {
      text: contentText,
      buttonId,
      buttonTitle,
      ...event.interaction,
      from: cleanPhone,
    };

    addTrace('Trigger Matching Started', 'passed', {
      triggerType,
      triggerPayload,
      workspaceId,
    });

    let matchedWorkflows = await AdvancedWorkflowEngine.matchWorkflows(
      triggerType,
      triggerPayload,
      workspaceId
    );

    // Fallback: If no keyword matched for regular text, check for incoming_message triggers
    if (matchedWorkflows.length === 0 && triggerType === 'keyword' && contentText) {
      matchedWorkflows = await AdvancedWorkflowEngine.matchWorkflows(
        'incoming_message',
        { text: contentText, from: cleanPhone },
        workspaceId
      );
    }

    addTrace('Trigger Matching Completed', 'passed', {
      matchedCount: matchedWorkflows.length,
      matchedNames: matchedWorkflows.map((w) => w.name),
    });

    // 6. Execute Matched Workflows
    const executions: any[] = [];
    if (matchedWorkflows.length > 0) {
      for (const wf of matchedWorkflows) {
        addTrace(`Executing Workflow: ${wf.name}`, 'passed', {
          workflowId: wf.id,
          isTestSimulation: event.isTestSimulation,
        });

        const execResult = await AdvancedWorkflowEngine.executeWorkflow(wf, {
          workflowId: wf.id,
          workspaceId,
          phoneNumber: cleanPhone,
          contactId: contact.id,
          triggerType,
          triggerPayload,
          isTestSimulation: event.isTestSimulation,
        });

        executions.push(execResult);
      }

      const hasFailed = executions.some((e) => e.status === 'failed');
      return {
        success: !hasFailed,
        event,
        matchedWorkflowsCount: matchedWorkflows.length,
        matchedWorkflowNames: matchedWorkflows.map((w) => w.name),
        sessionAction,
        resumedSessionId,
        executions,
        error: hasFailed ? executions.find((e) => e.status === 'failed')?.error : undefined,
        trace,
      };
    }

    // 7. Legacy Fallback: AutomationsDB match (for backwards compatibility)
    const matchedLegacy = AutomationsDB.findMatch(contentText, workspaceId);
    if (matchedLegacy) {
      addTrace('Legacy AutomationsDB Matched', 'passed', { flowId: matchedLegacy.id });
      if (!event.isTestSimulation) {
        const payload = matchedLegacy.actionPayload as any;
        if (matchedLegacy.actionType === 'text') {
          await WhatsAppMessageService.send({
            workspaceId,
            to: cleanPhone,
            type: 'text',
            text: payload.text || 'Hello!',
            requireRealDelivery: true,
          });
        }
        AutomationsDB.incrementExecution(matchedLegacy.id);
      }
      return {
        success: true,
        event,
        matchedWorkflowsCount: 1,
        matchedWorkflowNames: [matchedLegacy.name || 'Legacy Flow'],
        sessionAction,
        executions: [],
        trace,
      };
    }

    // 8. Autonomous AI Assistant Inbound Reply (if real message in production)
    if (!event.isTestSimulation && event.rawType === 'text' && contentText) {
      addTrace('AI Assistant Invoked', 'passed');
      await handleAiInboundReply(cleanPhone, contact.id, contentText, workspaceId);
    }

    addTrace('Pipeline Finished Without Workflow Trigger', 'passed', {
      reason: 'No workflow or automation matched incoming message content.',
    });

    return {
      success: true,
      event,
      matchedWorkflowsCount: 0,
      matchedWorkflowNames: [],
      sessionAction,
      executions: [],
      trace,
    };
  }
}
