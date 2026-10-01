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
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function stripBoundaryPunctuation(text: string): string {
  if (!text) return '';
  return text.replace(/^[!?,.:;\-~*#@%^&()\[\]{}'"]+|[!?,.:;\-~*#@%^&()\[\]{}'"]+$/gu, '');
}

export function matchKeywordRule(
  rawIncomingText: string,
  rawExpectedKeywords: string | string[],
  pattern: 'contains' | 'exact' | 'starts_with' | 'regex' = 'contains'
): { matched: boolean; matchedKeyword?: string } {
  const incoming = normalizeText(rawIncomingText);
  if (!incoming) return { matched: false };

  const incomingClean = stripBoundaryPunctuation(incoming);

  const keywordList: string[] = (
    Array.isArray(rawExpectedKeywords)
      ? rawExpectedKeywords
      : (rawExpectedKeywords || '').toString().split(/,|\//)
  )
    .map((k) => normalizeText(k))
    .filter(Boolean);

  if (keywordList.length === 0) {
    return { matched: true };
  }

  const tokens = incoming
    .split(/[\s,.;:!?\-_/\\()\[\]{}'"]+/)
    .map(stripBoundaryPunctuation)
    .filter(Boolean);

  for (const kw of keywordList) {
    const kwClean = stripBoundaryPunctuation(kw);

    if (pattern === 'exact') {
      if (incoming === kw || incomingClean === kwClean) {
        return { matched: true, matchedKeyword: kw };
      }
    } else if (pattern === 'starts_with') {
      if (incoming.startsWith(kw) || incomingClean.startsWith(kwClean)) {
        return { matched: true, matchedKeyword: kw };
      }
    } else if (pattern === 'regex') {
      try {
        const regex = new RegExp(kw, 'iu');
        if (regex.test(incoming) || regex.test(incomingClean)) {
          return { matched: true, matchedKeyword: kw };
        }
      } catch {
        // safe failure
      }
    } else {
      if (incoming.includes(kw) || (kwClean && incomingClean.includes(kwClean))) {
        return { matched: true, matchedKeyword: kw };
      }
      if (tokens.includes(kw) || (kwClean && tokens.includes(kwClean))) {
        return { matched: true, matchedKeyword: kw };
      }
      try {
        const escaped = escapeRegex(kw);
        const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
        if (regex.test(incoming)) {
          return { matched: true, matchedKeyword: kw };
        }
      } catch {
        // fallback
      }
    }
  }

  return { matched: false };
}

export function findTriggerNode(workflow: WorkflowDefinition): WorkflowNode | undefined {
  if (!workflow.nodes || workflow.nodes.length === 0) return undefined;

  const triggerByType = workflow.nodes.find((n) =>
    n.type === 'trigger' ||
    n.type === 'trigger_keyword' ||
    n.type === 'trigger_incoming' ||
    n.type === 'trigger_button' ||
    n.type.startsWith('trigger_') ||
    n.id === 'node_trigger' ||
    n.id === 'node-trigger'
  );
  if (triggerByType) return triggerByType;

  const triggerByConfig = workflow.nodes.find((n) =>
    Boolean(n.triggerKeyword || n.config?.keyword || n.config?.keywords || n.triggerType)
  );
  if (triggerByConfig) return triggerByConfig;

  return workflow.nodes[0];
}

export function getWorkflowExpectedKeywords(workflow: WorkflowDefinition, triggerNode?: WorkflowNode): string {
  const node = triggerNode || findTriggerNode(workflow);
  const isTrigger = !node || node.type.startsWith('trigger') || node.id.includes('trigger');
  const nodeText = isTrigger ? (node?.config?.text || '') : '';

  return (
    node?.config?.keyword ||
    node?.config?.keywords ||
    node?.triggerKeyword ||
    nodeText ||
    workflow.triggerKeyword ||
    ''
  ).toString().trim();
}

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
  resumedSessionId?: string;
}

export class AdvancedWorkflowEngine {
  /**
  /**
   * Matches an incoming trigger event against all active workflows
   */
  static async matchWorkflows(
    triggerType: AutomationTriggerType,
    triggerPayload: any,
    workspaceId = DEFAULT_WORKSPACE_ID
  ): Promise<WorkflowDefinition[]> {
    const workflows = (await TestCenterStore.listWorkflows(workspaceId)).filter((w) => w.isActive);
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
    const text = (payload?.text || payload?.body || payload?.triggerKeyword || '').toString();
    const triggerNode = findTriggerNode(wf);
    const rawKeywords = getWorkflowExpectedKeywords(wf, triggerNode);
    const pattern = wf.triggerMatchPattern || (wf.triggerType === 'exact_match' ? 'exact' : 'contains');

    // Specific trigger type matches
    switch (triggerType) {
      case 'incoming_message':
      case 'first_message':
      case 'customer_reply':
      case 'broadcast_reply': {
        const isIncoming = wf.triggerType === 'incoming_message' || triggerNode?.type === 'trigger_incoming';
        const isKeyword = wf.triggerType === 'keyword' || triggerNode?.type === 'trigger_keyword' || triggerNode?.type === 'trigger';

        if (isIncoming) {
          if (!rawKeywords) return true;
          return matchKeywordRule(text, rawKeywords, pattern).matched;
        }
        if (isKeyword) {
          if (!rawKeywords) return false;
          return matchKeywordRule(text, rawKeywords, pattern).matched;
        }
        return false;
      }

      case 'keyword':
      case 'contains_text': {
        if (!rawKeywords) return false;
        return matchKeywordRule(text, rawKeywords, pattern).matched;
      }

      case 'exact_match': {
        if (!rawKeywords) return false;
        return matchKeywordRule(text, rawKeywords, 'exact').matched;
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
      case 'webhook_trigger': {
        if (payload?.workflowId && wf.id === payload.workflowId) {
          if (text && rawKeywords) {
            return matchKeywordRule(text, rawKeywords, pattern).matched;
          }
          return true;
        }
        if (text && rawKeywords) {
          return matchKeywordRule(text, rawKeywords, pattern).matched;
        }
        return wf.triggerType === triggerType;
      }

      case 'contact_tag':
        if (payload?.tag && triggerNode?.config?.tag) {
          return payload.tag.toLowerCase() === triggerNode.config.tag.toLowerCase();
        }
        return wf.triggerType === 'contact_tag';

      case 'button_click':
        if (wf.triggerType === 'button_click') {
          if (!payload?.buttonId) return true;
          return triggerNode?.config?.buttons?.some((b: any) => b.id === payload.buttonId) ?? true;
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
    ).toString();

    const expectedKeywords = getWorkflowExpectedKeywords(workflow, currentNode);
    const pattern = workflow.triggerMatchPattern || (workflow.triggerType === 'exact_match' ? 'exact' : 'contains');

    // Operator explicit manual run (e.g. from an operator "Run Workflow" action)
    if (['manual_trigger', 'api_trigger', 'webhook_trigger'].includes(context.triggerType)) {
      const isKeywordFlow = workflow.triggerType === 'keyword' || currentNode.type === 'trigger_keyword';

      // If incoming text is provided, validate it against the expected keyword
      if (incomingText && expectedKeywords) {
        const { matched } = matchKeywordRule(incomingText, expectedKeywords, pattern);
        return {
          matched,
          reason: matched ? undefined : `Incoming message "${incomingText}" does not match required keyword(s): "${expectedKeywords}"`,
          incomingText,
          expectedKeywords,
        };
      }

      // If no text provided, only allow direct execution if explicit manual override is set
      if (context.triggerPayload?.allowDirectRun || context.triggerPayload?.manual) {
        return { matched: true, incomingText, expectedKeywords };
      }

      if (isKeywordFlow && !incomingText) {
        return {
          matched: false,
          reason: `Workflow requires incoming keyword(s): "${expectedKeywords}". None provided.`,
          incomingText,
          expectedKeywords,
        };
      }

      return { matched: true, incomingText, expectedKeywords };
    }

    // 1. Any incoming message trigger
    if (currentNode.type === 'trigger_incoming' || workflow.triggerType === 'incoming_message') {
      if (!expectedKeywords) {
        return { matched: Boolean(incomingText || context.triggerPayload), incomingText, expectedKeywords: '(any message)' };
      }
      const { matched } = matchKeywordRule(incomingText, expectedKeywords, pattern);
      return {
        matched,
        reason: matched ? undefined : `Incoming message "${incomingText}" does not match required keyword(s): "${expectedKeywords}"`,
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

      const { matched } = matchKeywordRule(incomingText, expectedKeywords, pattern);
      return {
        matched,
        reason: matched ? undefined : `Incoming message "${incomingText}" does not match required keyword(s): "${expectedKeywords}"`,
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

    const buttonId = (event.buttonId || '').trim();
    const buttonTitle = (event.buttonTitle || '').trim().toLowerCase();
    const cardButtonId = (event.cardButtonId || buttonId).trim();
    const cardIndex = event.cardIndex !== undefined ? event.cardIndex : undefined;

    // Check if current node (or parent if wait_for_reply) has carousel cards or buttons
    let cards = currentNode.config?.cards || [];
    let buttons = currentNode.config?.buttons || [];

    // If current node is wait_for_reply without its own cards/buttons, inspect parent node
    if (currentNode.type === 'wait_for_reply' && cards.length === 0 && buttons.length === 0) {
      const incomingEdges = edges.filter((e) => e.target === currentNode.id);
      for (const inEdge of incomingEdges) {
        const parentNode = workflow.nodes.find((n) => n.id === inEdge.source);
        if (parentNode?.config?.cards) cards = parentNode.config.cards;
        if (parentNode?.config?.buttons) buttons = parentNode.config.buttons;
      }
    }

    // 1. CAROUSEL CARDS RESOLUTION
    if (cards.length > 0 && (event.action === 'carousel_click' || event.action === 'button_click')) {
      for (let cIdx = 0; cIdx < cards.length; cIdx++) {
        const card = cards[cIdx];
        const cardBtns = card.buttons || [];
        const isTargetCardIndex = cardIndex !== undefined && cardIndex === cIdx;
        const matchedCardBtn = cardBtns.find((b: any) =>
          (cardButtonId && b.id && b.id.toLowerCase() === cardButtonId.toLowerCase()) ||
          (buttonId && b.id && b.id.toLowerCase() === buttonId.toLowerCase()) ||
          (buttonTitle && b.title && b.title.trim().toLowerCase() === buttonTitle)
        );

        if (matchedCardBtn || isTargetCardIndex) {
          const targetCardBtnId = matchedCardBtn?.id || cardButtonId || buttonId;
          // Match edge by card button ID
          if (targetCardBtnId) {
            const edgeByBtn = nodeEdges.find(
              (e) =>
                e.sourceHandle === targetCardBtnId ||
                (e.sourceHandle && e.sourceHandle.toLowerCase() === targetCardBtnId.toLowerCase()) ||
                (e.label && e.label.toLowerCase() === targetCardBtnId.toLowerCase())
            );
            if (edgeByBtn) return { nextNodeId: edgeByBtn.target, sourceHandle: edgeByBtn.sourceHandle || undefined, matchedEdge: edgeByBtn };
          }

          // Match edge by card index handle (card-0, card_0, etc.)
          const edgeByIndex = nodeEdges.find(
            (e) =>
              e.sourceHandle === `card-${cIdx}` ||
              e.sourceHandle === `card_${cIdx}` ||
              e.sourceHandle === `${cIdx}`
          );
          if (edgeByIndex) return { nextNodeId: edgeByIndex.target, sourceHandle: edgeByIndex.sourceHandle || undefined, matchedEdge: edgeByIndex };

          // Match edge by card title or button title
          const cardTitleLower = (card.title || matchedCardBtn?.title || '').trim().toLowerCase();
          if (cardTitleLower) {
            const edgeByTitle = nodeEdges.find(
              (e) =>
                (e.label && e.label.toLowerCase() === cardTitleLower) ||
                (e.sourceHandle && e.sourceHandle.toLowerCase() === cardTitleLower)
            );
            if (edgeByTitle) return { nextNodeId: edgeByTitle.target, sourceHandle: edgeByTitle.sourceHandle || undefined, matchedEdge: edgeByTitle };
          }
        }
      }
    }

    // 2. INTERACTIVE BUTTON RESOLUTION
    if (event.action === 'button_click' || event.action === 'carousel_click') {
      const btnIndex = buttons.findIndex(
        (b: any) =>
          (buttonId && b.id && b.id.toLowerCase() === buttonId.toLowerCase()) ||
          (buttonTitle && b.title && b.title.trim().toLowerCase() === buttonTitle) ||
          (buttonId && b.title && b.title.trim().toLowerCase() === buttonId.toLowerCase())
      );
      const matchedBtn = btnIndex !== -1 ? buttons[btnIndex] : null;

      // 2a. Direct edge match by buttonId (e.g., sourceHandle === 'btn_catalog')
      if (buttonId) {
        const edgeById = nodeEdges.find(
          (e) =>
            e.sourceHandle === buttonId ||
            (e.sourceHandle && e.sourceHandle.toLowerCase() === buttonId.toLowerCase()) ||
            (e.label && e.label.toLowerCase() === buttonId.toLowerCase())
        );
        if (edgeById) return { nextNodeId: edgeById.target, sourceHandle: edgeById.sourceHandle || undefined, matchedEdge: edgeById };
      }

      // 2b. List Row Match if current node is a list
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

      // 2c. Match by matchedBtn.id if different from buttonId
      if (matchedBtn?.id && matchedBtn.id.toLowerCase() !== buttonId.toLowerCase()) {
        const edgeByMatchedId = nodeEdges.find(
          (e) =>
            e.sourceHandle === matchedBtn.id ||
            (e.sourceHandle && e.sourceHandle.toLowerCase() === matchedBtn.id.toLowerCase()) ||
            (e.label && e.label.toLowerCase() === matchedBtn.id.toLowerCase())
        );
        if (edgeByMatchedId) return { nextNodeId: edgeByMatchedId.target, sourceHandle: edgeByMatchedId.sourceHandle || undefined, matchedEdge: edgeByMatchedId };
      }

      // 2d. Direct edge match by btnIndex (e.g., sourceHandle === 'btn-0' or 'btn_0' or '0')
      if (btnIndex !== -1) {
        const edgeByIndex = nodeEdges.find(
          (e) =>
            e.sourceHandle === `btn-${btnIndex}` ||
            e.sourceHandle === `btn_${btnIndex}` ||
            e.sourceHandle === `${btnIndex}`
        );
        if (edgeByIndex) return { nextNodeId: edgeByIndex.target, sourceHandle: edgeByIndex.sourceHandle || undefined, matchedEdge: edgeByIndex };
      }

      // 2e. Direct edge match by button title
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

      // 2f. Node config direct routing (e.g., button.nextNodeId or config.buttonRoutes)
      if ((matchedBtn as any)?.nextNodeId) return { nextNodeId: (matchedBtn as any).nextNodeId, sourceHandle: buttonId };
      if ((currentNode.config as any)?.buttonRoutes?.[buttonId]) return { nextNodeId: (currentNode.config as any).buttonRoutes[buttonId], sourceHandle: buttonId };
      if ((currentNode.config as any)?.branches?.[buttonId]) return { nextNodeId: (currentNode.config as any).branches[buttonId], sourceHandle: buttonId };

      // 2g. If only 1 edge exists leaving this button node, follow it
      if (nodeEdges.length === 1) {
        return { nextNodeId: nodeEdges[0].target, sourceHandle: nodeEdges[0].sourceHandle || undefined, matchedEdge: nodeEdges[0] };
      }

      // 2h. Fallback: match nth edge to nth button if counts match
      if (btnIndex >= 0 && btnIndex < nodeEdges.length) {
        return { nextNodeId: nodeEdges[btnIndex].target, sourceHandle: nodeEdges[btnIndex].sourceHandle || undefined, matchedEdge: nodeEdges[btnIndex] };
      }
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
    let contact = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
    if (!contact) {
      contact = await ContactsDB.upsert(
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

    await TestCenterStore.recordExecutionLog(execLog);

    const startNode = workflow.nodes[0];
    if (!startNode) {
      execLog.status = 'completed';
      execLog.completedAt = new Date().toISOString();
      await TestCenterStore.recordExecutionLog(execLog);
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
    if (session.waitingFor === 'delay' &&
      (event.action !== 'delay_expired' || !(Date.parse(session.expiresAt) <= Date.now()))) return null;
    if (event.action === 'delay_expired' && session.waitingFor !== 'delay') return null;
    console.log(`[BUTTON PAYLOAD] Button action received for session ${session.id}:\n` +
      `  - buttonId: "${event.buttonId || 'none'}"\n` +
      `  - buttonTitle: "${event.buttonTitle || 'none'}"\n` +
      `  - action: "${event.action}"\n` +
      `  - fromPhone: "${session.phoneNumber}"`);

    const workflow = await TestCenterStore.getWorkflow(session.workflowId, session.workspaceId);
    if (!workflow || !workflow.isActive || workflow.workspaceId !== session.workspaceId) {
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

    // Fetch existing execution log or fallback
    let execLog = await TestCenterStore.getExecutionLog(session.executionId, session.workspaceId);
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

    const contact = await ContactsDB.getByPhone(session.phoneNumber, session.workspaceId);
    const nextNode = workflow.nodes.find((n) => n.id === nextNodeId);

    if (!nextNode) {
      execLog.status = 'completed';
      execLog.completedAt = new Date().toISOString();
      await TestCenterStore.clearSession(session.phoneNumber, session.workspaceId, session.id);
      await TestCenterStore.recordExecutionLog(execLog);
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
      resumedSessionId: session.id,
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
        let stopTraversal = false;

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
              await TestCenterStore.recordExecutionLog(execLog);

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

            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [${currentNode.type}] "${currentNode.title}" (${currentNode.id}) ➔ Interactive buttons dispatched to ${context.phoneNumber}`);

            if (!sendResult.success) {
              stopTraversal = true;
              break;
            }

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
              stepsTrace.push(traceStep);
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
              await TestCenterStore.saveSession(session);

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
              await TestCenterStore.recordExecutionLog(execLog);

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

            if (!sendResult.success) {
              stopTraversal = true;
              break;
            }

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
              stepsTrace.push(traceStep);
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
              await TestCenterStore.saveSession(session);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'button_click';
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              await TestCenterStore.recordExecutionLog(execLog);

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
            await TestCenterStore.saveSession(session);

            console.log(`[WorkflowEngine] ⏸ NODE PAUSED: Workflow "${workflow.name}" paused at "${currentNode.title}" (${currentNode.id})`);
            console.log(`[WorkflowEngine] ⏳ WAITING FOR USER ACTION: Waiting for customer reply / product selection from ${context.phoneNumber}`);

            execLog.status = 'waiting';
            execLog.currentNodeId = currentNode.id;
            execLog.waitingFor = 'reply';
            execLog.pausedAt = new Date().toISOString();
            execLog.steps = stepsTrace;
            execLog.metaResponses = metaResponses;
            execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
            await TestCenterStore.recordExecutionLog(execLog);

            return execLog;
          }

          case 'carousel':
          case 'whatsapp_carousel': {
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
              console.log(`[MESSAGE SENT] Carousel dispatched successfully:\n` +
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
              stopTraversal = true;
              console.error(`[MESSAGE SENT FAILED] Message dispatch failed for node "${currentNode.title}" (${currentNode.id}): ${sendResult.error}`);
            }

            traceStep.completedAt = new Date().toISOString();
            traceStep.durationMs = Date.now() - stepStart;

            if (!sendResult.success) {
              stopTraversal = true;
              break;
            }

            // Pause if carousel has cards with interactive buttons/CTAs
            const cards = currentNode.config?.cards || [];
            const hasButtons = cards.some((card: any) => (card.buttons && card.buttons.length > 0) || card.ctaButton);
            if (hasButtons) {
              const waitStep: ExecutionTraceStep = {
                nodeId: currentNode.id,
                nodeType: currentNode.type,
                nodeTitle: `Waiting for Carousel Interaction (${cards.length} cards)`,
                status: 'waiting_user_action',
                startedAt: new Date().toISOString(),
                durationMs: 0,
                outputResult: {
                  waitingFor: 'button_click',
                  cards: currentNode.config.cards,
                  status: 'paused_waiting_user_action',
                },
              };
              stepsTrace.push(traceStep);
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
              await TestCenterStore.saveSession(session);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'button_click';
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              await TestCenterStore.recordExecutionLog(execLog);

              return execLog;
            }

            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [${currentNode.type}] "${currentNode.title}" (${currentNode.id}) ➔ Dispatched to ${context.phoneNumber}`);
            break;
          }

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
              stopTraversal = true;
              console.error(`[MESSAGE SENT FAILED] Message dispatch failed for node "${currentNode.title}" (${currentNode.id}): ${sendResult.error}`);
            }
            console.log(`[WorkflowEngine] ⚙️ NODE EXECUTED: [${currentNode.type}] "${currentNode.title}" (${currentNode.id}) ➔ Dispatched to ${context.phoneNumber}`);
            break;
          }

          case 'delay': {
            const amount = currentNode.config.delayAmount ?? 1;
            if (!Number.isFinite(amount) || amount < 0) throw new Error('Delay must be a non-negative number');
            const unit = currentNode.config.delayUnit || 'minutes';
            if (!['seconds', 'minutes', 'hours', 'days'].includes(unit)) throw new Error('Invalid delay unit');
            const multiplier = unit === 'seconds' ? 1000 : unit === 'minutes' ? 60000 : unit === 'hours' ? 3600000 : 86400000;
            const scheduledDelayMs = amount * multiplier;
            const scheduledFor = new Date(Date.now() + scheduledDelayMs).toISOString();

            if (context.isTestSimulation) {
              const simDelayMs = 0; // Preview fast-forwards; it must never create a live scheduled session.
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
              await TestCenterStore.saveSession(session);

              console.log(`[WorkflowEngine] ⏸ NODE PAUSED: Workflow "${workflow.name}" paused for scheduled delay until ${scheduledFor}`);

              execLog.status = 'waiting';
              execLog.currentNodeId = currentNode.id;
              execLog.waitingFor = 'delay';
              execLog.pausedAt = new Date().toISOString();
              execLog.steps = stepsTrace;
              execLog.metaResponses = metaResponses;
              execLog.totalDurationMs = Date.now() - new Date(execLog.startedAt).getTime();
              await TestCenterStore.recordExecutionLog(execLog);

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
            const conditionResult = await this.evaluateCondition(
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

            const contactRecord = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord) {
              if (conf.stage) {
                await ContactsDB.upsert({ phoneNumber: contactRecord.phoneNumber, stage: conf.stage as any }, context.workspaceId);
              }
              if (conf.notes) {
                await ContactsDB.addNote(contactRecord.id, {
                  authorName: 'Workflow Engine',
                  content: conf.notes,
                }, context.workspaceId);
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
            const contactRecord = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
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
              await ContactsDB.upsert(updatedContact, context.workspaceId);
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
            const contactRecord = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord && conf.tag) {
              const tagToApply = conf.tag.trim();
              let tags = contactRecord.tags || [];
              if (conf.action === 'remove') {
                tags = tags.filter((t) => t.toLowerCase() !== tagToApply.toLowerCase());
              } else {
                tags = Array.from(new Set([...tags, tagToApply]));
              }
              await ContactsDB.upsert({ ...contactRecord, tags }, context.workspaceId);
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
            const contactRecord = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contactRecord) {
              await ContactsDB.upsert(
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
        if (!stopTraversal && workflow.edges && workflow.edges.length > 0) {
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
        if (stopTraversal || currentNode.type === 'end' || !nextNodeIdToFollow) {
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

    // Keep a failed session for a claimed retry. Successful runs consume only the
    // session they resumed, so a newly-created wait state cannot be deleted.
    if (!hasFailures) {
      await TestCenterStore.clearSession(context.phoneNumber, context.workspaceId, context.resumedSessionId);
    }

    console.log(`[WorkflowEngine] ✅ WORKFLOW COMPLETED: Workflow "${workflow.name}" (${workflow.id}) completed for ${context.phoneNumber} (Status: ${execLog.status})`);

    await TestCenterStore.recordExecutionLog(execLog);

    // Update workflow stats
    workflow.executionCount = (workflow.executionCount || 0) + 1;
    if (workflow.stats) {
      workflow.stats.enteredCount = (workflow.stats.enteredCount || 0) + 1;
      if (!hasFailures) {
        workflow.stats.completedCount = (workflow.stats.completedCount || 0) + 1;
      } else {
        workflow.stats.droppedCount = (workflow.stats.droppedCount || 0) + 1;
      }
      await TestCenterStore.saveWorkflow(workflow);
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
    const settings = await SettingsDB.get(context.workspaceId);
    // A simulation must never contact real recipients, even with live credentials.
    const isSandboxSimulation = context.isTestSimulation === true;

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
        workspaceId: context.workspaceId,
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
        endpoint: `https://graph.facebook.com/v25.0/${settings.phoneNumberId || 'sandbox_phone_id'}/messages`,
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
          endpoint: 'POST /v25.0/{PHONE_NUMBER_ID}/messages (Meta Sandbox)',
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
        bodyText: interpolatedBody,
        cards: config.cards || [],
        templateName: config.templateName,
        requireRealDelivery: true,
      });
      console.log(`[STEP 7: CAROUSEL EXECUTION]\n` +
        `  - carousel message sent: ${serviceResult.success ? 'SUCCESS' : 'FAILED'}\n` +
        `  - Meta API response: ${JSON.stringify(serviceResult, null, 2)}`);
    } else if (messageType === 'interactive_button' || messageType === 'quick_reply') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'button',
        headerText: interpolatedHeader,
        bodyText: interpolatedBody || 'Choose an option:',
        footerText: interpolatedFooter,
        buttons: (config.buttons || [{ id: 'opt_1', title: 'Proceed' }]).map((b: any) => ({
          id: b.id,
          title: b.title,
        })),
        requireRealDelivery: true,
      });
    } else if (messageType === 'list') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'list',
        headerText: interpolatedHeader,
        bodyText: interpolatedBody || 'Select an item:',
        footerText: interpolatedFooter,
        buttonText: config.buttonText || 'View Options',
        sections: config.sections || [],
        requireRealDelivery: true,
      });
    } else if (messageType === 'template') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'template',
        templateName: config.templateName || 'teaser_alert',
        languageCode: config.languageCode || 'en_US',
        requireRealDelivery: true,
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
        requireRealDelivery: true,
      });
    } else if (node.type === 'whatsapp_flow' || (messageType as any) === 'whatsapp_flow') {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'interactive',
        bodyText: config.bodyText || 'Please complete our interactive form below:',
        buttonText: config.flowCta || 'Start Form',
        buttons: [{ id: config.flowId || 'flow_btn', title: config.flowCta || 'Open Form' }],
        requireRealDelivery: true,
      });
    } else if (['image', 'video', 'audio', 'document', 'pdf'].includes(messageType)) {
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: messageType === 'pdf' ? 'document' : (messageType as any),
        mediaUrl: config.mediaUrl,
        caption: this.interpolateVariables(config.caption || config.text, variables, contact),
        filename: config.fileName,
        requireRealDelivery: true,
      });
    } else {
      // Standard text or fallback
      serviceResult = await WhatsAppMessageService.send({
        workspaceId: context.workspaceId,
        to: cleanTo,
        type: 'text',
        text: interpolatedBody || 'Automated message',
        requireRealDelivery: true,
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
    if (!serviceResult.success || serviceResult.isSimulated || !messageId || !messageId.startsWith('wamid.')) {
      const errorMsg = serviceResult.error || 'Meta API rejected message dispatch without valid Message ID.';
      TestCenterStore.recordDeliveryReceipt({
        id: `rec_${Date.now()}`,
        workspaceId: context.workspaceId,
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
          endpoint: 'POST /v25.0/{PHONE_NUMBER_ID}/messages',
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
      workspaceId: context.workspaceId,
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
      endpoint: `https://graph.facebook.com/v25.0/${settings.phoneNumberId}/messages`,
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
        endpoint: 'POST /v25.0/{PHONE_NUMBER_ID}/messages',
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
  private static async evaluateCondition(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    variables: Record<string, any>
  ): Promise<{
    evaluated: boolean;
    conditionResult: boolean;
    branchNextNodeId?: string;
    actionApplied?: string;
  }> {
    const config = node.config || {};
    const actionType: WorkflowActionType = (node.actionType as any) || 'conditional_logic';

    // 1. Tag Contact Action
    if (actionType === 'tag_contact' && config.tag) {
      const contact = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
      if (contact) {
        const tags = Array.from(new Set([...(contact.tags || []), config.tag.toLowerCase().trim()]));
        await ContactsDB.upsert({ ...contact, tags }, context.workspaceId);
      }
      return { evaluated: true, conditionResult: true, actionApplied: `Tagged contact with ${config.tag}` };
    }

    // 2. Remove Tag Action
    if (actionType === 'remove_tag' && config.removeTag) {
      const contact = await ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
      if (contact) {
        const tags = (contact.tags || []).filter((t) => t !== config.removeTag?.toLowerCase().trim());
        await ContactsDB.upsert({ ...contact, tags }, context.workspaceId);
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
