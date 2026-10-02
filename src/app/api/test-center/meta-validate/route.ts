import { getAuthorizedUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, WebhookEventsDB } from '@/lib/db';
import { MetaValidationResult } from '@/types/automations';
import { validateMetaConnection, META_GRAPH_VERSION } from '@/lib/meta/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const workspaceId = user.workspaceId || 'default';
    const settings = await SettingsDB.get(workspaceId);
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/api/webhook/whatsapp`;

    // Execute comprehensive, independent 8-dimension Meta connection validation
    const diagnostics = await validateMetaConnection({
      workspaceId,
      accessToken: settings.accessToken,
      appId: settings.appId,
      appSecret: settings.appSecret,
      wabaId: settings.wabaId,
      phoneNumberId: settings.phoneNumberId,
      businessId: settings.adAccountId,
      verifyToken: settings.verifyToken,
      webhookUrl: callbackUrl,
    });

    const isTokenValid = diagnostics.token.status === 'valid';
    const isPhoneConnected = diagnostics.phoneNumber.status === 'verified';
    const isWabaConnected = diagnostics.waba.status === 'verified';
    const isWabaSubscribed = diagnostics.subscription.status === 'subscribed';
    const isWebhookReady = diagnostics.webhook.status === 'verified' || isWabaSubscribed;
    const isPermissionsValid = diagnostics.permissions.status === 'verified';

    const hasCredentials = Boolean(
      settings.accessToken &&
      settings.phoneNumberId &&
      !settings.accessToken.includes('SAMPLE_TOKEN')
    );

    const valid = isTokenValid && isPhoneConnected;
    const latestProcessedAt = await WebhookEventsDB.latestProcessedAt(workspaceId);
    const signingSecretConfigured = /^[a-f0-9]{32}$/i.test(settings.appSecret || '');
    const signedEventVerified = Boolean(latestProcessedAt && settings.updatedAt && Date.parse(latestProcessedAt) >= Date.parse(settings.updatedAt));
    const webhookActive = isWebhookReady && signingSecretConfigured && signedEventVerified;

    const displayPhone = diagnostics.phoneNumber.details?.displayPhoneNumber || settings.phoneNumberId || 'None';
    const verifiedName = diagnostics.phoneNumber.details?.verifiedName || 'WhatsApp Verified Business';
    const qualityRating = diagnostics.phoneNumber.details?.qualityRating || 'UNKNOWN';

    const checklist = [
      {
        id: 'chk_webhook_active',
        name: 'Webhook Active',
        description: 'Inbound WhatsApp webhook endpoint /api/webhook/whatsapp responds to HTTP events',
        status: webhookActive ? ('pass' as const) : ('fail' as const),
        details: webhookActive
          ? 'A signed webhook event was processed after the current credentials were saved'
          : (!signingSecretConfigured ? 'Saved App Secret must match the 32-character secret in Meta App settings → Basic.' : diagnostics.webhook.error || diagnostics.subscription.error || 'Callback handshake/subscription alone do not prove receiving signed events. Send a real test reply.'),
        critical: true,
      },
      {
        id: 'chk_webhook_verified',
        name: 'Webhook Verified',
        description: 'Configured callback returned the expected GET verification challenge',
        status: diagnostics.webhook.status === 'verified' ? ('pass' as const) : ('fail' as const),
        details: diagnostics.webhook.status === 'verified' ? 'GET challenge succeeds; signed event verification is checked separately' : 'Callback challenge not verified',
        critical: true,
      },
      {
        id: 'chk_access_token',
        name: 'Access Token Valid',
        description: 'System User Permanent Access Token with required WhatsApp permissions',
        status: isTokenValid ? ('pass' as const) : ('fail' as const),
        details: isTokenValid
          ? `Token verified (Scopes: ${diagnostics.token.details?.scopes?.join(', ') || 'not returned by Meta'})`
          : (diagnostics.token.error || 'Live token missing, expired, or using a placeholder'),
        critical: true,
      },
      {
        id: 'chk_phone_number',
        name: 'Phone Number Connected',
        description: 'Verified WhatsApp Phone Number ID attached to Meta Cloud API',
        status: isPhoneConnected ? ('pass' as const) : ('fail' as const),
        details: isPhoneConnected
          ? `Phone Number ID verified: ${settings.phoneNumberId} (${displayPhone} - ${verifiedName})`
          : (diagnostics.phoneNumber.error || 'Phone Number ID not verified'),
        critical: true,
      },
      {
        id: 'chk_waba',
        name: 'WABA Connected',
        description: 'WhatsApp Business Account (WABA) registered with Meta Business Manager',
        status: isWabaConnected ? ('pass' as const) : ('warn' as const),
        details: isWabaConnected
          ? `WABA ID verified: ${settings.wabaId} (${diagnostics.waba.details?.name || 'Active'})`
          : (diagnostics.waba.error || 'WABA ID recommended for template and webhook management'),
        critical: false,
      },
      {
        id: 'chk_permissions',
        name: 'Permissions Available',
        description: 'whatsapp_business_messaging and whatsapp_business_management scopes granted',
        status: isPermissionsValid ? ('pass' as const) : ('warn' as const),
        details: isPermissionsValid
          ? 'Scopes verified: messaging, management'
          : (diagnostics.permissions.error || 'Ensure System User has Admin/Full Control access in Meta Business Manager'),
        critical: true,
      },
      {
        id: 'chk_waba_subscription',
        name: 'WABA Webhook Subscription',
        description: 'WABA subscribed_apps edge configured to stream inbound WhatsApp messages',
        status: isWabaSubscribed ? ('pass' as const) : ('warn' as const),
        details: isWabaSubscribed
          ? 'WABA is actively subscribed to the application'
          : (diagnostics.subscription.error || 'WABA requires subscribed_apps registration'),
        critical: false,
      },
      {
        id: 'chk_api_reachable',
        name: 'API Reachable',
        description: `Meta Graph API ${META_GRAPH_VERSION} endpoint responds successfully`,
        status: isTokenValid || isPhoneConnected ? ('pass' as const) : ('fail' as const),
        details: isTokenValid || isPhoneConnected
          ? `Meta Graph API ${META_GRAPH_VERSION} responding normally`
          : (diagnostics.phoneNumber.error || diagnostics.token.error || 'Network probe timeout'),
        critical: true,
      },
    ];

    const criticalFails = checklist.filter((c) => c.critical && c.status === 'fail').length;
    const overallStatus = criticalFails === 0 ? 'PASS' : 'FAIL';

    const result: MetaValidationResult = {
      timestamp: diagnostics.timestamp,
      overallStatus,
      checklist,
      details: {
        webhookActive,
        webhookVerified: diagnostics.webhook.status === 'verified',
        accessTokenValid: isTokenValid,
        phoneNumberConnected: isPhoneConnected,
        wabaConnected: isWabaConnected,
        permissionsAvailable: isPermissionsValid,

        apiReachable: isTokenValid || isPhoneConnected,
        qualityRating,
        verifiedName,
        displayPhoneNumber: displayPhone,
      },
    };

    // Determine safe, structured error message for user-facing display
    let structuredError = diagnostics.structuredError || null;
    let errorMessage: string | null = null;

    if (!valid) {
      errorMessage = diagnostics.phoneNumber.error || diagnostics.token.error || 'Meta credentials could not be verified.';
    } else if (!webhookActive) {
      errorMessage = diagnostics.webhook.error || diagnostics.subscription.error || 'Webhook receiver is pending verification.';
    } else if (diagnostics.app.status === 'mismatch') {
      errorMessage = diagnostics.app.error || null;
    } else if (diagnostics.app.status === 'invalid' && diagnostics.app.error) {
      // App secret warning: notify without blocking valid messaging
      errorMessage = diagnostics.app.error;
    }

    return NextResponse.json({
      ...result,
      valid,
      hasCredentials,
      webhookActive,
      webhookHandshakeVerified: diagnostics.webhook.status === 'verified',
      signedEventVerified,
      templateStatus: 'not_verified',
      error: errorMessage,
      diagnostics: {
        app: diagnostics.app,
        token: diagnostics.token,
        business: diagnostics.business,
        waba: diagnostics.waba,
        phoneNumber: diagnostics.phoneNumber,
        permissions: diagnostics.permissions,
        webhook: diagnostics.webhook,
        subscription: diagnostics.subscription,
      },
      structuredError: structuredError ? {
        code: structuredError.code,
        provider: 'meta',
        metaErrorCode: structuredError.metaErrorCode,
        metaErrorType: structuredError.metaErrorType,
        message: structuredError.message,
        fbTraceId: structuredError.fbTraceId,
        retryable: structuredError.retryable,
      } : null,
    });
  } catch (err: any) {
    console.error('[Meta Validate API Error]:', err);
    return NextResponse.json({
      error: err.message || 'Validation failed due to internal error',
      valid: false,
      webhookActive: false,
      structuredError: {
        code: 'INTERNAL_ERROR',
        provider: 'meta',
        message: err.message,
        retryable: true,
      },
    }, { status: 500 });
  }
}
