import { MetaApiResult, MetaWhatsAppClient } from './api';

export interface CheckoutOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  productName: string;
  price: string;
  orderId: string;
  paymentUrl?: string;
  currency?: string;
}

/**
 * Dispatches an instant WhatsApp interactive Checkout & Payment Response
 */
export async function sendCheckoutResponse(options: CheckoutOptions): Promise<MetaApiResult> {
  const {
    phoneNumberId,
    accessToken,
    to,
    productName,
    price,
    orderId,
    paymentUrl,
    currency = 'USD',
  } = options;

  if (!paymentUrl) return { success: false, error: 'A configured payment URL is required. No payment link has been created.' };
  let checkoutLink: string;
  try {
    const parsed = new URL(paymentUrl);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Invalid payment URL');
    checkoutLink = parsed.toString();
  } catch { return { success: false, error: 'A valid HTTPS payment URL is required.' }; }

  const bodyText = [
    `🧾 *Order Confirmation: #${orderId}*`,
    `----------------------------------------`,
    `📦 *Item:* ${productName}`,
    `💳 *Amount Due:* ${price} ${currency}`,
    `🔒 *Payment Link:* ${checkoutLink}`,
    `----------------------------------------`,
    `Tap below to confirm payment or request agent assistance.`,
  ].join('\n');

  // If live credentials, send interactive buttons
  if (phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN')) {
    return MetaWhatsAppClient.sendInteractiveButtons({
      phoneNumberId,
      accessToken,
      to,
      headerText: '🛒 Secure Checkout',
      bodyText,
      footerText: 'Passion Fruit Instant Commerce',
      buttons: [
        { id: `pay_confirm_${orderId}`, title: '✅ I Have Paid' },
        { id: `agent_help_${orderId}`, title: '💬 Chat with Agent' },
      ],
    });
  }

  return { success: false, error: 'Live Meta credentials are required to send a checkout response.' };
}

/**
 * Generates an automated order reference for WhatsApp Commerce
 */
export function generateWhatsAppOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PF-${timestamp}-${random}`;
}
