import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { getAuthorizedUser } from '@/lib/auth-server';
import { handleWebhookInboundMessages } from '@/lib/webhook/webhookInbound';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 100);
    const logs = TestCenterStore.getWebhookLogs(limit);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, logId } = body;

    if (action === 'replay' && logId) {
      const logs = TestCenterStore.getWebhookLogs(500);
      const targetLog = logs.find((l) => l.id === logId);

      if (!targetLog) {
        return NextResponse.json({ error: 'Webhook log event not found' }, { status: 404 });
      }

      const startTime = Date.now();
      const payload = targetLog.payload;

      // Replay inbound execution if it contained messages
      if (payload?.messages?.length > 0) {
        await handleWebhookInboundMessages(payload.messages, payload.contacts, user.workspaceId || DEFAULT_WORKSPACE_ID);
      }

      const durationMs = Date.now() - startTime;

      // Record replayed execution log
      const replayedLog = TestCenterStore.recordWebhookLog({
        id: `wh_replay_${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: 'incoming',
        source: 'Manual Replay Engine',
        eventType: targetLog.eventType,
        payload,
        responseStatus: 200,
        responseBody: { status: 'replayed', originalId: logId },
        executionTimeMs: durationMs,
        signatureVerified: true,
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        message: `Webhook ${logId} successfully replayed.`,
        replayedLog,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
