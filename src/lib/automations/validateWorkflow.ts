/** Validate graph structure before persisting user-created workflows. */
export function workflowValidationError(workflow: { nodes?: any[]; edges?: any[] }): string | null {
  if (!Array.isArray(workflow.nodes) || !workflow.nodes.length || workflow.nodes.length > 200) return 'A workflow needs between 1 and 200 nodes';
  const ids = new Set<string>();
  for (const node of workflow.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || typeof node.type !== 'string') return 'Every node needs an ID and type';
    if (ids.has(node.id)) return 'Node IDs must be unique';
    ids.add(node.id);
  }
  if (workflow.edges !== undefined && !Array.isArray(workflow.edges)) return 'Edges must be an array';
  if ((workflow.edges?.length || 0) > 500) return 'A workflow can contain at most 500 edges';
  for (const edge of workflow.edges || []) {
    if (!edge || !ids.has(edge.source) || !ids.has(edge.target)) return 'Every edge must connect existing nodes';
  }
  for (const node of workflow.nodes) {
    for (const target of [node.nextNodeId, node.config?.trueNextNodeId, node.config?.falseNextNodeId]) {
      if (target && !ids.has(target)) return 'A node points to a missing next node';
    }
  }
  const triggers = workflow.nodes.filter(n => n.type === 'trigger' || n.type.startsWith('trigger_'));
  if (triggers.length !== 1) return 'A workflow needs exactly one trigger node';
  return null;
}
