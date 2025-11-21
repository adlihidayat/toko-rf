// ============================================================
// FILE 1: app/api/stocks/public/route.ts - NEW PUBLIC ENDPOINT
// ============================================================
// This endpoint is for regular users/public to see available stock counts
// NO redeem codes, NO admin auth required

import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';

/**
 * GET /api/stocks/public
 * 
 * Public endpoint - Anyone can access
 * Returns ONLY available stock counts (for product pages)
 * NO redeem codes exposed
 * NO admin authentication required
 */
export async function GET(request: NextRequest) {
  try {
    console.log('✅ Public user accessing available stocks');

    const stocks = await StockService.getAllStocksWithProductInfo();

    // ✅ SECURITY: Strip redeem codes for public access
    const publicStocks = stocks
      .filter((s) => s.status === 'available') // Only show available
      .map((stock) => {
        const { redeemCode, ...safeStock } = stock;
        return safeStock;
      });

    console.log(
      `📊 Returning ${publicStocks.length} public available stocks (no codes)`
    );

    return NextResponse.json({ success: true, data: publicStocks });
  } catch (error) {
    console.error('❌ Error fetching public stocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
