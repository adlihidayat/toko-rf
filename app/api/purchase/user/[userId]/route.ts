// app/api/purchase/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/services/purchases';

export async function GET_PURCHASES(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    console.log('🔍 Fetching purchases for userId:', userId);

    const purchases = await PurchaseService.getUserPurchases(userId);

    console.log('📦 Purchases found:', purchases.length);

    // ============ SECURITY: Only show redeem codes for completed purchases ============
    const securePurchases = purchases.map(purchase => {
      if (purchase.paymentStatus === 'completed') {
        return purchase; // Include redeemCode for completed
      }

      // For non-completed, show status message but NOT the actual code
      return {
        ...purchase,
        redeemCode:
          purchase.paymentStatus === 'pending'
            ? 'Awaiting Payment'
            : 'Payment Failed',
      };
    });

    const stats = await PurchaseService.getUserStats(userId);

    console.log('📊 Stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: {
        purchases: securePurchases,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching user purchases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user purchases',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}