import { NextRequest, NextResponse } from 'next/server';
import { LeadCapturePipeline } from '@/lib/leads/leadPipeline';
import { getAdminClient } from '@/lib/supabase/server';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, phone_number, firstName, first_name, lastName, last_name, source = 'api', tags, metadata } = body;

    const rawPhone = phoneNumber || phone_number;
    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const result = await LeadCapturePipeline.ingest({
      phoneNumber: rawPhone,
      firstName: firstName || first_name,
      lastName: lastName || last_name,
      source,
      tags,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to capture lead' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    if (supabase) {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
