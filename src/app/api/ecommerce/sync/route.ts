import { NextRequest, NextResponse } from 'next/server';
import { IntegrationsDB } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';
import { decryptToken } from '@/lib/crypto';
import { makeWooCommerceRequest } from '@/lib/woocommerce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface UnifiedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  isValidForWhatsApp: boolean;
  dateAdded: string;
  platform: 'shopify' | 'woocommerce';
  ordersCount: number;
  totalSpent: string;
}

export interface UnifiedOrder {
  id: string;
  customerName: string;
  status: string;
  totalAmount: string;
  date: string;
  platform: 'shopify' | 'woocommerce';
  itemCount: number;
}

export interface UnifiedProduct {
  id: string;
  name: string;
  image: string | null;
  price: string;
  stockStatus: string;
  platform: 'shopify' | 'woocommerce';
}

// Format customer phone explicitly for Meta WhatsApp Cloud API compatibility
function formatWhatsAppPhone(rawPhone?: string | null): {
  formatted: string;
  whatsappNumber: string;
  isValidForWhatsApp: boolean;
} {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      formatted: 'No Phone',
      whatsappNumber: '',
      isValidForWhatsApp: false,
    };
  }

  const trimmed = rawPhone.trim();
  // Strip spaces, dashes, dots, brackets
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      formatted: trimmed || 'Invalid',
      whatsappNumber: digitsOnly,
      isValidForWhatsApp: false,
    };
  }

  // Proper E.164 formatted string
  const formatted = trimmed.startsWith('+') ? trimmed : `+${digitsOnly}`;

  return {
    formatted,
    whatsappNumber: digitsOnly,
    isValidForWhatsApp: true,
  };
}

// ─── Shopify Fetcher ─────────────────────────────────────────────────────────
async function fetchShopifyData(storeName: string, accessToken: string) {
  const cleanStore = storeName.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const baseUrl = `https://${cleanStore}/admin/api/2024-01`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken,
  };

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Shopify request timed out after 10s')), 10000)
  );

  try {
    const [custRes, ordRes, prodRes] = (await Promise.race([
      Promise.all([
        fetch(`${baseUrl}/customers.json?limit=50`, { headers }),
        fetch(`${baseUrl}/orders.json?status=any&limit=50`, { headers }),
        fetch(`${baseUrl}/products.json?limit=50`, { headers }),
      ]),
      timeoutPromise,
    ])) as [Response, Response, Response];

    if (custRes.status === 401 || ordRes.status === 401 || prodRes.status === 401) {
      throw new Error('AUTH_FAILED: Shopify access token is invalid or expired.');
    }
    if (custRes.status === 403 || ordRes.status === 403 || prodRes.status === 403) {
      throw new Error('AUTH_FAILED: Shopify token does not have required permissions (read_customers, read_orders, read_products).');
    }

    if (!custRes.ok) {
      const errText = await custRes.text();
      throw new Error(`Shopify API error (${custRes.status}): ${errText.slice(0, 100)}`);
    }

    const custData = await custRes.json();
    const ordData = await ordRes.json();
    const prodData = await prodRes.json();

    const customers: UnifiedCustomer[] = (custData.customers || []).map((c: any) => {
      const rawPhone = c.phone || c.default_address?.phone || null;
      const phoneInfo = formatWhatsAppPhone(rawPhone);
      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Customer';

      return {
        id: String(c.id),
        name: fullName,
        email: c.email || 'N/A',
        phone: phoneInfo.formatted,
        whatsappNumber: phoneInfo.whatsappNumber,
        isValidForWhatsApp: phoneInfo.isValidForWhatsApp,
        dateAdded: c.created_at || new Date().toISOString(),
        platform: 'shopify' as const,
        ordersCount: c.orders_count || 0,
        totalSpent: `${c.currency || '$'}${parseFloat(c.total_spent || '0').toFixed(2)}`,
      };
    });

    const orders: UnifiedOrder[] = (ordData.orders || []).map((o: any) => {
      const custName = o.customer
        ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() || o.customer.email
        : o.email || 'Guest Customer';

      let status = o.financial_status || 'Pending';
      status = status.charAt(0).toUpperCase() + status.slice(1);

      return {
        id: `#${o.order_number || o.name || o.id}`,
        customerName: custName,
        status,
        totalAmount: `${o.currency || '$'}${parseFloat(o.total_price || o.current_total_price || '0').toFixed(2)}`,
        date: o.created_at || new Date().toISOString(),
        platform: 'shopify' as const,
        itemCount: o.line_items?.length || 0,
      };
    });

    const products: UnifiedProduct[] = (prodData.products || []).map((p: any) => {
      const firstVariant = p.variants?.[0];
      const price = firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : 'N/A';
      
      let stockStatus = 'In Stock';
      if (firstVariant && firstVariant.inventory_management && firstVariant.inventory_quantity <= 0) {
        stockStatus = 'Out of Stock';
      }

      return {
        id: String(p.id),
        name: p.title || 'Untitled Product',
        image: p.image?.src || p.images?.[0]?.src || null,
        price,
        stockStatus,
        platform: 'shopify' as const,
      };
    });

    return { customers, orders, products };
  } catch (err: any) {
    console.error('[Shopify Fetcher Error]', err);
    throw err;
  }
}

