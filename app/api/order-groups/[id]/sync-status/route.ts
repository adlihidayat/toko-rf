// app/api/order-groups/[id]/sync-status/route.ts - NEW ENDPOINT
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';

/**
 * Sync a single order's status with Midtrans gateway
 * 
 * Endpoint: POST /api/order-groups/{id}/sync-status
 * 
 * Returns:
 * - 200: Order synced successfully
 * - 404: Order not found
 * - 500: Error syncing
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    console.log('🔄 Syncing individual order status:', id);

    // Sync order with gateway
    const updatedOrder = await OrderGroupService.syncOrderStatusWithGateway(id);

    if (!updatedOrder) {
      console.error('❌ Order not found or could not be synced:', id);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order synced successfully:', {
      orderId: id,
      status: updatedOrder.paymentStatus,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Order synced - Status: ${updatedOrder.paymentStatus}`,
    });
  } catch (error) {
    console.error('❌ Error syncing order status:', error);

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