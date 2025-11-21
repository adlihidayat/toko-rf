// app/api/order-groups/[id]/redeem-codes/route.ts
import { OrderGroupService } from '@/lib/db/services/order-group';
import { StockService } from '@/lib/db/services/stocks';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SECURE ENDPOINT: GET /api/order-groups/[id]/redeem-codes
 * 
 * ✅ Only accessible by order owner
 * ✅ Only returns codes if payment is COMPLETED
 * ✅ Never exposed in list views
 * ✅ Fetched on-demand when user expands order
 * 
 * Usage:
 * - Frontend: User clicks expand on completed order
 * - Only then does it call this endpoint
 * - Code is revealed only to the user who paid
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ============ SECURITY CHECK 1: Authentication ============
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`🔐 Redeem code request from user: ${userId} for order: ${id}`);

    // ============ SECURITY CHECK 2: Order exists ============
    const orderGroup = await OrderGroupService.getById(id);

    if (!orderGroup) {
      // Don't leak that order exists
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    // ============ SECURITY CHECK 3: User ownership ============
    if (orderGroup.userId.toString() !== userId) {
      console.warn(
        `🚫 UNAUTHORIZED ACCESS ATTEMPT: User ${userId} tried to access order ${id} (owner: ${orderGroup.userId})`
      );

      // Don't reveal that order exists
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    console.log(`✅ User ownership verified for order ${id}`);

    // ============ SECURITY CHECK 4: Payment completed ============
    if (orderGroup.paymentStatus !== 'completed') {
      console.warn(
        `🚫 INVALID STATUS ACCESS: User ${userId} tried to access codes for ${orderGroup.paymentStatus} order ${id}`
      );

      // Return 402 Payment Required to indicate payment is needed
      return NextResponse.json(
        {
          success: false,
          error: `Payment not completed. Current status: ${orderGroup.paymentStatus}`
        },
        { status: 402 } // 402 = Payment Required
      );
    }

    console.log(`✅ Payment verified as completed`);

    // ============ SAFE TO RETURN: Get redeem codes ============
    const stocks = await StockService.getOrderGroupStocks(id);
    const paidStocks = stocks.filter((s: any) => s.status === 'paid');
    const redeemCodes = paidStocks.map((s: any) => s.redeemCode);

    console.log(`✅ SECURE DELIVERY: Provided ${redeemCodes.length} redeem codes to user ${userId}`);

    // Log for audit
    console.log(`📋 AUDIT: User ${userId} accessed ${redeemCodes.length} codes from order ${id}`);

    return NextResponse.json({
      success: true,
      data: {
        orderGroupId: id,
        redeemCodes,
        count: redeemCodes.length,
        accessedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error fetching redeem codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch redeem codes',
      },
      { status: 500 }
    );
  }
}