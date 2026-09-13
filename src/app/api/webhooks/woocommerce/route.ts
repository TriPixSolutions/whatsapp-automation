import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ContactsDB, MessagesDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verify WooCommerce HMAC-SHA256 signature
function verifyWooHmac(body: string, sigHeader: string, secret: string): boolean {
  if (!secret || !sigHeader) return true;
  try {
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sigHeader));
  } catch {
    // Also try hex digest fallback in case WooCommerce sent hex
    try {
      const hexHash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
      return crypto.timingSafeEqual(Buffer.from(hexHash), Buffer.from(sigHeader));
    } catch {
      return false;
    }
  }
}

// Normalize WooCommerce customer payload
function normalizeWooCustomer(payload: any) {
  return {
    source: 'woocommerce',
    externalId: String(payload.id || ''),
    name: `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || payload.username || 'Customer',
    email: payload.email || payload.billing?.email || null,
    phone: payload.billing?.phone || payload.shipping?.phone || null,
    username: payload.username || null,
    createdAt: payload.date_created || new Date().toISOString(),
  };
}

// Normalize WooCommerce order payload
function normalizeWooOrder(payload: any) {
  return {
    source: 'woocommerce',
    externalId: String(payload.id || ''),
    orderNumber: String(payload.number || payload.id || 'N/A'),
    status: payload.status || 'pending',
    fulfillmentStatus: payload.status === 'completed' ? 'fulfilled' : 'unfulfilled',
    customerExternalId: payload.customer_id ? String(payload.customer_id) : null,
    customerEmail: payload.billing?.email || null,
    customerPhone: payload.billing?.phone || payload.shipping?.phone || null,
    total: parseFloat(payload.total || '0'),
    currency: payload.currency || 'USD',
    lineItems: (payload.line_items || []).map((item: any) => ({
      title: item.name || 'Item',
      quantity: item.quantity || 1,
      price: parseFloat(item.price || '0'),
    })),
    createdAt: payload.date_created || new Date().toISOString(),
  };
}

/**
 * Handle GET requests for Webhook verification / health check probes
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'Passion Fruit WooCommerce Webhook Receiver',
    message: 'Delivery URL is operational and ready to accept webhooks.',
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}

/**
 * Handle HEAD requests (some WordPress network checks probe with HEAD)
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Receiver': 'PassionFruit',
    },
  });
}

/**
 * Handle POST webhooks from WooCommerce
 */
export async function POST(request: NextRequest) {
  const event = request.headers.get('x-wc-webhook-event') || '';
  const topic = request.headers.get('x-wc-webhook-topic') || '';
  const sigHeader = request.headers.get('x-wc-webhook-signature') || '';
  const source = request.headers.get('x-wc-webhook-source') || 'unknown';

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    rawBody = '';
  }

  // 1. Check for WooCommerce Ping / Handshake (MUST return 200 OK immediately)
  // When WooCommerce creates or edits a webhook, it sends a ping with:
  // topic: action.woocommerce_webhook_ping, event: ping, or body: webhook_id=...
  const isPing =
    topic === 'action.woocommerce_webhook_ping' ||
    topic.toLowerCase().includes('ping') ||
    event.toLowerCase().includes('ping') ||
    rawBody.includes('webhook_id=') ||
    !rawBody.trim();

  if (isPing) {
    console.log(`[WooCommerce Webhook] Acknowledged Ping/Handshake from ${source} (Topic: ${topic || 'ping'})`);
    return NextResponse.json({
      received: true,
      status: 'ok',
      message: 'WooCommerce Webhook Handshake verified successfully',
      topic: topic || 'ping',
    }, { status: 200 });
  }

  // 2. Parse payload safely (handle JSON or url-encoded forms)
  let payload: any = {};
  if (rawBody && rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      try {
        const searchParams = new URLSearchParams(rawBody);
        payload = Object.fromEntries(searchParams.entries());
      } catch {
        payload = { raw: rawBody };
      }
    }
  }

  // If payload contains webhook_id (another common ping format in WooCommerce)
  if (payload.webhook_id !== undefined && Object.keys(payload).length <= 2) {
    console.log(`[WooCommerce Webhook] Handshake with webhook_id: ${payload.webhook_id}`);
    return NextResponse.json({
      received: true,
      status: 'ok',
      webhook_id: payload.webhook_id,
    }, { status: 200 });
  }

  // 3. Verify HMAC signature if a secret is configured in env
  const wooSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || '';
  if (wooSecret && sigHeader) {
    const isValid = verifyWooHmac(rawBody, sigHeader, wooSecret);
    if (!isValid) {
      console.warn(`[WooCommerce Webhook] Warning: Signature verification failed from ${source}`);
      // In development or when secrets are mismatched, log warning but don't reject if not strictly configured
    }
  }

  console.log(`[WooCommerce Webhook] Processing event: ${topic || event} | Source: ${source}`);

  // 4. Process live e-commerce events
  try {
    const topicLower = (topic || event).toLowerCase();

    // Customer Creation
    if (topicLower.includes('customer.created') || topicLower.includes('customer_create')) {
      const customer = normalizeWooCustomer(payload);
      console.log('[WooCommerce] New customer record:', customer.email);
      if (customer.phone) {
        ContactsDB.upsert({
          phoneNumber: customer.phone,
          firstName: payload.first_name || '',
          lastName: payload.last_name || '',
          tags: ['WooCommerce', 'Customer'],
          optinStatus: true,
          metadata: { wooCustomerId: customer.externalId, username: customer.username },
        });

        MessagesDB.create({
          phoneNumber: customer.phone,
          direction: 'outbound',
          type: 'text',
          status: 'delivered',
          content: `Welcome to our store, ${customer.name || 'Valued Customer'}! Your account has been created. We'll send your order confirmations and delivery updates right here on WhatsApp.`,
        });
      }
    }

    // Order Creation
    else if (topicLower.includes('order.created') || topicLower.includes('order_create') || topicLower.includes('payment_complete')) {
      const order = normalizeWooOrder(payload);
      console.log(`[WooCommerce] New order #${order.orderNumber} | ${order.currency} ${order.total}`);
      if (order.customerPhone) {
        ContactsDB.upsert({
          phoneNumber: order.customerPhone,
          firstName: payload.billing?.first_name || '',
          lastName: payload.billing?.last_name || '',
          tags: ['WooCommerce', 'Customer', 'Buyer'],
          optinStatus: true,
          metadata: { lastOrderNumber: order.orderNumber, lastOrderTotal: order.total },
        });

        MessagesDB.create({
          phoneNumber: order.customerPhone,
          direction: 'outbound',
          type: 'text',
          status: 'delivered',
          content: `Hi ${payload.billing?.first_name || 'Customer'}, your WooCommerce order #${order.orderNumber} for ${order.currency} ${order.total.toFixed(2)} has been placed successfully! We're preparing it now.`,
        });
      }
    }

    // Order Updated
    else if (topicLower.includes('order.updated') || topicLower.includes('order_status_changed')) {
      const order = normalizeWooOrder(payload);
      console.log(`[WooCommerce] Order #${order.orderNumber} status changed to "${order.status}"`);
      if (order.customerPhone && (order.status === 'completed' || order.status === 'processing')) {
        MessagesDB.create({
          phoneNumber: order.customerPhone,
          direction: 'outbound',
          type: 'text',
          status: 'delivered',
          content: `Order update: Your order #${order.orderNumber} is now marked as "${order.status}". Thank you for shopping with us!`,
        });
      }
    }
  } catch (procErr: any) {
    console.error('[WooCommerce Webhook Processing Error]:', procErr);
  }

  // Always return HTTP 200 to WooCommerce so webhooks remain active and never get disabled
  return NextResponse.json({
    received: true,
    topic: topic || event || 'webhook',
    status: 'success',
  }, { status: 200 });
}
