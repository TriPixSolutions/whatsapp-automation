import { randomUUID } from 'crypto';
import { InboundAutomationDispatcher } from '@/lib/automations/inboundDispatcher';
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

    if (['incoming_message','keyword_trigger','button_click','cta_click','carousel_click','list_selection'].includes(simulationType)) {
      const interaction = ['button_click','cta_click','carousel_click','list_selection'].includes(simulationType)
        ? { kind: simulationType === 'carousel_click' ? 'carousel_button' as const : simulationType === 'list_selection' ? 'list_reply' as const : 'button_reply' as const,
            id: cardButtonId || buttonId || '', title: buttonTitle || buttonId || '', cardIndex, cardButtonId } : undefined;
      const result = await InboundAutomationDispatcher.dispatch({workspaceId,phoneNumber:cleanPhone,
        messageId:`test_${randomUUID()}`,timestamp:String(Math.floor(Date.now()/1000)),rawType:interaction?'interactive':'text',
        text:text || (interaction ? undefined : 'Hello'),interaction,isTestSimulation,metadata:{synthetic:true},deliveryMode:isLiveDelivery?'live':'sandbox'});
      return NextResponse.json({...result,simulationType,deliveryMode:isLiveDelivery?'production':'sandbox',
        resumed:result.sessionAction==='resumed',activeExecution:result.executions[0]}, {status:result.success?200:409});
    }

    if (!['lead_form','webhook_event','api_trigger','manual_run','manual_trigger'].includes(simulationType)) return NextResponse.json({ error: 'Unknown simulation type' }, { status: 400 });
    let triggerType: AutomationTriggerType = simulationType === 'lead_form' ? 'meta_lead_form' : simulationType === 'webhook_event' ? 'webhook_trigger' : simulationType === 'api_trigger' ? 'api_trigger' : 'manual_trigger';
    let triggerPayload: any = triggerType === 'manual_trigger' ? { manual: true, allowDirectRun: true, triggeredBy: 'test_center' } : simulationType === 'lead_form' ? { source: leadFormSource || 'facebook', leadData, from: cleanPhone } : simulationType === 'webhook_event' ? webhookPayload || {} : apiPayload || {};

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
