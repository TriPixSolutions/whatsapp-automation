import axios, { AxiosError } from 'axios';

import { META_GRAPH_VERSION } from '@/lib/meta/config';

export interface MetaApiResult {
  success: boolean;
  messageId?: string;
  metaMessageId?: string;
  simulated?: boolean;
  error?: string;
  errorCode?: number;
  errorSubcode?: number;
  details?: any;
}

export interface SendTextOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}

export interface SendInteractiveButtonsOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: { id: string; title: string }[];
}

export interface ListSection {
  title: string;
  rows: { id: string; title: string; description?: string }[];
}

export interface SendInteractiveListOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttonText: string;
  sections: ListSection[];
}

export interface CarouselCard {
  headerImage?: string;
  title: string;
  description: string;
  buttons: { id: string; title: string }[];
}

export interface SendCarouselOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName?: string;
  bodyText?: string;
  cards: CarouselCard[];
}

export interface SendTemplateOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export class MetaWhatsAppClient {
  private static cleanPhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * Helper to parse Meta API errors with specific actionable messages
   */
  public static parseMetaError(error: any): { message: string; code?: number; subcode?: number } {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const err = error.response.data.error;
      const code = err.code;
      const subcode = err.error_subcode;
      let humanMessage = err.message || 'Meta API returned an unknown error';

      if (code === 131009 || code === 190) {
        humanMessage = 'Token Expired (#131009): System User Access Token is invalid or expired. Regenerate in Meta Business Manager.';
      } else if (code === 131047) {
        humanMessage = '24-Hour Window Expired (#131047): Customer last replied >24 hrs ago. Must send an approved Template Message.';
      } else if (code === 131026) {
        humanMessage = 'Message Undeliverable (#131026): The phone number does not have an active WhatsApp account or privacy settings block message.';
      } else if (code === 130429) {
        humanMessage = 'Rate Limit Hit (#130429): Cloud API messaging throughput limit reached. Slow down broadcasts.';
      } else if (code === 131030) {
        humanMessage = 'Recipient Not Allowed (#131030): In Meta Developer mode, recipient phone number must be added to Allowed Test Recipients in Meta App Dashboard > WhatsApp > API Setup.';
      } else if (code === 131056) {
        humanMessage = 'Pairing Rate Limit (#131056): Too many messages sent to this recipient in a short window. Please wait a few minutes before retrying.';
      } else if (code === 133010) {
        humanMessage = 'Phone Number Not Registered (#133010): The Phone Number ID is not registered or active with Meta WhatsApp Business Account.';
      } else if (code === 100) {
        humanMessage = `Invalid Parameter (#100): ${err.error_data?.details || err.message}`;
      } else if (code === 132001) {
        humanMessage = `Template Does Not Exist (#132001): Template name does not exist in the translation. The requested template was not found or has not been approved in Meta WhatsApp Manager for the specified language. For connection verification, use a simple text message.`;
      }

      return { message: humanMessage, code, subcode };
    }

