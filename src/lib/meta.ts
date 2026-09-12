// Meta WhatsApp Cloud API (v18.0+) Client & Utilities
// Official Facebook Graph API endpoint: https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages

export interface MetaCredentials {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
}

export const DEFAULT_META_CREDENTIALS: MetaCredentials = {
  wabaId: '',
  phoneNumberId: '',
  accessToken: '',
  verifyToken: 'passion_fruit_verify_token_2025',
};

const STORAGE_KEY = 'pf_meta_credentials';

export function getMetaCredentials(): MetaCredentials {
  if (typeof window === 'undefined') {
    return {
      wabaId: process.env.META_WABA_ID || '',
      phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
      accessToken: process.env.META_ACCESS_TOKEN || '',
      verifyToken: process.env.META_VERIFY_TOKEN || 'passion_fruit_verify_token_2025',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        wabaId: parsed.wabaId || '',
        phoneNumberId: parsed.phoneNumberId || '',
        accessToken: parsed.accessToken || '',
        verifyToken: parsed.verifyToken || 'passion_fruit_verify_token_2025',
      };
    }
  } catch (e) {
    console.error('Failed to parse meta credentials from localStorage', e);
  }

  return DEFAULT_META_CREDENTIALS;
}

export function saveMetaCredentials(creds: Partial<MetaCredentials>): void {
  if (typeof window === 'undefined') return;
  const current = getMetaCredentials();
  const updated: MetaCredentials = {
    ...current,
    ...creds,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export interface SendTextMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}

export interface SendTemplateMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export interface MetaSendResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  details?: any;
}

/**
 * Sends a real-time text message to a WhatsApp user via Meta Cloud API v18.0
 */
export async function sendWhatsAppTextMessage({
  phoneNumberId,
  accessToken,
  to,
  text,
}: SendTextMessageParams): Promise<MetaSendResult> {
  const cleanTo = to.replace(/[^0-9]/g, '');
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || `Meta API returned HTTP ${response.status}`,
        details: data.error,
      };
    }

    const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
    return {
      success: true,
      messageId,
      status: 'sent',
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request to Meta Graph API failed',
    };
  }
}

/**
 * Sends an official Meta-approved template message via Meta Cloud API v18.0
 */
export async function sendWhatsAppTemplateMessage({
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode = 'en_US',
  components = [],
}: SendTemplateMessageParams): Promise<MetaSendResult> {
  const cleanTo = to.replace(/[^0-9]/g, '');
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  if (components.length > 0) {
    payload.template.components = components;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || `Meta API returned HTTP ${response.status}`,
        details: data.error,
      };
    }

    const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
    return {
      success: true,
      messageId,
      status: 'sent',
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request to Meta Graph API failed',
    };
  }
}
