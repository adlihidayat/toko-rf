// app/api/stocks/release/route.ts - NEW ENDPOINT
import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';
import { verifyAdminAccess } from '@/lib/utils/admin-auth';

/**
 * POST /api/stocks/release
 * Release multiple stocks back to available status
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn('🚫 Non-admin attempted to release stocks');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { stockIds } = body;

    if (!stockIds || !Array.isArray(stockIds) || stockIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid stockIds - must be non-empty array' },
        { status: 400 }
      );
    }

    console.log(`✅ Admin releasing ${stockIds.length} stocks`);

    let releasedCount = 0;
    const failed: string[] = [];

    for (const stockId of stockIds) {
      try {
        const success = await StockService.markStockAsAvailable(stockId);
        if (success) {
          releasedCount++;
        } else {
          failed.push(stockId);
        }
      } catch (error) {
        console.error(`❌ Failed to release stock ${stockId}:`, error);
        failed.push(stockId);
      }
    }

    console.log(
      `✅ Released ${releasedCount}/${stockIds.length} stocks (${failed.length} failed)`
    );

    return NextResponse.json({
      success: releasedCount > 0,
      message: `Released ${releasedCount} stocks`,
      releasedCount,
      totalRequested: stockIds.length,
      failedIds: failed.length > 0 ? failed : undefined,
    });
  } catch (error) {
    console.error('❌ Error releasing stocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to release stocks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}