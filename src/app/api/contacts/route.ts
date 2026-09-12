import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, mockStore, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const search = searchParams.get('search')?.toLowerCase();

  const supabase = getAdminClient();

  if (supabase) {
    let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });

    if (tag && tag !== 'all') {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let filtered = data || [];
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.phone_number.toLowerCase().includes(search) ||
          c.first_name?.toLowerCase().includes(search) ||
          c.last_name?.toLowerCase().includes(search)
      );
    }
    return NextResponse.json(filtered);
  }

  // Fallback to mock store
  let filtered = [...mockStore.contacts];
  if (tag && tag !== 'all') {
    filtered = filtered.filter((c) => c.tags.includes(tag));
  }
  if (search) {
    filtered = filtered.filter(
      (c) =>
        c.phone_number.toLowerCase().includes(search) ||
        c.first_name?.toLowerCase().includes(search) ||
        c.last_name?.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001',
      phoneNumber,
      firstName,
      lastName,
      tags = ['vip'],
      optinStatus = true,
    } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;
    const supabase = getAdminClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('contacts')
        .upsert(
          {
            workspace_id: workspaceId,
            phone_number: cleanPhone,
            first_name: firstName,
            last_name: lastName,
            tags,
            optin_status: optinStatus,
          },
          { onConflict: 'workspace_id,phone_number' }
        )
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data, { status: 201 });
    }

    // Mock store insert
    const newContact = {
      id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      workspace_id: workspaceId,
      phone_number: cleanPhone,
      first_name: firstName,
      last_name: lastName,
      tags,
      optin_status: optinStatus,
      created_at: new Date().toISOString(),
    };

    mockStore.contacts.unshift(newContact);
    return NextResponse.json(newContact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
