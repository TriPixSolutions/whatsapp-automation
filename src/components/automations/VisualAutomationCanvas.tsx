'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomWorkflowNode, CustomNodeData } from './CustomWorkflowNode';
import { NodePalette, NodePaletteItem } from './NodePalette';
import { NodeConfigDrawer } from './NodeConfigDrawer';
import { RightLivePreviewPanel } from './RightLivePreviewPanel';
import {
  WorkflowDefinition,
  WorkflowNode,
  VisualWorkflowEdge,
  ExecutionTraceStep,
} from '@/types/automations';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Sparkles,
  Layers,
  Save,
  Check,
} from 'lucide-react';

interface VisualAutomationCanvasProps {
  workflow: WorkflowDefinition;
  onChangeWorkflow: (updated: WorkflowDefinition) => void;
  executionTrace?: ExecutionTraceStep[];
  isExecuting?: boolean;
  debugMode?: boolean;
}

const nodeTypes = {
  customNode: CustomWorkflowNode,
};

function VisualCanvasInner({
  workflow,
  onChangeWorkflow,
  executionTrace,
  isExecuting,
  debugMode,
}: VisualAutomationCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Map WorkflowNodes to ReactFlow Nodes
  const initialNodes: Node[] = useMemo(() => {
    return workflow.nodes.map((n, index) => {
      // Find execution step for this node if any
      const execStep = executionTrace?.find((s) => s.nodeId === n.id);
      let status: 'idle' | 'running' | 'completed' | 'failed' = 'idle';
      if (execStep) {
        if (execStep.status === 'failed') status = 'failed';
        else if (execStep.status === 'started') status = 'running';
        else status = 'completed';
      }

      return {
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 100 + index * 280, y: 150 },
        data: {
          ...n,
          status,
          executionDurationMs: execStep?.durationMs,
          errorMessage: execStep?.error,
          isSelected: n.id === selectedNodeId,
          onSelectNode: (id: string) => {
            setSelectedNodeId(id);
            setIsConfigOpen(true);
          },
          onDeleteNode: (id: string) => handleDeleteNode(id),
          onDuplicateNode: (id: string) => handleDuplicateNode(id),
        },
      };
    });
  }, [workflow.nodes, executionTrace, selectedNodeId]);

  // Map VisualWorkflowEdges to ReactFlow Edges
  const initialEdges: Edge[] = useMemo(() => {
    if (workflow.edges && workflow.edges.length > 0) {
      return workflow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        animated: e.animated || isExecuting,
        style: {
          stroke: e.sourceHandle === 'false' ? '#f43f5e' : '#10b981',
          strokeWidth: 2.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.sourceHandle === 'false' ? '#f43f5e' : '#10b981',
        },
      }));
    }

    // Fallback: derive sequential edges from nextNodeId
    const derived: Edge[] = [];
    workflow.nodes.forEach((n) => {
      if (n.nextNodeId) {
        derived.push({
          id: `e_${n.id}_${n.nextNodeId}`,
          source: n.id,
          target: n.nextNodeId,
          style: { stroke: '#10b981', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });
      }
      if (n.config?.trueNextNodeId) {
        derived.push({
          id: `e_true_${n.id}_${n.config.trueNextNodeId}`,
          source: n.id,
          sourceHandle: 'true',
          target: n.config.trueNextNodeId,
          label: 'True',
          style: { stroke: '#10b981', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });
      }
      if (n.config?.falseNextNodeId) {
        derived.push({
          id: `e_false_${n.id}_${n.config.falseNextNodeId}`,
          source: n.id,
          sourceHandle: 'false',
          target: n.config.falseNextNodeId,
          label: 'False',
          style: { stroke: '#f43f5e', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' },
        });
      }
    });
    return derived;
  }, [workflow.edges, workflow.nodes, isExecuting]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize when external workflow changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Propagate node position and structural updates to parent workflow
  const syncToParentWorkflow = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      const updatedNodes: WorkflowNode[] = newNodes.map((n) => {
        const existing = workflow.nodes.find((item) => item.id === n.id);
        const nodeData = n.data as any;
        return {
          id: n.id,
          type: nodeData.type || existing?.type || 'whatsapp_message',
          title: nodeData.title || existing?.title || 'Node',
          description: nodeData.description || existing?.description || '',
          triggerKeyword: nodeData.triggerKeyword || existing?.triggerKeyword,
          triggerType: nodeData.triggerType || existing?.triggerType,
          messageType: nodeData.messageType || existing?.messageType,
          config: nodeData.config || existing?.config || {},
          position: n.position,
          nextNodeId: existing?.nextNodeId,
        };
      });

      const updatedEdges: VisualWorkflowEdge[] = newEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: (e.label as string) || undefined,
        animated: e.animated,
      }));

      onChangeWorkflow({
        ...workflow,
        nodes: updatedNodes,
        edges: updatedEdges,
      });
    },
    [workflow, onChangeWorkflow]
  );

  // Connecting nodes using visual connection lines
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const isFalseBranch = params.sourceHandle === 'false';
        const color = isFalseBranch ? '#f43f5e' : '#10b981';
        const newEdge: Edge = {
          ...params,
          id: `edge_${params.source}_${params.sourceHandle || 'def'}_${params.target}`,
          animated: true,
          style: { stroke: color, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
        const updated = addEdge(newEdge, eds);
        syncToParentWorkflow(nodes, updated);
        return updated;
      });
    },
    [nodes, setEdges, syncToParentWorkflow]
  );

  // When node drag stops, sync positions
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      setNodes((nds) => {
        const updated = nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n));
        syncToParentWorkflow(updated, edges);
        return updated;
      });
    },
    [edges, setNodes, syncToParentWorkflow]
  );

  // Drag and drop node from NodePalette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData || !reactFlowBounds || !reactFlowInstance) return;

      const item: NodePaletteItem = JSON.parse(rawData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node_${Date.now()}`;
      const newWorkflowNode: WorkflowNode = {
        id: newNodeId,
        type: item.type,
        title: item.title,
        description: item.description,
        config: item.defaultConfig,
        position,
      };

      const updatedWorkflowNodes = [...workflow.nodes, newWorkflowNode];
      onChangeWorkflow({
        ...workflow,
        nodes: updatedWorkflowNodes,
      });

      setSelectedNodeId(newNodeId);
      setIsConfigOpen(true);
    },
    [reactFlowInstance, workflow, onChangeWorkflow]
  );

  // Add node from Palette click
  const handleAddNodeFromPalette = (item: NodePaletteItem) => {
    const newNodeId = `node_${Date.now()}`;
    const xOffset = 120 + (workflow.nodes.length % 5) * 60;
    const yOffset = 140 + (workflow.nodes.length % 4) * 80;

    const newWorkflowNode: WorkflowNode = {
      id: newNodeId,
      type: item.type,
      title: item.title,
      description: item.description,
      config: item.defaultConfig,
      position: { x: xOffset, y: yOffset },
    };

    const updatedWorkflowNodes = [...workflow.nodes, newWorkflowNode];
    onChangeWorkflow({
      ...workflow,
      nodes: updatedWorkflowNodes,
    });

    setSelectedNodeId(newNodeId);
    setIsConfigOpen(true);
  };

  // Node editing from drawer
  const handleUpdateNode = (updated: WorkflowNode) => {
    const updatedList = workflow.nodes.map((n) => (n.id === updated.id ? updated : n));
    onChangeWorkflow({
      ...workflow,
      nodes: updatedList,
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = workflow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = (workflow.edges || []).filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    onChangeWorkflow({
      ...workflow,
      nodes: updatedNodes,
      edges: updatedEdges,
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setIsConfigOpen(false);
    }
  };

  const handleDuplicateNode = (nodeId: string) => {
    const original = workflow.nodes.find((n) => n.id === nodeId);
    if (!original) return;

    const cloneId = `node_${Date.now()}`;
    const clone: WorkflowNode = {
      ...original,
      id: cloneId,
      title: `${original.title} (Copy)`,
      position: {
        x: (original.position?.x || 100) + 40,
        y: (original.position?.y || 100) + 40,
      },
    };

    onChangeWorkflow({
      ...workflow,
      nodes: [...workflow.nodes, clone],
    });

    setSelectedNodeId(cloneId);
  };

  const selectedNode = workflow.nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-950 select-none">
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0B0F19]"
        >
          {/* Infinite Canvas Background Grid */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#273347"
            className="opacity-70"
          />

          {/* Controls: Zoom In, Zoom Out, Fit */}
          <Controls
            showInteractive={false}
            className="!bg-gray-900 !border !border-gray-800 !rounded-xl !p-1 !shadow-2xl [&>button]:!bg-gray-900 [&>button]:!border-gray-800 [&>button]:!text-gray-300 hover:[&>button]:!text-white hover:[&>button]:!bg-gray-800"
          />

          {/* MiniMap */}
          <MiniMap
            nodeColor={(n: any) => {
              const type = n.data?.type || '';
              if (type.startsWith('trigger')) return '#f59e0b';
              if (type.includes('button')) return '#06b6d4';
              if (type.includes('carousel')) return '#a855f7';
              if (type.includes('condition')) return '#6366f1';
              return '#10b981';
            }}
            maskColor="rgba(11, 15, 25, 0.85)"
            className="!bg-gray-950 !border !border-gray-800 !rounded-xl !shadow-2xl overflow-hidden"
          />

          {/* Top Canvas Controls Panel */}
          <Panel position="top-center" className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-900/90 border border-gray-800/90 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs text-gray-300">
              <span className="font-semibold text-white">{workflow.nodes.length} Nodes</span>
              <span className="text-gray-600">·</span>
              <span className="font-mono text-emerald-400">{edges.length} Connections</span>
              {debugMode && (
                <>
                  <span className="text-gray-600">·</span>
                  <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    DEBUG ON
                  </span>
                </>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Left Collapsible Node Library Palette */}
      <NodePalette
        isOpen={isPaletteOpen}
        onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
        onAddNode={handleAddNodeFromPalette}
      />

      {/* Node Configuration Drawer (Active when a node is selected) */}
      <NodeConfigDrawer
        node={selectedNode}
        isOpen={isConfigOpen && selectedNode !== null}
        onClose={() => setIsConfigOpen(false)}
        onUpdate={handleUpdateNode}
        onDelete={handleDeleteNode}
        onDuplicate={handleDuplicateNode}
      />

      {/* Right Side Live WhatsApp Phone Preview */}
      <RightLivePreviewPanel
        selectedNode={selectedNode}
        allNodes={workflow.nodes}
        executionTrace={executionTrace}
        isOpen={isPreviewOpen}
        onToggle={() => setIsPreviewOpen(!isPreviewOpen)}
      />
    </div>
  );
}

export function VisualAutomationCanvas(props: VisualAutomationCanvasProps) {
  return (
    <ReactFlowProvider>
      <VisualCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
