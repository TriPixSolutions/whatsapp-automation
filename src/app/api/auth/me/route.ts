import { publicUser } from '@/lib/auth/publicUser';
import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthorizedUser({ allowPending: true });

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const settings = await SettingsDB.get(user.workspaceId!);

    return NextResponse.json({
      authenticated: true,
      user: publicUser(user),
      workspace: {
        id: user.workspaceId,
        name: settings.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
