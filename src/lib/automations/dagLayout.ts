import {
  WorkflowDefinition,
  WorkflowNode,
  VisualWorkflowEdge,
  NodeValidationError,
  WorkflowTreeNode,
} from '@/types/automations';

/**
 * Validates a workflow and all of its constituent nodes for production readiness.
 */
export function validateWorkflow(workflow: WorkflowDefinition): NodeValidationError[] {
  const errors: NodeValidationError[] = [];
  const nodeMap = new Map<string, WorkflowNode>();
  workflow.nodes.forEach((n) => nodeMap.set(n.id, n));

  if (workflow.nodes.length === 0) {
    errors.push({
      nodeId: 'root',
      message: 'Workflow has no nodes. Add at least one trigger node.',
      severity: 'error',
    });
    return errors;
  }

  // Ensure at least one trigger node exists
  const hasTrigger = workflow.nodes.some(
    (n) => n.type.startsWith('trigger') || n.type === 'trigger'
  );
  if (!hasTrigger) {
    errors.push({
      nodeId: workflow.nodes[0]?.id || 'root',
      message: 'Workflow requires an entry Trigger node to start execution.',
      severity: 'error',
    });
  }

  // Validate individual nodes
  workflow.nodes.forEach((node) => {
    const config = node.config || {};
    const type = (node.type || '').toLowerCase();

    // 1. Trigger validation
    if (type === 'trigger' || type.startsWith('trigger_')) {
      if (type === 'trigger_keyword' && !config.text && !config.triggerKeyword && !node.triggerKeyword) {
        errors.push({
          nodeId: node.id,
          field: 'triggerKeyword',
          message: 'Keyword trigger requires at least one keyword.',
          severity: 'warning',
        });
      }
    }

    // 2. Message validation
    if (type === 'message' || type === 'whatsapp_message') {
      if (!config.text && !config.bodyText && !config.mediaUrl) {
        errors.push({
          nodeId: node.id,
          field: 'text',
          message: 'Message content cannot be blank.',
          severity: 'error',
        });
      }
    }

    // 3. Button validation
    if (type === 'button' || type === 'whatsapp_button') {
      const buttons = config.buttons || [];
      if (buttons.length === 0) {
        errors.push({
          nodeId: node.id,
          field: 'buttons',
          message: 'At least one button must be defined (max 3).',
          severity: 'error',
        });
      } else if (buttons.length > 3) {
        errors.push({
          nodeId: node.id,
          field: 'buttons',
          message: 'WhatsApp limits interactive buttons to a maximum of 3.',
          severity: 'error',
        });
      }
      buttons.forEach((b: any, idx: number) => {
        if (!b.title || b.title.trim().length === 0) {
          errors.push({
            nodeId: node.id,
            field: `button_${idx}`,
            message: `Button ${idx + 1} title cannot be empty.`,
            severity: 'error',
          });
        } else if (b.title.length > 20) {
          errors.push({
            nodeId: node.id,
            field: `button_${idx}`,
            message: `Button "${b.title}" exceeds Meta 20-character limit.`,
            severity: 'error',
          });
        }
      });
    }

    // 4. Carousel validation
    if (type === 'carousel' || type === 'whatsapp_carousel') {
      const cards = config.cards || [];
      if (cards.length === 0) {
        errors.push({
          nodeId: node.id,
          field: 'cards',
          message: 'Carousel must have at least 1 card.',
          severity: 'error',
        });
      } else if (cards.length > 10) {
        errors.push({
          nodeId: node.id,
          field: 'cards',
          message: 'WhatsApp limits carousels to a maximum of 10 cards.',
          severity: 'error',
        });
      }
      cards.forEach((card: any, idx: number) => {
        if (!card.title || card.title.trim().length === 0) {
          errors.push({
            nodeId: node.id,
            field: `card_${idx}_title`,
            message: `Card ${idx + 1} requires a title.`,
            severity: 'error',
          });
        }
      });
    }

    // 5. Condition validation
    if (type === 'condition' || type === 'conditional_logic') {
      if (!config.conditionVariable && !config.conditionOperator) {
        errors.push({
          nodeId: node.id,
          field: 'conditionVariable',
          message: 'Condition node requires a variable and operator to evaluate.',
          severity: 'warning',
        });
      }
    }

    // 6. Delay validation
    if (type === 'delay') {
      const amount = Number(config.delayAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.push({
          nodeId: node.id,
          field: 'delayAmount',
          message: 'Delay duration must be a positive number.',
          severity: 'error',
        });
      }
    }

    // 7. API Request validation
    if (type === 'api_request' || type === 'api_node' || type === 'api') {
      const url = config.apiUrl || config.webhookUrl;
      if (!url) {
        errors.push({
          nodeId: node.id,
          field: 'apiUrl',
          message: 'API Request requires a valid endpoint URL.',
          severity: 'error',
        });
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push({
          nodeId: node.id,
          field: 'apiUrl',
          message: 'API URL must begin with http:// or https://',
          severity: 'error',
        });
      }
    }

    // 8. AI Agent validation
    if (type === 'ai_agent' || type === 'ai') {
      if (!config.systemPrompt && !config.text) {
        errors.push({
          nodeId: node.id,
          field: 'systemPrompt',
          message: 'AI Agent requires instructions or a prompt.',
          severity: 'warning',
        });
      }
    }
  });

  return errors;
}

