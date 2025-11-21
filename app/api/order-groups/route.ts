import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { verifyAdminAccess } from '@/lib/utils/admin-auth';

/**
 * Get all order groups (by status or all)
 * Admin only endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // ============ SECURITY: Verify admin access ============
    if (!verifyAdminAccess(request)) {
      console.warn('🚫 Non-admin attempted to access order groups');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const status = request.nextUrl.searchParams.get('status') as
      | 'pending'
      | 'completed'
      | 'failed'
      | 'cancelled'
      | null;

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const skip = parseInt(request.nextUrl.searchParams.get('skip') || '0');

    console.log(`✅ Admin accessing order groups (status: ${status || 'all'})`);

    if (status) {
      const count = await OrderGroupService.countByStatus(status);
      console.log(`📊 Found ${count} orders with status: ${status}`);

      return NextResponse.json({
        success: true,
        status,
        count,
        message: `${count} orders with status: ${status}`,
      });
    }

    // Get all order groups
    const orderGroups = await OrderGroupService.getAllOrderGroups(limit, skip);

    return NextResponse.json({
      success: true,
      data: orderGroups,
      total: orderGroups.length,
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