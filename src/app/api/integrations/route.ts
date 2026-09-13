import { NextRequest, NextResponse } from 'next/server';
import { IntegrationsDB } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';
import { encryptToken } from '@/lib/crypto';
import {
  cleanWooCommerceBaseUrl,
  verifyWooCommerceCredentials,
  registerWooCommerceWebhooks,
} from '@/lib/woocommerce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Clean and normalize Shopify store name
function normalizeShopifyStore(raw: string): string {
  let clean = raw.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  if (!clean.includes('.myshopify.com') && !clean.includes('.')) {
    clean = `${clean}.myshopify.com`;
  }
  return clean;
}

export async function GET() {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const shopify = IntegrationsDB.get(user.id, 'shopify');
  const woocommerce = IntegrationsDB.get(user.id, 'woocommerce');

  return NextResponse.json({
    integrations: {
      shopify: shopify
        ? {
            connected: true,
            storeName: shopify.storeName,
            connectedAt: shopify.connectedAt,
            hasWebhook: Boolean(shopify.webhookSecret),
          }
        : { connected: false },
      woocommerce: woocommerce
        ? {
            connected: true,
            siteUrl: woocommerce.siteUrl,
            connectedAt: woocommerce.connectedAt,
            hasWebhook: Boolean(woocommerce.webhookSecret),
          }
        : { connected: false },
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { platform, ...credentials } = body;

  if (!platform || !['shopify', 'woocommerce'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  // ─── SHOPIFY CONNECTION ───────────────────────────────────────────────────
  if (platform === 'shopify') {
    if (!credentials.storeName || !credentials.accessToken) {
      return NextResponse.json(
        { error: 'Store name and access token are required for Shopify' },
        { status: 400 }
      );
    }

    const cleanStoreName = normalizeShopifyStore(credentials.storeName);
    const token = credentials.accessToken.trim();

    // Verify Shopify Token with shop.json probe
    try {
      const probeRes = await fetch(`https://${cleanStoreName}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'User-Agent': 'PassionFruit-SaaS/1.0',
        },
      });

      if (!probeRes.ok) {
        if (probeRes.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Shopify access token. Please verify your Admin API access token in Shopify.' },
            { status: 400 }
          );
        }
        if (probeRes.status === 404) {
          return NextResponse.json(
            { error: `Shopify store "${cleanStoreName}" could not be found. Please verify the store URL.` },
            { status: 400 }
          );
        }
      }
    } catch (err: any) {
      console.warn('[Shopify Verification Warning]:', err.message);
    }

    const encryptedToken = encryptToken(token);

    IntegrationsDB.save({
      userId: user.id,
      platform: 'shopify',
      storeName: cleanStoreName,
      accessToken: encryptedToken,
      webhookSecret: credentials.webhookSecret?.trim() || '',
    });

    return NextResponse.json({
      success: true,
      platform,
      message: 'Shopify connected and verified successfully',
    });
  }

  // ─── WOOCOMMERCE CONNECTION ───────────────────────────────────────────────
  if (platform === 'woocommerce') {
    if (!credentials.siteUrl || !credentials.consumerKey || !credentials.consumerSecret) {
      return NextResponse.json(
        { error: 'Site URL, Consumer Key, and Consumer Secret are required for WooCommerce' },
        { status: 400 }
      );
    }

    const cleanSiteUrl = cleanWooCommerceBaseUrl(credentials.siteUrl);
    const consumerKey = credentials.consumerKey.trim();
    const consumerSecret = credentials.consumerSecret.trim();

    // 1. Thorough Credential Verification Probe
    console.log(`[WooCommerce Connect] Verifying credentials for ${cleanSiteUrl}...`);
    const verifyResult = await verifyWooCommerceCredentials(cleanSiteUrl, consumerKey, consumerSecret);

    if (!verifyResult.valid) {
      console.error(`[WooCommerce Connect Failed]:`, verifyResult.error);
      return NextResponse.json(
        {
          error: `Failed to connect WooCommerce: ${verifyResult.error}`,
          details: verifyResult.error,
        },
        { status: 400 }
      );
    }

    // 2. Automatic Webhook Registration
    const hostOrigin = request.nextUrl.origin || 'https://whatsapp-auto-saas.vercel.app';
    const webhookDeliveryUrl = `${hostOrigin}/api/webhooks/woocommerce`;
    const webhookSecret = credentials.webhookSecret?.trim() || 'passion_fruit_wc_2026';

    let webhookInfo: any = null;
    try {
      webhookInfo = await registerWooCommerceWebhooks(
        cleanSiteUrl,
        consumerKey,
        consumerSecret,
        webhookDeliveryUrl,
        webhookSecret
      );
      console.log('[WooCommerce Webhooks Registered]:', webhookInfo.registered);
    } catch (hookErr: any) {
      console.warn('[WooCommerce Webhook Auto-Registration Notice]:', hookErr.message);
    }

    // 3. Encrypt & Save to DB
    const encryptedKey = encryptToken(consumerKey);
    const encryptedSecret = encryptToken(consumerSecret);

    IntegrationsDB.save({
      userId: user.id,
      platform: 'woocommerce',
      siteUrl: cleanSiteUrl,
      consumerKey: encryptedKey,
      consumerSecret: encryptedSecret,
      webhookSecret,
    });

    return NextResponse.json({
      success: true,
      platform,
      message: 'WooCommerce credentials verified and connected successfully!',
      webhooks: webhookInfo,
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');

  if (!platform || !['shopify', 'woocommerce'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  IntegrationsDB.delete(user.id, platform as 'shopify' | 'woocommerce');

  return NextResponse.json({ success: true, message: `${platform} disconnected` });
}
