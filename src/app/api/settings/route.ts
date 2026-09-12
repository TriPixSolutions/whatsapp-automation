import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB } from '@/lib/db';

export async function GET() {
  try {
    const settings = SettingsDB.get();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = SettingsDB.update({
      wabaId: body.wabaId,
      phoneNumberId: body.phoneNumberId,
      accessToken: body.accessToken,
      verifyToken: body.verifyToken,
      customSubdomain: body.customSubdomain,
      adminUsername: body.adminUsername,
      adminPassword: body.adminPassword,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
