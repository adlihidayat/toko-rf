// app/api/cron/sync-order-status/route.ts - NEW CRON JOB ENDPOINT
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';

/**
 * Cron job to sync all pending orders with Midtrans gateway
 * 
 * Set up in Vercel:
 * 1. Go to your project settings
 * 2. Click "Cron Jobs"
 * 3. Add new cron job:
 *    - URL: https://yourdomain.com/api/cron/sync-order-status
 *    - Frequency: "Every 5 minutes" (or as needed)
 *    - Auth token: Add the CRON_SECRET from .env.local
 * 
 * Or test locally with:
 * curl http://localhost:3000/api/cron/sync-order-status \
 *   -H "Authorization: Bearer your_cron_secret"
 */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn('⚠️ CRON_SECRET not set - allowing request (set it for production)');
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron secret');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('⏰ Starting automatic order status sync...');

    // Sync all pending orders with gateway
    const result = await OrderGroupService.syncAllPendingOrders();

    console.log('✅ Cron job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Order status sync completed',
      result,
    });
  } catch (error) {
    console.error('❌ Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync order status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Also support GET requests for browser-based testing
 */
export async function GET(request: NextRequest) {
  try {
    // Check if called with test parameter
    const { searchParams } = new URL(request.url);
    const test = searchParams.get('test');

    if (test === '1') {
      console.log('📝 Test mode - would sync orders');

      // In test mode, just return what would happen
      return NextResponse.json({
        success: true,
        message: 'Test mode - no actual sync performed',
        note: 'Use POST request to perform actual sync',
      });
    }

    // Normal GET redirects to POST info
    return NextResponse.json({
      success: false,
      message: 'Use POST request to trigger sync',
      example: 'POST /api/cron/sync-order-status',
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}