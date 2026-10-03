import { workflowValidationErrors } from '@/lib/automations/validateWorkflow';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { getAuthorizedUser } from '@/lib/auth-server';
import { WorkflowDefinition } from '@/types/automations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const targetWorkspaceId = user.workspaceId!;
    const format = searchParams.get('format'); // 'nodes' or default

    return NextResponse.json(await TestCenterStore.listWorkflows(targetWorkspaceId));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const targetWorkspaceId = user.workspaceId!;

    // Check if this is a Workflow 2.0 DAG definition
    if (Array.isArray(body.nodes)) {
      const validation = workflowValidationErrors(body);
      if (validation.length) return NextResponse.json({ error: validation[0], details: validation }, { status: 422 });
      const existing = body.id ? await TestCenterStore.getWorkflow(body.id, targetWorkspaceId) : null;
      if (existing && existing.workspaceId !== targetWorkspaceId) {
        return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
      }
      const newWorkflow: WorkflowDefinition = {
        id: body.id || `wf_${Date.now()}`,
        workspaceId: targetWorkspaceId,
        name: body.name || 'Untitled Workflow',
        description: body.description || '',
        triggerType: body.triggerType || 'keyword',
        triggerKeyword: body.triggerKeyword || 'hello',
        triggerMatchPattern: body.triggerMatchPattern || 'contains',
        nodes: body.nodes,
        edges: body.edges || [],
        isActive: body.isActive !== undefined ? body.isActive : true,
        debugModeEnabled: Boolean(body.debugModeEnabled),
        executionCount: existing?.executionCount || 0,
        stats: existing?.stats || {
          enteredCount: 0,
          completedCount: 0,
          droppedCount: 0,
          sentCount: 0,
          deliveredCount: 0,
          readCount: 0,
          clickedCount: 0,
          repliedCount: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await TestCenterStore.saveWorkflow(newWorkflow);

      return NextResponse.json(saved, { status: 201 });
    }

    return NextResponse.json({ error: 'Use the workflow builder to save a connected node workflow.' }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const targetWorkspaceId = user.workspaceId!;
    const { id, ...partial } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required for updates.' }, { status: 400 });
    }

    // If it's a DAG workflow in TestCenterStore
    const existingWf = await TestCenterStore.getWorkflow(id, targetWorkspaceId);
    if (existingWf) {
      if ((existingWf.workspaceId === 'default' ? DEFAULT_WORKSPACE_ID : existingWf.workspaceId) !== targetWorkspaceId) {
        return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
      }
      const validation = workflowValidationErrors({
        nodes: partial.nodes ?? existingWf.nodes,
        edges: partial.edges ?? existingWf.edges,
        isActive: partial.isActive ?? existingWf.isActive,
      });
      if (validation.length) return NextResponse.json({ error: validation[0], details: validation }, { status: 422 });
      const updatedWf = await TestCenterStore.saveWorkflow({
        ...existingWf,
        name: partial.name ?? existingWf.name,
        description: partial.description ?? existingWf.description,
        nodes: partial.nodes ?? existingWf.nodes,
        edges: partial.edges ?? existingWf.edges,
        triggerType: partial.triggerType ?? existingWf.triggerType,
        triggerKeyword: partial.triggerKeyword ?? existingWf.triggerKeyword,
        triggerMatchPattern: partial.triggerMatchPattern ?? existingWf.triggerMatchPattern,
        isActive: partial.isActive ?? existingWf.isActive,
        debugModeEnabled: partial.debugModeEnabled ?? existingWf.debugModeEnabled,
        workspaceId: targetWorkspaceId,
        id,
      });
      return NextResponse.json(updatedWf);
    }

    return NextResponse.json({ error: 'Flow not found.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const targetWorkspaceId = user.workspaceId!;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required.' }, { status: 400 });
    }

    const workflow = await TestCenterStore.getWorkflow(id, targetWorkspaceId);
    if (workflow && (workflow.workspaceId === 'default' ? DEFAULT_WORKSPACE_ID : workflow.workspaceId) !== targetWorkspaceId) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }
    const dagDeleted = workflow ? await TestCenterStore.deleteWorkflow(id, targetWorkspaceId) : false;
    const success = dagDeleted;
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
