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
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomWorkflowNode } from './CustomWorkflowNode';
import { LeftWorkflowSidebar, NodePaletteItem } from './LeftWorkflowSidebar';
import { RightInspectorStudio } from './RightInspectorStudio';
import {
  WorkflowDefinition,
  WorkflowNode,
  VisualWorkflowEdge,
  ExecutionTraceStep,
} from '@/types/automations';
import { autoArrangeDAG, validateWorkflow } from '@/lib/automations/dagLayout';
import { cn } from '@/lib/utils';
import {
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Grid,
  Magnet,
  Maximize2,
  SlidersHorizontal,
  Play,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  FolderTree,
  Sparkles,
  Save,
  Check,
  Zap,
  ChevronDown,
  Plus,
} from 'lucide-react';

interface VisualAutomationCanvasProps {
  workflow: WorkflowDefinition;
  onChangeWorkflow: (updated: WorkflowDefinition) => void;
  workflows?: WorkflowDefinition[];
  onSelectWorkflow?: (workflowId: string) => void;
  onCreateWorkflow?: () => void;
  executionTrace?: ExecutionTraceStep[];
  isExecuting?: boolean;
  debugMode?: boolean;
  onRunTest?: () => void;
  onOpenLogs?: () => void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
}

const nodeTypes = {
  customNode: CustomWorkflowNode,
};