// ─── WooCommerce Fetcher ─────────────────────────────────────────────────────
async function fetchWooCommerceData(siteUrl: string, consumerKey: string, consumerSecret: string) {
  try {
    const [custRes, ordRes, prodRes] = await Promise.all([
      makeWooCommerceRequest<any[]>(siteUrl, consumerKey, consumerSecret, '/customers?per_page=50'),
      makeWooCommerceRequest<any[]>(siteUrl, consumerKey, consumerSecret, '/orders?per_page=50'),
      makeWooCommerceRequest<any[]>(siteUrl, consumerKey, consumerSecret, '/products?per_page=50'),
    ]);

    // If all three endpoints failed with authentication errors
    if (!custRes.ok && !ordRes.ok && !prodRes.ok) {
      const errMsg = custRes.error || ordRes.error || prodRes.error || 'Failed to authenticate with WooCommerce.';
      throw new Error(`AUTH_FAILED: ${errMsg}`);
    }

    const custData = custRes.ok && Array.isArray(custRes.data) ? custRes.data : [];
    const ordData = ordRes.ok && Array.isArray(ordRes.data) ? ordRes.data : [];
    const prodData = prodRes.ok && Array.isArray(prodRes.data) ? prodRes.data : [];

    const customers: UnifiedCustomer[] = custData.map((c: any) => {
      const rawPhone = c.billing?.phone || c.shipping?.phone || null;
      const phoneInfo = formatWhatsAppPhone(rawPhone);
      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username || c.email || 'Customer';

      return {
        id: String(c.id),
        name: fullName,
        email: c.email || 'N/A',
        phone: phoneInfo.formatted,
        whatsappNumber: phoneInfo.whatsappNumber,
        isValidForWhatsApp: phoneInfo.isValidForWhatsApp,
        dateAdded: c.date_created || new Date().toISOString(),
        platform: 'woocommerce' as const,
        ordersCount: c.orders_count || 0,
        totalSpent: `$${parseFloat(c.total_spent || '0').toFixed(2)}`,
      };
    });

    const orders: UnifiedOrder[] = ordData.map((o: any) => {
      const custName = `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Guest Customer';
      let status = o.status || 'Pending';
      status = status.charAt(0).toUpperCase() + status.slice(1);

      return {
        id: `#${o.number || o.id}`,
        customerName: custName,
        status,
        totalAmount: `${o.currency_symbol || '$'}${parseFloat(o.total || '0').toFixed(2)}`,
        date: o.date_created || new Date().toISOString(),
        platform: 'woocommerce' as const,
        itemCount: o.line_items?.length || 0,
      };
    });

    const products: UnifiedProduct[] = prodData.map((p: any) => {
      const price = p.price ? `$${parseFloat(p.price).toFixed(2)}` : (p.regular_price ? `$${parseFloat(p.regular_price).toFixed(2)}` : 'Free');
      let stockStatus = 'In Stock';
      if (p.stock_status === 'outofstock') {
        stockStatus = 'Out of Stock';
      } else if (p.stock_status === 'onbackorder') {
        stockStatus = 'On Backorder';
      }

      return {
        id: String(p.id),
        name: p.name || 'Untitled Product',
        image: p.images?.[0]?.src || null,
        price,
        stockStatus,
        platform: 'woocommerce' as const,
      };
    });

    return { customers, orders, products };
  } catch (err: any) {
    console.error('[WooCommerce Fetcher Error]', err);
    throw err;
  }
}

