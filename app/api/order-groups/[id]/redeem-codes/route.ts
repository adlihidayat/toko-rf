
// ============================================================
// FILE 1: app/api/order-groups/[id]/redeem-codes/route.ts
// ============================================================
// NEW FILE - Create this file

import { OrderGroupService } from '@/lib/db/services/order-group';
import { StockService } from '@/lib/db/services/stocks';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/order-groups/[id]/redeem-codes
 * 
 * Secure endpoint to get redeem codes ONLY for completed payments
 * Requires: x-user-id header matching order owner
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ============ SECURITY: Get user from auth header ============
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderGroup = await OrderGroupService.getById(id);

    if (!orderGroup) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // ============ SECURITY: Verify user ownership ============
    if (orderGroup.userId.toString() !== userId) {
      console.warn(`🚫 Unauthorized redeem code access: ${userId} -> ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ============ SECURITY: Verify payment is completed ============
    if (orderGroup.paymentStatus !== 'completed') {
      console.warn(`🚫 Attempt to access redeem codes for ${orderGroup.paymentStatus} order: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 402 }
      );
    }

    // Get only paid stocks with redeem codes
    const stocks = await StockService.getOrderGroupStocks(id);
    const paidStocks = stocks.filter((s) => s.status === 'paid');
    const redeemCodes = paidStocks.map((s) => s.redeemCode);

    console.log(`✅ Provided ${redeemCodes.length} redeem codes for order ${id} to user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        orderGroupId: id,
        redeemCodes,
        count: redeemCodes.length,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching redeem codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch redeem codes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}