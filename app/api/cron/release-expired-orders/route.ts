// app/api/cron/release-expired-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';

/**
 * Cron job to auto-release expired pending orders
 * 
 * Runs every 5 minutes
 * - Checks all pending orders
 * - If expiresAt < now, marks as failed and releases stocks
 * - Stocks go back to 'available' automatically via OrderGroupService.failPayment()
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Vercel cron signature
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn('⚠️ CRON_SECRET not set - allowing request');
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron authorization');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('⏰ [CRON] Starting expired order cleanup...');

    const releasedCount = await OrderGroupService.releaseExpiredOrders();

    console.log(`✅ [CRON] Released ${releasedCount} expired orders`);

    return NextResponse.json({
      success: true,
      message: `Auto-released ${releasedCount} expired orders`,
      releasedCount,
    });
  } catch (error) {
    console.error('❌ [CRON] Error releasing expired orders:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to release expired orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}