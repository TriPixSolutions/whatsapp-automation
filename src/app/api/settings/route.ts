import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { maskToken } from '@/lib/crypto';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetWorkspaceId = user.workspaceId || DEFAULT_WORKSPACE_ID;
    const settings = await SettingsDB.get(targetWorkspaceId);
    return NextResponse.json({
      ...settings,
      accessToken: maskToken(settings.accessToken),
      appSecret: settings.appSecret ? maskToken(settings.appSecret) : undefined,
      rawTokenConfigured: Boolean(settings.accessToken && !settings.accessToken.includes('SAMPLE_TOKEN')),
    });
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

    const targetWorkspaceId = user.workspaceId || DEFAULT_WORKSPACE_ID;
    if (!['owner', 'admin', 'super_admin'].includes(user.role)) return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });
    const body = await request.json();
    const replacementCredentials = Object.fromEntries(['accessToken','appSecret'].filter(key => typeof body[key] === 'string' && body[key].trim() && !/[•*]/.test(body[key])).map(key => [key, body[key].trim()]));
    const current = await SettingsDB.get(targetWorkspaceId, replacementCredentials);

    // Guard against saving masked token bullets back into database
    let tokenToSave = body.accessToken;
    if (!tokenToSave || tokenToSave.includes('••••') || tokenToSave.includes('****')) {
      tokenToSave = current.accessToken;
    }

    let secretToSave = body.appSecret;
    if (!secretToSave || secretToSave.includes('••••') || secretToSave.includes('****')) {
      secretToSave = current.appSecret;
    }

    const updated = await SettingsDB.update(
      {
        name: body.name || current.name,
        wabaId: body.wabaId !== undefined ? body.wabaId : current.wabaId,
        phoneNumberId: body.phoneNumberId !== undefined ? body.phoneNumberId : current.phoneNumberId,
        accessToken: tokenToSave,
        appSecret: secretToSave,
        appId: body.appId !== undefined ? body.appId : current.appId,
        verifyToken: body.verifyToken || current.verifyToken,
        catalogId: body.catalogId !== undefined ? body.catalogId : current.catalogId,
        adAccountId: body.adAccountId !== undefined ? body.adAccountId : current.adAccountId,
        customSubdomain: body.customSubdomain !== undefined ? body.customSubdomain : current.customSubdomain,
      },
      targetWorkspaceId
    );

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        accessToken: maskToken(updated.accessToken),
        appSecret: updated.appSecret ? maskToken(updated.appSecret) : undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
