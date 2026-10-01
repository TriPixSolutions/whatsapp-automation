import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTemplatesStore } from '@/lib/automations/workflowTemplatesStore';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';
import { ContactsDB, MessagesDB, ConversationsDB } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/automations/templates/test
 * Executes a transient test run of the template with simulated or live execution telemetry
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const {
      templateId,
      phoneNumber = '+919876543210',
      customTriggerText,
    } = body;
    const workspaceId = user.workspaceId!;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const template = WorkflowTemplatesStore.getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: `Template "${templateId}" not found` }, { status: 404 });
    }

    const transientWorkflow = await WorkflowTemplatesStore.getTransientWorkflow(templateId, workspaceId);
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

    // Ensure contact exists
    const contact = await ContactsDB.upsert(
      {
        phoneNumber: cleanPhone,
        firstName: 'Template',
        lastName: 'Tester',
        tags: ['template_test_sim'],
      },
      workspaceId
    );

    // Record incoming test message
    const triggerKeyword = customTriggerText || template.triggerKeyword || 'hello';
    await MessagesDB.create({
      phoneNumber: cleanPhone,
      contactId: contact.id,
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      content: triggerKeyword,
    }, workspaceId);
    await ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);

    // Execute through AdvancedWorkflowEngine
    const executionLog = await AdvancedWorkflowEngine.executeWorkflow(transientWorkflow, {
      workflowId: transientWorkflow.id,
      workspaceId,
      phoneNumber: cleanPhone,
      contactId: contact.id,
      triggerType: template.triggerType || 'keyword',
      triggerPayload: { text: triggerKeyword, body: triggerKeyword },
      isTestSimulation: true,
    });

    return NextResponse.json({
      success: true,
      templateId,
      templateName: template.name,
      executionId: executionLog.executionId,
      status: executionLog.status,
      durationMs: executionLog.totalDurationMs,
      stepsCount: executionLog.steps?.length || 0,
      steps: executionLog.steps || [],
      metaResponses: executionLog.metaResponses || [],
      waitingFor: executionLog.waitingFor,
      message: `Template test executed successfully (${executionLog.status}) with ${executionLog.steps?.length || 0} node execution steps.`,
    });
  } catch (err: any) {
    console.error('[Template Test Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
