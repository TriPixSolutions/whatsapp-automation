import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { contacts, workspaceId: bodyWsId } = body;
    const workspaceId = bodyWsId || DEFAULT_WORKSPACE_ID;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contact records provided.' }, { status: 400 });
    }

    let imported = 0;
    for (const c of contacts) {
      const rawPhone = (c.phone_number || c.phone || c.phoneNumber || '').trim();
      if (!rawPhone) continue;

      const tags = Array.isArray(c.tags)
        ? c.tags
        : typeof c.tags === 'string'
        ? c.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : ['vip'];

      ContactsDB.upsert({
        workspaceId,
        phoneNumber: rawPhone,
        firstName: c.first_name || c.firstName || '',
        lastName: c.last_name || c.lastName || '',
        tags,
        optinStatus: c.optin_status !== undefined ? Boolean(c.optin_status) : true,
      });
      imported++;
    }

    return NextResponse.json({
      success: true,
      count: imported,
      message: `Successfully imported ${imported} contacts to database.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
