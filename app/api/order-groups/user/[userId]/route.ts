// ============================================================
// FILE 3: app/api/order-groups/user/[userId]/route.ts
// ============================================================
// COMPLETE REPLACEMENT

import { OrderGroupService } from '@/lib/db/services/order-group';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: paramUserId } = await context.params;

    // ============ SECURITY: Verify user is requesting their own data ============
    const authUserId = request.headers.get('x-user-id');
    if (!authUserId || authUserId !== paramUserId) {
      console.warn(`🚫 Unauthorized order list access: ${authUserId} -> ${paramUserId}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('🔍 Fetching order groups for userId:', paramUserId);

    const orderGroups = await OrderGroupService.getUserOrderGroups(paramUserId);

    // ============ SECURITY: Strip redeem codes and stocks from all orders ============
    // Only return safe fields - redeem codes must be fetched from /redeem-codes endpoint
    const safeOrderGroups = orderGroups.map((og) => ({
      _id: og._id,
      userId: og.userId,
      productId: og.productId,
      productName: og.productName,
      productPrice: og.productPrice,
      quantity: og.quantity,
      totalPaid: og.totalPaid,
      paymentStatus: og.paymentStatus,
      rating: og.rating || null,
      createdAt: og.createdAt,
      reservedAt: og.reservedAt,
      paidAt: og.paidAt,
      expiresAt: og.expiresAt,
      // Explicitly NOT including: redeemCodes, stocks
    }));

    const stats = await OrderGroupService.getUserStats(paramUserId);

    console.log(`📊 Returning ${safeOrderGroups.length} orders for user ${paramUserId}`);

    return NextResponse.json({
      success: true,
      data: {
        orderGroups: safeOrderGroups,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching order groups:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order groups',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
