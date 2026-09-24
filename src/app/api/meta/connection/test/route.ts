import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import axios from 'axios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';

/**
 * POST /api/meta/connection/test
 * Tests live connection to Meta Cloud API by validating WABA ID, Phone Number ID, and Access Token
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

    // Call Meta Graph API to inspect phone number status
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}`;
    try {
      const res = await axios.get(url, {
        params: {
          fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
          access_token: accessToken,
        },
        timeout: 10000,
      });

      const data = res.data;
      return NextResponse.json({
        success: true,
        verified: true,
        phoneNumberId: data.id,
        displayPhoneNumber: data.display_phone_number,
        verifiedName: data.verified_name,
        qualityRating: data.quality_rating,
        message: 'Successfully connected and verified WhatsApp Cloud API phone number.',
      });
    } catch (apiErr: any) {
      const metaError = apiErr.response?.data?.error;
      const errorMsg = metaError?.message || apiErr.message;
      const code = metaError?.code;

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
