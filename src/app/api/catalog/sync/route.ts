import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { SettingsDB } from '@/lib/db';
import { syncProductsToMetaCatalog, CatalogProductSyncItem } from '@/lib/meta/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const settings = SettingsDB.get();

    const catalogId = body.catalogId || settings.catalogId || process.env.META_CATALOG_ID;
    const accessToken = settings.accessToken || process.env.META_SYSTEM_ACCESS_TOKEN;

    if (!catalogId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meta Catalog ID is missing. Configure catalogId in Settings or payload.',
        },
        { status: 400 }
      );
    }

    const products: CatalogProductSyncItem[] = body.products || [];
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No products provided for catalog synchronization.',
        },
        { status: 400 }
      );
    }

    if (!accessToken || accessToken.includes('SAMPLE_TOKEN')) {
      // Graceful simulation response if live Meta token is not yet connected
      return NextResponse.json({
        success: true,
        simulated: true,
        catalogId,
        syncedCount: products.length,
        message: `Simulated sync of ${products.length} products to Meta Catalog #${catalogId}. Connect live Meta Access Token to publish to Facebook/Instagram.`,
      });
    }

    const syncResult = await syncProductsToMetaCatalog({
      catalogId,
      accessToken,
      products,
    });

    if (!syncResult.success) {
      return NextResponse.json(
        {
          success: false,
          catalogId,
          error: syncResult.error,
          details: syncResult.details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      catalogId,
      syncedCount: syncResult.syncedCount,
      message: `Successfully synchronized ${syncResult.syncedCount} products with Meta Commerce Catalog.`,
    });
  } catch (error: any) {
    console.error('[Meta Catalog Sync API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
