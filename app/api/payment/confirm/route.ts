// app/api/payment/confirm/route.ts - FIXED STOCK HANDLING
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { StockService } from '@/lib/db/services/stocks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tempMidtransOrderId,
      tempStockIds,
      productId,
      quantity,
      totalPaid,
      userId,
      midtransTransactionId,
      paymentStatus, // 'pending' or 'completed'
    } = body;

    console.log('✅ Payment confirmed - creating OrderGroup:', {
      paymentStatus,
      midtransOrderId: tempMidtransOrderId,
      stockCount: tempStockIds.length,
    });

    // ============ STEP 1: Create OrderGroup ============
    const orderGroup = await OrderGroupService.createOrderGroup(
      userId,
      productId,
      tempStockIds,
      quantity,
      totalPaid,
      tempMidtransOrderId
    );

    const orderGroupId = orderGroup._id!.toString();
    const finalMidtransOrderId = orderGroupId;

    console.log('✅ OrderGroup created:', orderGroupId);

    // ============ STEP 2: Update with final Midtrans Order ID ============
    await OrderGroupService.updateMidtransOrderId(
      orderGroupId,
      finalMidtransOrderId
    );

    console.log('📝 Updated to final Midtrans Order ID:', finalMidtransOrderId);

    // ============ STEP 3: Handle stock status based on payment status ============
    if (paymentStatus === 'completed') {
      console.log('💳 Payment completed - marking stocks as PAID:', orderGroupId);

      // Mark all stocks as PAID (payment confirmed)
      for (const stockId of tempStockIds) {
        await StockService.markStockAsPaid(stockId, orderGroupId);
      }

      const updatedOrderGroup = await OrderGroupService.completePayment(
        orderGroupId,
        midtransTransactionId || `auto-${Date.now()}`
      );

      console.log('✅ Payment completed and stocks marked as paid');

      return NextResponse.json({
        success: true,
        data: updatedOrderGroup,
        message: 'Order created and payment completed',
        paymentStatus: 'completed',
      });
    }
    else if (paymentStatus === 'pending') {
      console.log('⏳ Payment pending - stocks already reserved via OrderGroup:', orderGroupId);

      // NOTE: Stocks are ALREADY marked as 'pending' in OrderGroupService.createOrderGroup
      // via the Stock.updateMany call. They are linked to this orderGroupId.
      // Do NOT release them here - they should stay pending until payment completes or fails

      const pendingOrderGroup = await OrderGroupService.updatePaymentStatus(
        orderGroupId,
        'pending'
      );

      console.log('✅ Order created with pending status');

      return NextResponse.json({
        success: true,
        data: pendingOrderGroup,
        message: 'Order created - payment pending. Stocks reserved.',
        paymentStatus: 'pending',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment status' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error confirming payment:', error);

    // ============ ROLLBACK: Release stocks on error ============
    try {
      const body = await request.json();
      if (body.tempStockIds && body.tempStockIds.length > 0) {
        console.log('🔄 Rolling back - releasing stocks...');
        for (const stockId of body.tempStockIds) {
          try {
            await StockService.markStockAsAvailable(stockId);
          } catch (releaseError) {
            console.error('Stock release error:', releaseError);
          }
        }
        console.log('✅ Stocks released');
      }
    } catch (parseError) {
      console.error('Error parsing request body for rollback:', parseError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}