import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionLog,
  WorkflowSessionState,
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
    const startNode = wf.nodes?.[0];
    const rawKeywords = (
      startNode?.config?.text ||
      startNode?.config?.keyword ||
      startNode?.config?.keywords ||
      startNode?.triggerKeyword ||
      wf.triggerKeyword ||
      ''
    ).toString().trim();

    // Specific trigger type matches
    switch (triggerType) {
      case 'incoming_message':
      case 'first_message':
      case 'customer_reply':
      case 'broadcast_reply': {
        if (wf.triggerType === 'incoming_message' || startNode?.type === 'trigger_incoming') {
          if (!rawKeywords) return true;
          const keywords = rawKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
          return keywords.some((k: string) => text.toLowerCase().includes(k) || new RegExp(`\\b${k}\\b`, 'i').test(text));
        }
        // If workflow triggerType is keyword, check if the incoming text matches the keyword
        if (wf.triggerType === 'keyword' || startNode?.type === 'trigger_keyword' || startNode?.type === 'trigger') {
          if (!rawKeywords) return false;
          const keywords = rawKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
          return keywords.some((k: string) => text.toLowerCase().includes(k) || new RegExp(`\\b${k}\\b`, 'i').test(text));
        }
        return false;
      }

      case 'keyword':
      case 'contains_text': {
        if (!rawKeywords) return false;
        const keywords = rawKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
        return keywords.some((k: string) => text.toLowerCase().includes(k) || new RegExp(`\\b${k}\\b`, 'i').test(text));
      }

      case 'exact_match': {
        if (!rawKeywords) return false;
        const keywords = rawKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
        return keywords.some((k: string) => text.toLowerCase() === k);
      }

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
        if (payload?.tag && startNode?.config?.tag) {
          return payload.tag.toLowerCase() === startNode.config.tag.toLowerCase();
        }
        return wf.triggerType === 'contact_tag';

      case 'button_click':
        if (wf.triggerType === 'button_click') {
          if (!payload?.buttonId) return true;
          return startNode?.config?.buttons?.some((b: any) => b.id === payload.buttonId) ?? true;
        }
        return false;

      case 'carousel_click':
        return wf.triggerType === 'carousel_click';

      case 'qr_scan':
        return wf.triggerType === 'qr_scan';

      default:
        return wf.triggerType === triggerType;
    }
  }

  /**
   * Deep trigger node validation with precise condition evaluation
   */
  static evaluateTriggerNode(
    currentNode: WorkflowNode,
    workflow: WorkflowDefinition,
    context: WorkflowExecutionContext
  ): { matched: boolean; reason?: string; incomingText: string; expectedKeywords: string } {
    const incomingText = (
      context.triggerPayload?.text ||
      context.triggerPayload?.body ||
      context.triggerPayload?.triggerKeyword ||
      ''
    ).toString().trim();

    const expectedKeywords = (
      currentNode.config?.text ||
      currentNode.config?.keyword ||
      currentNode.config?.keywords ||
      currentNode.triggerKeyword ||
      workflow.triggerKeyword ||
      ''
    ).toString().trim();

    // 1. Any incoming message trigger
    if (currentNode.type === 'trigger_incoming' || workflow.triggerType === 'incoming_message') {
      if (!expectedKeywords) {
        return { matched: Boolean(incomingText || context.triggerPayload), incomingText, expectedKeywords: '(any message)' };
      }
      const keywords = expectedKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      const isMatch = keywords.some((k: string) => incomingText.toLowerCase().includes(k) || new RegExp(`\\b${k}\\b`, 'i').test(incomingText));
      return {
        matched: isMatch,
        reason: isMatch ? undefined : `Incoming message "${incomingText}" does not match required keyword(s): "${expectedKeywords}"`,
        incomingText,
        expectedKeywords,
      };
    }

    // 2. Keyword trigger / Contains text / Exact match
    if (
      currentNode.type === 'trigger_keyword' ||
      currentNode.type === 'trigger' ||
      workflow.triggerType === 'keyword' ||
      workflow.triggerType === 'contains_text' ||
      workflow.triggerType === 'exact_match'
    ) {
      if (!expectedKeywords) {
        return {
          matched: Boolean(incomingText),
          reason: incomingText ? undefined : 'No incoming text provided for keyword trigger',
          incomingText,
          expectedKeywords: '(any keyword)',
        };
      }

      if (!incomingText) {
        return {
          matched: false,
          reason: `No incoming text received to match keyword(s): "${expectedKeywords}"`,
          incomingText,
          expectedKeywords,
        };
      }

      const keywords = expectedKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      const isExact = workflow.triggerMatchPattern === 'exact' || workflow.triggerType === 'exact_match';

      const isMatch = keywords.some((k: string) => {
        if (isExact) return incomingText.toLowerCase() === k;
        return incomingText.toLowerCase().includes(k) || new RegExp(`\\b${k}\\b`, 'i').test(incomingText);
      });

      return {
        matched: isMatch,
        reason: isMatch ? undefined : `Incoming message "${incomingText}" does not match required keyword(s): "${expectedKeywords}"`,
        incomingText,
        expectedKeywords,
      };
    }

    // 3. Button Click Trigger
    if (currentNode.type === 'trigger_button' || workflow.triggerType === 'button_click') {
      const buttonId = context.triggerPayload?.buttonId || context.triggerPayload?.id || incomingText;
      const expectedButtons = currentNode.config?.buttons || [];
      const isMatch = expectedButtons.length === 0 || expectedButtons.some((b: any) => b.id === buttonId || b.title?.toLowerCase() === buttonId.toLowerCase());
      return {
        matched: isMatch,
        reason: isMatch ? undefined : `Button click "${buttonId}" does not match trigger configuration`,
        incomingText,
        expectedKeywords: expectedButtons.map((b: any) => b.id).join(', '),
      };
    }

    // 4. Manual / Webhook / API trigger
    if (['manual_trigger', 'api_trigger', 'webhook_trigger'].includes(context.triggerType)) {
      // If manual trigger explicitly provided a text payload and node has keyword configured, validate it
      if (expectedKeywords && incomingText) {
        const keywords = expectedKeywords.split(/,|\//).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
        const isMatch = keywords.some((k: string) => incomingText.toLowerCase().includes(k) || new RegExp(`\\b${k}\\b`, 'i').test(incomingText));
        return {
          matched: isMatch,
          reason: isMatch ? undefined : `Test payload text "${incomingText}" does not match required keyword(s): "${expectedKeywords}"`,
          incomingText,
          expectedKeywords,
        };
      }
      return { matched: true, incomingText, expectedKeywords };
    }

    return { matched: true, incomingText, expectedKeywords };
  }

  /**
   * Resolves the next branch/node to follow based on button click, carousel interaction, or customer reply
   * Returns full branch resolution telemetry (target node, sourceHandle, matched edge)
   */
  static resolveNextBranchDetailed(
    workflow: WorkflowDefinition,
    currentNode: WorkflowNode,
    event: {
      action: 'button_click' | 'carousel_click' | 'reply' | 'delay_expired';
      buttonId?: string;
      buttonTitle?: string;
      cardIndex?: number;
      cardButtonId?: string;
      text?: string;
    }
  ): { nextNodeId?: string; sourceHandle?: string; matchedEdge?: any } {
    const edges = workflow.edges || [];
    const nodeEdges = edges.filter((e) => e.source === currentNode.id);

    if (nodeEdges.length === 0) {
      return { nextNodeId: currentNode.nextNodeId };
    }

    if (event.action === 'button_click') {
      const buttonId = (event.buttonId || '').trim();
      const buttonTitle = (event.buttonTitle || '').trim().toLowerCase();

      // Find index of clicked button in node config
      const buttons = currentNode.config?.buttons || [];
      const btnIndex = buttons.findIndex(
        (b: any) =>
          (buttonId && b.id && b.id.toLowerCase() === buttonId.toLowerCase()) ||
          (buttonTitle && b.title && b.title.trim().toLowerCase() === buttonTitle) ||
          (buttonId && b.title && b.title.trim().toLowerCase() === buttonId.toLowerCase())
      );
      const matchedBtn = btnIndex !== -1 ? buttons[btnIndex] : null;

      // 1. Direct edge match by buttonId (e.g., sourceHandle === 'btn_catalog')
      if (buttonId) {
        const edgeById = nodeEdges.find(
          (e) =>
            e.sourceHandle === buttonId ||
            (e.sourceHandle && e.sourceHandle.toLowerCase() === buttonId.toLowerCase()) ||
            (e.label && e.label.toLowerCase() === buttonId.toLowerCase())
        );
        if (edgeById) return { nextNodeId: edgeById.target, sourceHandle: edgeById.sourceHandle || undefined, matchedEdge: edgeById };
      }

      // 1a. List Row Match if current node is a list
      if (currentNode.type === 'list' || currentNode.type === 'whatsapp_list') {
        const sections = currentNode.config?.sections || [];
        for (const sec of sections) {
          const matchedRow = (sec.rows || []).find(
            (r: any) =>
              (buttonId && r.id && r.id.toLowerCase() === buttonId.toLowerCase()) ||
              (buttonTitle && r.title && r.title.toLowerCase() === buttonTitle.toLowerCase())
          );
          if (matchedRow) {
            const edgeByRow = nodeEdges.find(
              (e) =>
                e.sourceHandle === matchedRow.id ||
                (e.sourceHandle && e.sourceHandle.toLowerCase() === matchedRow.id.toLowerCase()) ||
                (e.label && e.label.toLowerCase() === (matchedRow.title || '').toLowerCase())
            );
            if (edgeByRow) return { nextNodeId: edgeByRow.target, sourceHandle: edgeByRow.sourceHandle || undefined, matchedEdge: edgeByRow };
          }
        }
      }

      // 1b. Match by matchedBtn.id if different from buttonId
      if (matchedBtn?.id && matchedBtn.id.toLowerCase() !== buttonId.toLowerCase()) {
        const edgeByMatchedId = nodeEdges.find(
          (e) =>
            e.sourceHandle === matchedBtn.id ||
            (e.sourceHandle && e.sourceHandle.toLowerCase() === matchedBtn.id.toLowerCase()) ||
            (e.label && e.label.toLowerCase() === matchedBtn.id.toLowerCase())
        );
        if (edgeByMatchedId) return { nextNodeId: edgeByMatchedId.target, sourceHandle: edgeByMatchedId.sourceHandle || undefined, matchedEdge: edgeByMatchedId };
      }

      // 2. Direct edge match by btnIndex (e.g., sourceHandle === 'btn-0' or 'btn_0' or '0')
      if (btnIndex !== -1) {
        const edgeByIndex = nodeEdges.find(
          (e) =>
            e.sourceHandle === `btn-${btnIndex}` ||
            e.sourceHandle === `btn_${btnIndex}` ||
            e.sourceHandle === `${btnIndex}`
        );
        if (edgeByIndex) return { nextNodeId: edgeByIndex.target, sourceHandle: edgeByIndex.sourceHandle || undefined, matchedEdge: edgeByIndex };
      }

      // 3. Direct edge match by button title (e.g., label or sourceHandle === 'Browse Catalog')
      const targetTitle = buttonTitle || (matchedBtn?.title || '').trim().toLowerCase();
      if (targetTitle) {
        const edgeByTitle = nodeEdges.find(
          (e) =>
            (e.label && e.label.toLowerCase() === targetTitle) ||
            (e.sourceHandle && e.sourceHandle.toLowerCase() === targetTitle) ||
            (e.label && (e.label.toLowerCase().includes(targetTitle) || targetTitle.includes(e.label.toLowerCase())))
        );
        if (edgeByTitle) return { nextNodeId: edgeByTitle.target, sourceHandle: edgeByTitle.sourceHandle || undefined, matchedEdge: edgeByTitle };
      }

      // 4. Node config direct routing (e.g., button.nextNodeId or config.buttonRoutes)
      if ((matchedBtn as any)?.nextNodeId) return { nextNodeId: (matchedBtn as any).nextNodeId, sourceHandle: buttonId };
      if ((currentNode.config as any)?.buttonRoutes?.[buttonId]) return { nextNodeId: (currentNode.config as any).buttonRoutes[buttonId], sourceHandle: buttonId };
      if ((currentNode.config as any)?.branches?.[buttonId]) return { nextNodeId: (currentNode.config as any).branches[buttonId], sourceHandle: buttonId };

      // 5. If only 1 edge exists leaving this button node, follow it
      if (nodeEdges.length === 1) {
        return { nextNodeId: nodeEdges[0].target, sourceHandle: nodeEdges[0].sourceHandle || undefined, matchedEdge: nodeEdges[0] };
      }

      // 6. Fallback: match nth edge to nth button if counts match
      if (btnIndex >= 0 && btnIndex < nodeEdges.length) {
        return { nextNodeId: nodeEdges[btnIndex].target, sourceHandle: nodeEdges[btnIndex].sourceHandle || undefined, matchedEdge: nodeEdges[btnIndex] };
      }
    }

    if (event.action === 'carousel_click') {
      const cardBtnId = (event.cardButtonId || '').trim();
      const cardIndex = event.cardIndex !== undefined ? event.cardIndex : 0;

      if (cardBtnId) {
        const edgeByCardBtn = nodeEdges.find(
          (e) =>
            e.sourceHandle === cardBtnId ||
            (e.sourceHandle && e.sourceHandle.toLowerCase() === cardBtnId.toLowerCase()) ||
            (e.label && e.label.toLowerCase() === cardBtnId.toLowerCase())
        );
        if (edgeByCardBtn) return { nextNodeId: edgeByCardBtn.target, sourceHandle: edgeByCardBtn.sourceHandle || undefined, matchedEdge: edgeByCardBtn };
      }

      const edgeByCardIndex = nodeEdges.find(
        (e) =>
          e.sourceHandle === `card-${cardIndex}` ||
          e.sourceHandle === `card_${cardIndex}` ||
          e.sourceHandle === `${cardIndex}`
      );
      if (edgeByCardIndex) return { nextNodeId: edgeByCardIndex.target, sourceHandle: edgeByCardIndex.sourceHandle || undefined, matchedEdge: edgeByCardIndex };

      if (nodeEdges.length === 1) return { nextNodeId: nodeEdges[0].target, sourceHandle: nodeEdges[0].sourceHandle || undefined, matchedEdge: nodeEdges[0] };
      return { nextNodeId: currentNode.nextNodeId };
    }

    if (event.action === 'reply') {
      const repliedEdge = nodeEdges.find((e) => e.sourceHandle === 'replied') || nodeEdges[0];
      if (repliedEdge) return { nextNodeId: repliedEdge.target, sourceHandle: repliedEdge.sourceHandle || undefined, matchedEdge: repliedEdge };
      return { nextNodeId: currentNode.nextNodeId };
    }

    // Default edge or nextNodeId
    if (nodeEdges.length > 0) return { nextNodeId: nodeEdges[0].target, sourceHandle: nodeEdges[0].sourceHandle || undefined, matchedEdge: nodeEdges[0] };
    return { nextNodeId: currentNode.nextNodeId };
  }

  static resolveNextBranch(
    workflow: WorkflowDefinition,
    currentNode: WorkflowNode,
    event: {
      action: 'button_click' | 'carousel_click' | 'reply' | 'delay_expired';
      buttonId?: string;
      buttonTitle?: string;
      cardIndex?: number;
      cardButtonId?: string;
      text?: string;
    }
  ): string | undefined {
    return this.resolveNextBranchDetailed(workflow, currentNode, event).nextNodeId;
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

    console.log(`[WorkflowEngine] 🚀 WORKFLOW STARTED: "${workflow.name}" (${workflow.id}) for recipient ${context.phoneNumber} via trigger ${context.triggerType}`);

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

    const startNode = workflow.nodes[0];
    if (!startNode) {
      execLog.status = 'completed';
      execLog.completedAt = new Date().toISOString();
      TestCenterStore.recordExecutionLog(execLog);
      return execLog;
    }

    return this.runNodeTraversal(
      workflow,
      startNode,
      context,
      execLog,
      stepsTrace,
      metaResponses,
      executionVariables,
      contact
    );
  }

  /**
   * Resumes a paused/waiting workflow execution after customer button click, selection, or reply
   */
  static async resumeWorkflowExecution(
    session: WorkflowSessionState,
    event: {
      action: 'button_click' | 'carousel_click' | 'reply' | 'delay_expired';
      buttonId?: string;
      buttonTitle?: string;
      cardIndex?: number;
      cardButtonId?: string;
      text?: string;
      metadata?: any;
    },
    isTestSimulation = false
  ): Promise<WorkflowExecutionLog | null> {
    console.log(`[BUTTON PAYLOAD] Button action received for session ${session.id}:\n` +
      `  - buttonId: "${event.buttonId || 'none'}"\n` +
      `  - buttonTitle: "${event.buttonTitle || 'none'}"\n` +
      `  - action: "${event.action}"\n` +
      `  - fromPhone: "${session.phoneNumber}"`);

    const workflow = TestCenterStore.getWorkflow(session.workflowId);
    if (!workflow) {
      const err = `[WORKFLOW NOT FOUND] Workflow "${session.workflowId}" not found for session "${session.id}"`;
      console.error(err);
      return null;
    }
    console.log(`[WORKFLOW FOUND] Workflow ID: "${workflow.id}", Name: "${workflow.name}"`);

    const pausedNode = workflow.nodes.find((n) => n.id === session.currentNodeId);
    if (!pausedNode) {
      const err = `[NODE NOT FOUND] Paused node "${session.currentNodeId}" not found in workflow "${workflow.id}"`;
      console.error(err);
      return null;
    }
    console.log(`[NODE FOUND] Current Paused Node: "${pausedNode.title}" (${pausedNode.id}), Type: "${pausedNode.type}"`);

    const resolution = this.resolveNextBranchDetailed(workflow, pausedNode, event);
    const nextNodeId = resolution.nextNodeId;

    if (!nextNodeId) {
      console.error(`[BRANCH NOT FOUND] No matching branch found from node "${pausedNode.title}" (${pausedNode.id}) for action: ${event.action} (Button ID: "${event.buttonId}", Title: "${event.buttonTitle}")`);
      return null;
    }

    console.log(`[BRANCH FOUND] Matched branch from node "${pausedNode.title}" (${pausedNode.id}) ➔ Next Node ID: "${nextNodeId}" (Button ID: "${event.buttonId}", Title: "${event.buttonTitle}")`);
    console.log(`[NEXT NODE] Next Node ID: "${nextNodeId}"`);
    console.log(`[WORKFLOW RESUMED] Workflow "${workflow.name}" (${workflow.id}) resumed from node "${pausedNode.title}" (${pausedNode.id}) ➔ Advancing to node "${nextNodeId}"`);

    // Clear the waiting session since it has been fulfilled
    TestCenterStore.clearSession(session.phoneNumber, session.workspaceId);
    console.log(`[SESSION CLEARED] Cleared session for ${session.phoneNumber}`);

    // Fetch existing execution log or fallback
    let execLog = TestCenterStore.getExecutionLog(session.executionId);
    if (!execLog) {
      execLog = {
        id: session.executionId,
        executionId: session.executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        workspaceId: session.workspaceId,
        phoneNumber: session.phoneNumber,
        contactId: session.contactId,
        triggerType: 'button_click',
        triggerValue: event.buttonId || event.buttonTitle || event.action,
        status: 'running',
        startedAt: session.pausedAt || new Date().toISOString(),
        resumedAt: new Date().toISOString(),
        totalDurationMs: 0,
        steps: [],
        metaResponses: [],
      };
    } else {
      execLog.status = 'running';
      execLog.resumedAt = new Date().toISOString();
      execLog.waitingFor = undefined;
      execLog.waitingOptions = undefined;
    }

    const stepsTrace = execLog.steps || [];
    const metaResponses = execLog.metaResponses || [];
    const executionVariables: Record<string, any> = {
      phoneNumber: session.phoneNumber,
      ...(session.variables || {}),
    };
    if (event.text) executionVariables.text = event.text;
    if (event.buttonId) executionVariables.buttonId = event.buttonId;
    if (event.buttonTitle) executionVariables.buttonTitle = event.buttonTitle;

    // Record resume step in trace
    stepsTrace.push({
      nodeId: pausedNode.id,
      nodeType: pausedNode.type,
      nodeTitle: `${pausedNode.title} ➔ Clicked: "${event.buttonTitle || event.buttonId || event.action}"`,
      status: 'workflow_resumed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0,
      outputResult: {
        event: event.action,
        buttonId: event.buttonId,
        buttonTitle: event.buttonTitle,
        cardIndex: event.cardIndex,
        cardButtonId: event.cardButtonId,
        text: event.text,
        resumedToNodeId: nextNodeId,
      },
    });

    const contact = ContactsDB.getByPhone(session.phoneNumber, session.workspaceId);
    const nextNode = workflow.nodes.find((n) => n.id === nextNodeId);

    if (!nextNode) {
      execLog.status = 'completed';
      execLog.completedAt = new Date().toISOString();
      TestCenterStore.recordExecutionLog(execLog);
      return execLog;
    }

    const context: WorkflowExecutionContext = {
      workflowId: workflow.id,
      workspaceId: session.workspaceId,
      phoneNumber: session.phoneNumber,
      contactId: session.contactId,
      triggerType: 'button_click',
      triggerPayload: event,
      isTestSimulation,
      variables: executionVariables,
    };

    return this.runNodeTraversal(
      workflow,
      nextNode,
      context,
      execLog,
      stepsTrace,
      metaResponses,
      executionVariables,
      contact
    );
  }

  /**
   * Internal Core Node Graph Traversal Runner
   */
  private static async runNodeTraversal(
    workflow: WorkflowDefinition,
    startNode: WorkflowNode,
    context: WorkflowExecutionContext,
    execLog: WorkflowExecutionLog,
    stepsTrace: ExecutionTraceStep[],
    metaResponses: any[],
    executionVariables: Record<string, any>,
    contact: any
  ): Promise<WorkflowExecutionLog> {
    const nodeMap = new Map<string, WorkflowNode>();
    for (const n of workflow.nodes) {
      nodeMap.set(n.id, n);
    }

    let currentNode: WorkflowNode | undefined = startNode;
    let stepCount = 0;
    const maxSteps = 50; // loop protection

    while (currentNode && stepCount < maxSteps) {
      stepCount++;
      const stepStart = Date.now();
      console.log(`[NEXT NODE] Next node executed:\n` +
        `  - nodeId: "${currentNode.id}"\n` +
        `  - title: "${currentNode.title}"\n` +
        `  - type: "${currentNode.type}"`);
      console.log(`[STEP 6: NEXT NODE EXECUTED] Starting execution of next node:\n` +
        `  - node type: "${currentNode.type}"\n` +
        `  - node id: "${currentNode.id}"\n` +
        `  - node title: "${currentNode.title}"`);
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
        let branchHandleToFollow: string | undefined = undefined;

        // Process Node Type
        switch (currentNode.type) {
          case 'trigger':
          case 'trigger_incoming':
          case 'trigger_keyword':
          case 'trigger_button':
          case 'trigger_carousel':
          case 'trigger_list':
          case 'trigger_flow': {
            // Trigger Evaluation Logging & Processing
            console.log(`[TRIGGER EVALUATION STARTED]\n` +
              `  - workflowId: "${workflow.id}"\n` +
              `  - workflowName: "${workflow.name}"\n` +
              `  - nodeId: "${currentNode.id}"\n` +
              `  - nodeTitle: "${currentNode.title}"\n` +
              `  - nodeType: "${currentNode.type}"\n` +
              `  - triggerType: "${context.triggerType}"\n` +
              `  - phoneNumber: "${context.phoneNumber}"\n` +
              `  - incomingText: "${context.triggerPayload?.text || context.triggerPayload?.body || ''}"\n` +
              `  - storedKeyword: "${currentNode.config?.text || currentNode.triggerKeyword || workflow.triggerKeyword || ''}"`);

            const evalResult = AdvancedWorkflowEngine.evaluateTriggerNode(currentNode, workflow, context);
            const incomingText = evalResult.incomingText || (context.triggerPayload?.text || '').toString().trim();
            const expectedKeywords = evalResult.expectedKeywords || (currentNode.config?.text || workflow.triggerKeyword || '');

            console.log(`[TRIGGER EVALUATION: AFTER] Result: matched=${evalResult.matched}, incomingText="${incomingText}", expectedKeywords="${expectedKeywords}"${evalResult.reason ? `, reason="${evalResult.reason}"` : ''}`);

            if (!evalResult.matched) {
              console.log(`[TRIGGER FAILED] Trigger condition failed: incoming text "${incomingText}" does not match stored keyword(s) "${expectedKeywords}" for workflow "${workflow.id}"`);
              console.log(`[WORKFLOW WAITING FOR TRIGGER] Workflow "${workflow.name}" (${workflow.id}) remains idle waiting for trigger condition.`);

              traceStep.status = 'waiting_for_trigger';
              traceStep.outputResult = {
                matched: false,
                reason: evalResult.reason || 'Trigger condition not met',
                received: incomingText,
                expected: expectedKeywords,
              };
              traceStep.completedAt = new Date().toISOString();
              traceStep.durationMs = Date.now() - stepStart;
              stepsTrace.push(traceStep);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'trigger';
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              TestCenterStore.recordExecutionLog(execLog);

              return execLog;
            }

            console.log(`[TRIGGER MATCHED] Trigger matched successfully: incoming text "${incomingText}" matches stored keyword(s) "${expectedKeywords}" for workflow "${workflow.id}"`);
            console.log(`[WORKFLOW STARTED] Workflow "${workflow.name}" (${workflow.id}) started for recipient ${context.phoneNumber}`);

            traceStep.status = 'trigger_fired';
            traceStep.outputResult = {
              matched: true,
              triggerType: context.triggerType,
              payload: context.triggerPayload,
              matchedKeyword: expectedKeywords,
            };
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [${currentNode.type}] "${currentNode.title}" (${currentNode.id})`);
            break;
          }

          case 'button':
          case 'whatsapp_button': {
            // 1. Dispatch interactive button message to WhatsApp
            const sendResult = await this.dispatchNodeMessage(
              currentNode,
              context,
              executionVariables,
              contact
            );

            traceStep.outputResult = sendResult;
            traceStep.metaCall = sendResult.metaCall;

            if (sendResult.success) {
              traceStep.status = 'message_sent';
              console.log(`[MESSAGE SENT] Message dispatched successfully:\n` +
                `  - node: "${currentNode.title}" (${currentNode.id})\n` +
                `  - type: "${currentNode.type}"\n` +
                `  - to: "${context.phoneNumber}"\n` +
                `  - messageId: "${sendResult.messageId || 'simulated'}"`);
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
              console.error(`[MESSAGE SENT FAILED] Message dispatch failed for node "${currentNode.title}" (${currentNode.id}): ${sendResult.error}`);
            }

            traceStep.completedAt = new Date().toISOString();
            traceStep.durationMs = Date.now() - stepStart;
            stepsTrace.push(traceStep);

            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [${currentNode.type}] "${currentNode.title}" (${currentNode.id}) ➔ Interactive buttons dispatched to ${context.phoneNumber}`);

            // 2. PAUSE WORKFLOW EXECUTION: Interactive buttons require user click!
            const buttons = currentNode.config?.buttons || [];
            if (buttons.length > 0) {
              const waitStep: ExecutionTraceStep = {
                nodeId: currentNode.id,
                nodeType: currentNode.type,
                nodeTitle: `Waiting for Button Click (${buttons.map((b: any) => b.title).join(', ')})`,
                status: 'waiting_user_action',
                startedAt: new Date().toISOString(),
                durationMs: 0,
                outputResult: {
                  waitingFor: 'button_click',
                  buttons: currentNode.config.buttons,
                  status: 'paused_waiting_user_action',
                },
              };
              stepsTrace.push(waitStep);

              // Persist active session
              const session: WorkflowSessionState = {
                id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                workspaceId: context.workspaceId,
                phoneNumber: context.phoneNumber,
                contactId: contact?.id,
                workflowId: workflow.id,
                executionId: execLog.executionId,
                currentNodeId: currentNode.id,
                waitingFor: 'button_click',
                waitingOptions: buttons.map((b: any, idx: number) => ({
                  id: b.id,
                  title: b.title,
                  index: idx,
                })),
                variables: executionVariables,
                pausedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              };
              TestCenterStore.saveSession(session);

              console.log(`[WorkflowEngine] ⏸ NODE PAUSED: Workflow "${workflow.name}" paused at "${currentNode.title}" (${currentNode.id})`);
              console.log(`[WorkflowEngine] ⏳ WAITING FOR USER ACTION: Waiting for button click from ${context.phoneNumber} (Options: ${buttons.map((b: any) => b.title).join(', ')})`);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'button_click';
              execLog.waitingOptions = session.waitingOptions;
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              TestCenterStore.recordExecutionLog(execLog);

              return execLog;
            }
            break;
          }

          case 'list':
          case 'whatsapp_list': {
            const sendResult = await this.dispatchNodeMessage(
              currentNode,
              context,
              executionVariables,
              contact
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
              traceStep.error = sendResult.error || 'Meta API returned list message dispatch failure';
            }

            traceStep.completedAt = new Date().toISOString();
            traceStep.durationMs = Date.now() - stepStart;
            stepsTrace.push(traceStep);

            // Pause if list has sections and rows waiting for user selection
            const sections = currentNode.config?.sections || [];
            if (sections.length > 0) {
              const waitStep: ExecutionTraceStep = {
                nodeId: currentNode.id,
                nodeType: currentNode.type,
                nodeTitle: `Waiting for List Selection`,
                status: 'waiting_user_action',
                startedAt: new Date().toISOString(),
                durationMs: 0,
                outputResult: {
                  waitingFor: 'button_click',
                  sections: currentNode.config.sections,
                  status: 'paused_waiting_user_action',
                },
              };
              stepsTrace.push(waitStep);

              const session: WorkflowSessionState = {
                id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                workspaceId: context.workspaceId,
                phoneNumber: context.phoneNumber,
                contactId: contact?.id,
                workflowId: workflow.id,
                executionId: execLog.executionId,
                currentNodeId: currentNode.id,
                waitingFor: 'button_click',
                variables: executionVariables,
                pausedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              };
              TestCenterStore.saveSession(session);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'button_click';
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              TestCenterStore.recordExecutionLog(execLog);

              return execLog;
            }
            break;
          }

          case 'wait_for_reply': {
            traceStep.status = 'waiting_user_action';
            traceStep.outputResult = {
              waitingFor: 'reply',
              timeoutMinutes: currentNode.config?.timeoutMinutes || 1440,
              status: 'paused_waiting_user_reply',
            };
            traceStep.completedAt = new Date().toISOString();
            traceStep.durationMs = Date.now() - stepStart;
            stepsTrace.push(traceStep);

            // Persist active session waiting for reply/product selection
            const session: WorkflowSessionState = {
              id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              workspaceId: context.workspaceId,
              phoneNumber: context.phoneNumber,
              contactId: contact?.id,
              workflowId: workflow.id,
              executionId: execLog.executionId,
              currentNodeId: currentNode.id,
              waitingFor: 'reply',
              variables: executionVariables,
              pausedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            };
            TestCenterStore.saveSession(session);

            console.log(`[WorkflowEngine] ⏸ NODE PAUSED: Workflow "${workflow.name}" paused at "${currentNode.title}" (${currentNode.id})`);
            console.log(`[WorkflowEngine] ⏳ WAITING FOR USER ACTION: Waiting for customer reply / product selection from ${context.phoneNumber}`);

            execLog.status = 'waiting';
            execLog.currentNodeId = currentNode.id;
            execLog.waitingFor = 'reply';
            execLog.pausedAt = new Date().toISOString();
            execLog.steps = stepsTrace;
            execLog.metaResponses = metaResponses;
            execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
            TestCenterStore.recordExecutionLog(execLog);

            return execLog;
          }

          case 'carousel':
          case 'whatsapp_carousel':
          case 'message':
          case 'whatsapp_message':
          case 'whatsapp_catalog':
          case 'whatsapp_flow': {
            const sendResult = await this.dispatchNodeMessage(
              currentNode,
              context,
              executionVariables,
              contact
            );

            traceStep.outputResult = sendResult;
            traceStep.metaCall = sendResult.metaCall;

            if (sendResult.success) {
              traceStep.status = 'message_sent';
              console.log(`[MESSAGE SENT] Message dispatched successfully:\n` +
                `  - node: "${currentNode.title}" (${currentNode.id})\n` +
                `  - type: "${currentNode.type}"\n` +
                `  - to: "${context.phoneNumber}"\n` +
                `  - messageId: "${sendResult.messageId || 'simulated'}"`);
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
              console.error(`[MESSAGE SENT FAILED] Message dispatch failed for node "${currentNode.title}" (${currentNode.id}): ${sendResult.error}`);
            }
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [${currentNode.type}] "${currentNode.title}" (${currentNode.id}) ➔ Dispatched to ${context.phoneNumber}`);
            break;
          }

          case 'delay': {
            const amount = currentNode.config.delayAmount || 1;
            const unit = currentNode.config.delayUnit || 'minutes';
            const multiplier = unit === 'seconds' ? 1000 : unit === 'minutes' ? 60000 : unit === 'hours' ? 3600000 : 86400000;
            const scheduledDelayMs = amount * multiplier;
            const scheduledFor = new Date(Date.now() + scheduledDelayMs).toISOString();

            if (context.isTestSimulation && amount <= 5 && unit === 'seconds') {
              const simDelayMs = amount * 1000;
              await new Promise((r) => setTimeout(r, simDelayMs));
              traceStep.outputResult = {
                simulatedDelay: `${amount} ${unit}`,
                scheduledFor,
                resumedAt: new Date().toISOString(),
                waitedMs: simDelayMs,
              };
              traceStep.status = 'node_executed';
              console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [delay] "${currentNode.title}" (${currentNode.id}) ➔ Waited ${amount}s simulation`);
            } else {
              // Pause execution and schedule follow-up job
              traceStep.status = 'waiting_user_action';
              traceStep.outputResult = {
                scheduledDelay: `${amount} ${unit}`,
                scheduledFor,
                queueState: 'scheduled',
              };
              traceStep.completedAt = new Date().toISOString();
              traceStep.durationMs = Date.now() - stepStart;
              stepsTrace.push(traceStep);

              const session: WorkflowSessionState = {
                id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                workspaceId: context.workspaceId,
                phoneNumber: context.phoneNumber,
                contactId: contact?.id,
                workflowId: workflow.id,
                executionId: execLog.executionId,
                currentNodeId: currentNode.id,
                waitingFor: 'delay',
                variables: executionVariables,
                pausedAt: new Date().toISOString(),
                expiresAt: scheduledFor,
              };
              TestCenterStore.saveSession(session);

              console.log(`[WorkflowEngine] ⏸ NODE PAUSED: Workflow "${workflow.name}" paused for scheduled delay until ${scheduledFor}`);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'delay';
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              TestCenterStore.recordExecutionLog(execLog);

              return execLog;
            }
            break;
          }

          case 'set_variable':
          case 'variable': {
            const conf = currentNode.config || {};
            const key = conf.variableKey || conf.key || 'custom_var';
            const rawVal = conf.variableValue || conf.value || '';
            const val = this.interpolateVariables(rawVal, executionVariables, contact);
            executionVariables[key] = val;
            traceStep.outputResult = {
              variableSet: key,
              value: val,
              currentContextVariables: { ...executionVariables },
            };
            traceStep.status = 'node_executed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [variable] Set ${key}="${val}"`);
            break;
          }

          case 'condition':
          case 'conditional_logic': {
            const conditionResult = this.evaluateCondition(
              currentNode,
              context,
              executionVariables
            );
            traceStep.outputResult = conditionResult;
            traceStep.status = 'node_executed';
            branchHandleToFollow = conditionResult.conditionResult ? 'true' : 'false';

            if (conditionResult.branchNextNodeId) {
              nextNodeIdToFollow = conditionResult.branchNextNodeId;
            }
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [condition] "${currentNode.title}" ➔ Evaluated to ${conditionResult.conditionResult}`);
            break;
          }

          case 'multi_branch': {
            const varVal = (executionVariables[currentNode.config.conditionVariable || 'text'] || context.triggerPayload?.text || '').toString().toLowerCase();
            const branches = currentNode.config.branches || [];
            const matchedBranch = branches.find((b: any) =>
              b.conditionValue && varVal.includes(b.conditionValue.toLowerCase())
            ) || branches[0];

            branchHandleToFollow = matchedBranch?.id;
            traceStep.outputResult = {
              selectedBranch: matchedBranch?.label || 'Default Branch',
              branchId: matchedBranch?.id,
            };
            traceStep.status = 'node_executed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [multi_branch] "${currentNode.title}" ➔ Selected "${matchedBranch?.label}"`);
            break;
          }

          case 'crm_action': {
            const conf = currentNode.config || {};
            console.log(`[STEP 9: CRM ACTION STARTED]\n` +
              `  - CRM action started for node: "${currentNode.title}" (${currentNode.id})\n` +
              `  - Stage: "${conf.stage}"\n` +
              `  - Notes: "${conf.notes}"\n` +
              `  - Priority: "${conf.priority || 'standard'}"\n` +
              `  - Phone: "${context.phoneNumber}"`);

            const contactRecord = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord) {
              if (conf.stage) {
                ContactsDB.upsert({ phoneNumber: contactRecord.phoneNumber, stage: conf.stage as any }, context.workspaceId);
              }
              if (conf.notes) {
                ContactsDB.addNote(contactRecord.id, {
                  authorName: 'Workflow Engine',
                  content: conf.notes,
                });
              }
            }
            traceStep.outputResult = {
              crmUpdated: true,
              stage: conf.stage,
              notesAdded: conf.notes || 'None',
            };
            traceStep.status = 'node_executed';
            console.log(`[STEP 9: CRM ACTION COMPLETED]\n` +
              `  - CRM action completed for node: "${currentNode.title}" (${currentNode.id})\n` +
              `  - Stage updated to: "${conf.stage}"\n` +
              `  - Contact: "${contactRecord ? contactRecord.id : 'synced'}"`);
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [crm_action] "${currentNode.title}" ➔ Stage: ${conf.stage || 'updated'}`);
            break;
          }

          case 'lead_management': {
            const conf = currentNode.config || {};
            const contactRecord = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord) {
              const updatedContact = {
                ...contactRecord,
                leadStatus: conf.leadStatus || 'qualified',
                metadata: {
                  ...(contactRecord.metadata || {}),
                  leadValue: conf.leadValue || 500,
                  priority: conf.priority || 'high',
                },
              };
              ContactsDB.upsert(updatedContact, context.workspaceId);
            }
            traceStep.outputResult = {
              leadStatus: conf.leadStatus || 'qualified',
              leadValue: conf.leadValue || 500,
              priority: conf.priority || 'high',
            };
            traceStep.status = 'node_executed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [lead_management] Status: ${conf.leadStatus || 'qualified'}`);
            break;
          }

          case 'tag':
          case 'tag_management': {
            const conf = currentNode.config || {};
            const contactRecord = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord && conf.tag) {
              const tagToApply = conf.tag.trim();
              let tags = contactRecord.tags || [];
              if (conf.action === 'remove') {
                tags = tags.filter((t) => t.toLowerCase() !== tagToApply.toLowerCase());
              } else {
                tags = Array.from(new Set([...tags, tagToApply]));
              }
              ContactsDB.upsert({ ...contactRecord, tags }, context.workspaceId);
            }
            traceStep.outputResult = {
              action: conf.action || 'add',
              tag: conf.tag,
            };
            traceStep.status = 'node_executed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [tag] "${currentNode.title}" ➔ Tag "${conf.tag}" applied`);
            break;
          }

          case 'google_sheets': {
            const conf = currentNode.config || {};
            traceStep.outputResult = {
              sheetName: conf.sheetName || 'WhatsApp Leads',
              operation: conf.operation || 'append_row',
              dataAppended: {
                phoneNumber: context.phoneNumber,
                timestamp: new Date().toISOString(),
                workflowId: workflow.id,
              },
              status: 'success',
            };
            traceStep.status = 'node_executed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [google_sheets] Sheet: ${conf.sheetName}`);
            break;
          }

          case 'webhook':
          case 'webhook_node':
          case 'webhook_request':
          case 'api':
          case 'api_node':
          case 'api_request': {
            const integrationResult = await this.executeIntegrationNode(
              currentNode,
              context,
              executionVariables
            );
            traceStep.outputResult = integrationResult;
            traceStep.status = integrationResult.success ? 'node_executed' : 'failed';
            if (integrationResult.error) traceStep.error = integrationResult.error;
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [api/webhook] Result: ${integrationResult.success ? 'OK' : 'Error'}`);
            break;
          }

          case 'assign_agent': {
            const conf = currentNode.config || {};
            const contactRecord = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord) {
              ContactsDB.upsert(
                {
                  ...contactRecord,
                  assignedAgent: conf.agentName || conf.agentId || 'Support Specialist',
                  stage: 'in_progress',
                },
                context.workspaceId
              );
            }
            traceStep.outputResult = {
              assignedAgent: conf.agentName || conf.agentId || 'Support Specialist',
              status: 'assigned',
            };
            traceStep.status = 'node_executed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [assign_agent] Assigned: ${conf.agentName || 'Specialist'}`);
            break;
          }

          case 'ai':
          case 'ai_agent':
          case 'ai_smart_reply': {
            const conf = currentNode.config || {};
            const systemPrompt = conf.systemPrompt || 'You are a helpful WhatsApp customer support assistant.';
            const customerMessage = (executionVariables.text || context.triggerPayload?.text || 'Hello').toString();

            let replyText = 'Thank you for reaching out! Our team is reviewing your inquiry.';
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                  model: 'gemini-1.5-flash',
                  systemInstruction: systemPrompt,
                });
                const result = await model.generateContent(`Customer message: "${customerMessage}". Respond briefly and professionally for WhatsApp.`);
                const text = result.response.text().trim();
                if (text) replyText = text;
              } catch (err: any) {
                console.warn('[WorkflowEngine] AI generation failed, using fallback:', err.message);
              }
            }

            const sendResult = await WhatsAppMessageService.send({
              workspaceId: context.workspaceId,
              to: context.phoneNumber,
              type: 'text',
              text: replyText,
              bypassWindowCheck: true,
            });

            traceStep.outputResult = { aiReply: replyText, success: sendResult.success };
            traceStep.status = sendResult.success ? 'message_sent' : 'failed';
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [ai] Generated AI reply and dispatched`);
            break;
          }

          case 'end': {
            traceStep.status = 'completed';
            traceStep.outputResult = { workflowCompleted: true };
            nextNodeIdToFollow = undefined;
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [end] "${currentNode.title}" (${currentNode.id})`);
            break;
          }

          default: {
            traceStep.status = 'node_executed';
            traceStep.outputResult = { executed: true };
          }
        }

        // Visual Edge Graph Navigation check
        if (workflow.edges && workflow.edges.length > 0) {
          if (branchHandleToFollow) {
            const branchEdge = workflow.edges.find(
              (e) => e.source === currentNode?.id && e.sourceHandle === branchHandleToFollow
            );
            if (branchEdge) {
              nextNodeIdToFollow = branchEdge.target;
            }
          }
          if (!nextNodeIdToFollow) {
            const defaultEdge = workflow.edges.find((e) => e.source === currentNode?.id);
            if (defaultEdge) {
              nextNodeIdToFollow = defaultEdge.target;
            }
          }
        }

        traceStep.completedAt = new Date().toISOString();
        traceStep.durationMs = Date.now() - stepStart;
        stepsTrace.push(traceStep);

        console.log(`[NEXT NODE EXECUTED] Node "${currentNode.title}" (${currentNode.id}) [${currentNode.type}] executed successfully for ${context.phoneNumber} (Status: ${traceStep.status})`);

        // Terminate on explicit stop or failed non-recoverable error
        if (currentNode.type === 'end' || !nextNodeIdToFollow) {
          break;
        }

        currentNode = nodeMap.get(nextNodeIdToFollow);
      } catch (err: any) {
        console.error(`[WorkflowEngine] ❌ ERROR at node "${currentNode?.title || 'Unknown'}":`, err.message);
        traceStep.status = 'failed';
        traceStep.error = err.message;
        traceStep.completedAt = new Date().toISOString();
        traceStep.durationMs = Date.now() - stepStart;
        stepsTrace.push(traceStep);
        break;
      }
    }

    if (stepCount >= maxSteps && currentNode) {
      console.warn(`[WorkflowEngine] ⚠️ Loop Guard triggered (${maxSteps} steps threshold)`);
      stepsTrace.push({
        nodeId: 'loop_guard_protection',
        nodeType: 'end',
        nodeTitle: 'Loop Guard Protection Triggered',
        status: 'failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
        error: `Workflow execution aborted: Node traversal threshold reached (${maxSteps} hops). Check workflow graph for cyclical loops.`,
      });
    }

    // Workflow reached completion (or unrecoverable error)
    const completedAt = new Date().toISOString();
    const hasFailures = stepsTrace.some((s) => s.status === 'failed');
    execLog.status = hasFailures ? 'failed' : 'completed';
    execLog.completedAt = completedAt;
    execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
    execLog.steps = stepsTrace;
    execLog.metaResponses = metaResponses;

    // Clear session upon workflow completion
    TestCenterStore.clearSession(context.phoneNumber, context.workspaceId);

    console.log(`[WorkflowEngine] ✅ WORKFLOW COMPLETED: Workflow "${workflow.name}" (${workflow.id}) completed for ${context.phoneNumber} (Status: ${execLog.status})`);

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
   * Replaces dynamic template variables like {{contact.firstName}}, {{contact.phoneNumber}}, {{variables.*}}
   */
  static interpolateVariables(
    text: string | undefined,
    variables: Record<string, any>,
    contact?: any
  ): string {
    if (!text) return '';
    let result = text;
    const lookup: Record<string, any> = {
      ...variables,
      'contact.firstName': contact?.firstName || 'Friend',
      'contact.lastName': contact?.lastName || '',
      'contact.name': [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || 'Friend',
      'contact.phoneNumber': contact?.phoneNumber || variables.phoneNumber || '',
      'contact.leadStatus': contact?.leadStatus || 'new',
      phoneNumber: variables.phoneNumber || contact?.phoneNumber || '',
    };
    return result.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
      if (lookup[key] !== undefined) return String(lookup[key]);
      return match;
    });
  }

  /**
   * Dispatches WhatsApp Message for Message, Button, or Carousel Nodes
   */
  private static async dispatchNodeMessage(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    variables: Record<string, any>,
    contact?: any
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    metaCall?: any;
  }> {
    const config = node.config || {};
    const messageType: PlatformMessageType =
      (node.messageType as any) ||
      (node.type === 'button' || node.type === 'whatsapp_button'
        ? 'interactive_button'
        : node.type === 'carousel' || node.type === 'whatsapp_carousel'
        ? 'carousel'
        : node.type === 'list' || node.type === 'whatsapp_list'
        ? 'list'
        : node.type === 'whatsapp_catalog' || node.type === 'catalog'
        ? 'catalog'
        : node.type === 'whatsapp_flow' || node.type === 'flow'
        ? 'whatsapp_flow'
        : 'text');

    const cleanTo = context.phoneNumber;
    const settings = SettingsDB.get(context.workspaceId);
    const sandboxSettings = TestCenterStore.getSandboxSettings();

    // In live mode (isTestSimulation: false), NEVER use sandbox mock if live credentials exist!
    const isSandboxSimulation = Boolean(
      context.isTestSimulation && (
        sandboxSettings.enabled ||
        !settings.accessToken ||
        settings.accessToken.includes('SAMPLE_TOKEN') ||
        settings.accessToken.includes('AI_GENERATED') ||
        settings.accessToken.startsWith('MOCK_')
      )
    );

    const rawBody = config.bodyText || config.text;
    const interpolatedBody = this.interpolateVariables(rawBody, variables, contact);
    const interpolatedHeader = this.interpolateVariables(config.headerText, variables, contact);
    const interpolatedFooter = this.interpolateVariables(config.footerText, variables, contact);

    const callPayload: any = {
      type: messageType,
      to: cleanTo,
      header: interpolatedHeader,
      body: interpolatedBody,
      footer: interpolatedFooter,
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
      console.log(`[STEP 7: CAROUSEL EXECUTION]\n` +
        `  - carousel payload generated: ${JSON.stringify(callPayload, null, 2)}`);
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'carousel',
        bodyText: config.bodyText || config.text,
        cards: config.cards || [],
        templateName: config.templateName,
        bypassWindowCheck: true,
      });
      console.log(`[STEP 7: CAROUSEL EXECUTION]\n` +
        `  - carousel message sent: ${serviceResult.success ? 'SUCCESS' : 'FAILED'}\n` +
        `  - Meta API response: ${JSON.stringify(serviceResult, null, 2)}`);
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
    } else if (node.type === 'whatsapp_catalog' || (messageType as any) === 'catalog' || messageType === 'product') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'interactive',
        bodyText: `${config.bodyText || 'Explore our verified product collection:'}\n\n*${config.productTitle || 'Signature Item'}* - ${config.productPrice || '$149.00'}\n${config.productSubtitle || 'In Stock · Fast Courier Delivery'}`,
        buttons: [{ id: 'view_catalog', title: 'View Catalog' }],
        catalogId: config.catalogId,
        productRetailerId: config.retailerId,
        bypassWindowCheck: true,
      });
    } else if (node.type === 'whatsapp_flow' || (messageType as any) === 'whatsapp_flow') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'interactive',
        bodyText: config.bodyText || 'Please complete our interactive form below:',
        buttonText: config.flowCta || 'Start Form',
        buttons: [{ id: config.flowId || 'flow_btn', title: config.flowCta || 'Open Form' }],
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
      if (node.id === 'node_pricing_info' || node.title?.toLowerCase().includes('pricing')) {
        console.log(`[STEP 8: PRICING EXECUTION]\n` +
          `  - pricing message generated: "${config.text || config.bodyText}"\n` +
          `  - pricing message sent: ${serviceResult.success ? 'SUCCESS' : 'FAILED'}\n` +
          `  - Meta API response: ${JSON.stringify(serviceResult, null, 2)}`);
      }
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
    else if (operator === 'greater_than') matches = parseFloat(actualVal) > parseFloat(targetVal);
    else if (operator === 'less_than') matches = parseFloat(actualVal) < parseFloat(targetVal);
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
      const method = config.apiMethod || config.webhookMethod || 'POST';
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
