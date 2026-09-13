/**
 * Robust WooCommerce REST API Client & Helper
 * Handles URL normalization, Base64 Basic Auth, Query Param Fallbacks,
 * Security Headers (User-Agent, Accept), Credential Verification & Webhook Registration.
 */

export interface WooCommerceApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  code?: string;
}

/**
 * Normalizes user-provided WordPress/WooCommerce site URL:
 * - Trims whitespace
 * - Prepends https:// if protocol is missing
 * - Strips trailing slashes
 * - Strips accidental /wp-json/wc/v3 or /wp-json suffixes
 */
export function cleanWooCommerceBaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let clean = rawUrl.trim();

  // Ensure valid protocol
  if (!/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }

  // Remove trailing slashes
  clean = clean.replace(/\/+$/, '');

  // Strip accidental trailing /wp-json or /wp-json/wc/v3
  clean = clean.replace(/\/wp-json(\/wc\/v[0-9]+)?\/?$/i, '');

  return clean;
}

/**
 * Constructs a proper WooCommerce REST API v3 endpoint URL
 */
export function buildWooCommerceUrl(siteUrl: string, path: string, params?: Record<string, string>): string {
  const cleanBase = cleanWooCommerceBaseUrl(siteUrl);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = new URL(`${cleanBase}/wp-json/wc/v3${cleanPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        fullUrl.searchParams.set(key, String(value));
      }
    }
  }

  return fullUrl.toString();
}

/**
 * Standard browser-like headers to bypass security plugins (Wordfence, Cloudflare WAF, etc.)
 */
function getStandardHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers({
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 PassionFruit-Integration/1.0',
    'Cache-Control': 'no-cache',
  });

  if (extraHeaders) {
    const extra = new Headers(extraHeaders);
    extra.forEach((value, key) => headers.set(key, value));
  }

  return headers;
}

/**
 * Parses WooCommerce error responses cleanly (handles JSON objects, HTML error pages, and HTTP status codes)
 */
function parseWooCommerceError(status: number, rawText: string, json: any): { error: string; code?: string } {
  if (json && typeof json === 'object') {
    const message = json.message || json.code || json.data?.message;
    const code = json.code;
    if (message) {
      // Decode HTML entities if present in WordPress error message
      const cleanMessage = String(message).replace(/<[^>]*>?/gm, '').trim();
      return { error: cleanMessage, code };
    }
  }

  // Handle common HTTP status codes
  if (status === 401) {
    return {
      error: 'Unauthorized (401). Invalid Consumer Key or Consumer Secret. Please check your credentials.',
      code: 'unauthorized',
    };
  }
  if (status === 402) {
    return {
      error: 'Payment Required / Host Firewall Block (402). A security plugin (e.g. Wordfence) or host firewall intercepted the API request.',
      code: 'payment_required_or_firewall',
    };
  }
  if (status === 403) {
    return {
      error: 'Forbidden (403). Your API Key does not have sufficient permissions. Please set permissions to "Read/Write".',
      code: 'forbidden',
    };
  }
  if (status === 404) {
    return {
      error: 'WooCommerce REST API not found (404). Ensure WooCommerce is active and WordPress Permalinks are enabled (not Plain).',
      code: 'not_found',
    };
  }

  // Fallback text
  const snippet = rawText ? rawText.replace(/<[^>]*>?/gm, '').slice(0, 200).trim() : `HTTP Error ${status}`;
  return { error: snippet || `WooCommerce server returned HTTP ${status}` };
}

/**
 * Makes an authenticated request to WooCommerce REST API v3
 * Tries HTTP Basic Auth first; if 401/402/403 occurs (common when servers strip Authorization headers),
 * falls back to Query Parameter authentication (?consumer_key=...&consumer_secret=...)
 */
export async function makeWooCommerceRequest<T = any>(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
  path: string,
  options: RequestInit = {}
): Promise<WooCommerceApiResult<T>> {
  const cleanKey = consumerKey.trim();
  const cleanSecret = consumerSecret.trim();
  const targetUrl = buildWooCommerceUrl(siteUrl, path);

  const basicAuth = Buffer.from(`${cleanKey}:${cleanSecret}`).toString('base64');
  const headers = getStandardHeaders(options.headers);
  headers.set('Authorization', `Basic ${basicAuth}`);

  const timeoutSignal = AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined;

  try {
    // Attempt 1: Standard HTTP Basic Auth
    let response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options.signal || timeoutSignal,
    });

    // If server stripped Authorization header or returned 401/402/403, attempt Fallback with query parameters
    if ([401, 402, 403].includes(response.status)) {
      const fallbackUrl = buildWooCommerceUrl(siteUrl, path, {
        consumer_key: cleanKey,
        consumer_secret: cleanSecret,
      });

      const fallbackHeaders = getStandardHeaders(options.headers);
      const fallbackResponse = await fetch(fallbackUrl, {
        ...options,
        headers: fallbackHeaders,
        signal: options.signal || timeoutSignal,
      });

      if (fallbackResponse.ok) {
        response = fallbackResponse;
      }
    }

    const rawText = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(rawText);
    } catch {}

    if (!response.ok) {
      const parsedErr = parseWooCommerceError(response.status, rawText, json);
      return {
        ok: false,
        status: response.status,
        data: null,
        error: parsedErr.error,
        code: parsedErr.code,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: json as T,
    };
  } catch (err: any) {
    console.error('[WooCommerce Request Error]:', err);
    if (err.name === 'TimeoutError' || err.message?.includes('timed out')) {
      return {
        ok: false,
        status: 408,
        data: null,
        error: 'Connection timed out. The WordPress server took longer than 12 seconds to respond.',
      };
    }
    return {
      ok: false,
      status: 500,
      data: null,
      error: `Network error: Could not reach WordPress site. ${err.message || ''}`,
    };
  }
}

/**
 * Exhaustively verifies WooCommerce credentials against safe endpoints:
 * 1. Checks /system_status
 * 2. If 403/404, fallback checks /customers?per_page=1 or /products?per_page=1
 */
export async function verifyWooCommerceCredentials(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ valid: boolean; error?: string; storeDetails?: any }> {
  if (!siteUrl || !consumerKey || !consumerSecret) {
    return { valid: false, error: 'Store URL, Consumer Key, and Consumer Secret are required.' };
  }

  // Probe 1: System Status or Data index
  const probe1 = await makeWooCommerceRequest(siteUrl, consumerKey, consumerSecret, '/system_status');
  if (probe1.ok && probe1.data) {
    return {
      valid: true,
      storeDetails: {
        wcVersion: probe1.data.environment?.version,
        wpVersion: probe1.data.environment?.wp_version,
        siteTitle: probe1.data.environment?.site_title,
      },
    };
  }

  // Probe 2: Try reading 1 product (tests Read permission)
  const probe2 = await makeWooCommerceRequest(siteUrl, consumerKey, consumerSecret, '/products?per_page=1');
  if (probe2.ok && Array.isArray(probe2.data)) {
    return { valid: true };
  }

  // Probe 3: Try reading 1 customer
  const probe3 = await makeWooCommerceRequest(siteUrl, consumerKey, consumerSecret, '/customers?per_page=1');
  if (probe3.ok && Array.isArray(probe3.data)) {
    return { valid: true };
  }

  // If all failed, pick the most descriptive error
  const finalError =
    probe1.error ||
    probe2.error ||
    probe3.error ||
    'Failed to validate WooCommerce API keys. Please verify your Consumer Key and Consumer Secret.';

  return { valid: false, error: finalError };
}

/**
 * Exhaustive WooCommerce webhook registration with try/catch
 * Attempts to register: order.created, customer.created, order.updated
 */
export async function registerWooCommerceWebhooks(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
  webhookBaseUrl: string,
  webhookSecret?: string
): Promise<{ success: boolean; registered: string[]; errors: string[] }> {
  const topics = [
    { topic: 'order.created', name: 'Passion Fruit - Order Created' },
    { topic: 'customer.created', name: 'Passion Fruit - Customer Created' },
    { topic: 'order.updated', name: 'Passion Fruit - Order Updated' },
  ];

  const registered: string[] = [];
  const errors: string[] = [];

  for (const item of topics) {
    try {
      const res = await makeWooCommerceRequest(siteUrl, consumerKey, consumerSecret, '/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          name: item.name,
          topic: item.topic,
          delivery_url: webhookBaseUrl,
          secret: webhookSecret || 'passion_fruit_wc_sec_2026',
          status: 'active',
        }),
      });

      if (res.ok) {
        registered.push(item.topic);
      } else {
        // If it already exists (duplicate delivery URL / topic), it's completely acceptable
        if (
          res.error?.includes('already exists') ||
          res.error?.includes('duplicate') ||
          res.code?.includes('duplicate')
        ) {
          registered.push(`${item.topic} (existing)`);
        } else {
          errors.push(`${item.topic}: ${res.error}`);
        }
      }
    } catch (e: any) {
      errors.push(`${item.topic}: ${e.message}`);
    }
  }

  return {
    success: registered.length > 0,
    registered,
    errors,
  };
}
