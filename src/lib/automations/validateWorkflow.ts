import { messageFromWorkflowNode, validateOutboundMessage } from '@/lib/whatsapp/messageModel';

type WorkflowShape = { nodes?: any[]; edges?: any[]; isActive?: boolean };

const triggerNode = (node: any) => node?.type === 'trigger' || String(node?.type || '').startsWith('trigger_');
const interactiveNode = (node: any) => ['button', 'whatsapp_button', 'list', 'whatsapp_list', 'carousel', 'whatsapp_carousel'].includes(node?.type);

/** Canonical validation shared by every workflow save path. Drafts may be incomplete;
 * active workflows must be executable and provider-safe. */
export function workflowValidationErrors(workflow: WorkflowShape): string[] {
  const errors: string[] = [];
  const nodes = workflow.nodes;
  const edges = workflow.edges ?? [];
  const strict = workflow.isActive !== false;

  if (!Array.isArray(nodes) || !nodes.length || nodes.length > 200) return ['A workflow needs between 1 and 200 steps.'];
  if (!Array.isArray(edges)) return ['Workflow connections must be an array.'];
  if (edges.length > 500) errors.push('A workflow can contain at most 500 connections.');

  const ids = new Set<string>();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || !node.id.trim() || typeof node.type !== 'string') {
      errors.push('Every step needs a stable ID and type.');
      continue;
    }
    if (ids.has(node.id)) errors.push(`Step ID "${node.id}" is duplicated.`);
    ids.add(node.id);
  }

  const edgeIds = new Set<string>();
  const routeKeys = new Set<string>();
  for (const edge of edges) {
    if (!edge || !ids.has(edge.source) || !ids.has(edge.target)) {
      errors.push('Every connection must join two existing steps.');
      continue;
    }
    if (edge.source === edge.target) errors.push(`Step "${edge.source}" cannot connect directly to itself.`);
    if (edge.id) {
      if (edgeIds.has(edge.id)) errors.push(`Connection ID "${edge.id}" is duplicated.`);
      edgeIds.add(edge.id);
    }
    const handle = String(edge.sourceHandle || 'default');
    const routeKey = `${edge.source}:${handle}`;
    if (routeKeys.has(routeKey)) errors.push(`Step "${edge.source}" has more than one route for "${handle}".`);
    routeKeys.add(routeKey);
  }

  for (const node of nodes) {
    for (const target of [node.nextNodeId, node.config?.trueNextNodeId, node.config?.falseNextNodeId]) {
      if (target && !ids.has(target)) errors.push(`Step "${node.title || node.id}" points to a missing next step.`);
    }
  }

  const triggers = nodes.filter(triggerNode);
  if (triggers.length !== 1) errors.push('A workflow needs exactly one trigger step.');

  if (strict && triggers.length === 1) {
    const trigger = triggers[0];
    const keyword = String(trigger.config?.text || trigger.config?.triggerKeyword || trigger.triggerKeyword || '').trim();
    if (trigger.type === 'trigger_keyword' && !keyword) errors.push(`Trigger "${trigger.title || trigger.id}" needs at least one keyword.`);
    if (trigger.type === 'trigger_scheduled') {
      const scheduleAt = String(trigger.config?.scheduleAt || '');
      const recipient = String(trigger.config?.recipientPhone || '').replace(/[\s()-]/g, '');
      const recurrenceMinutes = Number(trigger.config?.recurrenceMinutes || 0);
      if (!scheduleAt || !Number.isFinite(Date.parse(scheduleAt))) errors.push('Scheduled trigger needs a valid start date and time.');
      if (!/^\+[1-9]\d{7,14}$/.test(recipient)) errors.push('Scheduled trigger recipient must use E.164 format, for example +919876543210.');
      if (recurrenceMinutes < 0 || !Number.isFinite(recurrenceMinutes)) errors.push('Scheduled trigger recurrence must be zero or a positive number of minutes.');
    }
  }

  if (strict) {
    for (const node of nodes) {
      const message = messageFromWorkflowNode(node);
      if (message) {
        for (const error of validateOutboundMessage(message)) errors.push(`${node.title || node.id}: ${error}`);
      }

      if (node.type === 'delay') {
        const amount = Number(node.config?.delayAmount);
        if (!Number.isFinite(amount) || amount <= 0) errors.push(`${node.title || node.id}: Delay must be greater than zero.`);
      }

      if ((node.type === 'tag' || node.type === 'tag_management') && !String(node.config?.tag || '').trim()) {
        errors.push(`${node.title || node.id}: Choose a contact tag.`);
      }
      if (node.type === 'lead_management' && !String(node.config?.leadStatus || '').trim()) {
        errors.push(`${node.title || node.id}: Choose the lead stage to save.`);
      }
      if ((node.type === 'crm_action' || node.type === 'assign_agent') &&
        !String(node.config?.assigneeEmail || node.config?.agentId || node.config?.stage || node.config?.notes || '').trim()) {
        errors.push(`${node.title || node.id}: Choose an assignee or a CRM update.`);
      }
      if ((node.type === 'ai' || node.type === 'ai_agent' || node.type === 'ai_smart_reply') &&
        !String(node.config?.systemPrompt || node.config?.prompt || '').trim()) {
        errors.push(`${node.title || node.id}: Add instructions for the AI agent.`);
      }
      if ((node.type === 'branch' || node.type === 'multi_branch') && !(node.config?.branches || []).length) {
        errors.push(`${node.title || node.id}: Add at least one branch.`);
      }

      if (interactiveNode(node)) {
        const configuredIds = node.type === 'list' || node.type === 'whatsapp_list'
          ? (node.config?.sections || []).flatMap((section: any) => (section.rows || []).map((row: any) => row.id))
          : node.type === 'carousel' || node.type === 'whatsapp_carousel'
            ? (node.config?.cards || []).flatMap((card: any) => (card.buttons || []).map((button: any) => button.id))
            : (node.config?.buttons || []).map((button: any) => button.id);
        const routes = new Set(edges.filter((edge: any) => edge.source === node.id).map((edge: any) => edge.sourceHandle));
        for (const choiceId of configuredIds.filter(Boolean)) {
          const directTarget = node.config?.buttonRoutes?.[choiceId] || node.config?.branches?.[choiceId];
          const embeddedTarget = (node.config?.buttons || []).find((button: any) => button.id === choiceId)?.nextNodeId;
          if (!routes.has(choiceId) && !directTarget && !embeddedTarget) errors.push(`${node.title || node.id}: Choice "${choiceId}" needs a connected branch.`);
        }
      }
    }

    if (triggers.length === 1) {
      const reachable = new Set<string>();
      const pending = [triggers[0].id];
      while (pending.length) {
        const id = pending.pop()!;
        if (reachable.has(id)) continue;
        reachable.add(id);
        const node = nodes.find((item: any) => item.id === id);
        for (const target of [node?.nextNodeId, node?.config?.trueNextNodeId, node?.config?.falseNextNodeId]) if (target) pending.push(target);
        for (const edge of edges.filter((item: any) => item.source === id)) pending.push(edge.target);
      }
      const unreachable = nodes.filter((node: any) => !reachable.has(node.id));
      if (unreachable.length) errors.push(`Disconnected steps cannot run: ${unreachable.map((node: any) => node.title || node.id).join(', ')}.`);
    }
  }

  return [...new Set(errors)];
}

export function workflowValidationError(workflow: WorkflowShape): string | null {
  return workflowValidationErrors(workflow)[0] || null;
}
