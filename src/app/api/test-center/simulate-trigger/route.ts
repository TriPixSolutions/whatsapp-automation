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
      isSandbox = false,
    } = body;

    const workspaceId = user.workspaceId!;
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

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
      // 3. Simulate Incoming Message (Hi, Hello, Pricing, Offer, Start)
      case 'incoming_message':
        triggerType = 'incoming_message';
        triggerPayload = { text: text || 'Hello', from: cleanPhone };
        // Log inbound message in conversation inbox
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

      // 4. Simulate Keyword Trigger
      case 'keyword_trigger':
        triggerType = 'keyword';
        triggerPayload = { text: text || 'Pricing', keyword: text || 'Pricing' };
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

      // 5. Simulate Button Click
      case 'button_click':
        triggerType = 'button_click';
        triggerPayload = {
          buttonId: buttonId || 'btn_catalog',
          buttonTitle: buttonTitle || 'Browse Catalog',
          title: buttonTitle || 'Browse Catalog',
        };
        // Record in Button Testing Lab
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

      // 6. Simulate Carousel Click
      case 'carousel_click':
        triggerType = 'carousel_click';
        triggerPayload = {
          cardIndex: cardIndex !== undefined ? cardIndex : 0,
          cardButtonId: cardButtonId || 'buy_shoes',
          cardTitle: leadData?.cardTitle || 'Featured Card',
        };
        // Record in Carousel Testing Lab
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

      // 7. Simulate CTA Button Click
      case 'cta_click':
        triggerType = 'button_click';
        triggerPayload = {
          buttonId: buttonId || 'cta_website',
          buttonTitle: buttonTitle || 'Visit Website',
          type: 'url',
          url: 'https://example.com/shop',
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

      // 8. Simulate Lead Form Submission
      case 'lead_form':
        triggerType = leadFormSource === 'instagram' ? 'instagram_lead' : 'facebook_lead';
        triggerPayload = {
          source: leadFormSource || 'facebook',
          formId: 'fb_lead_form_839219',
          leadData: leadData || { name: 'Sarah Connor', interest: 'Premium Package' },
        };
        break;

      // 8b. Simulate List Selection
      case 'list_selection':
        triggerType = 'button_click';
        triggerPayload = {
          listId: buttonId || 'opt_vip_support',
          listTitle: buttonTitle || 'VIP Priority Support',
          title: buttonTitle || 'VIP Priority Support',
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

      // 8c. Simulate WhatsApp Flow Submission
      case 'flow_submission':
        triggerType = 'button_click';
        triggerPayload = {
          flowId: 'flow_reg_9921',
          response: {
            screen: 'REGISTER_SCREEN',
            data: { email: 'customer@example.com', service: 'WhatsApp Automation' },
          },
        };
        await MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'interactive',
          status: 'delivered',
          content: 'WhatsApp Flow submitted: Registration Form',
          payload: triggerPayload,
        }, workspaceId);
        await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 9. Simulate Webhook Event
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

      // 10. Simulate API Trigger
      case 'api_trigger':
        triggerType = 'api_trigger';
        triggerPayload = apiPayload || { apiAction: 'start_onboarding', clientTier: 'vip' };
        break;

      // 2. Send Test Trigger (Manual)
      default:
        triggerType = 'manual_trigger';
        triggerPayload = { manual: true, triggeredBy: 'test_center' };
        break;
    }

    // 2. PRIORITY 1: If there is an active waiting session for this recipient, RESUME it!
    const activeSession = await TestCenterStore.getActiveSession(cleanPhone, workspaceId);
    const sessionMatchesAction = Boolean(
      activeSession && (
        ((simulationType === 'button_click' || simulationType === 'cta_click') && activeSession.waitingFor === 'button_click') ||
        (simulationType === 'carousel_click' && ['reply', 'carousel_click'].includes(activeSession.waitingFor)) ||
        (simulationType === 'incoming_message' && activeSession.waitingFor === 'reply')
      )
    );
    if (activeSession && sessionMatchesAction) {
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
        false
      );

      if (resumed) {
        return NextResponse.json({
          success: true,
          simulationType,
          phoneNumber: cleanPhone,
          resumed: true,
          matchedWorkflowsCount: 1,
          executions: [resumed],
          activeExecution: resumed,
          status: resumed.status,
          message: `Workflow resumed along branch for "${buttonTitle || buttonId || text || simulationType}".`,
        });
      }
    }

    // 2b. PRIORITY 2: Select target workflow to start fresh execution
    let targetWorkflows = [];
    if (workflowId) {
      const specificWf = await TestCenterStore.getWorkflow(workflowId, workspaceId);
      if (specificWf) targetWorkflows.push(specificWf);
    }

    if (targetWorkflows.length === 0) {
      targetWorkflows = await AdvancedWorkflowEngine.matchWorkflows(
        triggerType,
        triggerPayload,
        workspaceId
      );
    }

    // Interaction tests need a workflow that actually contains the requested
    // interactive node. The newest workflow is not necessarily suitable.
    const allWorkflows = await TestCenterStore.listWorkflows(workspaceId);
    const compatibleNodeTypes = simulationType === 'button_click'
      ? ['button', 'whatsapp_button']
      : simulationType === 'carousel_click'
      ? ['carousel', 'whatsapp_carousel']
      : [];
    if (compatibleNodeTypes.length > 0 && !targetWorkflows.some((wf) =>
      wf.nodes.some((node) => compatibleNodeTypes.includes(node.type)))) {
      const compatible = allWorkflows.find((wf) =>
        wf.isActive && wf.nodes.some((node) => compatibleNodeTypes.includes(node.type)));
      if (compatible) targetWorkflows = [compatible];
    }

    // If still no matching workflow, use the primary seed workflow
    if (targetWorkflows.length === 0) {
      if (allWorkflows.length > 0) targetWorkflows.push(allWorkflows[0]);
    }

    if (targetWorkflows.length === 0) {
      return NextResponse.json(
        { error: 'No active workflow found to simulate against.' },
        { status: 404 }
      );
    }

    // A click action is normally received after a workflow has paused. For an
    // independent Test Center action, prepare that state automatically and then
    // exercise the same resume path used by a real webhook.
    if (simulationType === 'button_click' || simulationType === 'carousel_click') {
      const workflow = targetWorkflows[0];
      if (activeSession && !sessionMatchesAction) {
        await TestCenterStore.clearSession(cleanPhone, workspaceId, activeSession.id);
      }

      const primed = await AdvancedWorkflowEngine.executeWorkflow(workflow, {
        workflowId: workflow.id,
        workspaceId,
        phoneNumber: cleanPhone,
        triggerType: 'manual_trigger',
        triggerPayload: {},
        debugMode,
        isTestSimulation: false,
      });

      if (primed.status === 'failed') {
        const failedStep = [...(primed.steps || [])].reverse().find((step) => step.status === 'failed');
        return NextResponse.json({
          success: false,
          error: failedStep?.error || `Workflow "${workflow.name}" failed while preparing the interaction test.`,
          failedNode: failedStep?.nodeTitle,
          activeExecution: primed,
        }, { status: 502 });
      }

      let preparedSession = await TestCenterStore.getActiveSession(cleanPhone, workspaceId);

      // Carousel interactions in the sample workflow are reached through the
      // catalog button. Follow the branch that leads to a carousel first.
      if (simulationType === 'carousel_click' && preparedSession?.waitingFor === 'button_click') {
        const pausedNode = workflow.nodes.find((node) => node.id === preparedSession?.currentNodeId);
        const outgoing = (workflow.edges || []).filter((edge) => edge.source === pausedNode?.id);
        const nodeById = new Map(workflow.nodes.map((node) => [node.id, node]));
        const reachesCarousel = (startId: string) => {
          const queue = [startId];
          const visited = new Set<string>();
          while (queue.length > 0) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);
            const node = nodeById.get(id);
            if (node && ['carousel', 'whatsapp_carousel'].includes(node.type)) return true;
            for (const edge of workflow.edges || []) if (edge.source === id) queue.push(edge.target);
            if (node?.nextNodeId) queue.push(node.nextNodeId);
          }
          return false;
        };
        const carouselEdge = outgoing.find((edge) => reachesCarousel(edge.target));
        if (carouselEdge) {
          const catalogButton = pausedNode?.config?.buttons?.find((button: any) =>
            button.id === carouselEdge.sourceHandle || button.title === carouselEdge.label);
          await AdvancedWorkflowEngine.resumeWorkflowExecution(preparedSession, {
            action: 'button_click',
            buttonId: carouselEdge.sourceHandle || catalogButton?.id,
            buttonTitle: carouselEdge.label || catalogButton?.title,
          }, false);
          preparedSession = await TestCenterStore.getActiveSession(cleanPhone, workspaceId);
        }
      }

      if (!preparedSession || !(
        (simulationType === 'button_click' && preparedSession.waitingFor === 'button_click') ||
        (simulationType === 'carousel_click' && ['reply', 'carousel_click'].includes(preparedSession.waitingFor))
      )) {
        return NextResponse.json({
          success: false,
          error: `Workflow "${workflow.name}" could not reach a ${simulationType === 'button_click' ? 'button' : 'carousel'} interaction node.`,
          activeExecution: primed,
        }, { status: 409 });
      }

      const resumed = await AdvancedWorkflowEngine.resumeWorkflowExecution(preparedSession, simulationType === 'button_click'
        ? {
            action: 'button_click',
            buttonId: buttonId || triggerPayload.buttonId,
            buttonTitle: buttonTitle || triggerPayload.buttonTitle,
          }
        : {
            action: 'carousel_click',
            cardIndex,
            cardButtonId: cardButtonId || triggerPayload.cardButtonId,
          }, false);

      if (!resumed) {
        return NextResponse.json({
          success: false,
          error: `No matching workflow branch was found for this ${simulationType.replace('_', ' ')}.`,
          activeExecution: primed,
        }, { status: 409 });
      }

      if (resumed.status === 'failed') {
        const failedStep = [...(resumed.steps || [])].reverse().find((step) => step.status === 'failed');
        return NextResponse.json({
          success: false,
          error: failedStep?.error || `Workflow branch failed after ${simulationType.replace('_', ' ')}.`,
          failedNode: failedStep?.nodeTitle,
          activeExecution: resumed,
        }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        simulationType,
        deliveryMode: isSandbox ? 'test_recipient' : 'production',
        phoneNumber: cleanPhone,
        resumed: true,
        matchedWorkflowsCount: 1,
        executions: [resumed],
        activeExecution: resumed,
        status: resumed.status,
      });
    }

    // 3. Execute matched workflows
    const executionResults = [];
    for (const wf of targetWorkflows) {
      const execResult = await AdvancedWorkflowEngine.executeWorkflow(wf, {
        workflowId: wf.id,
        workspaceId,
        phoneNumber: cleanPhone,
        triggerType,
        triggerPayload,
        debugMode,
        // Test Center actions exercise real delivery. "Test mode" limits the
        // recipient; it does not replace Meta calls with fabricated receipts.
        isTestSimulation: false,
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
      deliveryMode: isSandbox ? 'test_recipient' : 'production',
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