function VisualCanvasInner({
  workflow,
  onChangeWorkflow,
  workflows,
  onSelectWorkflow,
  onCreateWorkflow,
  executionTrace,
  isExecuting,
  debugMode,
  onRunTest,
  onOpenLogs,
  isSaving,
  lastSavedAt,
}: VisualAutomationCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Studio Docking States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Canvas View Settings
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridVariant, setGridVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);

  // Undo / Redo History Stacks
  const [historyPast, setHistoryPast] = useState<WorkflowDefinition[]>([]);
  const [historyFuture, setHistoryFuture] = useState<WorkflowDefinition[]>([]);

  // Clipboard for Copy / Paste
  const copiedNodeRef = useRef<WorkflowNode | null>(null);

  // Calculate live validation errors
  const validationErrors = useMemo(() => {
    return validateWorkflow(workflow);
  }, [workflow]);

  // Push new state onto history before mutation
  const pushHistory = useCallback(
    (current: WorkflowDefinition) => {
      setHistoryPast((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(current))]);
      setHistoryFuture([]);
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [JSON.parse(JSON.stringify(workflow)), ...prev]);
    onChangeWorkflow(previous);
  }, [historyPast, workflow, onChangeWorkflow]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, JSON.parse(JSON.stringify(workflow))]);
    onChangeWorkflow(next);
  }, [historyFuture, workflow, onChangeWorkflow]);

  // Map WorkflowNodes to ReactFlow Nodes
  const initialNodes: Node[] = useMemo(() => {
    return workflow.nodes.map((n, index) => {
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
        position: n.position || { x: 100 + index * 320, y: 160 },
        selected: n.id === selectedNodeId,
        data: {
          ...n,
          status,
          executionDurationMs: execStep?.durationMs,
          errorMessage: execStep?.error,
          isSelected: n.id === selectedNodeId,
          onSelectNode: (id: string) => {
            setSelectedNodeId(id);
            setIsRightPanelOpen(true);
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
      return workflow.edges.map((e) => {
        const isFalse = e.sourceHandle === 'false' || e.label?.toLowerCase() === 'no';
        const color = isFalse ? '#f43f5e' : '#10b981';
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label,
          animated: e.animated || isExecuting,
          style: {
            stroke: color,
            strokeWidth: 2.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
          },
        };
      });
    }

    // Fallback: derive connections from node configuration
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
          label: 'Yes',
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
          label: 'No',
          style: { stroke: '#f43f5e', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' },
        });
      }
    });
    return derived;
  }, [workflow.edges, workflow.nodes, isExecuting]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync ReactFlow internal state when workflow prop changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Synchronize changes to parent workflow
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

  // Connecting nodes with directional arrows
  const onConnect = useCallback(
    (params: Connection) => {
      pushHistory(workflow);
      setEdges((eds) => {
        const isFalse = params.sourceHandle === 'false';
        const color = isFalse ? '#f43f5e' : '#10b981';
        const label = isFalse ? 'No' : params.sourceHandle === 'true' ? 'Yes' : undefined;
        const newEdge: Edge = {
          ...params,
          id: `edge_${params.source}_${params.sourceHandle || 'def'}_${params.target}`,
          label,
          animated: true,
          style: { stroke: color, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
        const updated = addEdge(newEdge, eds);
        syncToParentWorkflow(nodes, updated);
        return updated;
      });
    },
    [workflow, nodes, pushHistory, setEdges, syncToParentWorkflow]
  );

  // Node Drag Stop
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

  // Auto Arrange (DAG Layout Algorithm)
  const handleAutoArrange = useCallback(() => {
    pushHistory(workflow);
    const arranged = autoArrangeDAG(workflow, 'LR');
    onChangeWorkflow({
      ...workflow,
      nodes: arranged.nodes,
      edges: arranged.edges,
    });
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      }
    }, 50);
  }, [workflow, pushHistory, onChangeWorkflow, reactFlowInstance]);

  // Duplicate Node
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const source = workflow.nodes.find((n) => n.id === nodeId);
      if (!source) return;
      pushHistory(workflow);

      const duplicatedId = `node_${Date.now()}`;
      const duplicated: WorkflowNode = {
        ...JSON.parse(JSON.stringify(source)),
        id: duplicatedId,
        title: `${source.title} (Copy)`,
        position: {
          x: (source.position?.x || 100) + 40,
          y: (source.position?.y || 160) + 40,
        },
      };

      const updatedNodes = [...workflow.nodes, duplicated];
      onChangeWorkflow({ ...workflow, nodes: updatedNodes });
      setSelectedNodeId(duplicatedId);
    },
    [workflow, pushHistory, onChangeWorkflow]
  );

  // Delete Node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      pushHistory(workflow);
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
      }
    },
    [workflow, selectedNodeId, pushHistory, onChangeWorkflow]
  );

  // Copy Node
  const handleCopyNode = useCallback(() => {
    if (!selectedNodeId) return;
    const target = workflow.nodes.find((n) => n.id === selectedNodeId);
    if (target) {
      copiedNodeRef.current = target;
    }
  }, [selectedNodeId, workflow.nodes]);

  // Paste Node
  const handlePasteNode = useCallback(() => {
    if (!copiedNodeRef.current) return;
    handleDuplicateNode(copiedNodeRef.current.id);
  }, [handleDuplicateNode]);

  // Drag and drop from Left Panel
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData || !reactFlowInstance) return;

      const item: NodePaletteItem = JSON.parse(rawData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      pushHistory(workflow);
      const newNodeId = `node_${Date.now()}`;
      const newWorkflowNode: WorkflowNode = {
        id: newNodeId,
        type: item.type,
        title: item.title,
        description: item.description,
        config: item.defaultConfig,
        position,
      };

      onChangeWorkflow({
        ...workflow,
        nodes: [...workflow.nodes, newWorkflowNode],
      });

      setSelectedNodeId(newNodeId);
      setIsRightPanelOpen(true);
    },
    [reactFlowInstance, workflow, pushHistory, onChangeWorkflow]
  );

  // Add node from Left Panel single-click
  const handleAddNodeFromSidebar = useCallback(
    (item: NodePaletteItem) => {
      pushHistory(workflow);
      const newNodeId = `node_${Date.now()}`;
      const offset = (workflow.nodes.length % 6) * 50;
      const newWorkflowNode: WorkflowNode = {
        id: newNodeId,
        type: item.type,
        title: item.title,
        description: item.description,
        config: item.defaultConfig,
        position: {
          x: 180 + offset,
          y: 160 + offset,
        },
      };

      onChangeWorkflow({
        ...workflow,
        nodes: [...workflow.nodes, newWorkflowNode],
      });

      setSelectedNodeId(newNodeId);
      setIsRightPanelOpen(true);
    },
    [workflow, pushHistory, onChangeWorkflow]
  );

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      if (isInput) return;

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopyNode();
      }
      // Paste (Ctrl+V / Cmd+V)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteNode();
      }
      // Delete / Backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
      }
      // Undo (Ctrl+Z / Cmd+Z)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo (Ctrl+Y or Cmd+Shift+Z)
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Escape (Deselect)
      else if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, handleCopyNode, handlePasteNode, handleDeleteNode, handleUndo, handleRedo]);

  const selectedNode = useMemo(() => {
    return workflow.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [workflow.nodes, selectedNodeId]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-white select-none relative">
      {/* ============================================================== */}
      {/* STUDIO TOP TOOLBAR */}
      {/* ============================================================== */}
      <div className="h-14 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 flex items-center justify-between z-10 shrink-0 mb-3 shadow-lg backdrop-blur-md">
        {/* Left: Workflow Selector & Name */}
        <div className="flex items-center gap-3">
          {workflows && workflows.length > 0 && onSelectWorkflow && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={workflow.id}
                  onChange={(e) => onSelectWorkflow(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer max-w-[170px] truncate"
                >
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {onCreateWorkflow && (
                <button
                  onClick={onCreateWorkflow}
                  title="Create New Workflow"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}
              <div className="w-px h-5 bg-slate-800 mx-1 shrink-0" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => onChangeWorkflow({ ...workflow, name: e.target.value })}
                className="bg-transparent text-sm font-bold text-white focus:bg-slate-800 px-1.5 py-0.5 rounded outline-none border border-transparent focus:border-slate-700 transition-colors max-w-[160px] sm:max-w-xs truncate"
              />
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0',
                  workflow.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                )}
              >
                {workflow.isActive ? 'Active' : 'Draft'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 pl-1.5 flex items-center gap-2">
              <span>{workflow.nodes.length} Nodes</span>
              <span>•</span>
              <span>{(workflow.edges || []).length} Connections</span>
              {validationErrors.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors.length} issues
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Canvas Controls (Undo, Redo, Auto-Arrange, Snap, Grid) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={handleUndo}
            disabled={historyPast.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyFuture.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

          <button
            onClick={handleAutoArrange}
            title="Auto-Arrange Nodes (DAG Layout)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto Arrange</span>
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Toggle Snap to Grid"
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              snapToGrid ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            )}
          >
            <Magnet className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              setGridVariant(
                gridVariant === BackgroundVariant.Dots
                  ? BackgroundVariant.Lines
                  : BackgroundVariant.Dots
              )
            }
            title="Toggle Grid (Dots / Lines)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Grid className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

          {selectedNodeId && (
            <>
              <button
                onClick={handleCopyNode}
                title="Copy Node (Ctrl+C)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteNode(selectedNodeId)}
                title="Delete Selected Node (Del)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Right: Actions (Run Test, Logs, Save Status) */}
        <div className="flex items-center gap-2.5">
          {/* Auto-Save Indicator */}
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            {isSaving ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Saving...</span>
              </>
            ) : lastSavedAt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-500">Saved</span>
              </>
            ) : null}
          </div>

          {onOpenLogs && (
            <button
              onClick={onOpenLogs}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all"
            >
              Logs
            </button>
          )}

          {onRunTest && (
            <button
              onClick={onRunTest}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Test</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3-COLUMN STUDIO LAYOUT */}
      {/* ============================================================== */}
      <div className="flex-1 flex min-h-0 gap-4 overflow-hidden relative">
        {/* 1. Left Panel (Node Library & Layer Tree) */}
        <LeftWorkflowSidebar
          workflow={workflow}
          onAddNode={handleAddNodeFromSidebar}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            if (reactFlowInstance) {
              const target = workflow.nodes.find((n) => n.id === id);
              if (target?.position) {
                reactFlowInstance.setCenter(target.position.x + 120, target.position.y + 60, {
                  zoom: 1.1,
                  duration: 400,
                });
              }
            }
          }}
          selectedNodeId={selectedNodeId}
          isOpen={isLeftPanelOpen}
          onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        />

        {/* 2. Center Canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 h-full rounded-2xl border border-slate-800 bg-slate-950 shadow-inner overflow-hidden relative min-w-[320px]"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            snapToGrid={snapToGrid}
            snapGrid={[15, 15]}
            selectionMode={SelectionMode.Partial}
            selectNodesOnDrag={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2.0}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#10b981', strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
            }}
          >
            <Background
              variant={gridVariant}
              gap={16}
              size={1.5}
              color="rgba(148, 163, 184, 0.15)"
            />
            <Controls
              showInteractive={false}
              className="!bg-slate-900 !border-slate-800 !rounded-xl !shadow-2xl overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-800 [&>button:hover]:!text-white"
            />
            <MiniMap
              nodeStrokeColor="#10b981"
              nodeColor="#1e293b"
              maskColor="rgba(2, 6, 23, 0.75)"
              className="!bg-slate-950/90 !border !border-slate-800 !rounded-xl !shadow-2xl overflow-hidden"
            />
          </ReactFlow>
        </div>

        {/* 3. Right Panel (Node Inspector & Real WhatsApp Mobile Preview) */}
        <RightInspectorStudio
          selectedNode={selectedNode}
          allNodes={workflow.nodes}
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(!isRightPanelOpen)}
          onUpdateNode={(updated) => {
            const updatedNodes = workflow.nodes.map((n) => (n.id === updated.id ? updated : n));
            onChangeWorkflow({
              ...workflow,
              nodes: updatedNodes,
            });
          }}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            if (reactFlowInstance) {
              const target = workflow.nodes.find((n) => n.id === id);
              if (target?.position) {
                reactFlowInstance.setCenter(target.position.x + 120, target.position.y + 60, {
                  zoom: 1.1,
                  duration: 400,
                });
              }
            }
          }}
          validationErrors={validationErrors}
        />
      </div>
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