/**
 * Automatically arranges all nodes in a clean topological DAG layout (Auto-Arrange)
 */
export function autoArrangeDAG(
  workflow: WorkflowDefinition,
  direction: 'LR' | 'TB' = 'LR'
): { nodes: WorkflowNode[]; edges: VisualWorkflowEdge[] } {
  if (!workflow.nodes || workflow.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 1. Build adjacency maps
  const nodeMap = new Map<string, WorkflowNode>();
  workflow.nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // Collect all edges (explicit + implied from node properties)
  const edges: VisualWorkflowEdge[] = [...(workflow.edges || [])];

  // Also include implied nextNodeId connections if missing from edges list
  workflow.nodes.forEach((n) => {
    if (n.nextNodeId && !edges.some((e) => e.source === n.id && e.target === n.nextNodeId)) {
      edges.push({
        id: `e_${n.id}_${n.nextNodeId}`,
        source: n.id,
        target: n.nextNodeId,
      });
    }
    if (n.config?.trueNextNodeId && !edges.some((e) => e.source === n.id && e.sourceHandle === 'true')) {
      edges.push({
        id: `e_true_${n.id}_${n.config.trueNextNodeId}`,
        source: n.id,
        sourceHandle: 'true',
        target: n.config.trueNextNodeId,
        label: 'Yes',
      });
    }
    if (n.config?.falseNextNodeId && !edges.some((e) => e.source === n.id && e.sourceHandle === 'false')) {
      edges.push({
        id: `e_false_${n.id}_${n.config.falseNextNodeId}`,
        source: n.id,
        sourceHandle: 'false',
        target: n.config.falseNextNodeId,
        label: 'No',
      });
    }
  });

  const childrenMap = new Map<string, string[]>();
  const parentCount = new Map<string, number>();

  workflow.nodes.forEach((n) => {
    childrenMap.set(n.id, []);
    parentCount.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (childrenMap.has(e.source) && nodeMap.has(e.target)) {
      childrenMap.get(e.source)!.push(e.target);
      parentCount.set(e.target, (parentCount.get(e.target) || 0) + 1);
    }
  });

  // 2. Identify root nodes (nodes with 0 incoming edges, or trigger nodes)
  const roots: string[] = [];
  workflow.nodes.forEach((n) => {
    const isTrigger = n.type.startsWith('trigger') || n.type === 'trigger';
    if ((parentCount.get(n.id) || 0) === 0 || isTrigger) {
      if (!roots.includes(n.id)) roots.push(n.id);
    }
  });

  if (roots.length === 0 && workflow.nodes.length > 0) {
    roots.push(workflow.nodes[0].id);
  }

  // 3. Assign topological depth (rank) to each node using BFS
  const nodeRank = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; rank: number }> = roots.map((id) => ({ id, rank: 0 }));

  roots.forEach((id) => nodeRank.set(id, 0));

  while (queue.length > 0) {
    const { id, rank } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      const currentRank = nodeRank.get(childId) || 0;
      const nextRank = Math.max(currentRank, rank + 1);
      nodeRank.set(childId, nextRank);
      queue.push({ id: childId, rank: nextRank });
    });
  }

  // Any unreached disconnected nodes get grouped at end rank
  let maxRank = 0;
  nodeRank.forEach((r) => {
    if (r > maxRank) maxRank = r;
  });

  workflow.nodes.forEach((n) => {
    if (!nodeRank.has(n.id)) {
      maxRank += 1;
      nodeRank.set(n.id, maxRank);
    }
  });

  // 4. Group nodes by rank
  const rankGroups = new Map<number, string[]>();
  nodeRank.forEach((rank, id) => {
    if (!rankGroups.has(rank)) rankGroups.set(rank, []);
    rankGroups.get(rank)!.push(id);
  });

  // 5. Position nodes with clean spacing
  const xSpacing = 340;
  const ySpacing = 180;
  const startX = 80;
  const startY = 120;

  const arrangedNodes: WorkflowNode[] = [];

  rankGroups.forEach((nodeIds, rank) => {
    const totalInRank = nodeIds.length;
    const yCenterOffset = ((totalInRank - 1) * ySpacing) / 2;

    nodeIds.forEach((id, index) => {
      const original = nodeMap.get(id)!;
      let posX = startX + rank * xSpacing;
      let posY = startY + index * ySpacing - (totalInRank > 1 ? yCenterOffset * 0.4 : 0);

      // Handle TB vs LR direction
      if (direction === 'TB') {
        const temp = posX;
        posX = posY;
        posY = temp;
      }

      arrangedNodes.push({
        ...original,
        position: {
          x: Math.round(posX),
          y: Math.round(posY),
        },
      });
    });
  });

  return {
    nodes: arrangedNodes,
    edges,
  };
}

