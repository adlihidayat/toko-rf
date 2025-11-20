// /api/payment/confirm/route.ts
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

    // ============ STEP 1: Create OrderGroup with final Midtrans Order ID ============
    const orderGroup = await OrderGroupService.createOrderGroup(
      userId,
      productId,
      tempStockIds,
      quantity,
      totalPaid,
      tempMidtransOrderId // Use the temp ID
    );

    const orderGroupId = orderGroup._id!.toString();
    const finalMidtransOrderId = orderGroupId; // Use MongoDB ID as final

    console.log('✅ OrderGroup created:', orderGroupId);

    // ============ STEP 2: Update with final Midtrans Order ID ============
    await OrderGroupService.updateMidtransOrderId(
      orderGroupId,
      finalMidtransOrderId
    );

    console.log('📝 Updated to final Midtrans Order ID:', finalMidtransOrderId);

    // ============ STEP 3: Update payment status ============
    if (paymentStatus === 'completed') {
      console.log('💳 Completing payment for order group:', orderGroupId);

      const updatedOrderGroup = await OrderGroupService.completePayment(
        orderGroupId,
        midtransTransactionId || `auto-${Date.now()}`
      );

      console.log('✅ Payment completed');

      return NextResponse.json({
        success: true,
        data: updatedOrderGroup,
        message: 'Order created and payment completed',
        paymentStatus: 'completed',
      });
    } else if (paymentStatus === 'pending') {
      console.log('⏳ Payment pending for order group:', orderGroupId);

      const pendingOrderGroup = await OrderGroupService.updatePaymentStatus(
        orderGroupId,
        'pending'
      );

      console.log('✅ Order created with pending status');

      return NextResponse.json({
        success: true,
        data: pendingOrderGroup,
        message: 'Order created - payment pending',
        paymentStatus: 'pending',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment status' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
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
