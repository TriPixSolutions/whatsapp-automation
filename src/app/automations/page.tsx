'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { VisualAutomationCanvas } from '@/components/automations/VisualAutomationCanvas';
import { TestWorkflowModal } from '@/components/automations/TestWorkflowModal';
import { ExecutionLogsModal } from '@/components/automations/ExecutionLogsModal';
import { ExecutionTraceStep, WorkflowDefinition, WorkflowExecutionLog } from '@/types/automations';
import { cn } from '@/lib/utils';

function newDraftWorkflow(): WorkflowDefinition {
  const createdAt = new Date().toISOString();
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const triggerId = `trigger_${suffix}`;
  const messageId = `message_${suffix}`;
  return {
    id: `workflow_${suffix}`,
    workspaceId: 'default',
    name: 'New WhatsApp workflow',
    description: 'Starts when a customer sends “hello”.',
    triggerType: 'keyword',
    triggerKeyword: 'hello',
    triggerMatchPattern: 'contains',
    isActive: false,
    executionCount: 0,
    nodes: [
      {
        id: triggerId,
        type: 'trigger_keyword',
        title: 'Customer says hello',
        description: 'Starts this workflow when the message contains hello.',
        config: { text: 'hello', triggerKeyword: 'hello' },
        position: { x: 80, y: 180 },
        nextNodeId: messageId,
      },
      {
        id: messageId,
        type: 'whatsapp_message',
        title: 'Welcome message',
        description: 'The first response the customer receives.',
        config: { text: 'Hello! How can we help you today?' },
        position: { x: 420, y: 180 },
      },
    ],
    edges: [{ id: `edge_${suffix}`, source: triggerId, target: messageId, animated: true }],
    createdAt,
    updatedAt: createdAt,
  };
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowError, setWorkflowError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [lastExecution, setLastExecution] = useState<WorkflowExecutionLog | null>(null);
  const [executionTrace, setExecutionTrace] = useState<ExecutionTraceStep[]>([]);
  const [isNavSidebarCollapsed, setIsNavSidebarCollapsed] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setWorkflowError('');
    try {
      const response = await fetch('/api/automations');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Saved workflows could not be loaded.');
      if (!Array.isArray(result)) throw new Error('The workflow response is invalid.');
      setWorkflows(result);
      setActiveWorkflow((current) => result.find((item) => item.id === current?.id) || result[0] || null);
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Saved workflows could not be loaded.');
      setWorkflows([]);
      setActiveWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  useEffect(() => {
    try { setIsNavSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true'); } catch {}
    const handleCollapse = (event: Event) => {
      setIsNavSidebarCollapsed(Boolean((event as CustomEvent).detail?.collapsed));
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    };
    window.addEventListener('sidebar-collapse', handleCollapse);
    return () => window.removeEventListener('sidebar-collapse', handleCollapse);
  }, []);

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);

  const saveWorkflow = useCallback(async (workflow: WorkflowDefinition) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      const result = await response.json();
      if (!response.ok) {
        const extra = Array.isArray(result.details) && result.details.length > 1 ? ` ${result.details.slice(1).join(' ')}` : '';
        throw new Error(`${result.error || 'Workflow was not saved.'}${extra}`);
      }
      setWorkflowError('');
      setLastSavedAt(new Date().toLocaleTimeString());
      setWorkflows((items) => items.map((item) => item.id === result.id ? result : item));
      setActiveWorkflow((current) => current?.id === result.id ? result : current);
      return result as WorkflowDefinition;
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Workflow was not saved.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleWorkflowChange = useCallback((updated: WorkflowDefinition) => {
    setActiveWorkflow(updated);
    setWorkflows((items) => items.map((item) => item.id === updated.id ? updated : item));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveWorkflow(updated), 800);
  }, [saveWorkflow]);

  const handleCreateWorkflow = useCallback(async () => {
    const draft = newDraftWorkflow();
    setWorkflowError('');
    setWorkflows((items) => [draft, ...items]);
    setActiveWorkflow(draft);
    const saved = await saveWorkflow(draft);
    if (!saved) {
      setWorkflows((items) => items.filter((item) => item.id !== draft.id));
      setActiveWorkflow(null);
    }
  }, [saveWorkflow]);

  const handleRunTestWorkflow = async (payload: { phoneNumber: string; text: string; simulationType: string }) => {
    if (!activeWorkflow) throw new Error('Choose a workflow first.');
    setIsExecutingTest(true);
    try {
      const response = await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: activeWorkflow.id,
          phoneNumber: payload.phoneNumber,
          text: payload.text,
          simulationType: payload.simulationType,
          buttonId: ['button_click', 'list_selection'].includes(payload.simulationType) ? payload.text : undefined,
          cardButtonId: payload.simulationType === 'carousel_click' ? payload.text : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.error || 'The sandbox test could not run.');
      const execution: WorkflowExecutionLog | undefined = result.activeExecution || result.executions?.[0];
      if (!execution) throw new Error(result.message || 'No workflow matched this test input.');
      setLastExecution(execution);
      for (let index = 0; index < execution.steps.length; index++) {
        setExecutionTrace(execution.steps.slice(0, index + 1));
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      return execution;
    } finally {
      setIsExecutingTest(false);
    }
  };

  return (
    <div className={cn('flex h-screen overflow-hidden bg-slate-950 text-white transition-all', isNavSidebarCollapsed ? 'pl-0 md:pl-[68px]' : 'pl-0 md:pl-60')}>
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
        {workflowError && (
          <div role="alert" className="mb-3 flex items-start justify-between gap-4 rounded-xl border border-red-500/30 bg-red-950/70 px-4 py-3 text-sm text-red-100">
            <span>{workflowError}</span>
            <button onClick={() => setWorkflowError('')} className="font-semibold text-red-200">Dismiss</button>
          </div>
        )}
        {loading ? (
          <div className="grid h-full place-items-center text-slate-400">Loading your workflows…</div>
        ) : !activeWorkflow ? (
          <div className="grid h-full place-items-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
            <div>
              <h1 className="text-2xl font-semibold">Create your first WhatsApp workflow</h1>
              <p className="mt-2 max-w-md text-slate-400">Start with a customer trigger and a welcome message. Add choices only when you need them.</p>
              <button onClick={handleCreateWorkflow} className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">Create workflow</button>
            </div>
          </div>
        ) : (
          <VisualAutomationCanvas
            workflow={activeWorkflow}
            onChangeWorkflow={handleWorkflowChange}
            workflows={workflows}
            onSelectWorkflow={(id) => {
              const selected = workflows.find((workflow) => workflow.id === id);
              if (selected) { setActiveWorkflow(selected); setExecutionTrace([]); setLastExecution(null); }
            }}
            onCreateWorkflow={handleCreateWorkflow}
            executionTrace={executionTrace}
            isExecuting={isExecutingTest}
            onRunTest={() => setIsTestModalOpen(true)}
            onOpenLogs={() => setIsLogsModalOpen(true)}
            isSaving={isSaving}
            lastSavedAt={lastSavedAt}
          />
        )}
      </main>

      {activeWorkflow && <TestWorkflowModal workflow={activeWorkflow} isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} onRunTest={handleRunTestWorkflow} isRunning={isExecutingTest} lastExecution={lastExecution} />}
      {activeWorkflow && <ExecutionLogsModal workflowId={activeWorkflow.id} isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} />}
    </div>
  );
}
