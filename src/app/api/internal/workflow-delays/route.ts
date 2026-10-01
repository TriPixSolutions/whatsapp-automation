import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';

export const runtime = 'nodejs';
let running = false;

export async function POST(request: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'Worker is not configured' }, { status: 503 });
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (running) return NextResponse.json({ skipped: true });
  running = true;
  let resumed = 0, failed = 0;
  try {
    for (const session of await TestCenterStore.claimDueDelaySessions(10)) {
      try {
        const result = await AdvancedWorkflowEngine.resumeWorkflowExecution(session, { action: 'delay_expired' });
        if (result && result.status !== 'failed') resumed++;
        else {
          failed++;
          await TestCenterStore.releaseSessionClaim(session.id, session.claimToken);
        }
      } catch {
        failed++;
        await TestCenterStore.releaseSessionClaim(session.id, session.claimToken);
      }
    }
    return NextResponse.json({ resumed, failed });
  } catch {
    return NextResponse.json({ error: 'Delay runner failed' }, { status: 500 });
  } finally {
    running = false;
  }
}
