import { NextRequest, NextResponse } from 'next/server';
import { AutomationsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { getAuthorizedUser } from '@/lib/auth-server';
import { WorkflowDefinition } from '@/types/automations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    const { searchParams } = new URL(request.url);
    const targetWorkspaceId = user?.workspaceId || searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;
    const format = searchParams.get('format'); // 'nodes' or default

    // If requesting modern DAG workflows
    const workflows = TestCenterStore.listWorkflows(targetWorkspaceId);
    if (format === 'dag' || workflows.length > 0) {
      return NextResponse.json(workflows);
    }

    const flows = AutomationsDB.list(targetWorkspaceId);
    return NextResponse.json(flows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    const body = await request.json();
    const targetWorkspaceId = user?.workspaceId || body.workspaceId || DEFAULT_WORKSPACE_ID;

    // Check if this is a Workflow 2.0 DAG definition
    if (Array.isArray(body.nodes)) {
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
        executionCount: body.executionCount || 0,
        stats: body.stats || {
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

      const saved = TestCenterStore.saveWorkflow(newWorkflow);

      // Sync to legacy table for backward compatibility
      AutomationsDB.create(
        {
          id: saved.id,
          name: saved.name,
          triggerKeyword: saved.triggerKeyword,
          triggerType: 'keyword',
          actionType: 'buttons',
          actionPayload: { body: 'DAG Flow', buttons: [] } as any,
          isActive: saved.isActive,
        },
        targetWorkspaceId
      );

      return NextResponse.json(saved, { status: 201 });
    }

    // Legacy simple flow creation
    const { name, triggerKeyword, triggerType = 'keyword', actionType = 'buttons', actionPayload } = body;
    if (!triggerKeyword || !actionPayload) {
      return NextResponse.json(
        { error: 'Trigger keyword and action payload are required.' },
        { status: 400 }
      );
    }

    const created = AutomationsDB.create(
      {
        name: name || `Flow: ${triggerKeyword}`,
        triggerKeyword,
        triggerType,
        actionType,
        actionPayload,
        isActive: true,
      },
      targetWorkspaceId
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const targetWorkspaceId = user.workspaceId || body.workspaceId || DEFAULT_WORKSPACE_ID;
    const { id, ...partial } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required for updates.' }, { status: 400 });
    }

    // If it's a DAG workflow in TestCenterStore
    const existingWf = TestCenterStore.getWorkflow(id);
    if (existingWf) {
      const updatedWf = TestCenterStore.saveWorkflow({
        ...existingWf,
        ...partial,
        id,
      });
      return NextResponse.json(updatedWf);
    }

    const updated = AutomationsDB.update(id, partial, targetWorkspaceId);
    if (!updated) {
      return NextResponse.json({ error: 'Flow not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const targetWorkspaceId = user.workspaceId || searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required.' }, { status: 400 });
    }

    TestCenterStore.deleteWorkflow(id);
    const success = AutomationsDB.delete(id, targetWorkspaceId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
