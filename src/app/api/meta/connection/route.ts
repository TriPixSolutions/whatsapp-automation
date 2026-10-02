import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { getAdminClient } from '@/lib/supabase/server';
import axios from 'axios';
import { META_GRAPH_VERSION, parseMetaGraphError } from '@/lib/meta/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/meta/connection
 * Diagnostic endpoint for Meta Connection, Token Health, Webhook Health, and Phone Number Health
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetWorkspaceId = user.workspaceId || searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;
    const settings = await SettingsDB.get(targetWorkspaceId);

    const { wabaId, phoneNumberId, accessToken, verifyToken, webhookUrl, appId, appSecret } = settings;

    const isConfigured = Boolean(
      phoneNumberId &&
      accessToken &&
      !accessToken.includes('SAMPLE_TOKEN') &&
      !accessToken.startsWith('MOCK_') &&
      !accessToken.startsWith('TEST_')
    );

    // Initial Health Payload - Status must come from actual backend verification
    const healthReport: any = {
      connectionStatus: 'disconnected',
      isLive: isConfigured,
      workspaceId: targetWorkspaceId,
      credentials: {
        businessId: settings.adAccountId || '',
        wabaId: wabaId || '',
        phoneNumberId: phoneNumberId || '',
        appId: appId || '',
        accessTokenMasked: accessToken
          ? `${accessToken.substring(0, Math.min(7, accessToken.length))}...${accessToken.substring(Math.max(0, accessToken.length - 4))}`
          : 'None',
        webhookUrl: webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhook/whatsapp`,
      },
      tokenHealth: {
        status: isConfigured ? 'pending_verification' : 'unconfigured',
        error: isConfigured ? null : 'Access token is missing, mock, or placeholder',
      },
      webhookHealth: {
        status: verifyToken && appSecret ? 'configured_not_verified' : 'pending_configuration',
        verifyTokenSet: Boolean(verifyToken),
        appSecretSet: Boolean(appSecret),
        webhookUrl: webhookUrl || '/api/webhook/whatsapp',
      },
      phoneNumberHealth: {
        status: isConfigured ? 'pending_verification' : 'unconfigured',
        displayPhoneNumber: phoneNumberId || 'None',
        qualityRating: 'UNKNOWN',
        verifiedName: 'WhatsApp Business',
      },
      wabaHealth: {
        status: wabaId ? 'configured_not_verified' : 'unconfigured',
        wabaId: wabaId || '',
      },
    };

    // If live credentials exist, run live Meta Graph API probe
    if (isConfigured) {
      try {
        const phoneProbeUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}`;
        const phoneRes = await axios.get(phoneProbeUrl, {
          params: {
            fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
          },
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 6000,
        });

        const pData = phoneRes.data;
        healthReport.connectionStatus = 'connected';
        healthReport.phoneNumberHealth = {
          status: 'verified',
          displayPhoneNumber: pData.display_phone_number || phoneNumberId,
          verifiedName: pData.verified_name || 'Verified Business',
          qualityRating: pData.quality_rating || 'UNKNOWN',
          codeVerificationStatus: pData.code_verification_status || 'UNKNOWN',
        };
        healthReport.tokenHealth = {
          status: 'valid',
          type: 'System User Token',
          error: null,
        };
      } catch (err: any) {
        const metaErr = err.response?.data?.error;
        healthReport.connectionStatus = 'error';
        healthReport.tokenHealth = {
          status: 'invalid_or_expired',
          error: metaErr?.message || err.message,
          code: metaErr?.code,
        };
        healthReport.phoneNumberHealth.status = 'error';
      }
    } else if (accessToken && accessToken.startsWith('TEST_')) {
      healthReport.connectionStatus = 'sandbox';
      healthReport.tokenHealth = {
        status: 'sandbox',
        error: 'Test token detected. Connect live Meta credentials.',
      };
    } else {
      healthReport.connectionStatus = 'disconnected';
    }

    return NextResponse.json(healthReport);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/meta/connection
 * Completes Meta Onboarding Flow:
 * 1. Validates Business, WABA, Phone Number, and Token
 * 2. Subscribes Webhook to WABA
 * 3. Encrypts and Saves Connection Credentials
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['owner', 'admin', 'super_admin'].includes(user.role)) return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });
    const body = await request.json();
    const {
      businessId,
      wabaId,
      phoneNumberId,
      accessToken,
      appId,
      appSecret,
      verifyToken = 'tripix_verify_token_2026',
      catalogId,
      workspaceId = DEFAULT_WORKSPACE_ID,
    } = body;

    const targetWorkspaceId = user.workspaceId || workspaceId || DEFAULT_WORKSPACE_ID;

    if (!phoneNumberId) {
      return NextResponse.json(
        { error: 'Phone Number ID is required.' },
        { status: 400 }
      );
    }

    if (typeof body.appSecret === 'string' && body.appSecret.trim() && !/[•*]/.test(body.appSecret) && !/^[a-f0-9]{32}$/i.test(body.appSecret.trim())) {
      return NextResponse.json({ error: 'Meta App Secret must be the 32-character hexadecimal secret from App settings → Basic.' }, { status: 400 });
    }
    const replacementCredentials = Object.fromEntries(['accessToken','appSecret'].filter(key => typeof body[key] === 'string' && body[key].trim() && !/[•*]/.test(body[key])).map(key => [key, body[key].trim()]));
    const current = await SettingsDB.get(targetWorkspaceId, replacementCredentials);
    const isMasked = (value: unknown) =>
      typeof value === 'string' && (value.includes('••••') || value.includes('****'));
    const resolvedToken = !accessToken || isMasked(accessToken) ? current.accessToken : accessToken;
    const resolvedAppSecret = !appSecret || isMasked(appSecret) ? current.appSecret : appSecret;

    const cleanToken = resolvedToken?.trim();
    const cleanPhoneId = phoneNumberId.trim();
    const cleanWabaId = (wabaId || '').trim();

    if (!cleanToken) {
      return NextResponse.json({ error: 'A valid Meta access token is required.' }, { status: 400 });
    }

    // 1. Live Validation Probe against Meta Graph API
    let verifiedName = 'WhatsApp Business Account';
    let displayPhone = cleanPhoneId;
    let qualityRating = 'UNKNOWN';
    let webhookConfigured = false;
    let webhookConfigurationError: string | null = null;

    const isLive = !cleanToken.includes('SAMPLE_TOKEN') && !/^(MOCK_|TEST_)/.test(cleanToken);
    if (!isLive) return NextResponse.json({ error: 'Real Meta credentials are required' }, { status: 400 });

    if (isLive) {
      try {
        const phoneProbe = await axios.get(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanPhoneId}`,
          {
            params: {
              fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
            },
            headers: { Authorization: `Bearer ${cleanToken}` },
            timeout: 10000,
          }
        );

        if (phoneProbe.data) {
          displayPhone = phoneProbe.data.display_phone_number || cleanPhoneId;
          verifiedName = phoneProbe.data.verified_name || verifiedName;
          qualityRating = phoneProbe.data.quality_rating || qualityRating;
        }
      } catch (err: any) {
        const metaErr = err.response?.data?.error;
        console.error('[Meta Connection Test Failed]:', metaErr || err.message);
        return NextResponse.json(
          {
            error: metaErr?.message || 'Meta validation failed. Invalid Phone Number ID or Access Token.',
            code: metaErr?.code,
          },
          { status: 400 }
        );
      }

      // 2. Subscribe Webhook to WABA
      if (cleanWabaId) {
        try {
          await axios.post(
            `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanWabaId}/subscribed_apps`,
            {},
            {
              headers: { Authorization: `Bearer ${cleanToken}` },
              timeout: 10000,
            }
          );
          console.log(`[Meta Webhook] Successfully subscribed apps for WABA: ${cleanWabaId}`);
        } catch (subErr: any) {
          console.warn('[Meta Subscribed Apps Warning]:', subErr.response?.data || subErr.message);
          return NextResponse.json({ error: 'Business account subscription failed. Check token permissions and business asset assignment.' }, { status: 400 });
        }
      }

    }

    // 3. Encrypt and Persist Connection Settings
    const updatedSettings = await SettingsDB.update(
      {
        wabaId: cleanWabaId,
        phoneNumberId: cleanPhoneId,
        accessToken: cleanToken,
        verifyToken,
        appId: appId || undefined,
        appSecret: resolvedAppSecret || undefined,
        adAccountId: businessId || undefined,
        catalogId: catalogId || undefined,
      },
      targetWorkspaceId
    );

    // Persist first because Meta immediately calls the callback URL with the
    // verify token while this request is registering the subscription.
    if (isLive && appId && resolvedAppSecret && verifyToken) {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/api/webhook/whatsapp`;
      try {
        await axios.post(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${String(appId).trim()}/subscriptions`,
          null,
          {
            params: {
              object: 'whatsapp_business_account',
              callback_url: callbackUrl,
              verify_token: verifyToken,
              fields: 'messages',
              include_values: true,
            },
            headers: {
              Authorization: `Bearer ${String(appId).trim()}|${resolvedAppSecret}`,
            },
            timeout: 10000,
          }
        );
        webhookConfigured = true;
      } catch (webhookErr: any) {
        const parsed = parseMetaGraphError(webhookErr, `POST /${String(appId).trim()}/subscriptions`);
        webhookConfigurationError = parsed.message;
        console.warn('[Meta Webhook Configuration Warning]:', webhookConfigurationError);
      }
    } else {
      webhookConfigurationError = 'Meta App ID, App Secret, and webhook verify token are required for inbound automation.';
    }

    // 4. Update Supabase Phone Numbers and Meta Connection tables
    const supabase = getAdminClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('phone_numbers').update({
          display_phone_number: displayPhone, verified_name: verifiedName,
          quality_rating: qualityRating, updated_at: new Date().toISOString(),
        }).eq('phone_number_id', cleanPhoneId).eq('workspace_id', targetWorkspaceId);
        if (error) throw error;
      } catch (dbErr: any) {
        console.warn('[Supabase Phone Number Sync Warning]:', dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      connectionStatus: 'connected',
      message: 'Meta WhatsApp Business connection saved and verified successfully.',
      connection: {
        workspaceId: targetWorkspaceId,
        wabaId: cleanWabaId,
        phoneNumberId: cleanPhoneId,
        displayPhoneNumber: displayPhone,
        verifiedName,
        qualityRating,
        tokenHealth: 'valid',
        webhookHealth: webhookConfigured ? 'subscribed' : 'configuration_required',
        webhookConfigurationError,
      },
    });
  } catch (error: any) {
    console.error('[Meta Connection POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
