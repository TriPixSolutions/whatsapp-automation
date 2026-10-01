import { getAuthorizedUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, WebhookEventsDB } from '@/lib/db';
import axios from 'axios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';

/**
 * GET /api/meta/diagnostics
 * Meta App Review & Production Verification Readiness Diagnostic Check:
 * - Webhook Status & Verification Handshake
 * - Token Status & Permissions
 * - Phone Number Status & Quality Rating
 * - WABA Status & Namespace
 * - Meta Compliance Endpoints (Privacy Policy, Terms, Data Deletion)
 */
export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const settings = await SettingsDB.get(user.workspaceId!);
  const { phoneNumberId, wabaId, accessToken, verifyToken, appSecret } = settings;

  const isConfigured = Boolean(
    phoneNumberId &&
    accessToken &&
    !accessToken.includes('SAMPLE_TOKEN') &&
    !accessToken.startsWith('MOCK_')
  );
  const lastEventProcessedAt = await WebhookEventsDB.latestProcessedAt(user.workspaceId!);
  const webhookConfigured = Boolean(verifyToken && appSecret);

  const report: any = {
    timestamp: new Date().toISOString(),
    overallReadiness: isConfigured && webhookConfigured ? 'CONFIGURED_UNVERIFIED' : 'CONFIGURATION_INCOMPLETE',
    metaApiVersion: META_GRAPH_VERSION,
    complianceEndpoints: {
      privacyPolicyUrl: `${origin}/privacy-policy`,
      termsOfServiceUrl: `${origin}/terms-of-service`,
      dataDeletionCallbackUrl: `${origin}/api/meta/data-deletion`,
      dataDeletionStatusUrl: `${origin}/data-deletion/status`,
      webhookUrl: `${origin}/api/webhook/whatsapp`,
      complianceStatus: 'ENDPOINTS_DECLARED',
    },
    webhook: {
      status: webhookConfigured ? 'configured' : 'incomplete',
      verifyTokenSet: Boolean(verifyToken),
      signatureSecretSet: Boolean(appSecret),
      endpointAvailable: true,
      lastEventProcessed: Boolean(lastEventProcessedAt),
      lastEventProcessedAt,
    },
    token: {
      status: isConfigured ? 'valid' : 'unconfigured',
      type: 'not_probed',
      permissions: 'not_probed',
      expiresIn: 'not_probed',
    },
    phoneNumber: {
      status: isConfigured ? 'registered' : 'unconfigured',
      phoneNumberId: phoneNumberId || 'None',
      qualityRating: 'not_probed',
      codeVerificationStatus: 'not_probed',
    },
    waba: {
      status: wabaId ? 'configured_unverified' : 'unconfigured',
      wabaId: wabaId || 'None',
    },
    checklist: [
      { item: 'Webhook verification token configured', passed: Boolean(verifyToken) },
      { item: 'Inbound webhook signature secret configured', passed: Boolean(appSecret) },
      { item: 'A webhook event has completed', passed: Boolean(lastEventProcessedAt) },
      { item: 'WhatsApp sender credentials configured', passed: isConfigured },
      { item: 'WABA ID configured', passed: Boolean(wabaId) },
    ],
  };

  // Live Meta API diagnostic probes if configured
  if (isConfigured) {
    try {
      const probeRes = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}`,
        {
          params: {
            fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
            access_token: accessToken,
          },
          timeout: 6000,
        }
      );

      report.phoneNumber = {
        status: 'live_verified',
        phoneNumberId: probeRes.data.id,
        displayPhoneNumber: probeRes.data.display_phone_number,
        verifiedName: probeRes.data.verified_name,
        qualityRating: probeRes.data.quality_rating,
        codeVerificationStatus: probeRes.data.code_verification_status,
      };
      report.token.status = 'live_probe_succeeded';
      report.overallReadiness = webhookConfigured && lastEventProcessedAt
        ? 'LIVE_CONNECTION_VERIFIED'
        : 'META_API_VERIFIED_WEBHOOK_PENDING';
    } catch (err: any) {
      report.phoneNumber.liveProbeError = err.response?.data?.error?.message || err.message;
      report.token.status = 'probe_failed';
      report.overallReadiness = 'LIVE_PROBE_FAILED';
    }
  }

  return NextResponse.json(report);
}
