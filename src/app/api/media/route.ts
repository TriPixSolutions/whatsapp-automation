import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';
import { getAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/media
 * Uploads a media asset (image, video, document, audio) to Meta Cloud API and stores metadata
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'application/octet-stream';
    const filename = file.name || `media_${Date.now()}`;
    const fileSize = buffer.length;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const settings = SettingsDB.get(DEFAULT_WORKSPACE_ID);
    const { phoneNumberId, accessToken } = settings;

    let metaMediaId: string | undefined;

    // If live Meta credentials configured, upload to Meta Cloud Media API
    if (phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN')) {
      const uploadResult = await MetaWhatsAppClient.uploadMedia({
        phoneNumberId,
        accessToken,
        fileBuffer: buffer,
        mimeType,
        filename,
      });

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || 'Failed to upload media to Meta Cloud API' },
          { status: 502 }
        );
      }
      metaMediaId = uploadResult.mediaId;
    } else {
      metaMediaId = `meta_med_${Date.now()}`;
    }

    const assetId = `med_${Date.now()}`;
    const publicUrl = `/api/media?id=${assetId}`;

    // Store in Supabase media_assets table
    const supabase = getAdminClient();
    if (supabase) {
      try {
        await supabase
          .from('media_assets')
          .insert({
            id: assetId,
            workspace_id: DEFAULT_WORKSPACE_ID,
            meta_media_id: metaMediaId,
            file_name: filename,
            file_size_bytes: fileSize,
            mime_type: mimeType,
            sha256_hash: sha256,
            storage_path: `uploads/${assetId}_${filename}`,
            public_url: publicUrl,
          });
      } catch (err: any) {
        console.warn('[Media DB] Insert warning:', err?.message || err);
      }
    }

    return NextResponse.json({
      success: true,
      mediaId: metaMediaId,
      assetId,
      filename,
      mimeType,
      fileSize,
      sha256,
      publicUrl,
    });
  } catch (error: any) {
    console.error('[Media Upload Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/media
 * Lists uploaded media assets for the workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from('media_assets')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .order('created_at', { ascending: false });

      if (data) return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
