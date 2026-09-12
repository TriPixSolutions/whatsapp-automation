import axios from 'axios';

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';

export interface SendTemplateOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
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

export interface SendTextOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}

export class MetaWhatsAppClient {
  private static cleanPhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  private static isTestMode(token: string): boolean {
    return (
      !token ||
      token.includes('SAMPLE_TOKEN') ||
      token.startsWith('MOCK_') ||
      token.startsWith('TEST_')
    );
  }

  /**
   * Dispatches Meta-Approved Template (e.g. teaser_alert)
   */
  static async sendTemplate(options: SendTemplateOptions) {
    const { phoneNumberId, accessToken, to, templateName, languageCode = 'en_US', components } = options;
    const recipient = this.cleanPhone(to);

    if (this.isTestMode(accessToken)) {
      console.log(`[Meta Client Simulation] Template '${templateName}' dispatched to ${recipient}`);
      return {
        success: true,
        metaMessageId: `wamid.sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        simulated: true,
      };
    }

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
      const res = await axios.post(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      const metaMessageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, metaMessageId, data: res.data };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error('[Meta Client Error] sendTemplate failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Dispatches WhatsApp Interactive Quick Reply Button Message (Max 3 buttons)
   * Perfect for Test Flow 2: [Product Specs, Pricing, Talk to Agent]
   */
  static async sendInteractiveButtons(options: SendInteractiveButtonsOptions) {
    const { phoneNumberId, accessToken, to, headerText, bodyText, footerText, buttons } = options;
    const recipient = this.cleanPhone(to);

    if (this.isTestMode(accessToken)) {
      console.log(`[Meta Client Simulation] Interactive Buttons dispatched to ${recipient}`);
      return {
        success: true,
        metaMessageId: `wamid.sim_interactive_${Date.now()}`,
        simulated: true,
      };
    }

    // WhatsApp Interactive Button format
    const formattedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id.substring(0, 256),
        title: btn.title.substring(0, 20),
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
      const res = await axios.post(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      const metaMessageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, metaMessageId, data: res.data };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error('[Meta Client Error] sendInteractiveButtons failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Dispatches Standard Text Message
   */
  static async sendText(options: SendTextOptions) {
    const { phoneNumberId, accessToken, to, text } = options;
    const recipient = this.cleanPhone(to);

    if (this.isTestMode(accessToken)) {
      console.log(`[Meta Client Simulation] Text message dispatched to ${recipient}: ${text}`);
      return {
        success: true,
        metaMessageId: `wamid.sim_text_${Date.now()}`,
        simulated: true,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: { body: text },
    };

    try {
      const res = await axios.post(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      const metaMessageId = res.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { success: true, metaMessageId, data: res.data };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error('[Meta Client Error] sendText failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}
