// app/api/payment/resume/route.ts - UPDATED TO REUSE EXISTING TRANSACTION
import { OrderGroupService } from '@/lib/db/services/order-group';
import { MidtransService } from '@/lib/midtrans/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderGroupId, userId } = await request.json();

    if (!orderGroupId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderGroupId or userId' },
        { status: 400 }
      );
    }

    console.log('🔄 Attempting to resume payment for order group:', orderGroupId);

    // ============ GET EXISTING ORDER GROUP ============
    const orderGroup = await OrderGroupService.getById(orderGroupId);

    if (!orderGroup) {
      console.error('❌ Order group not found:', orderGroupId);
      return NextResponse.json(
        { success: false, error: 'Order group not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order group found');
    console.log('   Status:', orderGroup.paymentStatus);
    console.log('   Midtrans Order ID:', orderGroup.midtransOrderId);

    // ============ VALIDATE ORDER STATUS ============
    if (orderGroup.paymentStatus !== 'pending') {
      console.error(
        `❌ Cannot resume payment for ${orderGroup.paymentStatus} order`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Cannot resume payment for ${orderGroup.paymentStatus} orders`,
        },
        { status: 400 }
      );
    }

    // ============ VALIDATE USER OWNERSHIP ============
    if (orderGroup.userId !== userId) {
      console.error('❌ User is not the owner of this order');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ============ CHECK IF MIDTRANS ORDER ID EXISTS ============
    if (!orderGroup.midtransOrderId) {
      console.error('❌ No Midtrans order ID found for this order group');
      return NextResponse.json(
        { success: false, error: 'Invalid order - missing Midtrans transaction' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking transaction status with Midtrans...');

    try {
      // ============ QUERY MIDTRANS FOR EXISTING TRANSACTION STATUS ============
      const transactionStatus = await MidtransService.getTransactionStatus(
        orderGroup.midtransOrderId
      );

      console.log('📊 Transaction status from Midtrans:', {
        transaction_status: transactionStatus.transaction_status,
        fraud_status: transactionStatus.fraud_status,
        status_code: transactionStatus.status_code,
      });

      // ============ PARSE TRANSACTION STATUS ============
      const { status } = MidtransService.parseNotificationStatus(transactionStatus);

      // If already completed on Midtrans, update our DB
      if (status === 'completed') {
        console.log('✅ Midtrans shows payment already completed');

        const updated = await OrderGroupService.completePayment(
          orderGroupId,
          transactionStatus.transaction_id
        );

        return NextResponse.json({
          success: true,
          data: {
            token: 'already_completed',
            amount: orderGroup.totalPaid,
            status: 'completed',
            message: 'Payment already completed on Midtrans',
          },
        });
      }

      // If failed or expired, return error
      if (status === 'failed' || status === 'cancelled') {
        console.log('❌ Transaction is in failed state on Midtrans');

        // Update to failed
        await OrderGroupService.failPayment(orderGroupId);

        return NextResponse.json(
          {
            success: false,
            error: 'Payment was not completed. Please try a new transaction.',
            status: 'failed',
          },
          { status: 400 }
        );
      }

      // ============ IF STILL PENDING, GET EXISTING SNAP TOKEN ============
      console.log('⏳ Transaction still pending - retrieving existing Snap token');

      // Get a fresh Snap token for the SAME transaction
      const snapResponse = await MidtransService.getSnapToken(
        orderGroup.midtransOrderId
      );

      console.log('✅ Snap token retrieved successfully');
      console.log('   Token preview:', snapResponse.token.substring(0, 20) + '...');

      return NextResponse.json({
        success: true,
        data: {
          token: snapResponse.token,
          amount: orderGroup.totalPaid,
          orderGroupId,
          message: 'Use the same payment link - no charges duplicated',
        },
      });

    } catch (midtransError) {
      console.error('❌ Error querying Midtrans:', midtransError);

      // If Midtrans is unreachable, create a NEW transaction as fallback
      console.log('⚠️ Fallback: Creating new transaction since Midtrans query failed');

      try {
        // Create completely NEW order group with new Midtrans ID
        const newMidtransOrderId = `${orderGroupId}-retry-${Date.now()}`;

        console.log('🔄 Creating new OrderGroup with new Midtrans ID:', newMidtransOrderId);

        // Create new snap token
        const newSnapResponse = await MidtransService.createTransaction(
          newMidtransOrderId,
          orderGroup.totalPaid,
          {
            first_name: 'User',
            email: 'user@example.com',
            phone: '0',
          }
        );

        // Update the original order group with new Midtrans ID
        await OrderGroupService.updateMidtransOrderId(
          orderGroupId,
          newMidtransOrderId
        );

        console.log('✅ New transaction created as fallback');

        return NextResponse.json({
          success: true,
          data: {
            token: newSnapResponse.token,
            amount: orderGroup.totalPaid,
            orderGroupId,
            isNewTransaction: true,
            message: 'New payment transaction created (Midtrans connection issue)',
          },
        });

      } catch (fallbackError) {
        console.error('❌ Fallback transaction creation also failed:', fallbackError);

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to retrieve payment gateway. Please try again later.',
            details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          },
          { status: 503 }
        );
      }
    }

  } catch (error) {
    console.error('❌ Payment resume error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resume payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}