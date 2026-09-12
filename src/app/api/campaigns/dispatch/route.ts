import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, CampaignsDB, MessagesDB, SettingsDB } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignName = 'Broadcast Campaign',
      templateName = 'teaser_alert',
      targetTag = 'all',
      variables = {},
    } = body;

    // 1. Fetch real target contacts from Database
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

    // 2. Fetch Meta API credentials
    const settings = SettingsDB.get();
    const { phoneNumberId, accessToken } = settings;

    // 3. Create Campaign record in Database
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

    let sent = 0;
    let failed = 0;

    // 4. Iterate through contacts and send official Meta message
    for (const contact of targetContacts) {
      const recipientPhone = contact.phoneNumber;
      let sendResult: any = { success: false };

      if (phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN')) {
        // Construct template parameters with dynamic variables if provided
        const var1 = variables['1'] || contact.firstName || 'Customer';
        const var2 = variables['2'] || 'Exclusive Item';
        const var3 = variables['3'] || 'PF-1001';

        const components: any[] = [];
        if (Object.keys(variables).length > 0) {
          components.push({
            type: 'body',
            parameters: [
              { type: 'text', text: var1 },
              { type: 'text', text: var2 },
              { type: 'text', text: var3 },
            ],
          });
        }

        sendResult = await MetaWhatsAppClient.sendTemplate({
          phoneNumberId,
          accessToken,
          to: recipientPhone,
          templateName,
          languageCode: 'en_US',
          components: components.length > 0 ? components : undefined,
        });
      } else {
        // Local simulation if credentials not yet configured
        sendResult = {
          success: true,
          messageId: `wamid.camp_${Date.now()}_${sent}`,
          simulated: true,
        };
      }

      // Log outbound message to Database
      const messageId = sendResult.messageId || `wamid.camp_${Date.now()}_${sent}`;
      MessagesDB.create({
        metaMessageId: messageId,
        phoneNumber: recipientPhone,
        contactId: contact.id,
        direction: 'outbound',
        type: 'template',
        status: sendResult.success ? 'sent' : 'failed',
        content: `Template: ${templateName}`,
        payload: {
          campaignId: campaign.id,
          templateName,
          variables,
        },
        errorMessage: sendResult.error,
      });

      if (sendResult.success) {
        sent++;
      } else {
        failed++;
      }
    }

    // 5. Update Campaign with final metrics
    CampaignsDB.update(campaign.id, {
      status: failed === targetContacts.length ? 'failed' : 'completed',
      sentCount: sent,
      failedCount: failed,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: targetContacts.length,
      sentCount: sent,
      failedCount: failed,
      message: `Successfully dispatched to ${sent} contacts (${failed} failed).`,
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
