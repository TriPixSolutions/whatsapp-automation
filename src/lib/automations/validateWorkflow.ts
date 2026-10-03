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
