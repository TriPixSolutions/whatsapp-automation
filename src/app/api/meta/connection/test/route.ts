import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';
import axios from 'axios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';

/**
 * POST /api/meta/connection/test
 * Tests live connection to Meta Cloud API by validating WABA ID, Phone Number ID, and Access Token,
 * and optionally dispatches a connection test text message without templates.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const settings = SettingsDB.get(DEFAULT_WORKSPACE_ID);

    const phoneNumberId = (body.phoneNumberId || settings.phoneNumberId || '').trim();
    const wabaId = (body.wabaId || settings.wabaId || '').trim();
    const accessToken = (body.accessToken || settings.accessToken || '').trim();
    const testPhoneNumber = (body.testPhoneNumber || body.to || body.phoneNumber || '').trim();

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone Number ID and Access Token are required to test connection.',
        },
        { status: 400 }
      );
    }

    if (accessToken.includes('SAMPLE_TOKEN') || accessToken.startsWith('MOCK_')) {
      return NextResponse.json({
        success: false,
        error: 'Placeholder or sample token detected. Please enter a valid Meta System User Access Token.',
      });
    }

    // 1. Call Meta Graph API to inspect phone number status
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}`;
    let phoneData: any = null;

    try {
      console.log(`[Meta Connection Test] Probing phone number ID: ${phoneNumberId}`);
      const res = await axios.get(url, {
        params: {
          fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
          access_token: accessToken,
        },
        timeout: 10000,
      });

      phoneData = res.data;
      console.log('[Meta Connection Test] Phone probe full response:', JSON.stringify(phoneData, null, 2));
    } catch (apiErr: any) {
      const metaError = apiErr.response?.data?.error;
      const errorMsg = metaError?.message || apiErr.message;
      const code = metaError?.code;

      console.error('[Meta Connection Test] Phone probe error:', JSON.stringify(apiErr.response?.data || apiErr.message, null, 2));

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          code,
          hint:
            code === 190
              ? 'Token expired or invalid. Generate a permanent System User token with whatsapp_business_messaging permissions.'
              : code === 100
              ? 'Invalid Phone Number ID. Verify your Meta Developer Console Phone Number ID.'
              : 'Meta API verification failed.',
        },
        { status: 400 }
      );
    }

    // 2. If testPhoneNumber is provided, send connection test text message (no templates)
    let testMessageResult: any = null;
    if (testPhoneNumber) {
      const testText = 'WhatsApp connection successful. Test message from TriPix SaaS.';
      console.log(`[Meta Connection Test] Dispatching simple text message to ${testPhoneNumber}: "${testText}"`);

      testMessageResult = await MetaWhatsAppClient.sendText({
        phoneNumberId,
        accessToken,
        to: testPhoneNumber,
        text: testText,
      });

      console.log('[Meta Connection Test] Full test message dispatch result:', JSON.stringify(testMessageResult, null, 2));

      if (!testMessageResult.success) {
        return NextResponse.json(
          {
            success: false,
            verified: true,
            phoneNumberId: phoneData.id,
            displayPhoneNumber: phoneData.display_phone_number,
            verifiedName: phoneData.verified_name,
            error: testMessageResult.error || 'Failed to dispatch test message.',
            details: testMessageResult.details,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      phoneNumberId: phoneData.id,
      displayPhoneNumber: phoneData.display_phone_number,
      verifiedName: phoneData.verified_name,
      qualityRating: phoneData.quality_rating,
      testMessage: testMessageResult,
      message: testPhoneNumber
        ? 'Successfully connected and sent test message via WhatsApp Cloud API.'
        : 'Successfully connected and verified WhatsApp Cloud API phone number.',
    });
  } catch (error: any) {
    console.error('[Meta Connection Test Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
