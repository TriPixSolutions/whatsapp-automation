import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, CampaignsDB } from '@/lib/db';
import { enqueueCampaignJob } from '@/lib/queue/campaignQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignName = 'Broadcast Campaign',
      templateName = 'teaser_alert',
      targetTag = 'all',
      variables = {},
    } = body;

    // 1. Fetch target contacts from Database
    const targetContacts = ContactsDB.list({
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
    const campaign = CampaignsDB.create({
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
    });

    // 3. Delegate to Vercel-safe chunked background queue
    const queuedJob = enqueueCampaignJob({
      campaignId: campaign.id,
      templateName,
      contacts: targetContacts,
      variables,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: targetContacts.length,
      status: queuedJob.status,
      message: `Dispatched ${targetContacts.length} recipients to background messaging queue.`,
    });
  } catch (error: any) {
    console.error('[Campaign Dispatch API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const list = CampaignsDB.list();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
