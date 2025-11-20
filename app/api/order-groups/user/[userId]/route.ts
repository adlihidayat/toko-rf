// app/api/order-groups/user/[userId]/route.ts - SECURE VERSION
import { OrderGroupService } from '@/lib/db/services/order-group';
import { StockService } from '@/lib/db/services/stocks';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    console.log('🔍 Fetching order groups for userId:', userId);

    // Get raw order groups from database
    const orderGroups = await OrderGroupService.getUserOrderGroups(userId);

    console.log('📦 Order groups found:', orderGroups.length);

    // ============ SECURITY: Filter out stocks and redeem codes for non-completed orders ============
    const secureOrderGroups = orderGroups.map((og) => {
      // Only include stocks if payment is completed
      if (og.paymentStatus !== 'completed') {
        console.log(`🔒 Hiding stocks for ${og._id} - status: ${og.paymentStatus}`);

        return {
          ...og,
          stocks: [], // ← SECURITY: Don't send stocks for non-completed
          redeemCodes: [], // ← SECURITY: Don't send redeem codes
        };
      }

      // For completed orders, include all paid stocks
      const paidStocks = (og.stocks || []).filter((s) => s.status === 'paid');

      console.log(`✅ Including ${paidStocks.length} paid stocks for ${og._id}`);

      return {
        ...og,
        stocks: paidStocks, // ← Only include paid stocks
        redeemCodes: paidStocks.map((s) => s.redeemCode), // ← Only completed codes
      };
    });

    console.log('📊 Order groups secured');

    // Get stats (only counts completed anyway)
    const stats = await OrderGroupService.getUserStats(userId);

    console.log('📊 Stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: {
        orderGroups: secureOrderGroups,
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