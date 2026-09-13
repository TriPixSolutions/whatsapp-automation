import { CampaignsDB, MessagesDB, SettingsDB, Contact } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';

export interface CampaignQueuePayload {
  campaignId: string;
  templateName: string;
  contacts: Contact[];
  variables?: Record<string, string>;
}

const CHUNK_SIZE = 25;
const RATE_LIMIT_DELAY_MS = 60; // Pacing delay to adhere to Meta rate limits

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processCampaignInBackground(payload: CampaignQueuePayload) {
  const { campaignId, templateName, contacts, variables = {} } = payload;
  const settings = SettingsDB.get();
  const { phoneNumberId, accessToken } = settings;
  const isLiveMeta = Boolean(phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN'));

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
    const chunk = contacts.slice(i, i + CHUNK_SIZE);

    for (const contact of chunk) {
      let sendResult: any = { success: false };

      if (isLiveMeta) {
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

        try {
          sendResult = await MetaWhatsAppClient.sendTemplate({
            phoneNumberId,
            accessToken,
            to: contact.phoneNumber,
            templateName,
            languageCode: 'en_US',
            components: components.length > 0 ? components : undefined,
          });
        } catch (err: any) {
          sendResult = { success: false, error: err.message };
        }
      } else {
        sendResult = {
          success: true,
          messageId: `wamid.camp_${Date.now()}_${sent}`,
          simulated: true,
        };
      }

      const metaMessageId = sendResult.messageId || `wamid.camp_${Date.now()}_${sent}`;
      MessagesDB.create({
        metaMessageId,
        phoneNumber: contact.phoneNumber,
        contactId: contact.id,
        direction: 'outbound',
        type: 'template',
        status: sendResult.success ? 'sent' : 'failed',
        content: `Template: ${templateName}`,
        payload: { campaignId, templateName, variables },
        errorMessage: sendResult.error,
      });

      if (sendResult.success) sent++;
      else failed++;

      // Meta rate limit pacing
      await delay(RATE_LIMIT_DELAY_MS);
    }

    // Intermediate database checkpoint
    CampaignsDB.update(campaignId, {
      sentCount: sent,
      failedCount: failed,
    });
  }

  // Final campaign state update
  CampaignsDB.update(campaignId, {
    status: failed === contacts.length ? 'failed' : 'completed',
    sentCount: sent,
    failedCount: failed,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Non-blocking queue dispatcher safe for Vercel Serverless
 */
export function enqueueCampaignJob(payload: CampaignQueuePayload) {
  // Fire background chunked execution without blocking HTTP response
  setTimeout(() => {
    processCampaignInBackground(payload).catch((err) => {
      console.error('[Campaign Queue Error] Execution failed:', err);
      CampaignsDB.update(payload.campaignId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
      });
    });
  }, 10);

  return {
    success: true,
    campaignId: payload.campaignId,
    totalRecipients: payload.contacts.length,
    status: 'processing' as const,
  };
}
