// app/api/stocks/release/route.ts - NEW ENDPOINT
import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockIds } = body;

    if (!stockIds || !Array.isArray(stockIds) || stockIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid stockIds' },
        { status: 400 }
      );
    }

    console.log('🔄 Releasing stocks:', stockIds);

    // Release all stocks back to available
    let releasedCount = 0;
    for (const stockId of stockIds) {
      try {
        const success = await StockService.markStockAsAvailable(stockId);
        if (success) releasedCount++;
      } catch (error) {
        console.error(`❌ Failed to release stock ${stockId}:`, error);
      }
    }

    console.log(`✅ Released ${releasedCount}/${stockIds.length} stocks`);

    return NextResponse.json({
      success: true,
      message: `Released ${releasedCount} stocks`,
      releasedCount,
      totalRequested: stockIds.length,
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