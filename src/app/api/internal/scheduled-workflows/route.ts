import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'Worker is not configured' }, { status: 503 });
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const workflowId = String(body.workflowId || '');
    const workspaceId = String(body.workspaceId || '');
    const phoneNumber = String(body.phoneNumber || '').replace(/[\s()-]/g, '');
    if (!workflowId || !workspaceId || !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'A workflow, workspace and E.164 phone number are required.' }, { status: 400 });
    }
    const workflow = await TestCenterStore.getWorkflow(workflowId, workspaceId);
    if (!workflow || !workflow.isActive || workflow.triggerType !== 'scheduled_trigger') {
      return NextResponse.json({ error: 'Active scheduled workflow not found.' }, { status: 404 });
    }
    const execution = await AdvancedWorkflowEngine.executeWorkflow(workflow, {
      workflowId, workspaceId, phoneNumber, triggerType: 'scheduled_trigger', isTestSimulation: false,
      triggerPayload: { scheduled: true, jobId: String(body.jobId || '') },
    });
    if (execution.status === 'failed') return NextResponse.json({ error: 'Scheduled workflow execution failed.', executionId: execution.executionId }, { status: 502 });
    return NextResponse.json({ success: true, executionId: execution.executionId, status: execution.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Scheduled workflow execution failed.' }, { status: 500 });
  }
}
