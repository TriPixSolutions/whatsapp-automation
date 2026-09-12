import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, mockStore } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts, workspaceId = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001' } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contact records provided.' }, { status: 400 });
    }

    const formattedRecords = contacts.map((c) => {
      let rawPhone = (c.phone_number || c.phone || '').trim();
      let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      if (!rawPhone.startsWith('+')) {
        cleanPhone = `+${cleanPhone}`;
      } else {
        cleanPhone = `+${cleanPhone}`;
      }

      let tags = Array.isArray(c.tags)
        ? c.tags
        : typeof c.tags === 'string'
        ? c.tags.split(',').map((t: string) => t.trim().toLowerCase())
        : ['vip'];

      return {
        workspace_id: workspaceId,
        phone_number: cleanPhone,
        first_name: c.first_name || c.firstName || 'VIP',
        last_name: c.last_name || c.lastName || '',
        tags,
        optin_status: c.optin_status !== undefined ? Boolean(c.optin_status) : true,
      };
    });

    const supabase = getAdminClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('contacts')
        .upsert(formattedRecords, { onConflict: 'workspace_id,phone_number' })
        .select();

      if (error) {
        console.error('[Import Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        count: data?.length || formattedRecords.length,
        message: `Successfully imported ${formattedRecords.length} contacts.`,
      });
    }

    // Mock store bulk upsert
    let imported = 0;
    formattedRecords.forEach((rec) => {
      const existingIdx = mockStore.contacts.findIndex((c) => c.phone_number === rec.phone_number);
      if (existingIdx >= 0) {
        mockStore.contacts[existingIdx] = {
          ...mockStore.contacts[existingIdx],
          ...rec,
        };
      } else {
        mockStore.contacts.push({
          id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}${imported}`,
          ...rec,
          created_at: new Date().toISOString(),
        });
      }
      imported++;
    });

    return NextResponse.json({
      success: true,
      count: imported,
      message: `Successfully imported ${imported} contacts to workspace.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
