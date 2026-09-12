import { NextRequest, NextResponse } from 'next/server';
import { AutomationsDB } from '@/lib/db';

export async function GET() {
  try {
    const flows = AutomationsDB.list();
    return NextResponse.json(flows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, triggerKeyword, triggerType = 'keyword', actionType = 'buttons', actionPayload } = body;

    if (!triggerKeyword || !actionPayload) {
      return NextResponse.json(
        { error: 'Trigger keyword and action payload are required.' },
        { status: 400 }
      );
    }

    const created = AutomationsDB.create({
      name: name || `Flow: ${triggerKeyword}`,
      triggerKeyword,
      triggerType,
      actionType,
      actionPayload,
      isActive: true,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...partial } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required for updates.' }, { status: 400 });
    }

    const updated = AutomationsDB.update(id, partial);
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required.' }, { status: 400 });
    }

    const success = AutomationsDB.delete(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
