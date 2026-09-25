import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTemplatesStore } from '@/lib/automations/workflowTemplatesStore';
import { getAuthorizedUser } from '@/lib/auth-server';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/automations/templates
 * Query Params:
 *  - category: Filter category (All, Trigger Testing, Interactive Buttons, etc.)
 *  - search: Search query string
 *  - id: Get single template by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    if (id) {
      const template = WorkflowTemplatesStore.getTemplate(id);
      if (!template) {
        return NextResponse.json({ error: `Template "${id}" not found` }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    const templates = WorkflowTemplatesStore.listTemplates(category, search);
    return NextResponse.json({
      total: templates.length,
      templates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/automations/templates
 * Actions:
 *  - import: Import template to active workflows
 *  - duplicate: Clone template
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    const body = await request.json();
    const targetWorkspaceId = user?.workspaceId || body.workspaceId || DEFAULT_WORKSPACE_ID;
    const { action = 'import', templateId, customName } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    if (action === 'import') {
      const result = WorkflowTemplatesStore.importTemplate(templateId, targetWorkspaceId, customName);
      return NextResponse.json(result, { status: 201 });
    }

    if (action === 'duplicate') {
      const duplicated = WorkflowTemplatesStore.duplicateTemplate(templateId, customName);
      return NextResponse.json(duplicated, { status: 201 });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
