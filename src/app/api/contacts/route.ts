import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;

    const contacts = ContactsDB.list({ tag, search });

    // Map to frontend-friendly structure
    const mapped = contacts.map((c) => ({
      id: c.id,
      phone_number: c.phoneNumber,
      phoneNumber: c.phoneNumber,
      first_name: c.firstName,
      firstName: c.firstName,
      last_name: c.lastName,
      lastName: c.lastName,
      tags: c.tags || [],
      optin_status: c.optinStatus,
      optinStatus: c.optinStatus,
      created_at: c.createdAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phoneNumber,
      phone_number,
      firstName,
      first_name,
      lastName,
      last_name,
      tags = ['vip'],
      optinStatus = true,
      optin_status,
    } = body;

    const rawPhone = phoneNumber || phone_number;
    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const created = ContactsDB.upsert({
      phoneNumber: rawPhone,
      firstName: firstName || first_name || '',
      lastName: lastName || last_name || '',
      tags: Array.isArray(tags) ? tags : [tags],
      optinStatus: optinStatus !== undefined ? optinStatus : optin_status !== undefined ? optin_status : true,
    });

    return NextResponse.json(
      {
        id: created.id,
        phone_number: created.phoneNumber,
        phoneNumber: created.phoneNumber,
        first_name: created.firstName,
        firstName: created.firstName,
        last_name: created.lastName,
        lastName: created.lastName,
        tags: created.tags,
        optin_status: created.optinStatus,
        optinStatus: created.optinStatus,
        created_at: created.createdAt,
        createdAt: created.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const deleted = ContactsDB.delete(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
