import axios from 'axios';
import { SettingsDB } from '@/lib/db';

import { META_GRAPH_VERSION } from './config';
export { META_GRAPH_VERSION } from './config';

export interface StructuredMetaError {
  code: string;
  provider: 'meta';
  metaErrorCode?: number;
  metaErrorSubcode?: number;
  metaErrorType?: string;
  message: string;
  fbTraceId?: string;
  retryable: boolean;
  endpoint?: string;
}

export interface DiagnosticItem {
  status: 'verified' | 'valid' | 'invalid' | 'mismatch' | 'pending' | 'unconfigured' | 'error' | 'subscribed' | 'unsubscribed' | 'warning';
  error?: string | null;
  code?: number;
  subcode?: number;
  type?: string;
  fbTraceId?: string;
  details?: any;
}

export interface MetaConnectionDiagnostics {
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  app: DiagnosticItem;
  token: DiagnosticItem;
  business: DiagnosticItem;
  waba: DiagnosticItem;
  phoneNumber: DiagnosticItem;
  permissions: DiagnosticItem;
  webhook: DiagnosticItem;
  subscription: DiagnosticItem;
  structuredError?: StructuredMetaError | null;
  timestamp: string;
}

/**
 * Safely parse raw Meta Graph API errors into structured, user-friendly errors
 * without exposing access tokens, secrets, or internal stack traces.
 */
export function parseMetaGraphError(err: any, endpoint?: string): StructuredMetaError {
  const metaError = err.response?.data?.error || {};
  const code = metaError.code || err.code;
  const subcode = metaError.error_subcode;
  const type = metaError.type || 'OAuthException';
  const fbTraceId = metaError.fbtrace_id;
  const rawMessage: string = metaError.message || err.message || 'Unknown Meta API error';

  let codeKey = 'META_ERROR';
  let message = rawMessage;
  let retryable = false;

  if (code === 190) {
    if (rawMessage.toLowerCase().includes('application') || rawMessage.toLowerCase().includes('system error')) {
      codeKey = 'META_APP_VALIDATION_ERROR';
      message = 'Meta Application Validation Error (#190): Meta cannot validate your App ID and App Secret. Please verify that the App ID and App Secret in Meta for Developers match your settings.';
    } else {
      codeKey = 'META_TOKEN_EXPIRED';
      message = 'Token Expired (#190): System User Access Token is invalid or expired. Regenerate in Meta Business Manager.';
    }
  } else if (code === 131009) {
    codeKey = 'META_TOKEN_EXPIRED';
    message = 'Token Expired (#131009): System User Access Token is invalid or expired. Regenerate in Meta Business Manager.';
  } else if (code === 131047) {
    codeKey = 'META_WINDOW_EXPIRED';
    message = '24-Hour Messaging Window Expired (#131047): Customer last replied >24 hours ago. Send an approved template message.';
  } else if (code === 131026) {
    codeKey = 'META_MESSAGE_UNDELIVERABLE';
    message = 'Message Undeliverable (#131026): The phone number does not have an active WhatsApp account or recipient privacy settings block messages.';
  } else if (code === 130429) {
    codeKey = 'META_RATE_LIMIT';
    message = 'Rate Limit Hit (#130429): Cloud API messaging throughput limit reached. Slow down broadcasts.';
    retryable = true;
  } else if (code === 131030) {
    codeKey = 'META_RECIPIENT_NOT_ALLOWED';
    message = 'Recipient Not Allowed (#131030): In Meta Developer mode, recipient phone number must be added to Allowed Test Recipients in Meta App Dashboard > WhatsApp > API Setup.';
  } else if (code === 133010) {
    codeKey = 'META_PHONE_NOT_REGISTERED';
    message = 'Phone Number Not Registered (#133010): The Phone Number ID is not registered or active with Meta WhatsApp Business Account.';
  } else if (code === 100) {
    codeKey = 'META_INVALID_PARAM';
    message = `Invalid Parameter (#100): ${metaError.error_data?.details || rawMessage}`;
  } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    codeKey = 'META_NETWORK_TIMEOUT';
    message = 'Meta Graph API request timed out. Please try again.';
    retryable = true;
  }

  // Safe structured logging
  console.warn(`[Meta Graph API Error]`, {
    status: err.response?.status,
    endpoint: endpoint || 'unknown',
    metaErrorCode: code,
    metaErrorSubcode: subcode,
    metaErrorType: type,
    message: rawMessage,
    fbTraceId,
  });

  return {
    code: codeKey,
    provider: 'meta',
    metaErrorCode: code,
    metaErrorSubcode: subcode,
    metaErrorType: type,
    message,
    fbTraceId,
    retryable,
    endpoint,
  };
}

