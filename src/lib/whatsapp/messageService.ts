import { SettingsDB, MessagesDB, ContactsDB, ConversationsDB, MediaAssetsDB, DEFAULT_WORKSPACE_ID, Message, MessageType } from '@/lib/db';
import { MetaWhatsAppClient, MetaApiResult } from '@/lib/meta/api';
import { decryptToken } from '@/lib/crypto';
import {
  CanonicalOutboundMessage,
  OutboundMessageKind,
  canonicalizeOutboundMessage,
  dbMessageType,
  validateOutboundMessage,
} from './messageModel';

export interface SendWhatsAppMessageOptions {
  workspaceId?: string;
  to: string;
  type: OutboundMessageKind;
  text?: string;
  phoneNumberId?: string;
  accessToken?: string;
  requireRealDelivery?: boolean;
  allowSimulation?: boolean; // Explicit opt-in for local tests only
  isConnectionTest?: boolean;
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
  mediaAssetId?: string;
  caption?: string;
  filename?: string;
  catalogId?: string;
  productRetailerId?: string;
  productSections?: any[];
  flowId?: string;
  flowToken?: string;
  flowCta?: string;
  flowScreen?: string;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contact?: { formattedName: string; phoneNumber: string; organization?: string };
  bypassWindowCheck?: boolean; // Only for system alerts
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  metaMessageId?: string;
  error?: string;
  errorCode?: number;
  errorSubcode?: number;
  details?: any;
  phoneNumberIdUsed?: string;
  isSimulated?: boolean;
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
    const workspaceId = (options.workspaceId === 'default' || !options.workspaceId) ? DEFAULT_WORKSPACE_ID : options.workspaceId;
    const settings = await SettingsDB.get(workspaceId);
    const phoneNumberId = (options.phoneNumberId || settings.phoneNumberId || '').trim();
    const accessToken = decryptToken((options.accessToken || settings.accessToken || '').trim());

    const message: CanonicalOutboundMessage = canonicalizeOutboundMessage({
      kind: options.type,
      text: options.text,
      headerText: options.headerText,
      bodyText: options.bodyText,
      footerText: options.footerText,
      templateName: options.templateName,
      languageCode: options.languageCode,
      components: options.components,
      buttons: options.buttons,
      buttonText: options.buttonText,
      sections: options.sections,
      cards: options.cards,
      mediaUrl: options.mediaUrl,
      mediaId: options.mediaId,
      mediaAssetId: options.mediaAssetId,
      caption: options.caption,
      filename: options.filename,
      catalogId: options.catalogId || settings.catalogId,
      productRetailerId: options.productRetailerId,
      productSections: options.productSections,
      flowId: options.flowId,
      flowToken: options.flowToken,
      flowCta: options.flowCta,
      flowScreen: options.flowScreen,
      location: options.location,
      contact: options.contact,
    });
    const validationErrors = validateOutboundMessage(message);
    if (validationErrors.length) {
      return {
        success: false,
        error: validationErrors.join(' '),
        phoneNumberIdUsed: phoneNumberId,
        isSimulated: false,
      };
    }
    const persistedType = dbMessageType(message.kind);

    const cleanTo = options.to.startsWith('+') ? options.to : `+${options.to.replace(/[^0-9]/g, '')}`;

    // 1. Ensure contact exists in database
    const contact = await ContactsDB.upsert(
      {
        phoneNumber: cleanTo,
      },
      workspaceId
    );