// ─── Main Route Handler ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedPlatform = searchParams.get('platform') || 'all';

  const shopifyIntg = IntegrationsDB.get(user.id, 'shopify');
  const wooIntg = IntegrationsDB.get(user.id, 'woocommerce');

  const shouldFetchShopify =
    (requestedPlatform === 'all' || requestedPlatform === 'shopify') &&
    shopifyIntg &&
    shopifyIntg.storeName &&
    shopifyIntg.accessToken;

  const shouldFetchWoo =
    (requestedPlatform === 'all' || requestedPlatform === 'woocommerce') &&
    wooIntg &&
    wooIntg.siteUrl &&
    wooIntg.consumerKey &&
    wooIntg.consumerSecret;

  if (!shouldFetchShopify && !shouldFetchWoo) {
    return NextResponse.json(
      {
        error: 'No active store connected.',
        details: 'Please connect your Shopify or WooCommerce store above to view live data.',
      },
      { status: 400 }
    );
  }

  let allCustomers: UnifiedCustomer[] = [];
  let allOrders: UnifiedOrder[] = [];
  let allProducts: UnifiedProduct[] = [];
  const errors: string[] = [];

  // Fetch Shopify if configured
  if (shouldFetchShopify && shopifyIntg) {
    try {
      const decryptedToken = decryptToken(shopifyIntg.accessToken!);
      const result = await fetchShopifyData(shopifyIntg.storeName!, decryptedToken);
      allCustomers.push(...result.customers);
      allOrders.push(...result.orders);
      allProducts.push(...result.products);
    } catch (err: any) {
      console.error('[Sync Shopify Failed]:', err.message);
      errors.push(
        err.message?.includes('AUTH_FAILED')
          ? 'Failed to fetch data from Shopify. Please check your API keys.'
          : `Shopify sync error: ${err.message}`
      );
    }
  }

  // Fetch WooCommerce if configured
  if (shouldFetchWoo && wooIntg) {
    try {
      const decKey = decryptToken(wooIntg.consumerKey!);
      const decSecret = decryptToken(wooIntg.consumerSecret!);
      const result = await fetchWooCommerceData(wooIntg.siteUrl!, decKey, decSecret);
      allCustomers.push(...result.customers);
      allOrders.push(...result.orders);
      allProducts.push(...result.products);
    } catch (err: any) {
      console.error('[Sync WooCommerce Failed]:', err.message);
      errors.push(
        err.message?.includes('AUTH_FAILED')
          ? 'Failed to fetch data from WooCommerce. Please check your API keys.'
          : `WooCommerce sync error: ${err.message}`
      );
    }
  }

  // If all requested platforms failed due to auth/API key errors, return the required error message
  if (
    errors.length > 0 &&
    allCustomers.length === 0 &&
    allOrders.length === 0 &&
    allProducts.length === 0
  ) {
    return NextResponse.json(
      {
        error: 'Failed to fetch data. Please check your API keys.',
        details: errors.join(' | '),
      },
      { status: 400 }
    );
  }

  // Sort by date descending
  allCustomers.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    success: true,
    syncedAt: new Date().toISOString(),
    platform: requestedPlatform,
    warning: errors.length > 0 ? errors.join('; ') : undefined,
    counts: {
      customers: allCustomers.length,
      orders: allOrders.length,
      products: allProducts.length,
    },
    data: {
      customers: allCustomers,
      orders: allOrders,
      products: allProducts,
    },
  });
}
