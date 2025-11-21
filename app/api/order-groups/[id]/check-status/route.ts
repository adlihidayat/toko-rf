// app/api/order-groups/[id]/check-status/route.ts - NEW ENDPOINT
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';

/**
 * Check and auto-update payment status for a pending order
 * 
 * Call this from "Refresh" button or automatically on history page load
 * 
 * It will:
 * 1. Get the current order status
 * 2. Query Midtrans for actual payment status
 * 3. Auto-update local DB if status changed
 * 4. Return the current status
 * 
 * Endpoint: POST /api/order-groups/{id}/check-status
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ============ SECURITY: Get user from auth header ============
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking payment status for order:', id);

    // Get order group
    const orderGroup = await OrderGroupService.getById(id);

    if (!orderGroup) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // ============ SECURITY: Verify user ownership ============
    if (orderGroup.userId.toString() !== userId) {
      console.warn(`🚫 Unauthorized status check: ${userId} -> ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('📍 Found order group');
    console.log('   Current status:', orderGroup.paymentStatus);
    console.log('   Midtrans ID:', orderGroup.midtransOrderId);

    // If already completed or failed, just return it
    if (orderGroup.paymentStatus === 'completed') {
      console.log('✅ Order already completed');
      return NextResponse.json({
        success: true,
        data: orderGroup,
        message: 'Payment already completed',
        paymentStatus: 'completed',
        statusChanged: false,
      });
    }

    if (orderGroup.paymentStatus === 'failed') {
      console.log('❌ Order already failed');
      return NextResponse.json({
        success: true,
        data: orderGroup,
        message: 'Payment failed',
        paymentStatus: 'failed',
        statusChanged: false,
      });
    }

    // ============ ORDER IS PENDING - CHECK WITH MIDTRANS ============
    if (!orderGroup.midtransOrderId) {
      return NextResponse.json(
        { success: false, error: 'No Midtrans transaction ID found' },
        { status: 400 }
      );
    }

    try {
      console.log('🔄 Syncing with Midtrans gateway...');

      // Sync with gateway to get current status
      const updatedOrderGroup = await OrderGroupService.syncOrderStatusWithGateway(id);

      if (!updatedOrderGroup) {
        console.error('❌ Failed to sync order');
        return NextResponse.json(
          { success: false, error: 'Failed to sync order status' },
          { status: 500 }
        );
      }

      const statusChanged = updatedOrderGroup.paymentStatus !== orderGroup.paymentStatus;

      console.log('✅ Sync complete:', {
        oldStatus: orderGroup.paymentStatus,
        newStatus: updatedOrderGroup.paymentStatus,
        statusChanged,
      });

      // Return updated order with status change indicator
      return NextResponse.json({
        success: true,
        data: updatedOrderGroup,
        message: statusChanged
          ? `Status updated from ${orderGroup.paymentStatus} to ${updatedOrderGroup.paymentStatus}`
          : `Status unchanged: ${updatedOrderGroup.paymentStatus}`,
        paymentStatus: updatedOrderGroup.paymentStatus,
        statusChanged,
        wasUpdated: statusChanged,
      });

    } catch (syncError) {
      console.error('❌ Error syncing with Midtrans:', syncError);

      // Return local status if sync fails
      return NextResponse.json({
        success: true,
        data: orderGroup,
        message: 'Could not verify with Midtrans - using cached status',
        paymentStatus: orderGroup.paymentStatus,
        statusChanged: false,
        warning: 'Network error - showing last known status',
      }, { status: 200 });
    }

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}