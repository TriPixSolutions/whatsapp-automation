import { SettingsDB, MessagesDB, ContactsDB, ConversationsDB, DEFAULT_WORKSPACE_ID, Message, MessageType } from '@/lib/db';
import { MetaWhatsAppClient, MetaApiResult } from '@/lib/meta/api';

export interface SendWhatsAppMessageOptions {
  workspaceId?: string;
  to: string;
  type: MessageType;
  text?: string;
  templateName?: string;
  languageCode?: string;
  components?: any[];
  headerText?: string;
  bodyText?: string;
  footerText?: string;
  buttonText?: string;
  buttons?: { id: string; title: string }[];
  sections?: any[];
  cards?: any[];
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  catalogId?: string;
  productRetailerId?: string;
  productSections?: any[];
  bypassWindowCheck?: boolean; // Only for system alerts
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  metaMessageId?: string;
  error?: string;
  errorCode?: number;
  windowClosed?: boolean;
  savedMessage?: Message;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks whether the WhatsApp 24-hour customer care window is open
 */
export function isConversationWindowOpen(lastInboundTimestamp?: string | null): boolean {
  if (!lastInboundTimestamp) return false;
  const lastInboundTime = new Date(lastInboundTimestamp).getTime();
  if (isNaN(lastInboundTime)) return false;
  const elapsed = Date.now() - lastInboundTime;
  return elapsed < 24 * 60 * 60 * 1000;
}

export class WhatsAppMessageService {
  /**
   * Centralized message dispatch with 24-hour window enforcement, retry mechanism, and message persistence
   */
  static async send(options: SendWhatsAppMessageOptions): Promise<SendMessageResult> {
    const workspaceId = options.workspaceId || DEFAULT_WORKSPACE_ID;
    const settings = SettingsDB.get(workspaceId);
    const { phoneNumberId, accessToken } = settings;

    const cleanTo = options.to.startsWith('+') ? options.to : `+${options.to.replace(/[^0-9]/g, '')}`;

    // 1. Ensure contact exists in database
    const contact = ContactsDB.upsert(
      {
        phoneNumber: cleanTo,
      },
      workspaceId
    );

    // 2. 24-Hour Policy Window Enforcement (Enforces Meta Cloud API Conversation Window)
    if (options.type !== 'template' && !options.bypassWindowCheck) {
      const windowOpen = ConversationsDB.isWindowOpen(cleanTo, workspaceId);

      if (!windowOpen) {
        const errorMsg =
          '24-Hour Window Closed (#131047): Customer last messaged over 24 hours ago. Meta WhatsApp policy requires sending an approved Template message to initiate or re-engage conversation.';
        console.warn(`[WhatsApp Policy Warning] ${cleanTo}: ${errorMsg}`);

        const savedFailed = MessagesDB.create(
          {
            phoneNumber: cleanTo,
            contactId: contact.id,
            direction: 'outbound',
            type: options.type,
            status: 'failed',
            content: options.text || options.bodyText || `[${options.type.toUpperCase()}]`,
            errorMessage: errorMsg,
            payload: options,
          },
          workspaceId
        );

        return {
          success: false,
          error: errorMsg,
          errorCode: 131047,
          windowClosed: true,
          savedMessage: savedFailed,
        };
      }
    }

    // 3. Check live credentials
    const isLive = Boolean(
      phoneNumberId &&
      accessToken &&
      !accessToken.includes('SAMPLE_TOKEN') &&
      !accessToken.startsWith('MOCK_') &&
      !accessToken.startsWith('TEST_') &&
      process.env.META_SANDBOX !== 'true'
    );

    if (!isLive) {
      // Unconfigured or sandbox credentials
      const simulatedId = `wamid.local_${Date.now()}`;
      console.log(`[WhatsApp Sandbox] Simulated send (${options.type}) to ${cleanTo}`);

      const savedMessage = MessagesDB.create(
        {
          metaMessageId: simulatedId,
          phoneNumber: cleanTo,
          contactId: contact.id,
          direction: 'outbound',
          type: options.type,
          status: 'sent',
          content: options.text || options.bodyText || options.templateName || `[${options.type.toUpperCase()}]`,
          payload: options,
        },
        workspaceId
      );

      // Track outbound conversation timestamp
      ConversationsDB.recordOutbound(cleanTo, contact.id, workspaceId);

      return {
        success: true,
        messageId: simulatedId,
        metaMessageId: simulatedId,
        savedMessage,
      };
    }

    // 4. Dispatch with exponential backoff retries (up to 3 attempts)
    let metaResult: MetaApiResult = { success: false };
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (options.type === 'text') {
          metaResult = await MetaWhatsAppClient.sendText({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            text: options.text || options.bodyText || '',
          });
        } else if (options.type === 'button' || options.type === 'interactive') {
          metaResult = await MetaWhatsAppClient.sendInteractiveButtons({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            headerText: options.headerText,
            bodyText: options.bodyText || options.text || '',
            footerText: options.footerText,
            buttons: options.buttons || [{ id: 'btn_1', title: 'Reply' }],
          });
        } else if (options.type === 'list') {
          metaResult = await MetaWhatsAppClient.sendInteractiveList({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            headerText: options.headerText,
            bodyText: options.bodyText || options.text || '',
            footerText: options.footerText,
            buttonText: options.buttonText || 'Options',
            sections: options.sections || [],
          });
        } else if (options.type === 'carousel') {
          metaResult = await MetaWhatsAppClient.sendCarouselTemplate({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            templateName: options.templateName,
            bodyText: options.bodyText,
            cards: options.cards || [],
          });
        } else if (options.type === 'template') {
          metaResult = await MetaWhatsAppClient.sendTemplate({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            templateName: options.templateName || 'teaser_alert',
            languageCode: options.languageCode || 'en_US',
            components: options.components,
          });
        } else if (['image', 'video', 'audio', 'document'].includes(options.type)) {
          metaResult = await MetaWhatsAppClient.sendMedia({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            type: options.type as any,
            mediaUrl: options.mediaUrl,
            mediaId: options.mediaId,
            caption: options.caption || options.text,
            filename: options.filename,
          });
        } else if (options.type === 'catalog') {
          if (options.productRetailerId) {
            metaResult = await MetaWhatsAppClient.sendSingleProduct({
              phoneNumberId,
              accessToken,
              to: cleanTo,
              catalogId: options.catalogId || settings.catalogId || '',
              productRetailerId: options.productRetailerId,
              bodyText: options.bodyText,
            });
          } else {
            metaResult = await MetaWhatsAppClient.sendMultiProduct({
              phoneNumberId,
              accessToken,
              to: cleanTo,
              catalogId: options.catalogId || settings.catalogId || '',
              headerText: options.headerText || 'Product Catalog',
              bodyText: options.bodyText || 'Browse our items',
              sections: options.productSections || [],
            });
          }
        }

        if (metaResult.success) {
          break;
        }

        // Do not retry client validation errors (code 100, 190, 131047)
        if (metaResult.errorCode && [100, 190, 131047, 131026].includes(metaResult.errorCode)) {
          break;
        }

        if (attempt < maxRetries) {
          await delay(Math.pow(2, attempt) * 500); // 1s, 2s
        }
      } catch (err: any) {
        console.error(`[WhatsApp Message Service] Attempt ${attempt} failed:`, err.message);
        if (attempt === maxRetries) {
          metaResult = { success: false, error: err.message };
        } else {
          await delay(Math.pow(2, attempt) * 500);
        }
      }
    }

    // 5. Save outbound message record
    const metaMessageId = metaResult.messageId || metaResult.metaMessageId || `wamid.${Date.now()}`;
    const outboundContent =
      options.text ||
      options.bodyText ||
      (options.templateName ? `Template: ${options.templateName}` : `[${options.type.toUpperCase()}]`);

    const savedMessage = MessagesDB.create(
      {
        metaMessageId,
        phoneNumber: cleanTo,
        contactId: contact.id,
        direction: 'outbound',
        type: options.type,
        status: metaResult.success ? 'sent' : 'failed',
        content: outboundContent,
        mediaUrl: options.mediaUrl,
        payload: options,
        errorMessage: metaResult.error,
      },
      workspaceId
    );

    if (metaResult.success) {
      ConversationsDB.recordOutbound(cleanTo, contact.id, workspaceId);
    }

    return {
      success: metaResult.success,
      messageId: metaMessageId,
      metaMessageId,
      error: metaResult.error,
      errorCode: metaResult.errorCode,
      savedMessage,
    };
  }
}
