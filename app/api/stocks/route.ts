import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';
import { verifyAdminAccess } from '@/lib/utils/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn('🚫 Non-admin attempted to access admin stocks endpoint');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    console.log('✅ Admin accessing full stocks list - INCLUDING REDEEM CODES');

    const stocks = await StockService.getAllStocksWithProductInfo();

    // ✅ ADMIN GETS FULL DATA - Including redeem codes for management
    console.log(`📊 Returning ${stocks.length} stocks with redeem codes to admin`);

    return NextResponse.json({ success: true, data: stocks });
  } catch (error) {
    console.error('❌ Error fetching stocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn('🚫 Non-admin attempted to create stock');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.productId || !body.redeemCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: productId, redeemCode' },
        { status: 400 }
      );
    }

    console.log('✅ Admin creating stock');

    const stock = await StockService.createStock(body);

    // ✅ Return full stock data to admin
    return NextResponse.json({ success: true, data: stock }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stock' },
      { status: 500 }
    );
  }
}