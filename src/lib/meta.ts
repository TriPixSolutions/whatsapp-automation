// Meta WhatsApp Cloud API (v18.0+) Client & Utilities
// Official Facebook Graph API endpoint: https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages

import {
  MetaWhatsAppClient,
  SendTextOptions,
  SendInteractiveButtonsOptions,
  SendInteractiveListOptions,
  SendCarouselOptions,
  SendTemplateOptions,
  MetaApiResult,
} from './meta/api';

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
      verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'passion_fruit_verify_token_2025',
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
  if (typeof window === 'undefined') {
    return;
  }
  const current = getMetaCredentials();
  const updated: MetaCredentials = {
    ...current,
    ...creds,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync to backend DB asynchronously
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((err) => console.warn('Backend settings sync error:', err));
}

export {
  MetaWhatsAppClient,
  type SendTextOptions,
  type SendInteractiveButtonsOptions,
  type SendInteractiveListOptions,
  type SendCarouselOptions,
  type SendTemplateOptions,
  type MetaApiResult,
};

// Top-level convenient exports
export const sendText = MetaWhatsAppClient.sendText.bind(MetaWhatsAppClient);
export const sendInteractiveButtons = MetaWhatsAppClient.sendInteractiveButtons.bind(MetaWhatsAppClient);
export const sendInteractiveList = MetaWhatsAppClient.sendInteractiveList.bind(MetaWhatsAppClient);
export const sendCarouselTemplate = MetaWhatsAppClient.sendCarouselTemplate.bind(MetaWhatsAppClient);
export const sendTemplate = MetaWhatsAppClient.sendTemplate.bind(MetaWhatsAppClient);
export const parseMetaError = MetaWhatsAppClient.parseMetaError.bind(MetaWhatsAppClient);

// Backward-compatible aliases
export async function sendWhatsAppTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}) {
  return MetaWhatsAppClient.sendText(params);
}

export async function sendWhatsAppTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}) {
  return MetaWhatsAppClient.sendTemplate(params);
}
