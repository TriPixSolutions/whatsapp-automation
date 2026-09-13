import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ContactsDB, MessagesDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verify Shopify HMAC-SHA256 signature
function verifyShopifyHmac(body: string, hmacHeader: string, secret: string): boolean {
  if (!secret || !hmacHeader) return true;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

// Normalize Shopify customer payload → unified CRM record
function normalizeShopifyCustomer(payload: any) {
  return {
    source: 'shopify',
    externalId: String(payload.id || ''),
    name: `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || payload.email || 'Customer',
    email: payload.email || null,
    phone: payload.phone || payload.default_address?.phone || null,
    tags: (payload.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    totalSpent: parseFloat(payload.total_spent || '0'),
    ordersCount: payload.orders_count || 0,
    createdAt: payload.created_at || new Date().toISOString(),
  };
}

// Normalize Shopify order payload
function normalizeShopifyOrder(payload: any) {
  return {
    source: 'shopify',
    externalId: String(payload.id || ''),
    orderNumber: String(payload.order_number || payload.name || payload.id || 'N/A'),
    status: payload.financial_status || 'pending',
    fulfillmentStatus: payload.fulfillment_status || 'unfulfilled',
    customerExternalId: payload.customer ? String(payload.customer.id) : null,
    customerEmail: payload.email || null,
    customerPhone: payload.billing_address?.phone || payload.customer?.phone || null,
    total: parseFloat(payload.total_price || '0'),
    currency: payload.currency || 'USD',
    lineItems: (payload.line_items || []).map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
    })),
    trackingUrl: payload.fulfillments?.[0]?.tracking_url || null,
    createdAt: payload.created_at || new Date().toISOString(),
  };
}

// Normalize abandoned cart / checkout
function normalizeShopifyCart(payload: any) {
  return {
    source: 'shopify',
    externalId: payload.token || String(payload.id || ''),
    customerEmail: payload.email || null,
    customerPhone: payload.billing_address?.phone || null,
    total: parseFloat(payload.total_price || '0'),
    currency: payload.currency || 'USD',
    checkoutUrl: payload.abandoned_checkout_url || null,
    lineItems: (payload.line_items || []).map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
    })),
    createdAt: payload.created_at || new Date().toISOString(),
  };
}

/**
 * Handle GET requests for Webhook verification / health check probes
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'Passion Fruit Shopify Webhook Receiver',
    message: 'Delivery URL is operational and ready to accept webhooks.',
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}

/**
 * Handle HEAD requests
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

export async function POST(request: NextRequest) {
  const topic = request.headers.get('x-shopify-topic') || '';
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
  const shopDomain = request.headers.get('x-shopify-shop-domain') || 'unknown';

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    rawBody = '';
  }

  // Ping / Handshake check
  if (!rawBody.trim() || topic.includes('ping')) {
    return NextResponse.json({ received: true, status: 'ok', topic: topic || 'ping' }, { status: 200 });
  }

  // Verify HMAC signature if secret configured
  const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
  if (shopifySecret && hmacHeader && !verifyShopifyHmac(rawBody, hmacHeader, shopifySecret)) {
    console.error(`[Shopify Webhook] HMAC verification failed from ${shopDomain}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true, status: 'acknowledged' }, { status: 200 });
  }

  console.log(`[Shopify Webhook] Topic: ${topic} | Shop: ${shopDomain}`);

  try {
    switch (topic) {
      case 'customers/create': {
        const customer = normalizeShopifyCustomer(payload);
        console.log('[Shopify] New customer created:', customer.email);
        if (customer.phone) {
          ContactsDB.upsert({
            phoneNumber: customer.phone,
            firstName: payload.first_name || '',
            lastName: payload.last_name || '',
            tags: ['Shopify', 'Customer'],
            optinStatus: true,
            metadata: { shopifyCustomerId: customer.externalId, totalSpent: customer.totalSpent },
          });

          MessagesDB.create({
            phoneNumber: customer.phone,
            direction: 'outbound',
            type: 'text',
            status: 'delivered',
            content: `Welcome to our store, ${customer.name || 'Valued Customer'}! We're thrilled to connect with you on WhatsApp. Reply anytime if you need help with your orders.`,
          });
        }
        break;
      }
      case 'orders/create': {
        const order = normalizeShopifyOrder(payload);
        console.log(`[Shopify] New order #${order.orderNumber} | ${order.currency} ${order.total}`);
        if (order.customerPhone) {
          ContactsDB.upsert({
            phoneNumber: order.customerPhone,
            firstName: payload.customer?.first_name || '',
            lastName: payload.customer?.last_name || '',
            tags: ['Shopify', 'Customer', 'Buyer'],
            optinStatus: true,
            metadata: { lastOrderNumber: order.orderNumber, lastOrderTotal: order.total },
          });

          MessagesDB.create({
            phoneNumber: order.customerPhone,
            direction: 'outbound',
            type: 'text',
            status: 'delivered',
            content: `Hi ${payload.customer?.first_name || 'Customer'}, your order #${order.orderNumber} (${order.currency} ${order.total.toFixed(2)}) has been received and confirmed! We'll send your shipping tracking number as soon as it departs.`,
          });
        }
        break;
      }
      case 'checkouts/create': {
        const cart = normalizeShopifyCart(payload);
        console.log('[Shopify] Abandoned checkout cart detected:', cart.customerEmail);
        if (cart.customerPhone) {
          ContactsDB.upsert({
            phoneNumber: cart.customerPhone,
            tags: ['Shopify', 'Abandoned Cart'],
            optinStatus: true,
            metadata: { checkoutUrl: cart.checkoutUrl },
          });

          MessagesDB.create({
            phoneNumber: cart.customerPhone,
            direction: 'outbound',
            type: 'text',
            status: 'sent',
            content: `Hi there! You left some popular items in your cart. Complete your order now before items sell out: ${cart.checkoutUrl || 'https://passionfruit.io'}`,
          });
        }
        break;
      }
      default:
        console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
    }
  } catch (err: any) {
    console.error('[Shopify Webhook Error]:', err);
  }

  return NextResponse.json({ received: true, topic }, { status: 200 });
}
