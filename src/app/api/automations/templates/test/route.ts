import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTemplatesStore } from '@/lib/automations/workflowTemplatesStore';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';
import { DEFAULT_WORKSPACE_ID, ContactsDB, MessagesDB, ConversationsDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/automations/templates/test
 * Executes a transient test run of the template with simulated or live execution telemetry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      templateId,
      phoneNumber = '+919876543210',
      workspaceId = DEFAULT_WORKSPACE_ID,
      customTriggerText,
    } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const template = WorkflowTemplatesStore.getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: `Template "${templateId}" not found` }, { status: 404 });
    }

    const transientWorkflow = WorkflowTemplatesStore.getTransientWorkflow(templateId, workspaceId);
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

    // Ensure contact exists
    const contact = ContactsDB.upsert(
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
    MessagesDB.create({
      phoneNumber: cleanPhone,
      contactId: contact.id,
      direction: 'inbound',
      type: 'text',
      status: 'delivered',
      content: triggerKeyword,
    });
    ConversationsDB.recordInbound(cleanPhone, contact.id, workspaceId);

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