/**
 * Builds a hierarchical tree structure for the Workflow Structure Panel (Layer Tree).
 * Example: Trigger ├ Message ├ Delay ├ Condition ├ Yes └ No
 */
export function buildWorkflowTree(workflow: WorkflowDefinition): WorkflowTreeNode[] {
  if (!workflow.nodes || workflow.nodes.length === 0) {
    return [];
  }

  const nodeMap = new Map<string, WorkflowNode>();
  workflow.nodes.forEach((n) => nodeMap.set(n.id, n));

  const validationErrors = validateWorkflow(workflow);
  const errorMap = new Map<string, string>();
  validationErrors.forEach((e) => errorMap.set(e.nodeId, e.message));

  // Determine edge connections with labels
  const childConnections = new Map<
    string,
    Array<{ targetId: string; label?: string }>
  >();

  workflow.nodes.forEach((n) => childConnections.set(n.id, []));

  // From explicit edges
  (workflow.edges || []).forEach((e) => {
    if (childConnections.has(e.source) && nodeMap.has(e.target)) {
      let label = e.label;
      if (!label) {
        if (e.sourceHandle === 'true') label = 'Yes';
        else if (e.sourceHandle === 'false') label = 'No';
      }
      childConnections.get(e.source)!.push({ targetId: e.target, label });
    }
  });

  // Implied connections
  workflow.nodes.forEach((n) => {
    const conns = childConnections.get(n.id) || [];
    if (n.nextNodeId && !conns.some((c) => c.targetId === n.nextNodeId)) {
      conns.push({ targetId: n.nextNodeId });
    }
    if (n.config?.trueNextNodeId && !conns.some((c) => c.targetId === n.config.trueNextNodeId)) {
      conns.push({ targetId: n.config.trueNextNodeId, label: 'Yes' });
    }
    if (n.config?.falseNextNodeId && !conns.some((c) => c.targetId === n.config.falseNextNodeId)) {
      conns.push({ targetId: n.config.falseNextNodeId, label: 'No' });
    }
  });

  // Find root nodes (triggers or 0 incoming)
  const incomingCount = new Map<string, number>();
  workflow.nodes.forEach((n) => incomingCount.set(n.id, 0));

  childConnections.forEach((targets) => {
    targets.forEach(({ targetId }) => {
      incomingCount.set(targetId, (incomingCount.get(targetId) || 0) + 1);
    });
  });

  const roots: WorkflowNode[] = [];
  workflow.nodes.forEach((n) => {
    const isTrigger = n.type.startsWith('trigger') || n.type === 'trigger';
    if ((incomingCount.get(n.id) || 0) === 0 || isTrigger) {
      if (!roots.some((r) => r.id === n.id)) roots.push(n);
    }
  });

  if (roots.length === 0 && workflow.nodes.length > 0) {
    roots.push(workflow.nodes[0]);
  }

  // Recursive tree builder with cycle guard
  const visitedGlobal = new Set<string>();

  function buildBranch(
    node: WorkflowNode,
    depth: number,
    branchLabel?: string,
    ancestors = new Set<string>()
  ): WorkflowTreeNode {
    visitedGlobal.add(node.id);
    const newAncestors = new Set(ancestors).add(node.id);

    const children: WorkflowTreeNode[] = [];
    const conns = childConnections.get(node.id) || [];

    conns.forEach(({ targetId, label }) => {
      // Prevent cyclic infinite loops
      if (newAncestors.has(targetId)) return;
      const childNode = nodeMap.get(targetId);
      if (childNode) {
        children.push(buildBranch(childNode, depth + 1, label, newAncestors));
      }
    });

    return {
      id: node.id,
      title: node.title || node.id,
      type: node.type,
      depth,
      branchLabel,
      children,
      hasError: errorMap.has(node.id),
      errorMessage: errorMap.get(node.id),
    };
  }

  const tree: WorkflowTreeNode[] = roots.map((root) => buildBranch(root, 0));

  // Add any orphaned disconnected nodes as top-level items
  workflow.nodes.forEach((n) => {
    if (!visitedGlobal.has(n.id)) {
      tree.push(buildBranch(n, 0, 'Orphaned'));
    }
  });

  return tree;
}
