import { getAuthorizedUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { ContactsDB, MessagesDB, ConversationsDB } from '@/lib/db';
import { AutomationTriggerType } from '@/types/automations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      simulationType,
      phoneNumber = '+919876543210',
      workflowId,
      text,
      buttonId,
      buttonTitle,
      cardIndex,
      cardButtonId,
      leadFormSource,
      leadData,
      webhookPayload,
      apiPayload,
      debugMode = true,
      deliveryMode, // 'sandbox' | 'live'
      isSandbox, // backwards compatibility flag
      isLiveDelivery: explicitLive,
    } = body;

    const workspaceId = user.workspaceId!;
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

    // Delivery mode: Default is SANDBOX (safe preview). Live Meta calls require explicit opt-in.
    const isLiveDelivery = Boolean(
      explicitLive === true ||
      deliveryMode === 'live' ||
      (deliveryMode === 'production' && isSandbox === false)
    );
    const isTestSimulation = !isLiveDelivery;

    // 1. Ensure contact exists and record simulation event
    const contact = await ContactsDB.upsert(
      {
        phoneNumber: cleanPhone,
        firstName: leadData?.firstName || 'Test',
        lastName: leadData?.lastName || 'User',
        tags: ['simulated_test', 'test_number'],
      },
      workspaceId
    );

    let triggerType: AutomationTriggerType = 'manual_trigger';
    let triggerPayload: any = {};

    switch (simulationType) {
      // 1. Simulate Incoming Message
      case 'incoming_message':
        triggerType = 'incoming_message';
        triggerPayload = { text: text || 'Hello', from: cleanPhone };
        await MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'text',
          status: 'delivered',
          content: text || 'Hello',
        }, workspaceId);
        await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 2. Simulate Keyword Trigger
      case 'keyword_trigger':
        triggerType = 'keyword';
        triggerPayload = { text: text || 'Pricing', keyword: text || 'Pricing', from: cleanPhone };
        await MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'text',
          status: 'delivered',
          content: text || 'Pricing',
        }, workspaceId);
        await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 3. Simulate Button Click
      case 'button_click':
        triggerType = 'button_click';
        triggerPayload = {
          buttonId: buttonId || 'btn_catalog',
          buttonTitle: buttonTitle || 'Browse Catalog',
          title: buttonTitle || 'Browse Catalog',
          from: cleanPhone,
        };
        TestCenterStore.recordButtonEvent({
          workspaceId,
          id: `btn_evt_${Date.now()}`,
          timestamp: new Date().toISOString(),
          phoneNumber: cleanPhone,
          buttonType: 'quick_reply',
          buttonId: buttonId || 'btn_catalog',
          buttonTitle: buttonTitle || 'Browse Catalog',
          viewed: true,
          clicked: true,
          clickedAt: new Date().toISOString(),
          responsePayload: triggerPayload,
        });
        await MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'interactive',
          status: 'delivered',
          content: `Button clicked: ${buttonTitle || buttonId}`,
          payload: triggerPayload,
        }, workspaceId);
        await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 4. Simulate Carousel Click
      case 'carousel_click':
        triggerType = 'carousel_click';
        triggerPayload = {
          cardIndex: cardIndex !== undefined ? cardIndex : 0,
          cardButtonId: cardButtonId || 'buy_shoes',
          cardTitle: leadData?.cardTitle || 'Featured Card',
          from: cleanPhone,
        };
        TestCenterStore.recordCarouselEvent({
          workspaceId,
          id: `car_evt_${Date.now()}`,
          timestamp: new Date().toISOString(),
          phoneNumber: cleanPhone,
          carouselTitle: 'Product Showcase Carousel',
          totalCards: 3,
          cardIndex: cardIndex !== undefined ? cardIndex : 0,
          cardTitle: leadData?.cardTitle || 'Featured Card',
          cardViewed: true,
          cardClicked: true,
          buttonClickedId: cardButtonId || 'buy_shoes',
          clickedAt: new Date().toISOString(),
        });
        await MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'interactive',
          status: 'delivered',
          content: `Carousel card #${(cardIndex || 0) + 1} clicked`,
          payload: triggerPayload,
        }, workspaceId);
        await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 5. Simulate CTA Button Click
      case 'cta_click':
        triggerType = 'button_click';
        triggerPayload = {
          buttonId: buttonId || 'cta_website',
          buttonTitle: buttonTitle || 'Visit Website',
          type: 'url',
          url: 'https://example.com/shop',
          from: cleanPhone,
        };
        TestCenterStore.recordButtonEvent({
          workspaceId,
          id: `cta_evt_${Date.now()}`,
          timestamp: new Date().toISOString(),
          phoneNumber: cleanPhone,
          buttonType: 'url',
          buttonId: buttonId || 'cta_website',
          buttonTitle: buttonTitle || 'Visit Website',
          viewed: true,
          clicked: true,
          clickedAt: new Date().toISOString(),
          responsePayload: triggerPayload,
        });
        break;

      // 6. Simulate Lead Form Submission
      case 'lead_form':
        triggerType = leadFormSource === 'instagram' ? 'instagram_lead' : 'facebook_lead';
        triggerPayload = {
          source: leadFormSource || 'facebook',
          formId: 'fb_lead_form_839219',
          leadData: leadData || { name: 'Sarah Connor', interest: 'Premium Package' },
          from: cleanPhone,
        };
        break;

      // 7. Simulate List Selection
      case 'list_selection':
        triggerType = 'button_click';
        triggerPayload = {
          listId: buttonId || 'opt_vip_support',
          listTitle: buttonTitle || 'VIP Priority Support',
          title: buttonTitle || 'VIP Priority Support',
          from: cleanPhone,
        };
        await MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'interactive',
          status: 'delivered',
          content: `List selected: ${buttonTitle || buttonId || 'VIP Priority Support'}`,
          payload: triggerPayload,
        }, workspaceId);
        await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 8. Simulate Webhook Event
      case 'webhook_event':
        triggerType = 'webhook_trigger';
        triggerPayload = webhookPayload || { event: 'custom_order_paid', orderId: 'ORD_99182' };
        TestCenterStore.recordWebhookLog({
          id: `wh_sim_${Date.now()}`,
          workspaceId,
          timestamp: new Date().toISOString(),
          direction: 'incoming',
          source: 'Simulated Webhook Sender',
          eventType: 'custom_trigger',
          payload: triggerPayload,
          responseStatus: 200,
          responseBody: { status: 'triggered' },
          executionTimeMs: 8,
          signatureVerified: true,
          status: 'success',
        });
        break;

      // 9. Simulate API Trigger
      case 'api_trigger':
        triggerType = 'api_trigger';
        triggerPayload = apiPayload || { apiAction: 'start_onboarding', clientTier: 'vip' };
        break;

      // 10. Manual Workflow Run
      case 'manual_run':
      case 'manual_trigger':
      default:
        triggerType = 'manual_trigger';
        triggerPayload = { manual: true, allowDirectRun: true, triggeredBy: 'test_center' };
        break;
    }

    // =========================================================================
    // STEP 2: SESSION MANAGEMENT & RESUME EVALUATION
    // =========================================================================
    const activeSession = await TestCenterStore.getActiveSession(cleanPhone, workspaceId);
    const isInteractiveSimulation = simulationType === 'button_click' || simulationType === 'cta_click' || simulationType === 'carousel_click';

    if (activeSession) {
      const sessionMatchesAction = Boolean(
        ((simulationType === 'button_click' || simulationType === 'cta_click') && activeSession.waitingFor === 'button_click') ||
        (simulationType === 'carousel_click' && ['reply', 'carousel_click', 'carousel_selection', 'button_click'].includes(activeSession.waitingFor)) ||
        (simulationType === 'incoming_message' && activeSession.waitingFor === 'reply')
      );

      if (sessionMatchesAction) {
        const resumeAction = simulationType === 'carousel_click'
          ? 'carousel_click'
          : simulationType === 'incoming_message'
          ? 'reply'
          : 'button_click';

        const resumed = await AdvancedWorkflowEngine.resumeWorkflowExecution(
          activeSession,
          {
            action: resumeAction,
            buttonId: buttonId || triggerPayload?.buttonId,
            buttonTitle: buttonTitle || triggerPayload?.buttonTitle,
            cardIndex,
            cardButtonId,
            text: text || triggerPayload?.text,
          },
          isTestSimulation
        );

        if (resumed && resumed.status !== 'failed') {
          return NextResponse.json({
            success: true,
            simulationType,
            phoneNumber: cleanPhone,
            deliveryMode: isLiveDelivery ? 'production' : 'sandbox',
            resumed: true,
            matchedWorkflowsCount: 1,
            executions: [resumed],
            activeExecution: resumed,
            status: resumed.status,
            message: `Workflow resumed along branch for "${buttonTitle || buttonId || text || simulationType}".`,
          });
        }
      }
    } else if (isInteractiveSimulation) {
      // MODE 3 & 4: Button / Carousel simulation REQUIRES an active session!
      // Do NOT auto-prime or execute Node 0 unexpectedly.
      return NextResponse.json({
        success: false,
        error: `No active workflow session exists for ${cleanPhone}. Please run a workflow first so it reaches the interaction node.`,
        code: 'NO_ACTIVE_SESSION',
        phoneNumber: cleanPhone,
        simulationType,
      }, { status: 409 });
    }

    // =========================================================================
    // STEP 3: WORKFLOW MATCHING & TRIGGER EVALUATION
    // =========================================================================
    let targetWorkflows = [];

    if (triggerType === 'manual_trigger') {
      // Manual trigger: explicit operator run of a chosen workflow
      if (workflowId) {
        const specificWf = await TestCenterStore.getWorkflow(workflowId, workspaceId);
        if (specificWf) targetWorkflows.push(specificWf);
      }
      if (targetWorkflows.length === 0) {
        const allWfs = (await TestCenterStore.listWorkflows(workspaceId)).filter((w) => w.isActive);
        if (allWfs.length > 0) targetWorkflows.push(allWfs[0]);
      }
    } else {
      // Inbound event trigger (keyword, incoming_message, lead, etc.)
      targetWorkflows = await AdvancedWorkflowEngine.matchWorkflows(
        triggerType,
        triggerPayload,
        workspaceId
      );

      // If user selected a specific workflow to test against, filter to that workflow
      if (workflowId) {
        targetWorkflows = targetWorkflows.filter((w) => w.id === workflowId);
      }

      // Fallback: If no keyword matched, check fallback incoming_message triggers
      if (targetWorkflows.length === 0 && triggerType === 'keyword' && (text || triggerPayload?.text)) {
        const fallbackMatches = await AdvancedWorkflowEngine.matchWorkflows(
          'incoming_message',
          { text: text || triggerPayload?.text, from: cleanPhone },
          workspaceId
        );
        targetWorkflows = workflowId ? fallbackMatches.filter((w) => w.id === workflowId) : fallbackMatches;
      }
    }

    // If NO workflow matched the inbound trigger, report NO_MATCH gracefully.
    // NEVER fall back to executing an arbitrary workflow when testing inbound triggers!
    if (targetWorkflows.length === 0) {
      return NextResponse.json({
        success: true,
        simulationType,
        phoneNumber: cleanPhone,
        deliveryMode: isLiveDelivery ? 'production' : 'sandbox',
        matchedWorkflowsCount: 0,
        executions: [],
        message: `No active workflow matched incoming ${simulationType.replace('_', ' ')} "${text || buttonId || ''}". Inbound message persisted to inbox.`,
        trace: {
          eventReceived: { simulationType, text, buttonId, phoneNumber: cleanPhone },
          workspaceId,
          triggerType,
          triggerEvaluation: 'NO_MATCH',
          deliveryMode: isLiveDelivery ? 'production' : 'sandbox',
        },
      });
    }

    // =========================================================================
    // STEP 4: EXECUTE MATCHED WORKFLOWS
    // =========================================================================
    const executionResults = [];
    for (const wf of targetWorkflows) {
      const execResult = await AdvancedWorkflowEngine.executeWorkflow(wf, {
        workflowId: wf.id,
        workspaceId,
        phoneNumber: cleanPhone,
        triggerType,
        triggerPayload,
        debugMode,
        isTestSimulation,
      });
      executionResults.push(execResult);
    }

    const failedExecution = executionResults.find((execution) => execution.status === 'failed');
    const failedStep = failedExecution
      ? [...(failedExecution.steps || [])].reverse().find((step) => step.status === 'failed')
      : undefined;

    return NextResponse.json({
      success: !failedExecution,
      simulationType,
      phoneNumber: cleanPhone,
      deliveryMode: isLiveDelivery ? 'production' : 'sandbox',
      matchedWorkflowsCount: targetWorkflows.length,
      executions: executionResults,
      activeExecution: executionResults[0],
      error: failedStep?.error,
      failedNode: failedStep?.nodeTitle,
    }, { status: failedExecution ? 502 : 200 });
  } catch (err: any) {
    console.error('[Simulate Trigger API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
