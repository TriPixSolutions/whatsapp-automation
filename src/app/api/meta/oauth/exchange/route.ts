import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/meta/oauth/exchange
 * Exchanges a short-lived Meta user/system token for a 60-day long-lived page/system token.
 * Automatically saves and encrypts the long-lived token in SettingsDB.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortLivedToken, appId: customAppId, appSecret: customAppSecret } = body;

    if (!shortLivedToken) {
      return NextResponse.json(
        { error: 'Missing shortLivedToken parameter' },
        { status: 400 }
      );
    }

    const currentSettings = SettingsDB.get();
    const appId = customAppId || currentSettings.appId || process.env.META_APP_ID;
    const appSecret = customAppSecret || currentSettings.appSecret || process.env.META_APP_SECRET;

    // In local development/sandbox without live Meta App credentials, provide simulated exchange
    if (!appId || !appSecret || appId === 'your_meta_app_id' || appSecret === 'your_meta_app_secret' || shortLivedToken.startsWith('mock_') || shortLivedToken.startsWith('test_')) {
      const simulatedExpiresIn = 5184000; // 60 days in seconds
      const simulatedLongLivedToken = `EAA${Math.random().toString(36).substring(2, 15).toUpperCase()}LONG60D${Date.now()}`;

      SettingsDB.update({
        accessToken: simulatedLongLivedToken,
      });

      return NextResponse.json({
        success: true,
        expiresIn: simulatedExpiresIn,
        tokenType: 'bearer',
        mode: 'simulated',
        message: 'Successfully generated 60-day long-lived access token (Sandbox Mode)',
      });
    }

    // Call live Meta Graph API OAuth Exchange
    const metaUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    metaUrl.searchParams.set('grant_type', 'fb_exchange_token');
    metaUrl.searchParams.set('client_id', appId);
    metaUrl.searchParams.set('client_secret', appSecret);
    metaUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const metaRes = await fetch(metaUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await metaRes.json();

    if (!metaRes.ok || data.error) {
      console.error('[Meta OAuth Exchange Error]:', data.error);
      return NextResponse.json(
        {
          error: data.error?.message || 'Meta OAuth token exchange failed',
          code: data.error?.code,
          subcode: data.error?.error_subcode,
        },
        { status: metaRes.status >= 400 && metaRes.status < 600 ? metaRes.status : 400 }
      );
    }

    const longLivedToken = data.access_token;
    const expiresIn = data.expires_in || 5184000; // ~60 days

    // Update settings DB (SettingsDB.update automatically encrypts with AES-256-GCM)
    SettingsDB.update({
      accessToken: longLivedToken,
      appId,
      appSecret,
    });

    return NextResponse.json({
      success: true,
      expiresIn,
      tokenType: data.token_type || 'bearer',
      message: 'Successfully exchanged and saved 60-day long-lived access token',
    });
  } catch (error: any) {
    console.error('[Meta OAuth Route Exception]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during OAuth exchange' },
      { status: 500 }
    );
  }
}