    return { message: error.message || 'Network request to Meta Graph API failed' };
  }

  /**
   * 1. Send Standard Text Message
   * POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages
   */
  static async sendText(options: SendTextOptions): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, text } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };








    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });



      const messageId = res.data?.messages?.[0]?.id;
      if (!messageId || typeof messageId !== 'string' || !messageId.startsWith('wamid.')) {
        console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
        return {
          success: false,
          error: 'Meta Cloud API responded without a valid wamid message ID.',
          details: res.data,
        };
      }

      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      return {
        success: false,
        error: parsed.message,
        errorCode: parsed.code,
        errorSubcode: parsed.subcode,
        details: err.response?.data,
      };
    }
  }

  /**
   * 2. Send Interactive Quick Reply Buttons (Up to 3 buttons)
   */
  static async sendInteractiveButtons(options: SendInteractiveButtonsOptions): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, headerText, bodyText, footerText, buttons } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const formattedButtons = buttons.slice(0, 3).map((btn, index) => ({
      type: 'reply',
      reply: {
        id: (btn.id || `btn_${index}`).substring(0, 256),
        title: (btn.title || `Button ${index + 1}`).substring(0, 20),
      },
    }));

    const interactivePayload: any = {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: formattedButtons,
      },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }

    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'interactive',
      interactive: interactivePayload,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });

      const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      return {
        success: false,
        error: parsed.message,
        errorCode: parsed.code,
        errorSubcode: parsed.subcode,
        details: err.response?.data,
      };
    }
  }

  /**
   * 3. Send Interactive List Message (Sections & Rows Menu)
   */
  static async sendInteractiveList(options: SendInteractiveListOptions): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, headerText, bodyText, footerText, buttonText, sections } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const formattedSections = sections.map((sec, secIdx) => ({
      title: sec.title.substring(0, 24),
      rows: sec.rows.map((r, rIdx) => ({
        id: (r.id || `row_${secIdx}_${rIdx}`).substring(0, 200),
        title: r.title.substring(0, 24),
        description: r.description ? r.description.substring(0, 72) : undefined,
      })),
    }));

    const interactivePayload: any = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: (buttonText || 'View Options').substring(0, 20),
        sections: formattedSections,
      },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }

    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'interactive',
      interactive: interactivePayload,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });

      const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      return {
        success: false,
        error: parsed.message,
        errorCode: parsed.code,
        errorSubcode: parsed.subcode,
        details: err.response?.data,
      };
    }
  }

  /**
   * 4. Send Carousel / Product Cards Message
   * Dispatches horizontal scrollable carousel cards with images and action buttons
   */
  static async sendCarouselTemplate(options: SendCarouselOptions): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, templateName, bodyText, cards } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;
    const normalizedCards: CarouselCard[] = (cards || []).map((card: any, idx) => ({
      headerImage: card.headerImage || card.headerImageUrl || undefined,
      title: String(card.title || card.bodyText || `Product ${idx + 1}`).slice(0, 60),
      description: String(card.description || card.bodyText || card.title || `Product ${idx + 1}`).slice(0, 200),
      buttons: (card.buttons || []).map((button: any, buttonIdx: number) => ({
        id: String(button.id || button.payload || `card_${idx}_button_${buttonIdx}`),
        title: String(button.title || button.text || 'Select').slice(0, 20),
      })),
    }));

    if (normalizedCards.length === 0) {
      return { success: false, error: 'Carousel requires at least one configured card.' };
    }

    if (!templateName?.trim()) return { success: false, error: 'An approved Meta carousel template name is required. A carousel will not be replaced with a list.' };

    // Send the configured carousel template without changing the message type.
    if (templateName) {
      const carouselCards = normalizedCards.map((card, idx) => ({
        card_index: idx,
        components: [
          ...(card.headerImage
            ? [{ type: 'header', parameters: [{ type: 'image', image: { link: card.headerImage } }] }]
            : []),
          { type: 'body', parameters: [{ type: 'text', text: card.title }] },
          ...card.buttons.map((btn, btnIdx) => ({
            type: 'button',
            sub_type: 'quick_reply',
            index: btnIdx,
            parameters: [{ type: 'payload', payload: btn.id }],
          })),
        ],
      }));

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [
            {
              type: 'carousel',
              cards: carouselCards,
            },
          ],
        },
      };

      try {
        const res = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        });
        const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
        return { success: true, messageId, metaMessageId: messageId, details: res.data };
      } catch (err: any) {
        const parsed = this.parseMetaError(err);
        return { success: false, error: parsed.message, errorCode: parsed.code, errorSubcode: parsed.subcode, details: err.response?.data };
      }
    }

    return { success: false, error: 'Carousel template configuration is required.' };
  }

  /**
   * 5. Send Meta-Approved Template (e.g. teaser_alert, order_confirmation)
   */
  static async sendTemplate(options: SendTemplateOptions): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, templateName, languageCode = 'en_US', components } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }





    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });



      const messageId = res.data?.messages?.[0]?.id;
      if (!messageId || typeof messageId !== 'string' || !messageId.startsWith('wamid.')) {
        console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
        return {
          success: false,
          error: 'Meta Cloud API did not return a valid wamid message ID.',
          details: res.data,
        };
      }

      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      return {
        success: false,
        error: parsed.message,
        errorCode: parsed.code,
        errorSubcode: parsed.subcode,
        details: err.response?.data,
      };
    }
  }

  /**
   * 6. Send Media Message (Image, Video, Audio, Document)
   */
  static async sendMedia(options: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    type: 'image' | 'video' | 'audio' | 'document';
    mediaUrl?: string;
    mediaId?: string;
    caption?: string;
    filename?: string;
  }): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, type, mediaUrl, mediaId, caption, filename } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const mediaObject: any = {};
    if (mediaId) {
      mediaObject.id = mediaId;
    } else if (mediaUrl) {
      mediaObject.link = mediaUrl;
    } else {
      return { success: false, error: 'Either mediaUrl or mediaId must be provided' };
    }

    if (caption && (type === 'image' || type === 'video' || type === 'document')) {
      mediaObject.caption = caption;
    }
    if (filename && type === 'document') {
      mediaObject.filename = filename;
    }

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type,
      [type]: mediaObject,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      return {
        success: false,
        error: parsed.message,
        errorCode: parsed.code,
        errorSubcode: parsed.subcode,
        details: err.response?.data,
      };
    }
  }

  /**
   * 7. Upload Media to Meta Cloud API
   * POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/media
   */
  static async uploadMedia(options: {
    phoneNumberId: string;
    accessToken: string;
    fileBuffer: Buffer;
    mimeType: string;
    filename: string;
  }): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    const { phoneNumberId, accessToken, fileBuffer, mimeType, filename } = options;
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/media`;

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', mimeType);

      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 20000,
      });

      const mediaId = res.data?.id;
      return { success: true, mediaId };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.warn('[WhatsApp] Operation failed; inspect authorized execution diagnostics.');
      return { success: false, error: parsed.message };
    }
  }

  /**
   * 8. Send Single Product from Catalog
   */
  static async sendSingleProduct(options: import('./catalog').SingleProductOptions) {
    const { sendSingleProductMessage } = await import('./catalog');
    return sendSingleProductMessage(options);
  }

  /**
   * 9. Send Multi-Product List from Catalog
   */
  static async sendMultiProduct(options: import('./catalog').MultiProductOptions) {
    const { sendMultiProductMessage } = await import('./catalog');
    return sendMultiProductMessage(options);
  }

  /**
   * 10. Send WhatsApp Checkout Order & Payment Response
   */
  static async sendCheckout(options: import('./checkout').CheckoutOptions) {
    const { sendCheckoutResponse } = await import('./checkout');
    return sendCheckoutResponse(options);
  }

  /**
   * 11. Sync Store Products to Meta Commerce Catalog Batch API
   */
  static async syncCatalog(options: import('./catalog').CatalogSyncOptions) {
    const { syncProductsToMetaCatalog } = await import('./catalog');
    return syncProductsToMetaCatalog(options);
  }

  /**
   * 12. Send Native Location Message
   */
  static async sendLocation(options: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  }): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, latitude, longitude, name, address } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'location',
      location: {
        latitude,
        longitude,
        name: name || 'Location',
        address: address || '',
      },
    };

    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      return { success: false, error: parsed.message, errorCode: parsed.code };
    }
  }

  /**
   * 13. Send Native Contact Card Message
   */
  static async sendContactCard(options: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    contactName: string;
    contactPhone: string;
    organization?: string;
  }): Promise<MetaApiResult> {
    const { phoneNumberId, accessToken, to, contactName, contactPhone, organization } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'contacts',
      contacts: [
        {
          name: {
            first_name: contactName,
            formatted_name: contactName,
          },
          org: organization ? { company: organization } : undefined,
          phones: [{ phone: contactPhone, type: 'WORK' }],
        },
      ],
    };

    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      return { success: false, error: parsed.message, errorCode: parsed.code };
    }
  }

  /**
   * 14. Send Interactive WhatsApp Flow Message
   */
  static async sendWhatsAppFlow(options: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    flowId: string;
    flowCta?: string;
    headerText?: string;
    bodyText: string;
    footerText?: string;
    flowToken?: string;
    screen?: string;
    screenData?: Record<string, any>;
  }): Promise<MetaApiResult> {
    const {
      phoneNumberId,
      accessToken,
      to,
      flowId,
      flowCta = 'Start Flow',
      headerText,
      bodyText,
      footerText,
      flowToken = `flow_tok_${Date.now()}`,
      screen = 'START',
      screenData = {},
    } = options;
    const recipient = this.cleanPhone(to);
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

    const interactivePayload: any = {
      type: 'flow',
      body: { text: bodyText },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: flowId,
          flow_cta: flowCta,
          flow_action: 'navigate',
          flow_action_payload: {
            screen,
            data: screenData,
          },
        },
      },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'interactive',
      interactive: interactivePayload,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      const messageId = res.data?.messages?.[0]?.id;
      if (typeof messageId !== 'string' || !messageId.startsWith('wamid.')) return { success: false, error: 'Meta did not return a valid message ID.' };
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      return { success: false, error: parsed.message, errorCode: parsed.code };
    }
  }

  /**
   * 15. Fetch Live Approved Templates from Meta WABA Account
   */
  static async fetchWabaTemplates(options: {
    wabaId: string;
    accessToken: string;
  }): Promise<{ success: boolean; templates?: any[]; error?: string }> {
    const { wabaId, accessToken } = options;
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}/message_templates?fields=id,name,status,category,language,components&limit=100`;

    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15000,
      });
      return { success: true, templates: res.data?.data || [] };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      return { success: false, error: parsed.message };
    }
  }
}

export * from './catalog';
export * from './checkout';
