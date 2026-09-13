import axios from 'axios';
import { MetaApiResult } from './api';
import {
  SingleProductOptions,
  MultiProductOptions,
  CatalogSyncOptions,
} from './catalogTypes';

export * from './catalogTypes';

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export async function sendSingleProductMessage(options: SingleProductOptions): Promise<MetaApiResult> {
  const { phoneNumberId, accessToken, to, catalogId, productRetailerId, bodyText, footerText } = options;
  const recipient = cleanPhone(to);
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'interactive',
    interactive: {
      type: 'product',
      body: { text: bodyText || 'Check out this product from our catalog:' },
      action: { catalog_id: catalogId, product_retailer_id: productRetailerId },
    },
  };

  if (footerText) payload.interactive.footer = { text: footerText };

  try {
    const res = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 12000,
    });
    const messageId = res.data?.messages?.[0]?.id || `wamid.prod_${Date.now()}`;
    return { success: true, messageId, metaMessageId: messageId, details: res.data };
  } catch (err: any) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    return { success: false, error: errorMsg, details: err.response?.data };
  }
}

export async function sendMultiProductMessage(options: MultiProductOptions): Promise<MetaApiResult> {
  const { phoneNumberId, accessToken, to, catalogId, headerText, bodyText, footerText, sections } = options;
  const recipient = cleanPhone(to);
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;

  const formattedSections = sections.map((sec) => ({
    title: sec.title.substring(0, 24),
    product_items: sec.productRetailerIds.map((id) => ({ product_retailer_id: id })),
  }));

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: { type: 'text', text: headerText.substring(0, 60) },
      body: { text: bodyText.substring(0, 1024) },
      action: { catalog_id: catalogId, sections: formattedSections },
    },
  };

  if (footerText) payload.interactive.footer = { text: footerText.substring(0, 60) };

  try {
    const res = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 12000,
    });
    const messageId = res.data?.messages?.[0]?.id || `wamid.prodlist_${Date.now()}`;
    return { success: true, messageId, metaMessageId: messageId, details: res.data };
  } catch (err: any) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    return { success: false, error: errorMsg, details: err.response?.data };
  }
}

export async function syncProductsToMetaCatalog(options: CatalogSyncOptions) {
  const { catalogId, accessToken, products } = options;
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${catalogId}/batch`;

  const requests = products.map((item) => {
    const numPrice = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
    const priceCents = Math.round(numPrice * 100);
    return {
      method: 'UPDATE',
      retailer_id: String(item.id),
      data: {
        title: item.name,
        description: item.description || item.name,
        availability: item.stockStatus === 'Out of Stock' ? 'out of stock' : 'in stock',
        condition: 'new',
        price: priceCents,
        currency: 'USD',
        image_url: item.image || undefined,
        url: item.url || undefined,
      },
    };
  });

  try {
    const res = await axios.post(url, { requests }, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return { success: true, syncedCount: requests.length, details: res.data };
  } catch (err: any) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    return { success: false, error: errorMsg, details: err.response?.data };
  }
}
