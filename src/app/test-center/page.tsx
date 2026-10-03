'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, FlaskConical, MessageSquare, Play, RefreshCw, Send, Smartphone } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import { ExecutionTraceStep, WorkflowDefinition, WorkflowExecutionLog, WebhookLogItem } from '@/types/automations';
import { messageFromWorkflowNode, toWhatsAppPreview } from '@/lib/whatsapp/messageModel';

type LabMode = 'sandbox' | 'live';

export default function AutomationLabPage() {
  const [mode, setMode] = useState<LabMode>('sandbox');
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [message, setMessage] = useState('hello');
  const [execution, setExecution] = useState<WorkflowExecutionLog | null>(null);
  const [lastInbound, setLastInbound] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [connection, setConnection] = useState<'checking' | 'connected' | 'attention'>('checking');
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) || null,
    [workflows, selectedWorkflowId],
  );

  const loadProductState = useCallback(async () => {
    const [workflowResponse, connectionResponse, settingsResponse] = await Promise.all([
      fetch('/api/automations'),
      fetch('/api/test-center/meta-validate'),
      fetch('/api/settings'),
    ]);
    const workflowResult = await workflowResponse.json().catch(() => []);
    const connectionResult = await connectionResponse.json().catch(() => ({}));
    const settingsResult = await settingsResponse.json().catch(() => ({}));
    const saved = Array.isArray(workflowResult) ? workflowResult : [];
    setWorkflows(saved);
    setSelectedWorkflowId((current) => saved.some((workflow) => workflow.id === current) ? current : saved[0]?.id || '');
    setConnection(connectionResponse.ok && connectionResult.valid && connectionResult.webhookActive ? 'connected' : 'attention');
    setDisplayPhoneNumber(settingsResult.displayPhoneNumber || settingsResult.phoneNumber || '');
  }, []);

  const loadLiveActivity = useCallback(async () => {
    const response = await fetch('/api/test-center/logs?type=webhooks&limit=25');
    const result = await response.json().catch(() => ({}));
    if (response.ok) setWebhookLogs(Array.isArray(result.webhookLogs) ? result.webhookLogs : []);
  }, []);

  useEffect(() => {
    loadProductState().catch(() => {
      setConnection('attention');
      setError('Automation Lab could not load the current workspace state.');
    });
    loadLiveActivity().catch(() => {});
  }, [loadProductState, loadLiveActivity]);

  const runSandboxEvent = async (payload: Record<string, unknown>) => {
    if (!selectedWorkflowId) {
      setError('Create or select a workflow first.');
      return;
    }
    setRunning(true);
    setError('');
    try {
      const response = await fetch('/api/test-center/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          phoneNumber: '+15550001111',
          ...payload,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.error || 'The sandbox event could not be processed.');
      const nextExecution = result.activeExecution || result.executions?.[0];
      if (!nextExecution) throw new Error(result.message || 'This input did not match the selected workflow trigger.');
      setExecution(nextExecution);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The sandbox event could not be processed.');
    } finally {
      setRunning(false);
    }
  };

  const startConversation = async () => {
    setExecution(null);
    setLastInbound(message);
    await runSandboxEvent({ simulationType: 'keyword_trigger', text: message });
  };

  const chooseReply = async (id: string, title: string, carousel = false) => {
    setLastInbound(title);
    await runSandboxEvent({
      simulationType: carousel ? 'carousel_click' : 'button_click',
      buttonId: carousel ? undefined : id,
      buttonTitle: title,
      cardButtonId: carousel ? id : undefined,
    });
  };

  const conversationMessages = useMemo(() => {
    if (!selectedWorkflow || !execution) return [];
    const seen = new Set<string>();
    return execution.steps.flatMap((step) => {
      if (!['message_sent', 'waiting_user_action'].includes(step.status) || seen.has(step.nodeId)) return [];
      const node = selectedWorkflow.nodes.find((item) => item.id === step.nodeId);
      const model = node ? messageFromWorkflowNode(node) : null;
      if (!model) return [];
      seen.add(step.nodeId);
      return [{ nodeId: step.nodeId, model: toWhatsAppPreview(model) }];
    });
  }, [execution, selectedWorkflow]);

  const currentNode = selectedWorkflow?.nodes.find((node) => node.id === execution?.currentNodeId);
  const currentModel = currentNode ? messageFromWorkflowNode(currentNode) : null;
  const waitingChoices = execution?.status === 'waiting'
    ? currentModel?.kind === 'carousel'
      ? (currentModel.cards || []).flatMap((card) => card.buttons)
      : currentModel?.kind === 'list'
        ? (currentModel.sections || []).flatMap((section) => section.rows)
        : currentModel?.buttons || execution.waitingOptions || []
    : [];

  return (
    <div className="min-h-screen bg-slate-50 md:pl-60">
      <Sidebar />
      <Header title="Automation Lab" subtitle="Understand what the customer sees and why each workflow step runs" />
      <main className="space-y-5 p-4 md:p-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-950 p-2.5 text-emerald-400"><FlaskConical className="h-5 w-5" /></div>
            <div>
              <h1 className="font-bold text-slate-950">Test one workflow at a time</h1>
              <p className="text-sm text-slate-500">Sandbox is synthetic and isolated. Live activity comes only from Meta webhooks.</p>
            </div>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            <button onClick={() => setMode('sandbox')} className={cn('rounded-lg px-4 py-2', mode === 'sandbox' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500')}>Sandbox test</button>
            <button onClick={() => setMode('live')} className={cn('rounded-lg px-4 py-2', mode === 'live' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500')}>Real WhatsApp test</button>
          </div>
        </section>

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        {mode === 'sandbox' ? (
          <div className="grid min-h-[650px] grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(380px,1fr)_360px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-bold text-slate-950">1. Choose the test</h2>
              <label className="mt-5 block text-xs font-semibold text-slate-600">Workflow</label>
              <select value={selectedWorkflowId} onChange={(event) => { setSelectedWorkflowId(event.target.value); setExecution(null); setError(''); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900">
                {workflows.length === 0 && <option value="">No workflows yet</option>}
                {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
              </select>
              <label className="mt-4 block text-xs font-semibold text-slate-600">Customer message</label>
              <input value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900" placeholder="hello" />
              <button onClick={startConversation} disabled={running || !selectedWorkflowId} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Play className="h-4 w-4" />{running ? 'Running…' : 'Start conversation'}</button>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                No WhatsApp message is sent. The session and execution trace are stored separately from live customers.
              </div>
            </section>

            <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#efeae2] shadow-sm">
              <div className="flex items-center gap-3 bg-[#008069] px-4 py-3 text-white">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><MessageSquare className="h-5 w-5" /></div>
                <div><h2 className="text-sm font-bold">Sandbox customer</h2><p className="text-xs text-white/80">Synthetic conversation · no real delivery</p></div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {!execution && <div className="mx-auto mt-20 max-w-sm rounded-xl bg-white/80 p-4 text-center text-sm text-slate-600">Start the conversation to see the exact message content produced by the selected workflow.</div>}
                {lastInbound && execution && <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-4 py-2.5 text-sm text-slate-900 shadow-sm">{lastInbound}</div>}
                {conversationMessages.map(({ nodeId, model }) => (
                  <div key={nodeId} className="mr-auto max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-slate-900 shadow-sm">
                    {model.mediaUrl && model.kind === 'image' && <img src={model.mediaUrl} alt="Uploaded WhatsApp media" className="mb-2 max-h-48 w-full rounded-xl object-cover" />}
                    {model.title && <p className="mb-1 font-bold">{model.title}</p>}
                    <p className="whitespace-pre-wrap">{model.body}</p>
                    {model.footer && <p className="mt-2 text-xs text-slate-500">{model.footer}</p>}
                    {model.kind === 'carousel' && <p className="mt-2 text-xs font-semibold text-purple-700">{model.cards?.length || 0} carousel cards</p>}
                  </div>
                ))}
                {waitingChoices.length > 0 && (
                  <div className="mr-auto grid w-[88%] gap-1.5">
                    {waitingChoices.map((choice: any) => (
                      <button key={choice.id} disabled={running} onClick={() => chooseReply(choice.id, choice.title, currentModel?.kind === 'carousel')} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#008069] shadow-sm disabled:opacity-50">{choice.title}</button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-bold text-slate-950">3. Why it happened</h2><Activity className="h-4 w-4 text-slate-400" /></div>
              <div className="mt-4 space-y-3">
                {!execution && <p className="text-sm text-slate-500">Execution steps will appear here.</p>}
                {(execution?.steps || []).map((step: ExecutionTraceStep, index) => (
                  <div key={`${step.nodeId}-${index}`} className="flex gap-3">
                    {step.status === 'failed' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                    <div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{step.nodeTitle}</p><p className="text-xs capitalize text-slate-500">{step.status.replaceAll('_', ' ')}</p>{step.error && <p className="mt-1 text-xs text-rose-600">{step.error}</p>}</div>
                  </div>
                ))}
              </div>
              {execution && <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Advanced debug</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] text-slate-600">{JSON.stringify(execution, null, 2)}</pre></details>}
            </section>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-bold text-slate-950">Real test status</h2><span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', connection === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800')}>{connection === 'checking' ? 'Checking' : connection === 'connected' ? 'Connected' : 'Attention required'}</span></div>
              <ol className="mt-5 space-y-4 text-sm text-slate-700">
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">1</span><span>Open WhatsApp on the recipient registered in Meta’s test-number panel.</span></li>
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">2</span><span>Send the selected workflow keyword to the connected Meta test number{displayPhoneNumber ? ` (${displayPhoneNumber})` : ''}.</span></li>
                <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">3</span><span>Tap the real WhatsApp button or list option, then refresh activity here.</span></li>
              </ol>
              <button onClick={() => { loadProductState(); loadLiveActivity(); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800"><RefreshCw className="h-4 w-4" />Refresh live activity</button>
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">This mode never creates a synthetic inbound event. Only signed Meta callbacks appear as live activity.</div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-950">Live webhook activity</h2><p className="text-sm text-slate-500">Actual callbacks received from Meta</p></div><Smartphone className="h-5 w-5 text-emerald-600" /></div>
              <div className="mt-5 divide-y divide-slate-100">
                {webhookLogs.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No live webhook activity is available yet.</div>}
                {webhookLogs.map((log) => (
                  <details key={log.id} className="py-3"><summary className="flex cursor-pointer items-center justify-between gap-4 text-sm"><span className="font-semibold text-slate-800">{log.eventType.replaceAll('_', ' ')}</span><span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span></summary><pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] text-slate-200">{JSON.stringify(log.payload, null, 2)}</pre></details>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
