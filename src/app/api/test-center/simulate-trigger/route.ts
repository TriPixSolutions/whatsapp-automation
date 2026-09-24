import { NextRequest, NextResponse } from 'next/server';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { DEFAULT_WORKSPACE_ID, ContactsDB, MessagesDB, ConversationsDB } from '@/lib/db';
import { AutomationTriggerType } from '@/types/automations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const workspaceId = DEFAULT_WORKSPACE_ID;
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

    // 1. Ensure contact exists and record simulation event
    const contact = ContactsDB.upsert(
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
        MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'text',
          status: 'delivered',
          content: text || 'Hello',
        });
        ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
        break;

      // 4. Simulate Keyword Trigger
      case 'keyword_trigger':
        triggerType = 'keyword';
        triggerPayload = { text: text || 'Pricing', keyword: text || 'Pricing' };
        MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'text',
          status: 'delivered',
          content: text || 'Pricing',
        });
        ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
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
        MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'interactive',
          status: 'delivered',
          content: `Button clicked: ${buttonTitle || buttonId}`,
          payload: triggerPayload,
        });
        ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
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
        MessagesDB.create({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          direction: 'inbound',
          type: 'interactive',
          status: 'delivered',
          content: `Carousel card #${(cardIndex || 0) + 1} clicked`,
          payload: triggerPayload,
        });
        ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);
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

      // 9. Simulate Webhook Event
      case 'webhook_event':
        triggerType = 'webhook_trigger';
        triggerPayload = webhookPayload || { event: 'custom_order_paid', orderId: 'ORD_99182' };
        TestCenterStore.recordWebhookLog({
          id: `wh_sim_${Date.now()}`,
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

    // 2. Select target workflow
    let targetWorkflows = [];
    if (workflowId) {
      const specificWf = TestCenterStore.getWorkflow(workflowId);
      if (specificWf) targetWorkflows.push(specificWf);
    }

    if (targetWorkflows.length === 0) {
      targetWorkflows = AdvancedWorkflowEngine.matchWorkflows(
        triggerType,
        triggerPayload,
        workspaceId
      );
    }

    // If still no matching workflow, use the primary seed workflow
    if (targetWorkflows.length === 0) {
      const allWfs = TestCenterStore.listWorkflows(workspaceId);
      if (allWfs.length > 0) targetWorkflows.push(allWfs[0]);
    }

    if (targetWorkflows.length === 0) {
      return NextResponse.json(
        { error: 'No active workflow found to simulate against.' },
        { status: 404 }
      );
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
        isTestSimulation: true,
      });
      executionResults.push(execResult);
    }

    return NextResponse.json({
      success: true,
      simulationType,
      phoneNumber: cleanPhone,
      matchedWorkflowsCount: targetWorkflows.length,
      executions: executionResults,
      activeExecution: executionResults[0],
    });
  } catch (err: any) {
    console.error('[Simulate Trigger API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
