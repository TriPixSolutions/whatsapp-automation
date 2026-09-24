import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const data = TestCenterStore.getSandboxSettings();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, enabled, phoneNumber, name } = body;

    if (action === 'toggle_enabled') {
      TestCenterStore.setSandboxEnabled(Boolean(enabled));
      return NextResponse.json({ success: true, enabled: Boolean(enabled) });
    }

    if (action === 'add_recipient') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }
      const updated = TestCenterStore.addSandboxRecipient(phoneNumber, name || 'Test Recipient');
      return NextResponse.json({ success: true, recipients: updated });
    }

    if (action === 'remove_recipient') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }
      const updated = TestCenterStore.removeSandboxRecipient(phoneNumber);
      return NextResponse.json({ success: true, recipients: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
