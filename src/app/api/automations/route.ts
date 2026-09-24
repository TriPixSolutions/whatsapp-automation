import { NextRequest, NextResponse } from 'next/server';
import { AutomationsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;
    const flows = AutomationsDB.list(workspaceId);
    return NextResponse.json(flows);
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
    const {
      name,
      triggerKeyword,
      triggerType = 'keyword',
      actionType = 'buttons',
      actionPayload,
      workspaceId = DEFAULT_WORKSPACE_ID,
    } = body;

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
      workspaceId
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
    const { id, workspaceId = DEFAULT_WORKSPACE_ID, ...partial } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required for updates.' }, { status: 400 });
    }

    const updated = AutomationsDB.update(id, partial, workspaceId);
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
    const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required.' }, { status: 400 });
    }

    const success = AutomationsDB.delete(id, workspaceId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
