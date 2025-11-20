// app/api/order-groups/[id]/verify-payment/route.ts - NEW
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { MidtransService } from '@/lib/midtrans/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    console.log('🔍 Verifying payment status for order group:', id);

    // Get order group
    const orderGroup = await OrderGroupService.getById(id);

    if (!orderGroup) {
      return NextResponse.json(
        { success: false, error: 'Order group not found' },
        { status: 404 }
      );
    }

    console.log('📍 Found order group with Midtrans ID:', orderGroup.midtransOrderId);
    console.log('   Current status:', orderGroup.paymentStatus);

    // Query Midtrans for current transaction status
    if (!orderGroup.midtransOrderId) {
      return NextResponse.json(
        { success: false, error: 'No Midtrans transaction ID found' },
        { status: 400 }
      );
    }

    try {
      // Get status from Midtrans API
      const transactionStatus = await MidtransService.getTransactionStatus(
        orderGroup.midtransOrderId
      );

      console.log('📊 Transaction status from Midtrans:', transactionStatus);

      // Parse the status
      const { status } = MidtransService.parseNotificationStatus(transactionStatus);

      console.log(`💳 Parsed payment status: ${status}`);

      // If Midtrans says payment is complete but our DB says pending, update it
      if (status === 'completed' && orderGroup.paymentStatus === 'pending') {
        console.log('✅ Midtrans confirms payment - updating local status');

        const updatedOrderGroup = await OrderGroupService.completePayment(
          id,
          transactionStatus.transaction_id
        );

        return NextResponse.json({
          success: true,
          data: updatedOrderGroup,
          message: 'Payment confirmed and order updated',
          paymentStatus: 'completed',
        });
      }

      // If payment failed or was cancelled
      if ((status === 'failed' || status === 'cancelled') && orderGroup.paymentStatus === 'pending') {
        console.log('❌ Midtrans shows payment failed - releasing order');

        const failedOrderGroup = await OrderGroupService.failPayment(id);

        return NextResponse.json({
          success: false,
          error: 'Payment was not successful',
          data: failedOrderGroup,
          paymentStatus: 'failed',
        }, { status: 400 });
      }

      // Payment is still pending on Midtrans too
      if (status === 'pending') {
        console.log('⏳ Payment still pending on Midtrans');

        return NextResponse.json({
          success: false,
          error: 'Payment is still pending. Please complete the payment.',
          paymentStatus: 'pending',
        }, { status: 402 }); // 402 = Payment Required
      }

      // Status matches our DB
      console.log(`ℹ️ Payment status matches: ${status}`);

      return NextResponse.json({
        success: true,
        data: orderGroup,
        message: `Payment status: ${status}`,
        paymentStatus: status,
      });

    } catch (midtransError) {
      console.error('❌ Error querying Midtrans:', midtransError);

      // If Midtrans query fails but we have a local status, return it
      if (orderGroup.paymentStatus === 'completed') {
        return NextResponse.json({
          success: true,
          data: orderGroup,
          message: 'Using local cached status (Midtrans query failed)',
          paymentStatus: 'completed',
          warning: 'Could not verify with Midtrans gateway',
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify payment with gateway',
          details: midtransError instanceof Error ? midtransError.message : 'Unknown error',
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}