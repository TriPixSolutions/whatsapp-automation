import { NextRequest, NextResponse } from 'next/server';
import { TemplatesDB, SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = TemplatesDB.list();
    return NextResponse.json(templates);
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

    const body = await request.json();
    const { action, template } = body;

    if (action === 'sync_meta') {
      const targetWorkspaceId = user.workspaceId || DEFAULT_WORKSPACE_ID;
      const settings = SettingsDB.get(targetWorkspaceId);
      const wabaId = settings.wabaId || process.env.META_WABA_ID;
      const accessToken = settings.accessToken || process.env.META_ACCESS_TOKEN;

      if (!wabaId || !accessToken) {
        return NextResponse.json(
          { success: false, error: 'WABA ID and Access Token must be configured in Settings to sync live templates from Meta.' },
          { status: 400 }
        );
      }

      const metaRes = await MetaWhatsAppClient.fetchWabaTemplates({ wabaId, accessToken });
      if (metaRes.success && Array.isArray(metaRes.templates)) {
        for (const t of metaRes.templates) {
          const bodyComponent = t.components?.find((c: any) => c.type === 'BODY');
          const headerComponent = t.components?.find((c: any) => c.type === 'HEADER');
          const footerComponent = t.components?.find((c: any) => c.type === 'FOOTER');
          const buttonsComponent = t.components?.find((c: any) => c.type === 'BUTTONS');

          TemplatesDB.upsert({
            id: t.id || `tmpl_${t.name}`,
            name: t.name,
            category: t.category || 'MARKETING',
            language: t.language || 'en_US',
            status: t.status || 'APPROVED',
            body: bodyComponent?.text || '',
            header: headerComponent?.text,
            footer: footerComponent?.text,
            buttons: buttonsComponent?.buttons?.map((b: any, idx: number) => ({
              id: `btn_${idx}`,
              type: b.type,
              text: b.text,
              url: b.url,
              phone_number: b.phone_number,
            })),
            updatedAt: new Date().toISOString(),
          });
        }
        return NextResponse.json({ success: true, count: metaRes.templates.length, templates: TemplatesDB.list() });
      }

      return NextResponse.json({ success: false, error: metaRes.error || 'Failed to fetch templates from Meta' }, { status: 400 });
    }

    if (template && template.name) {
      const saved = TemplatesDB.upsert({
        ...template,
        id: template.id || `tmpl_${template.name}`,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, template: saved });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
