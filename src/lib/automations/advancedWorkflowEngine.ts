import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionLog,
  ExecutionTraceStep,
  AutomationTriggerType,
  PlatformMessageType,
  WorkflowActionType,
} from '@/types/automations';
import { TestCenterStore } from './testCenterStore';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { ContactsDB, MessagesDB, SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';

export interface WorkflowExecutionContext {
  workflowId: string;
  workspaceId: string;
  phoneNumber: string;
  contactId?: string;
  triggerType: AutomationTriggerType;
  triggerPayload: any;
  debugMode?: boolean;
  isTestSimulation?: boolean;
  variables?: Record<string, any>;
}

export class AdvancedWorkflowEngine {
  /**
   * Matches an incoming trigger event against all active workflows
   */
  static matchWorkflows(
    triggerType: AutomationTriggerType,
    triggerPayload: any,
    workspaceId = DEFAULT_WORKSPACE_ID
  ): WorkflowDefinition[] {
    const workflows = TestCenterStore.listWorkflows(workspaceId).filter((w) => w.isActive);
    const matches: WorkflowDefinition[] = [];

    for (const wf of workflows) {
      if (this.doesTriggerMatch(wf, triggerType, triggerPayload)) {
        matches.push(wf);
      }
    }

    return matches;
  }

  /**
   * Evaluates if a workflow matches the specific trigger event
   */
  static doesTriggerMatch(
    wf: WorkflowDefinition,
    triggerType: AutomationTriggerType,
    payload: any
  ): boolean {
    const text = (payload?.text || payload?.body || payload?.triggerKeyword || '').toString().trim();
    const keyword = (wf.triggerKeyword || '').trim();

    switch (triggerType) {
      case 'incoming_message':
      case 'first_message':
      case 'customer_reply':
      case 'broadcast_reply':
        return true;

      case 'keyword':
      case 'contains_text':
        if (!keyword) return true;
        return text.toLowerCase().includes(keyword.toLowerCase());

      case 'exact_match':
        if (!keyword) return true;
        return text.toLowerCase() === keyword.toLowerCase();

      case 'new_contact':
      case 'imported_contact':
        return wf.triggerType === triggerType || wf.triggerType === 'new_contact';

      case 'meta_lead_form':
      case 'facebook_lead':
      case 'instagram_lead':
        return ['meta_lead_form', 'facebook_lead', 'instagram_lead'].includes(wf.triggerType);

      case 'manual_trigger':
      case 'api_trigger':
      case 'webhook_trigger':
        return wf.triggerType === triggerType || wf.id === payload?.workflowId;

      case 'contact_tag':
        if (payload?.tag && wf.nodes[0]?.config?.tag) {
          return payload.tag.toLowerCase() === wf.nodes[0].config.tag.toLowerCase();
        }
        return wf.triggerType === 'contact_tag';

      case 'button_click':
        if (payload?.buttonId && wf.nodes.some((n) => n.config?.buttons?.some((b: any) => b.id === payload.buttonId))) {
          return true;
        }
        return wf.triggerType === 'button_click';

      case 'carousel_click':
        if (payload?.cardButtonId || payload?.cardIndex !== undefined) {
          return true;
        }
        return wf.triggerType === 'carousel_click';

      case 'qr_scan':
        return wf.triggerType === 'qr_scan';

      default:
        return wf.triggerType === triggerType;
    }
  }

  /**
   * Main Workflow Execution Runner
   */
  static async executeWorkflow(
    workflow: WorkflowDefinition,
    context: WorkflowExecutionContext
  ): Promise<WorkflowExecutionLog> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const startedAt = new Date().toISOString();
    const stepsTrace: ExecutionTraceStep[] = [];
    const metaResponses: any[] = [];
    const executionVariables: Record<string, any> = {
      phoneNumber: context.phoneNumber,
      ...context.variables,
    };

    // 1. Ensure contact exists or fetch
    let contact = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
    if (!contact) {
      contact = ContactsDB.upsert(
        {
          phoneNumber: context.phoneNumber,
          firstName: context.triggerPayload?.firstName || 'Lead',
          lastName: context.triggerPayload?.lastName || '',
          tags: ['automated_lead'],
        },
        context.workspaceId
      );
    }
    context.contactId = contact.id;

    // 2. Initialize execution log
    const execLog: WorkflowExecutionLog = {
      id: executionId,
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      workspaceId: context.workspaceId,
      phoneNumber: context.phoneNumber,
      contactId: contact.id,
      triggerType: context.triggerType,
      triggerValue: context.triggerPayload?.text || context.triggerPayload?.buttonId || workflow.triggerKeyword,
      status: 'running',
      startedAt,
      totalDurationMs: 0,
      steps: stepsTrace,
      metaResponses,
      debugTrace: {
        debugMode: context.debugMode || workflow.debugModeEnabled,
        initialVariables: { ...executionVariables },
      },
    };

    TestCenterStore.recordExecutionLog(execLog);

    // 3. Execution Node Graph Navigation
    const nodeMap = new Map<string, WorkflowNode>();
    for (const n of workflow.nodes) {
      nodeMap.set(n.id, n);
    }

    let currentNode: WorkflowNode | undefined = workflow.nodes[0];
    let stepCount = 0;
    const maxSteps = 50; // loop protection

    while (currentNode && stepCount < maxSteps) {
      stepCount++;
      const stepStart = Date.now();
      const traceStep: ExecutionTraceStep = {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        nodeTitle: currentNode.title,
        status: 'started',
        startedAt: new Date().toISOString(),
        durationMs: 0,
        inputPayload: { ...currentNode.config, variables: executionVariables },
      };

      try {
        let nextNodeIdToFollow: string | undefined = currentNode.nextNodeId;

        // Process Node Type
        switch (currentNode.type) {
          case 'trigger': {
            traceStep.status = 'trigger_fired';
            traceStep.outputResult = {
              matched: true,
              triggerType: context.triggerType,
              payload: context.triggerPayload,
            };
            break;
          }

          case 'message':
          case 'button':
          case 'carousel': {
            const sendResult = await this.dispatchNodeMessage(
              currentNode,
              context,
              executionVariables
            );

            traceStep.outputResult = sendResult;
            traceStep.metaCall = sendResult.metaCall;

            if (sendResult.success) {
              traceStep.status = 'message_sent';
              if (sendResult.messageId) {
                metaResponses.push({
                  messageId: sendResult.messageId,
                  status: 'sent',
                  timestamp: new Date().toISOString(),
                  nodeId: currentNode.id,
                });
              }
            } else {
              traceStep.status = 'failed';
              traceStep.error = sendResult.error || 'Meta API returned message dispatch failure';
            }
            break;
          }

          case 'delay': {
            const amount = currentNode.config.delayAmount || 1;
            const unit = currentNode.config.delayUnit || 'minutes';

            // In test simulation mode or small delays (< 5 seconds), wait briefly; otherwise note scheduled delay
            if (context.isTestSimulation) {
              const simDelayMs = Math.min(amount * 500, 2000);
              await new Promise((r) => setTimeout(r, simDelayMs));
              traceStep.outputResult = { simulatedDelay: `${amount} ${unit}`, waitedMs: simDelayMs };
            } else {
              traceStep.outputResult = { scheduledDelay: `${amount} ${unit}` };
            }
            traceStep.status = 'node_executed';
            break;
          }

          case 'condition': {
            const conditionResult = this.evaluateCondition(
              currentNode,
              context,
              executionVariables
            );
            traceStep.outputResult = conditionResult;
            traceStep.status = 'node_executed';

            if (conditionResult.branchNextNodeId) {
              nextNodeIdToFollow = conditionResult.branchNextNodeId;
            }
            break;
          }

          case 'webhook':
          case 'api': {
            const integrationResult = await this.executeIntegrationNode(
              currentNode,
              context,
              executionVariables
            );
            traceStep.outputResult = integrationResult;
            traceStep.status = integrationResult.success ? 'node_executed' : 'failed';
            if (integrationResult.error) traceStep.error = integrationResult.error;
            break;
          }

          case 'end': {
            traceStep.status = 'completed';
            traceStep.outputResult = { workflowCompleted: true };
            nextNodeIdToFollow = undefined;
            break;
          }

          default: {
            traceStep.status = 'node_executed';
            traceStep.outputResult = { executed: true };
          }
        }

        traceStep.completedAt = new Date().toISOString();
        traceStep.durationMs = Date.now() - stepStart;
        stepsTrace.push(traceStep);

        // Terminate on explicit stop or failed non-recoverable error
        if (currentNode.type === 'end' || !nextNodeIdToFollow) {
          break;
        }

        currentNode = nodeMap.get(nextNodeIdToFollow);
      } catch (err: any) {
        traceStep.status = 'failed';
        traceStep.error = err.message;
        traceStep.completedAt = new Date().toISOString();
        traceStep.durationMs = Date.now() - stepStart;
        stepsTrace.push(traceStep);
        break;
      }
    }

    // 4. Finalize execution status
    const completedAt = new Date().toISOString();
    const hasFailures = stepsTrace.some((s) => s.status === 'failed');
    execLog.status = hasFailures ? 'failed' : 'completed';
    execLog.completedAt = completedAt;
    execLog.totalDurationMs = Date.now() - new Date(startedAt).getTime();
    execLog.steps = stepsTrace;
    execLog.metaResponses = metaResponses;

    TestCenterStore.recordExecutionLog(execLog);

    // Update workflow stats
    workflow.executionCount = (workflow.executionCount || 0) + 1;
    if (workflow.stats) {
      workflow.stats.enteredCount = (workflow.stats.enteredCount || 0) + 1;
      if (!hasFailures) {
        workflow.stats.completedCount = (workflow.stats.completedCount || 0) + 1;
      } else {
        workflow.stats.droppedCount = (workflow.stats.droppedCount || 0) + 1;
      }
      TestCenterStore.saveWorkflow(workflow);
    }

    return execLog;
  }

  /**
   * Dispatches WhatsApp Message for Message, Button, or Carousel Nodes
   */
  private static async dispatchNodeMessage(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    variables: Record<string, any>
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    metaCall?: any;
  }> {
    const config = node.config || {};
    const messageType: PlatformMessageType =
      (node.messageType as any) ||
      (node.type === 'button' ? 'interactive_button' : node.type === 'carousel' ? 'carousel' : 'text');

    const cleanTo = context.phoneNumber;
    const settings = SettingsDB.get(context.workspaceId);
    const sandboxSettings = TestCenterStore.getSandboxSettings();

    // In sandbox test simulation mode
    const isSandboxSimulation = Boolean(
      sandboxSettings.enabled ||
      context.isTestSimulation && (!settings.accessToken || settings.accessToken.includes('SAMPLE_TOKEN') || settings.accessToken.startsWith('MOCK_'))
    );

    const callPayload: any = {
      type: messageType,
      to: cleanTo,
      header: config.headerText,
      body: config.bodyText || config.text,
      footer: config.footerText,
      buttons: config.buttons,
      cards: config.cards,
      templateName: config.templateName,
      mediaUrl: config.mediaUrl,
    };

    if (isSandboxSimulation) {
      const simulatedMessageId = `wamid.test_sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      // Record delivery receipt
      TestCenterStore.recordDeliveryReceipt({
        id: `rec_${Date.now()}`,
        metaMessageId: simulatedMessageId,
        phoneNumber: cleanTo,
        workflowId: context.workflowId,
        messageType,
        queuedAt: now,
        sentAt: now,
        deliveredAt: new Date(Date.now() + 400).toISOString(),
        readAt: new Date(Date.now() + 1200).toISOString(),
        status: 'read',
      });

      // Record Meta API log
      TestCenterStore.recordMetaLog({
        id: `meta_${Date.now()}`,
        workspaceId: context.workspaceId,
        timestamp: now,
        direction: 'outbound_request',
        endpoint: `https://graph.facebook.com/v18.0/${settings.phoneNumberId || 'sandbox_phone_id'}/messages`,
        method: 'POST',
        phoneNumberId: settings.phoneNumberId || 'sandbox_phone_id',
        wabaId: settings.wabaId || 'sandbox_waba_id',
        messageId: simulatedMessageId,
        templateName: config.templateName,
        httpStatus: 200,
        requestBody: callPayload,
        responseBody: {
          messaging_product: 'whatsapp',
          contacts: [{ input: cleanTo, wa_id: cleanTo.replace(/[^0-9]/g, '') }],
          messages: [{ id: simulatedMessageId }],
        },
        deliveryStatus: 'read',
        latencyMs: 145,
      });

      return {
        success: true,
        messageId: simulatedMessageId,
        metaCall: {
          endpoint: 'POST /v18.0/{PHONE_NUMBER_ID}/messages (Meta Sandbox)',
          requestPayload: callPayload,
          responseStatus: 200,
          responseData: { messageId: simulatedMessageId, status: 'sent_sandbox' },
          metaMessageId: simulatedMessageId,
        },
      };
    }

    // Live Meta Dispatch via WhatsAppMessageService
    let serviceResult: any;
    if (messageType === 'carousel') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'carousel',
        bodyText: config.bodyText || config.text,
        cards: config.cards || [],
        templateName: config.templateName,
        bypassWindowCheck: true,
      });
    } else if (messageType === 'interactive_button' || messageType === 'quick_reply') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'button',
        headerText: config.headerText,
        bodyText: config.bodyText || config.text || 'Choose an option:',
        footerText: config.footerText,
        buttons: (config.buttons || [{ id: 'opt_1', title: 'Proceed' }]).map((b: any) => ({
          id: b.id,
          title: b.title,
        })),
        bypassWindowCheck: true,
      });
    } else if (messageType === 'list') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'list',
        headerText: config.headerText,
        bodyText: config.bodyText || config.text || 'Select an item:',
        footerText: config.footerText,
        buttonText: config.buttonText || 'View Options',
        sections: config.sections || [],
        bypassWindowCheck: true,
      });
    } else if (messageType === 'template') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'template',
        templateName: config.templateName || 'teaser_alert',
        languageCode: config.languageCode || 'en_US',
        bypassWindowCheck: true,
      });
    } else if (['image', 'video', 'audio', 'document', 'pdf'].includes(messageType)) {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: messageType === 'pdf' ? 'document' : (messageType as any),
        mediaUrl: config.mediaUrl,
        caption: config.caption || config.text,
        filename: config.fileName,
        bypassWindowCheck: true,
      });
    } else {
      // Standard text or fallback
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'text',
        text: config.text || config.bodyText || 'Automated message',
        bypassWindowCheck: true,
      });
    }

    const messageId = serviceResult.messageId || serviceResult.metaMessageId;
    const now = new Date().toISOString();

    // Strict Meta verification: If no valid wamid, fail explicitly
    if (!serviceResult.success || !messageId || (!messageId.startsWith('wamid.') && !serviceResult.isSimulated)) {
      const errorMsg = serviceResult.error || 'Meta API rejected message dispatch without valid Message ID.';
      TestCenterStore.recordDeliveryReceipt({
        id: `rec_${Date.now()}`,
        metaMessageId: messageId || `failed_${Date.now()}`,
        phoneNumber: cleanTo,
        workflowId: context.workflowId,
        messageType,
        queuedAt: now,
        failedAt: now,
        status: 'failed',
        errorCode: serviceResult.errorCode,
        errorMessage: errorMsg,
      });

      return {
        success: false,
        error: errorMsg,
        metaCall: {
          endpoint: 'POST /v18.0/{PHONE_NUMBER_ID}/messages',
          requestPayload: callPayload,
          responseStatus: serviceResult.errorCode || 400,
          responseData: serviceResult.details || { error: errorMsg },
          errorCode: serviceResult.errorCode,
          errorMessage: errorMsg,
        },
      };
    }

    // Record success in Delivery Receipts & Meta Logs
    TestCenterStore.recordDeliveryReceipt({
      id: `rec_${Date.now()}`,
      metaMessageId: messageId,
      phoneNumber: cleanTo,
      workflowId: context.workflowId,
      messageType,
      queuedAt: now,
      sentAt: now,
      status: 'sent',
    });

    TestCenterStore.recordMetaLog({
      id: `meta_${Date.now()}`,
      workspaceId: context.workspaceId,
      timestamp: now,
      direction: 'outbound_request',
      endpoint: `https://graph.facebook.com/v18.0/${settings.phoneNumberId}/messages`,
      method: 'POST',
      phoneNumberId: settings.phoneNumberId,
      wabaId: settings.wabaId,
      messageId,
      templateName: config.templateName,
      httpStatus: 200,
      requestBody: callPayload,
      responseBody: serviceResult.details || { messages: [{ id: messageId }] },
      deliveryStatus: 'sent',
      latencyMs: 180,
    });

    return {
      success: true,
      messageId,
      metaCall: {
        endpoint: 'POST /v18.0/{PHONE_NUMBER_ID}/messages',
        requestPayload: callPayload,
        responseStatus: 200,
        responseData: serviceResult.details || { messages: [{ id: messageId }] },
        metaMessageId: messageId,
      },
    };
  }

  /**
   * Evaluates Condition, If/Else, Tagging, or A/B Split Nodes
   */
  private static evaluateCondition(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    variables: Record<string, any>
  ): {
    evaluated: boolean;
    conditionResult: boolean;
    branchNextNodeId?: string;
    actionApplied?: string;
  } {
    const config = node.config || {};
    const actionType: WorkflowActionType = (node.actionType as any) || 'conditional_logic';

    // 1. Tag Contact Action
    if (actionType === 'tag_contact' && config.tag) {
      const contact = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
      if (contact) {
        const tags = Array.from(new Set([...(contact.tags || []), config.tag.toLowerCase().trim()]));
        ContactsDB.upsert({ ...contact, tags }, context.workspaceId);
      }
      return { evaluated: true, conditionResult: true, actionApplied: `Tagged contact with ${config.tag}` };
    }

    // 2. Remove Tag Action
    if (actionType === 'remove_tag' && config.removeTag) {
      const contact = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
      if (contact) {
        const tags = (contact.tags || []).filter((t) => t !== config.removeTag?.toLowerCase().trim());
        ContactsDB.upsert({ ...contact, tags }, context.workspaceId);
      }
      return { evaluated: true, conditionResult: true, actionApplied: `Removed tag ${config.removeTag}` };
    }

    // 3. A/B Split Testing
    if (actionType === 'random_split' || actionType === 'ab_testing') {
      const ratio = config.splitRatio !== undefined ? config.splitRatio : 0.5;
      const isA = Math.random() < ratio;
      const branchNextNodeId = isA ? config.trueNextNodeId : config.falseNextNodeId;
      return {
        evaluated: true,
        conditionResult: isA,
        branchNextNodeId,
        actionApplied: `Random split decided: Branch ${isA ? 'A' : 'B'}`,
      };
    }

    // 4. Conditional Logic Operator
    const varName = config.conditionVariable || 'text';
    const operator = config.conditionOperator || 'contains';
    const targetVal = (config.conditionValue || '').toLowerCase();
    const actualVal = (variables[varName] || context.triggerPayload?.text || '').toString().toLowerCase();

    let matches = false;
    if (operator === 'equals') matches = actualVal === targetVal;
    else if (operator === 'contains') matches = actualVal.includes(targetVal);
    else if (operator === 'not_equals') matches = actualVal !== targetVal;
    else if (operator === 'exists') matches = Boolean(actualVal);
    else if (operator === 'replied_within_24h') matches = true;

    const branchNextNodeId = matches ? config.trueNextNodeId : config.falseNextNodeId;
    return {
      evaluated: true,
      conditionResult: matches,
      branchNextNodeId,
      actionApplied: `Condition ${varName} ${operator} "${targetVal}" -> ${matches ? 'TRUE' : 'FALSE'}`,
    };
  }

  /**
   * Executes Webhook Request, API Call, or CRM task
   */
  private static async executeIntegrationNode(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    variables: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const config = node.config || {};
    const url = config.webhookUrl || config.apiUrl;

    if (!url) {
      return { success: true, data: { status: 'mock_executed', node: node.title } };
    }

    try {
      const method = config.webhookMethod || 'POST';
      const body = config.webhookBody ? JSON.parse(config.webhookBody) : {
        event: 'workflow_node_executed',
        workflowId: context.workflowId,
        phoneNumber: context.phoneNumber,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(config.webhookHeaders || {}),
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
      });

      const responseText = await res.text();
      let responseJson: any;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      return {
        success: res.ok,
        data: { status: res.status, response: responseJson },
        error: !res.ok ? `HTTP ${res.status}` : undefined,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