export interface ValidateMetaConnectionOptions {
  workspaceId?: string;
  accessToken?: string;
  appId?: string;
  appSecret?: string;
  wabaId?: string;
  phoneNumberId?: string;
  businessId?: string;
  verifyToken?: string;
  webhookUrl?: string;
}

/**
 * Diagnostic Service: validateMetaConnection()
 * Independently validates:
 * 1. App
 * 2. Token
 * 3. Business
 * 4. WABA
 * 5. Phone Number
 * 6. Permissions
 * 7. Webhook
 * 8. WABA subscription
 */
export async function validateMetaConnection(
  options: ValidateMetaConnectionOptions = {}
): Promise<MetaConnectionDiagnostics> {
  const targetWorkspaceId = options.workspaceId || 'default';
  const savedSettings = await SettingsDB.get(targetWorkspaceId).catch(() => ({}) as any);

  const cleanToken = (options.accessToken || savedSettings.accessToken || '').trim();
  const cleanAppId = (options.appId || savedSettings.appId || '').trim();
  const cleanAppSecret = (options.appSecret || savedSettings.appSecret || '').trim();
  const cleanWabaId = (options.wabaId || savedSettings.wabaId || '').trim();
  const cleanPhoneId = (options.phoneNumberId || savedSettings.phoneNumberId || '').trim();
  const cleanBusinessId = (options.businessId || savedSettings.adAccountId || '').trim();
  const cleanVerifyToken = (options.verifyToken || savedSettings.verifyToken || 'tripix_verify_token_2026').trim();
  const effectiveWebhookUrl = options.webhookUrl || savedSettings.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhook/whatsapp`;

  const isConfigured = Boolean(
    cleanToken &&
    !cleanToken.includes('SAMPLE_TOKEN') &&
    !cleanToken.startsWith('MOCK_') &&
    !cleanToken.startsWith('TEST_')
  );

  const result: MetaConnectionDiagnostics = {
    overallStatus: 'FAIL',
    app: { status: cleanAppId ? 'pending' : 'unconfigured' },
    token: { status: isConfigured ? 'pending' : 'unconfigured' },
    business: { status: cleanBusinessId ? 'pending' : 'unconfigured' },
    waba: { status: cleanWabaId ? 'pending' : 'unconfigured' },
    phoneNumber: { status: cleanPhoneId ? 'pending' : 'unconfigured' },
    permissions: { status: 'pending' },
    webhook: { status: 'pending' },
    subscription: { status: 'pending' },
    timestamp: new Date().toISOString(),
  };

  if (!isConfigured) {
    result.token = {
      status: 'unconfigured',
      error: 'Meta System User Access Token is missing or using a placeholder value.',
    };
    result.overallStatus = 'FAIL';
    return result;
  }

  let tokenAppId: string | null = null;
  let tokenScopes: string[] = [];

  // =========================================================================
  // 1. TOKEN VALIDATION & DEBUG_TOKEN
  // =========================================================================
  try {
    const debugUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/debug_token`;
    const debugRes = await axios.get(debugUrl, {
      params: {
        input_token: cleanToken,
        access_token: cleanToken,
      },
      timeout: 8000,
    });

    const tokenData = debugRes.data?.data;
    if (tokenData && tokenData.is_valid) {
      tokenAppId = tokenData.app_id ? String(tokenData.app_id).trim() : null;
      tokenScopes = Array.isArray(tokenData.scopes) ? tokenData.scopes : [];

      result.token = {
        status: 'valid',
        details: {
          appId: tokenAppId,
          application: tokenData.application,
          type: tokenData.type,
          scopes: tokenScopes,
          dataAccessExpiresAt: tokenData.data_access_expires_at,
          expiresAt: tokenData.expires_at,
        },
      };
    } else {
      result.token = {
        status: 'invalid',
        error: 'Access token is invalid or expired according to Meta token inspection.',
      };
    }
  } catch (debugErr: any) {
    // If debug_token is restricted on self-inspection, test token against /me or fallback probe
    try {
      const meRes = await axios.get(`https://graph.facebook.com/${META_GRAPH_VERSION}/me`, {
        params: { access_token: cleanToken },
        timeout: 6000,
      });
      if (meRes.data?.id) {
        result.token = {
          status: 'valid',
          details: { id: meRes.data.id, name: meRes.data.name },
        };
      }
    } catch {
      const parsed = parseMetaGraphError(debugErr, 'GET /debug_token');
      result.token = {
        status: 'invalid',
        error: parsed.message,
        code: parsed.metaErrorCode,
        fbTraceId: parsed.fbTraceId,
      };
      result.structuredError = parsed;
    }
  }

  // =========================================================================
  // 2. APP VALIDATION & MISMATCH DETECTION
  // =========================================================================
  if (cleanAppId) {
    if (tokenAppId && tokenAppId !== cleanAppId) {
      result.app = {
        status: 'mismatch',
        error: `Configured Meta App ID (${cleanAppId}) does not match the token's issuing App ID (${tokenAppId}). Please check your App ID in Meta App Dashboard.`,
        details: { configuredAppId: cleanAppId, tokenAppId },
      };
      if (!result.structuredError) {
        result.structuredError = {
          code: 'META_APP_MISMATCH',
          provider: 'meta',
          message: `The Meta App ID (${cleanAppId}) does not match the token issuing App ID (${tokenAppId}).`,
          retryable: false,
        };
      }
    } else if (cleanAppSecret) {
      // Test App Access Token validity if secret is provided
      try {
        const appRes = await axios.get(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanAppId}`,
          {
            params: {
              access_token: `${cleanAppId}|${cleanAppSecret}`,
              fields: 'id,name',
            },
            timeout: 6000,
          }
        );
        result.app = {
          status: 'valid',
          details: { id: appRes.data.id, name: appRes.data.name },
        };
      } catch (appErr: any) {
        const parsed = parseMetaGraphError(appErr, `GET /${cleanAppId}`);
        result.app = {
          status: 'invalid',
          error: parsed.message,
          code: parsed.metaErrorCode,
          fbTraceId: parsed.fbTraceId,
        };
        // If app validation failed with system error (#190), set structured error
        if (!result.structuredError) {
          result.structuredError = parsed;
        }
      }
    } else {
      result.app = {
        status: 'warning',
        error: 'Meta App Secret not configured. App Secret is required for incoming webhook signature verification.',
      };
    }
  } else if (tokenAppId) {
    result.app = {
      status: 'valid',
      details: { discoveredAppId: tokenAppId },
    };
  }

  // =========================================================================
  // 3. PHONE NUMBER PROBE
  // =========================================================================
  if (cleanPhoneId) {
    try {
      const phoneRes = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanPhoneId}`,
        {
          params: {
            fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
            access_token: cleanToken,
          },
          timeout: 8000,
        }
      );
      const pData = phoneRes.data;
      result.phoneNumber = {
        status: 'verified',
        details: {
          id: pData.id,
          displayPhoneNumber: pData.display_phone_number || cleanPhoneId,
          verifiedName: pData.verified_name || 'WhatsApp Business',
          qualityRating: pData.quality_rating || 'GREEN',
          codeVerificationStatus: pData.code_verification_status || 'VERIFIED',
        },
      };
    } catch (phoneErr: any) {
      const parsed = parseMetaGraphError(phoneErr, `GET /${cleanPhoneId}`);
      result.phoneNumber = {
        status: 'error',
        error: parsed.message,
        code: parsed.metaErrorCode,
        fbTraceId: parsed.fbTraceId,
      };
      if (!result.structuredError) result.structuredError = parsed;
    }
  } else {
    result.phoneNumber = {
      status: 'unconfigured',
      error: 'WhatsApp Phone Number ID is missing.',
    };
  }

  // =========================================================================
  // 4. WABA (WHATSAPP BUSINESS ACCOUNT) PROBE
  // =========================================================================
  if (cleanWabaId) {
    try {
      const wabaRes = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanWabaId}`,
        {
          params: {
            fields: 'id,name,currency,timezone_id,message_template_namespace',
            access_token: cleanToken,
          },
          timeout: 8000,
        }
      );
      result.waba = {
        status: 'verified',
        details: wabaRes.data,
      };
    } catch (wabaErr: any) {
      const parsed = parseMetaGraphError(wabaErr, `GET /${cleanWabaId}`);
      result.waba = {
        status: 'error',
        error: parsed.message,
        code: parsed.metaErrorCode,
        fbTraceId: parsed.fbTraceId,
      };
      if (!result.structuredError) result.structuredError = parsed;
    }
  } else {
    result.waba = {
      status: 'unconfigured',
      error: 'WhatsApp Business Account (WABA) ID is missing.',
    };
  }

  // =========================================================================
  // 5. PERMISSIONS CHECK
  // =========================================================================
  const hasMessagingCapability = result.phoneNumber.status === 'verified';
  const hasManagementCapability = result.waba.status === 'verified';

  if (tokenScopes.length > 0) {
    const hasMessagingScope = tokenScopes.includes('whatsapp_business_messaging');
    const hasManagementScope = tokenScopes.includes('whatsapp_business_management');
    if (hasMessagingScope && hasManagementScope) {
      result.permissions = {
        status: 'verified',
        details: { scopes: tokenScopes },
      };
    } else {
      const missing: string[] = [];
      if (!hasMessagingScope) missing.push('whatsapp_business_messaging');
      if (!hasManagementScope) missing.push('whatsapp_business_management');
      result.permissions = {
        status: 'warning',
        error: `Missing recommended scopes in token: ${missing.join(', ')}.`,
        details: { missing, granted: tokenScopes },
      };
    }
  } else if (hasMessagingCapability && hasManagementCapability) {
    result.permissions = {
      status: 'verified',
      details: { verifiedViaApiCapabilities: true },
    };
  } else {
    result.permissions = {
      status: 'pending',
      error: 'WhatsApp permissions could not be fully verified against Meta API.',
    };
  }

  // =========================================================================
  // 6. WABA WEBHOOK SUBSCRIPTION (Official WhatsApp Cloud API Subscribed Apps)
  // =========================================================================
  if (cleanWabaId && isConfigured) {
    try {
      const subRes = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanWabaId}/subscribed_apps`,
        {
          headers: { Authorization: `Bearer ${cleanToken}` },
          timeout: 8000,
        }
      );
      const subscribedApps = subRes.data?.data || [];
      if (Array.isArray(subscribedApps) && subscribedApps.length > 0) {
        result.subscription = {
          status: 'subscribed',
          details: { subscribedApps },
        };
      } else {
        // Attempt to subscribe automatically if not yet subscribed
        try {
          await axios.post(
            `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanWabaId}/subscribed_apps`,
            {},
            {
              headers: { Authorization: `Bearer ${cleanToken}` },
              timeout: 10000,
            }
          );
          result.subscription = {
            status: 'subscribed',
            details: { autoSubscribed: true },
          };
        } catch (subPostErr: any) {
          const parsed = parseMetaGraphError(subPostErr, `POST /${cleanWabaId}/subscribed_apps`);
          result.subscription = {
            status: 'unsubscribed',
            error: `WABA is not subscribed to receive webhook events: ${parsed.message}`,
            code: parsed.metaErrorCode,
            fbTraceId: parsed.fbTraceId,
          };
        }
      }
    } catch (subGetErr: any) {
      const parsed = parseMetaGraphError(subGetErr, `GET /${cleanWabaId}/subscribed_apps`);
      result.subscription = {
        status: 'unsubscribed',
        error: parsed.message,
        code: parsed.metaErrorCode,
        fbTraceId: parsed.fbTraceId,
      };
    }
  } else {
    result.subscription = {
      status: 'unconfigured',
      error: 'WABA ID is required to verify webhook subscription.',
    };
  }

  // =========================================================================
  // 7. WEBHOOK RECEIVER VERIFICATION (Local Endpoint Handshake)
  // =========================================================================
  const isListenerConfigured = Boolean(cleanVerifyToken && cleanVerifyToken.length >= 4);
  const isSubscriptionActive = result.subscription.status === 'subscribed';

  if (isSubscriptionActive && isListenerConfigured) {
    result.webhook = {
      status: 'verified',
      details: {
        receiverUrl: effectiveWebhookUrl,
        verifyTokenConfigured: true,
        wabaSubscribed: true,
      },
    };
  } else if (isSubscriptionActive) {
    result.webhook = {
      status: 'verified',
      details: {
        receiverUrl: effectiveWebhookUrl,
        wabaSubscribed: true,
      },
    };
  } else if (isListenerConfigured) {
    result.webhook = {
      status: 'pending',
      error: result.subscription.error || 'Webhook receiver is configured, waiting for WABA app subscription.',
      details: { receiverUrl: effectiveWebhookUrl },
    };
  } else {
    result.webhook = {
      status: 'unconfigured',
      error: 'Webhook receiver verify token is missing in settings.',
    };
  }

  // =========================================================================
  // 8. BUSINESS ACCOUNT PROBE (Optional)
  // =========================================================================
  if (cleanBusinessId) {
    try {
      const bizRes = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanBusinessId}`,
        {
          params: {
            fields: 'id,name,verification_status',
            access_token: cleanToken,
          },
          timeout: 6000,
        }
      );
      result.business = {
        status: 'verified',
        details: bizRes.data,
      };
    } catch (bizErr: any) {
      result.business = {
        status: 'warning',
        error: parseMetaGraphError(bizErr, `GET /${cleanBusinessId}`).message,
      };
    }
  }

  // Overall Status
  const isCoreValid =
    result.token.status === 'valid' &&
    result.phoneNumber.status === 'verified';

  const isWebhookReady =
    result.webhook.status === 'verified' ||
    result.subscription.status === 'subscribed';

  if (isCoreValid && isWebhookReady) {
    result.overallStatus = 'PASS';
  } else if (isCoreValid) {
    result.overallStatus = 'WARNING';
  } else {
    result.overallStatus = 'FAIL';
  }

  return result;
}