    // 2. 24-Hour Policy Window Enforcement (Enforces Meta Cloud API Conversation Window)
    const isTemplateMessage = message.kind === 'template' || message.kind === 'carousel';
    if (!isTemplateMessage) {
      const windowOpen = await ConversationsDB.isWindowOpen(cleanTo, workspaceId);

      if (!windowOpen) {
        const errorMsg =
          '24-Hour Window Closed (#131047): Customer last messaged over 24 hours ago. Meta WhatsApp policy requires sending an approved Template message to initiate or re-engage conversation.';
        console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');

        const savedFailed = await MessagesDB.create(
          {
            phoneNumber: cleanTo,
            contactId: contact.id,
            direction: 'outbound',
            type: persistedType,
            status: 'failed',
            content: message.text || message.bodyText || `[${message.kind.toUpperCase()}]`,
            errorMessage: errorMsg,
            payload: { type: message.kind, templateName: message.templateName, mediaId: message.mediaId },
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
    const isPlaceholder = Boolean(
      !accessToken ||
      accessToken.startsWith('enc:gcm:') ||
      accessToken.includes('SAMPLE_TOKEN') ||
      accessToken.includes('AI_GENERATED') ||
      accessToken.includes('placeholder') ||
      accessToken.startsWith('MOCK_') ||
      accessToken.startsWith('TEST_')
    );

    const isLive = Boolean(
      phoneNumberId &&
      accessToken &&
      !isPlaceholder &&
      process.env.META_SANDBOX !== 'true'
    );

    // If real delivery is strictly required (e.g. Connection Test), NEVER fake or simulate success!
    if (options.requireRealDelivery || options.isConnectionTest) {
      if (!phoneNumberId || !accessToken) {
        const err = 'Real WhatsApp delivery failed: Phone Number ID or Access Token is missing. Enter live credentials in Setup Wizard Step 2 & 3.';
        console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
        return { success: false, error: err, phoneNumberIdUsed: phoneNumberId, isSimulated: false };
      }
      if (isPlaceholder) {
        const err = 'Real WhatsApp delivery failed: Placeholder, masked, or test token detected. Enter a live System User Access Token from Meta Business Manager.';
        console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
        return { success: false, error: err, phoneNumberIdUsed: phoneNumberId, isSimulated: false };
      }
    }

    if (!isLive) {
      if (!options.allowSimulation || options.requireRealDelivery || options.isConnectionTest) {
        return {
          success: false,
          error: 'WhatsApp delivery unavailable: configure a live Phone Number ID and access token, and disable META_SANDBOX. No message was sent.',
          phoneNumberIdUsed: phoneNumberId,
          isSimulated: false,
        };
      }

      // Unconfigured or sandbox credentials
      const simulatedId = `wamid.local_${Date.now()}`;


      const savedMessage = await MessagesDB.create(
        {
          metaMessageId: simulatedId,
          phoneNumber: cleanTo,
          contactId: contact.id,
          direction: 'outbound',
          type: persistedType,
          status: 'sent',
          content: message.text || message.bodyText || message.templateName || `[${message.kind.toUpperCase()}]`,
          payload: { type: message.kind, templateName: message.templateName, mediaId: message.mediaId, isSimulation: true },
        },
        workspaceId
      );

      // Track outbound conversation timestamp
      await ConversationsDB.recordOutbound(cleanTo, contact.id, workspaceId, savedMessage.metaMessageId || savedMessage.id);

      return {
        success: true,
        messageId: simulatedId,
        metaMessageId: simulatedId,
        phoneNumberIdUsed: phoneNumberId,
        isSimulated: true,
        savedMessage,
      };
    }

    if (['image', 'video', 'audio', 'document'].includes(message.kind) && message.mediaAssetId && !message.mediaId) {
      const asset = await MediaAssetsDB.download(message.mediaAssetId, workspaceId);
      if (!asset) return { success: false, error: 'The uploaded media file no longer exists in this workspace.' };
      if (asset.metaMediaId) {
        message.mediaId = asset.metaMediaId;
      } else {
        const upload = await MetaWhatsAppClient.uploadMedia({
          phoneNumberId,
          accessToken,
          fileBuffer: asset.buffer,
          mimeType: asset.mimeType,
          filename: asset.fileName,
        });
        if (!upload.success || !upload.mediaId) return { success: false, error: upload.error || 'Meta could not prepare the uploaded media file.' };
        message.mediaId = upload.mediaId;
        await MediaAssetsDB.setMetaMediaId(asset.id, workspaceId, upload.mediaId);
      }
    }

    // 4. Dispatch with exponential backoff retries (up to 3 attempts)
    let metaResult: MetaApiResult = { success: false };
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (message.kind === 'text') {
          metaResult = await MetaWhatsAppClient.sendText({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            text: message.text || message.bodyText || '',
          });
        } else if (message.kind === 'button' || (message.kind === 'interactive' && message.buttons?.length)) {
          metaResult = await MetaWhatsAppClient.sendInteractiveButtons({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            headerText: message.headerText,
            bodyText: message.bodyText || message.text || '',
            footerText: message.footerText,
            buttons: message.buttons || [],
          });
        } else if (message.kind === 'list') {
          metaResult = await MetaWhatsAppClient.sendInteractiveList({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            headerText: message.headerText,
            bodyText: message.bodyText || message.text || '',
            footerText: message.footerText,
            buttonText: message.buttonText || 'Options',
            sections: message.sections || [],
          });
        } else if (message.kind === 'carousel') {
          metaResult = await MetaWhatsAppClient.sendCarouselTemplate({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            templateName: message.templateName,
            bodyText: message.bodyText,
            cards: message.cards || [],
          });
        } else if (message.kind === 'template') {
          metaResult = await MetaWhatsAppClient.sendTemplate({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            templateName: message.templateName!,
            languageCode: message.languageCode || 'en_US',
            components: message.components,
          });
        } else if (['image', 'video', 'audio', 'document'].includes(message.kind)) {
          metaResult = await MetaWhatsAppClient.sendMedia({
            phoneNumberId,
            accessToken,
            to: cleanTo,
            type: message.kind as any,
            mediaUrl: message.mediaUrl,
            mediaId: message.mediaId,
            caption: message.caption || message.text,
            filename: message.filename,
          });
        } else if (message.kind === 'catalog') {
          if (message.productRetailerId) {
            metaResult = await MetaWhatsAppClient.sendSingleProduct({
              phoneNumberId,
              accessToken,
              to: cleanTo,
              catalogId: message.catalogId || '',
              productRetailerId: message.productRetailerId,
              bodyText: message.bodyText,
            });
          } else {
            metaResult = await MetaWhatsAppClient.sendMultiProduct({
              phoneNumberId,
              accessToken,
              to: cleanTo,
              catalogId: message.catalogId || '',
              headerText: message.headerText || 'Product Catalog',
              bodyText: message.bodyText || 'Browse our items',
              sections: message.productSections || [],
            });
          }
        } else if (message.kind === 'flow') {
          metaResult = await MetaWhatsAppClient.sendWhatsAppFlow({
            phoneNumberId, accessToken, to: cleanTo, flowId: message.flowId!,
            flowToken: message.flowToken, flowCta: message.flowCta,
            screen: message.flowScreen, headerText: message.headerText,
            bodyText: message.bodyText || message.text || '', footerText: message.footerText,
          });
        } else if (message.kind === 'location') {
          metaResult = await MetaWhatsAppClient.sendLocation({
            phoneNumberId, accessToken, to: cleanTo,
            latitude: message.location!.latitude, longitude: message.location!.longitude,
            name: message.location!.name, address: message.location!.address,
          });
        } else if (message.kind === 'contact_card') {
          metaResult = await MetaWhatsAppClient.sendContactCard({
            phoneNumberId, accessToken, to: cleanTo,
            contactName: message.contact!.formattedName,
            contactPhone: message.contact!.phoneNumber,
            organization: message.contact!.organization,
          });
        } else {
          metaResult = { success: false, error: `Unsupported message type: ${message.kind}` };
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
        console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
        if (attempt === maxRetries) {
          metaResult = { success: false, error: err.message };
        } else {
          await delay(Math.pow(2, attempt) * 500);
        }
      }
    }

    // 5. Save outbound message record
    const metaMessageId = metaResult.messageId || metaResult.metaMessageId;
    const outboundContent =
      message.text ||
      message.bodyText ||
      (message.templateName ? `Template: ${message.templateName}` : `[${message.kind.toUpperCase()}]`);

    const savedMessage = await MessagesDB.create(
      {
        metaMessageId: metaMessageId || undefined,
        phoneNumber: cleanTo,
        contactId: contact.id,
        direction: 'outbound',
        type: persistedType,
        status: metaResult.success ? 'sent' : 'failed',
        content: outboundContent,
        mediaUrl: message.mediaUrl,
        payload: { type: message.kind, templateName: message.templateName, mediaId: message.mediaId },
        errorMessage: metaResult.error,
      },
      workspaceId
    );

    if (metaResult.success) {
      await ConversationsDB.recordOutbound(cleanTo, contact.id, workspaceId, savedMessage.metaMessageId || savedMessage.id);
    }

    return {
      success: metaResult.success,
      messageId: metaMessageId,
      metaMessageId,
      error: metaResult.error,
      errorCode: metaResult.errorCode,
      errorSubcode: metaResult.errorSubcode,
      details: metaResult.details,
      phoneNumberIdUsed: phoneNumberId,
      isSimulated: false,
      savedMessage,
    };
  }
}
