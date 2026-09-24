import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, CampaignsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { enqueueCampaignJob, manageCampaignState } from '@/lib/queue/campaignQueue';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      campaignName = 'Broadcast Campaign',
      templateName = 'teaser_alert',
      targetTag = 'all',
      variables = {},
      workspaceId = DEFAULT_WORKSPACE_ID,
    } = body;

    // 1. Fetch target contacts from Database
    const targetContacts = ContactsDB.list({
      workspaceId,
      tag: targetTag === 'all' ? undefined : targetTag,
    });

    if (targetContacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No opted-in contacts found with tag '${targetTag}'. Add contacts first.`,
        },
        { status: 400 }
      );
    }

    // 2. Create Campaign record with processing state
    const campaign = CampaignsDB.create(
      {
        name: campaignName,
        templateName,
        targetTag,
        status: 'processing',
        totalRecipients: targetContacts.length,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        variables,
      },
      workspaceId
    );

    // 3. Delegate to BullMQ Queue / Worker
    const queuedJob = await enqueueCampaignJob({
      campaignId: campaign.id,
      workspaceId,
      templateName,
      targetTag,
      contacts: targetContacts,
      variables,
    });

    if (!queuedJob.success) {
      return NextResponse.json(
        {
          success: false,
          error: queuedJob.error,
          campaignId: campaign.id,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: targetContacts.length,
      status: queuedJob.status,
      mode: queuedJob.mode,
      message: `Dispatched ${targetContacts.length} recipients to campaign queue.`,
    });
  } catch (error: any) {
    console.error('[Campaign Dispatch API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;
    const list = CampaignsDB.list(workspaceId);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, action, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!campaignId || !['pause', 'resume', 'stop', 'retry'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid campaignId and action (pause, resume, stop, retry) required' },
        { status: 400 }
      );
    }

    const updated = await manageCampaignState(campaignId, action, workspaceId);
    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
