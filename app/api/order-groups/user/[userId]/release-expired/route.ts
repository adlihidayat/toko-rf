// app/api/order-groups/release-expired/route.ts - NEW (for cron job)
import { OrderGroupService } from '@/lib/db/services/order-group';
import { NextRequest, NextResponse } from 'next/server';
// import { OrderGroupService } from '@/lib/db/services/order-groups';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for Vercel cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('⏰ Running expired order group cleanup...');

    const releasedCount = await OrderGroupService.releaseExpiredOrders();

    console.log(`✅ Released ${releasedCount} expired orders`);

    return NextResponse.json({
      success: true,
      message: `Released ${releasedCount} expired orders`,
      releasedCount,
    });
  } catch (error) {
    console.error('❌ Error releasing expired orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to release expired orders' },
      { status: 500 }
    );
  }
}