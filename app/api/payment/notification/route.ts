// app/api/payment/notification/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { MidtransService } from '@/lib/midtrans/service';
// import { OrderGroupService } from '@/lib/db/services/order-groups';
import { StockService } from '@/lib/db/services/stocks';
import crypto from 'crypto';
import { OrderGroupService } from '@/lib/db/services/order-group';

function verifySignature(notification: any, serverKey: string): boolean {
  const { order_id, status_code, gross_amount, signature_key } = notification;

  const hash = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  return hash === signature_key;
}

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();

    console.log('📢 Received Midtrans notification:', {
      orderId: notification.order_id,
      status: notification.transaction_status,
      fraudStatus: notification.fraud_status,
      timestamp: new Date().toISOString(),
    });

    // ============ SECURITY: Verify signature ============
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    if (!verifySignature(notification, serverKey)) {
      console.error('🚨 Invalid notification signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // ============ Parse notification ============
    const { status } = MidtransService.parseNotificationStatus(notification);
    const midtransOrderId = notification.order_id;
    const midtransTransactionId = notification.transaction_id;

    console.log(`💳 Payment status for order ${midtransOrderId}: ${status}`);

    // ============ Get OrderGroup by Midtrans Order ID ============
    const orderGroup = await OrderGroupService.getByMidtransOrderId(
      midtransOrderId
    );

    if (!orderGroup) {
      console.error(`❌ OrderGroup not found for order ID: ${midtransOrderId}`);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('📍 Found OrderGroup:', orderGroup._id);

    // ============ HANDLE DIFFERENT PAYMENT STATUSES ============
    if (status === 'completed') {
      console.log('✅ Payment successful for OrderGroup:', orderGroup._id);

      // Mark all stocks as PAID
      const updatedOrderGroup =
        await OrderGroupService.completePayment(
          orderGroup._id!.toString(),
          midtransTransactionId
        );

      if (!updatedOrderGroup) {
        throw new Error('Failed to update OrderGroup');
      }

      console.log('✅ OrderGroup and stocks marked as completed');
    } else if (status === 'pending') {
      console.log(
        '⏳ Payment pending for OrderGroup:',
        orderGroup._id,
        '- keeping stocks reserved'
      );
      // Stocks already marked as 'pending' during order creation
      // Just ensure the order group status is pending
      await OrderGroupService.updatePaymentStatus(
        orderGroup._id!.toString(),
        'pending'
      );
    } else if (status === 'failed' || status === 'cancelled') {
      console.log(
        '❌ Payment failed/cancelled for OrderGroup:',
        orderGroup._id,
        '- releasing stocks'
      );

      // Release all stocks back to available
      const failedOrderGroup = await OrderGroupService.failPayment(
        orderGroup._id!.toString()
      );

      if (!failedOrderGroup) {
        throw new Error('Failed to update OrderGroup');
      }

      console.log('✅ OrderGroup marked as failed, all stocks released');
    }

    console.log('📊 Notification processed successfully');

    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
      orderGroupId: orderGroup._id,
    });
  } catch (error: any) {
    console.error('❌ Notification processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process notification',
      },
      { status: 500 }
    );
  }
}