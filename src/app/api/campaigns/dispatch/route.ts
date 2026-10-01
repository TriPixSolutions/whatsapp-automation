import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, CampaignsDB } from '@/lib/db';
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
    } = body;

    const workspaceId = user.workspaceId!;

    // 1. Fetch target contacts from Database
    const targetContacts = (await ContactsDB.list({
      workspaceId,
      tag: targetTag === 'all' ? undefined : targetTag,
      limit: 10000,
    })).filter(contact => contact.optinStatus);

    if (targetContacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No opted-in contacts found with tag '${targetTag}'. Add contacts first.`,
        },
        { status: 400 }
      );
    }

    // 2. Create Campaign record before handing it to the queue.
    const campaign = await CampaignsDB.create(
      {
        name: campaignName,
        templateName,
        targetTag,
        status: 'pending',
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
      await CampaignsDB.update(campaign.id, { status: 'failed' }, workspaceId);
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
    const workspaceId = user.workspaceId!;
    const list = await CampaignsDB.list(workspaceId);
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
    const { campaignId, action } = body;
    const workspaceId = user.workspaceId!;

    if (!campaignId || !['pause', 'resume', 'stop', 'retry'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid campaignId and action (pause, resume, stop, retry) required' },
        { status: 400 }
      );
    }

    const updated = await manageCampaignState(campaignId, action, workspaceId);
    if (!updated) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
