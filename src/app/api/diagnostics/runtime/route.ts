import { getAuthorizedUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { workflowValidationErrors } from '@/lib/automations/validateWorkflow';
import { SettingsDB, WebhookEventsDB } from '@/lib/db';
import { database } from '@/lib/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckStatus = 'ready' | 'attention' | 'not_observable';

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const workspaceId = user.workspaceId!;
    const [settings, workflows, executions, webhookEvents] = await Promise.all([
      SettingsDB.get(workspaceId),
      TestCenterStore.listWorkflows(workspaceId),
      TestCenterStore.getExecutionLogs({ workspaceId, limit: 25 }),
      WebhookEventsDB.list(workspaceId, 25),
    ]);

    const activeWorkflows = workflows.filter((workflow) => workflow.isActive);
    const invalidActiveWorkflows = activeWorkflows
      .map((workflow) => ({ id: workflow.id, name: workflow.name, errors: workflowValidationErrors(workflow) }))
      .filter((workflow) => workflow.errors.length > 0);
    const failedExecutions = executions.filter((execution) => execution.status === 'failed');
    const failedWebhookEvents = webhookEvents.filter((event) => event.status === 'failed');
    const latestWebhook = webhookEvents[0] || null;
    const latestExecution = executions[0] || null;
    let workerHeartbeat: any = null;
    let workerHeartbeatAvailable = true;
    try {
      const result = await database().from('worker_heartbeats').select('*')
        .eq('worker_name', 'whatsapp-background-worker').maybeSingle();
      if (result.error) throw result.error;
      workerHeartbeat = result.data;
    } catch {
      workerHeartbeatAvailable = false;
    }
    const workerLastSeen = workerHeartbeat?.last_seen_at ? Date.parse(workerHeartbeat.last_seen_at) : 0;
    const workerFresh = workerHeartbeat?.status === 'online' && workerLastSeen > Date.now() - 90_000;
    const workerRedisReady = workerHeartbeat?.details?.redisStatus === 'ready';
    const metaConfigured = Boolean(
      settings.phoneNumberId && settings.wabaId && settings.accessToken &&
      !settings.accessToken.includes('SAMPLE_TOKEN') && !/^(MOCK_|TEST_)/.test(settings.accessToken)
    );
    const signatureConfigured = /^[a-f0-9]{32}$/i.test(settings.appSecret || '');

    const checks: Array<{ key: string; label: string; status: CheckStatus; detail: string }> = [
      { key: 'meta_credentials', label: 'Meta credentials', status: metaConfigured ? 'ready' : 'attention',
        detail: metaConfigured ? 'A WABA, phone number and non-placeholder token are saved.' : 'Meta sender credentials are incomplete.' },
      { key: 'webhook_signature', label: 'Webhook signature verification', status: signatureConfigured ? 'ready' : 'attention',
        detail: signatureConfigured ? 'A valid-format Meta App Secret is saved.' : 'Add the matching 32-character Meta App Secret.' },
      { key: 'active_workflows', label: 'Active workflow validation',
        status: invalidActiveWorkflows.length === 0 ? 'ready' : 'attention',
        detail: invalidActiveWorkflows.length === 0
          ? `${activeWorkflows.length} active workflow${activeWorkflows.length === 1 ? '' : 's'} passed structural validation.`
          : `${invalidActiveWorkflows.length} active workflow${invalidActiveWorkflows.length === 1 ? '' : 's'} need attention.` },
      { key: 'recent_executions', label: 'Recent workflow executions',
        status: executions.length === 0 ? 'not_observable' : failedExecutions.length === 0 ? 'ready' : 'attention',
        detail: executions.length === 0 ? 'No persisted execution evidence is available yet.'
          : `${failedExecutions.length} of the latest ${executions.length} executions failed.` },
      { key: 'recent_webhooks', label: 'Recent webhook processing',
        status: webhookEvents.length === 0 ? 'not_observable' : failedWebhookEvents.length === 0 ? 'ready' : 'attention',
        detail: webhookEvents.length === 0 ? 'No persisted webhook evidence is available yet.'
          : `${failedWebhookEvents.length} of the latest ${webhookEvents.length} webhook events failed.` },
      { key: 'background_worker', label: 'Background worker heartbeat',
        status: workerFresh && workerRedisReady ? 'ready' : workerHeartbeat ? 'attention' : 'not_observable',
        detail: workerFresh && workerRedisReady ? `Worker and broadcast queue reported online at ${workerHeartbeat.last_seen_at}.`
          : workerFresh ? `Scheduled jobs are online, but the broadcast queue is ${workerHeartbeat.details?.redisStatus || 'not configured'}.`
          : workerHeartbeat ? `Worker heartbeat is stale or stopped. Last seen ${workerHeartbeat.last_seen_at}.`
            : workerHeartbeatAvailable ? 'No worker heartbeat has been recorded yet.'
              : 'Worker heartbeat storage is not installed in this database yet.' },
    ];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus: checks.some((check) => check.status === 'attention') ? 'attention' :
        checks.some((check) => check.status === 'not_observable') ? 'not_verified' : 'ready',
      checks,
      counts: { workflows: workflows.length, activeWorkflows: activeWorkflows.length,
        invalidActiveWorkflows: invalidActiveWorkflows.length, recentExecutions: executions.length,
        failedExecutions: failedExecutions.length, recentWebhooks: webhookEvents.length,
        failedWebhooks: failedWebhookEvents.length },
      latestEvidence: {
        webhook: latestWebhook ? { timestamp: latestWebhook.timestamp, status: latestWebhook.status, eventType: latestWebhook.eventType } : null,
        execution: latestExecution ? { startedAt: latestExecution.startedAt, status: latestExecution.status,
          workflowId: latestExecution.workflowId } : null,
        worker: workerHeartbeat ? { status: workerHeartbeat.status, lastSeenAt: workerHeartbeat.last_seen_at,
          capabilities: workerHeartbeat.capabilities || [] } : null,
      },
      invalidActiveWorkflows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Diagnostics unavailable' }, { status: 500 });
  }
}
