// app/api/order-groups/[id]/route.ts - COMPLETE WITH SECURITY
import { OrderGroupService } from '@/lib/db/services/order-group';
import { StockService } from '@/lib/db/services/stocks';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    console.log('📍 Fetching order group:', id);

    const orderGroup = await OrderGroupService.getById(id);

    if (!orderGroup) {
      console.error('❌ Order group not found:', id);
      return NextResponse.json(
        { success: false, error: 'Order group not found' },
        { status: 404 }
      );
    }

    // ============ SECURITY: Verify user ownership ============
    if (orderGroup.userId.toString() !== userId) {
      console.warn(`🚫 Unauthorized order access: ${userId} -> ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: orderGroup });
  } catch (error) {
    console.error('❌ Error fetching order group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    console.log('📝 Updating order group:', id, 'with body:', body);

    // ============ HANDLE PAYMENT STATUS UPDATE ============
    if (body.paymentStatus !== undefined) {
      const newStatus = body.paymentStatus;
      console.log(`🔄 Updating payment status to: ${newStatus}`);

      // Get order group first
      const orderGroup = await OrderGroupService.getById(id);

      if (!orderGroup) {
        console.error('❌ Order group not found:', id);
        return NextResponse.json(
          { success: false, error: 'Order group not found' },
          { status: 404 }
        );
      }

      // Handle status transitions
      if (newStatus === 'completed') {
        console.log('💳 Completing payment for order group:', id);

        // Mark all stocks as PAID
        if (orderGroup.stockIds && orderGroup.stockIds.length > 0) {
          await StockService.markStockAsPaid(orderGroup.stockIds[0], id);
          console.log('✅ Stocks marked as paid');
        }

        // Update order group status
        const updatedOrderGroup = await OrderGroupService.completePayment(
          id,
          body.midtransTransactionId || `manual-${Date.now()}`
        );

        if (!updatedOrderGroup) {
          throw new Error('Failed to update order group');
        }

        console.log('✅ Payment completed successfully');
        return NextResponse.json({ success: true, data: updatedOrderGroup });
      }

      if (newStatus === 'cancelled') {
        console.log('❌ Cancelling order group:', id);

        // Release all stocks back to available
        if (orderGroup.stockIds && orderGroup.stockIds.length > 0) {
          for (const stockId of orderGroup.stockIds) {
            await StockService.markStockAsAvailable(stockId);
          }
          console.log('✅ All stocks released to available');
        }

        // Update order group status
        const updatedOrderGroup = await OrderGroupService.failPayment(id);

        if (!updatedOrderGroup) {
          throw new Error('Failed to update order group');
        }

        console.log('✅ Order group cancelled successfully');
        return NextResponse.json({ success: true, data: updatedOrderGroup });
      }

      if (newStatus === 'pending' || newStatus === 'failed') {
        // Generic status update
        const updatedOrderGroup = await OrderGroupService.updatePaymentStatus(
          id,
          newStatus
        );

        if (!updatedOrderGroup) {
          throw new Error('Failed to update order group');
        }

        console.log(`✅ Order group status updated to: ${newStatus}`);
        return NextResponse.json({ success: true, data: updatedOrderGroup });
      }
    }

    // ============ HANDLE RATING UPDATE ============
    if (body.rating !== undefined) {
      console.log('⭐ Updating rating for order group:', id);

      const orderGroup = await OrderGroupService.updateRating(id, body.rating);

      if (!orderGroup) {
        return NextResponse.json(
          { success: false, error: 'Order group not found' },
          { status: 404 }
        );
      }

      console.log('✅ Rating updated successfully');
      return NextResponse.json({ success: true, data: orderGroup });
    }

    // No valid fields to update
    console.error('❌ Invalid request body:', body);
    return NextResponse.json(
      { success: false, error: 'Invalid request body - provide paymentStatus or rating' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error updating order group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order group', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}