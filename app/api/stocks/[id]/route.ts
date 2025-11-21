import { StockService } from '@/lib/db/services/stocks';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/utils/admin-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn(`🚫 Non-admin attempted to access stock ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log(`✅ Admin accessing stock ${id}`);

    const stock = await StockService.getStockById(id);

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    // ✅ Return full stock data including redeem code to admin
    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    console.error('❌ Error fetching stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn(`🚫 Non-admin attempted to update stock ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // ============ SECURITY: Prevent updating redeem codes ============
    if (body.redeemCode) {
      console.warn(`🚫 Admin attempted to update redeem code for stock ${id}`);
      return NextResponse.json(
        { success: false, error: 'Cannot update redeem code' },
        { status: 403 }
      );
    }

    console.log(`✅ Admin updating stock ${id}`);

    const stock = await StockService.updateStock(id, body);

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    // ✅ Return full stock data to admin
    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    console.error('❌ Error updating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn(`🚫 Non-admin attempted to delete stock ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log(`✅ Admin deleting stock ${id}`);

    const deleted = await StockService.deleteStock(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Stock deleted' });
  } catch (error) {
    console.error('❌ Error deleting stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete stock' },
      { status: 500 }
    );
  }
}