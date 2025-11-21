// app/api/purchase/route.ts
// GET completed orders from OrderGroup collection (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { verifyAdminAccess } from '@/lib/utils/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn('🚫 Non-admin attempted to access purchase history');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Admin accessing purchase history from OrderGroup');

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const skip = parseInt(request.nextUrl.searchParams.get('skip') || '0');

    const allOrderGroups = await OrderGroupService.getAllOrderGroups(limit, skip);

    console.log(`📊 Retrieved ${allOrderGroups.length} order groups from database`);

    // ============ FILTER: Only return completed orders ============
    const completedOrders = allOrderGroups.filter(
      (og) => og.paymentStatus === 'completed'
    );

    console.log(
      `✅ Filtered to ${completedOrders.length} completed orders for admin`
    );

    // ============ TRANSFORM: Map to PurchaseWithDetails format ============
    const purchaseData = completedOrders.map((og) => {
      const firstRedeemCode = og.redeemCodes?.[0] || 'N/A';

      return {
        _id: og._id,
        userId: og.userId,
        productId: og.productId,
        productName: og.productName,
        productPrice: og.productPrice,
        userName: og.userName,
        quantity: og.quantity, // ✅ How many stock items were purchased
        totalPaid: og.totalPaid,
        paymentStatus: og.paymentStatus,
        rating: og.rating ?? null,
        createdAt: og.createdAt,
        paidAt: og.paidAt,
        redeemCode: firstRedeemCode,
      };
    });

    console.log(`📋 Returning ${purchaseData.length} purchases to admin`);

    return NextResponse.json({
      success: true,
      data: purchaseData,
      total: purchaseData.length,
    });
  } catch (error) {
    console.error('❌ Error fetching purchase history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch purchase history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}