// app/api/payment/notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MidtransService } from '@/lib/midtrans/service';
import { PurchaseService } from '@/lib/db/services/purchases';
import { StockService } from '@/lib/db/services/stocks';
import crypto from 'crypto';

/**
 * Verify Midtrans notification signature for security
 */
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

    // ============ Parse notification status ============
    const { status, orderId, transactionStatus, fraudStatus } =
      MidtransService.parseNotificationStatus(notification);

    console.log(`💳 Payment status for order ${orderId}: ${status}`);

    // Extract purchase IDs from order ID (format: "purchaseId1-purchaseId2-purchaseId3")
    const purchaseIds = orderId.split('-');

    // ============ HANDLE DIFFERENT PAYMENT STATUSES ============
    if (status === 'completed') {
      console.log('✅ Payment successful, marking stocks as PAID...');

      // Update all related purchases and mark their stocks as paid
      const updatePromises = purchaseIds.map(async (purchaseId) => {
        try {
          // Get the purchase to find its stock
          const purchase = await PurchaseService.getPurchaseById(purchaseId);

          if (!purchase) {
            console.error(`❌ Purchase not found: ${purchaseId}`);
            return null;
          }

          // Mark the stock as PAID (redeem code now available)
          if (purchase.stockId) {
            await StockService.markStockAsPaid(purchase.stockId, purchaseId);
            console.log(`✅ Stock marked as PAID: ${purchase.stockId}`);
          }

          // Update purchase status to completed
          const updatedPurchase = await PurchaseService.updatePurchaseStatus(
            purchaseId,
            'completed'
          );

          console.log(`✅ Purchase completed: ${purchaseId}`);
          return updatedPurchase;
        } catch (error) {
          console.error(`❌ Failed to process purchase ${purchaseId}:`, error);
          return null;
        }
      });

      await Promise.all(updatePromises);

      console.log(`✅ All ${purchaseIds.length} purchases marked as completed`);

    } else if (status === 'pending') {
      console.log('⏳ Payment still pending, keeping stocks reserved...');

      // Update purchases to pending status but keep stocks reserved
      const updatePromises = purchaseIds.map(async (purchaseId) => {
        try {
          return await PurchaseService.updatePurchaseStatus(purchaseId, 'pending');
        } catch (error) {
          console.error(`Failed to update purchase ${purchaseId}:`, error);
          return null;
        }
      });

      await Promise.all(updatePromises);

    } else if (status === 'failed' || status === 'cancelled') {
      console.log('❌ Payment failed/cancelled, releasing reserved stocks...');

      // Release all reserved stocks and mark purchases as failed
      const updatePromises = purchaseIds.map(async (purchaseId) => {
        try {
          // Get purchase to find stock
          const purchase = await PurchaseService.getPurchaseById(purchaseId);

          if (!purchase) {
            console.error(`Purchase not found: ${purchaseId}`);
            return null;
          }

          // Release the stock back to available
          if (purchase.stockId) {
            await StockService.markStockAsAvailable(purchase.stockId);
            console.log(`✅ Stock released to available: ${purchase.stockId}`);
          }

          // Mark purchase as failed
          return await PurchaseService.updatePurchaseStatus(purchaseId, 'failed');
        } catch (error) {
          console.error(`Failed to release stock for purchase ${purchaseId}:`, error);
          return null;
        }
      });

      await Promise.all(updatePromises);

      console.log(`✅ All ${purchaseIds.length} purchases marked as failed, stocks released`);
    }

    // ============ LOG TRANSACTION ============
    console.log('📊 Transaction summary:', {
      orderId,
      status,
      transactionStatus,
      fraudStatus,
      purchasesCount: purchaseIds.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
    });

  } catch (error: any) {
    console.error('❌ Notification processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process notification' },
      { status: 500 }
    );
  }
}