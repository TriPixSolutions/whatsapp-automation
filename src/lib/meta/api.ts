import axios, { AxiosError } from 'axios';

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';

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
      } else if (code === 100) {
        humanMessage = `Invalid Parameter (#100): ${err.error_data?.details || err.message}`;
      }

      return { message: humanMessage, code, subcode };
    }

    return { message: error.message || 'Network request to Meta Graph API failed' };
  }

  /**
   * 1. Send Standard Text Message
   * POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
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

      const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.error('[Meta Client] sendText error:', parsed);
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

      const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.error('[Meta Client] sendInteractiveButtons error:', parsed);
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

      const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.error('[Meta Client] sendInteractiveList error:', parsed);
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

    // If templateName is provided, send via Meta Carousel Template API
    if (templateName) {
      const carouselCards = cards.map((card, idx) => ({
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
        const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
        return { success: true, messageId, metaMessageId: messageId, details: res.data };
      } catch (err: any) {
        // Fallback to interactive list if template is unapproved
        console.warn('[Meta Client] Carousel template API returned error, falling back to Interactive format');
      }
    }

    // Interactive fallback: Deliver card items as rich structured interactive list
    const fallbackSections: ListSection[] = [
      {
        title: 'Featured Carousel Items',
        rows: cards.map((c, idx) => ({
          id: c.buttons[0]?.id || `card_${idx}`,
          title: c.title.substring(0, 24),
          description: c.description.substring(0, 72),
        })),
      },
    ];

    return this.sendInteractiveList({
      phoneNumberId,
      accessToken,
      to: recipient,
      headerText: 'Featured Showcase',
      bodyText: bodyText || 'Swipe through our featured catalog items below:',
      buttonText: 'Browse Items',
      sections: fallbackSections,
    });
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

      const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.error('[Meta Client] sendTemplate error:', parsed);
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

      const messageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, messageId, metaMessageId: messageId, details: res.data };
    } catch (err: any) {
      const parsed = this.parseMetaError(err);
      console.error(`[Meta Client] sendMedia (${type}) error:`, parsed);
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
   * POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/media
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
      console.error('[Meta Client] uploadMedia error:', parsed);
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
}

export * from './catalog';
export * from './checkout';


