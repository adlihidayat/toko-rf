// app/api/payment/confirm/route.ts - COMPLETE VERSION
// Handles: New payments, Resume/Retry payments, and all status changes

import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { StockService } from '@/lib/db/services/stocks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Payment confirmation received:', {
      paymentStatus: body.paymentStatus,
      hasOrderGroupId: !!body.orderGroupId,
      hasTempMidtransOrderId: !!body.tempMidtransOrderId,
    });

    // ============ CASE 1: RESUME/RETRY PAYMENT ============
    // User is resuming a previous payment that's still pending
    if (body.orderGroupId && body.originalOrderGroupId === body.orderGroupId) {
      console.log('🔄 RESUME PAYMENT - Mapping retry back to original order');

      const orderGroupId = body.orderGroupId;
      const midtransTransactionId = body.midtransTransactionId;
      const paymentStatus = body.paymentStatus;

      if (!orderGroupId) {
        return NextResponse.json(
          { success: false, error: 'orderGroupId required for resume' },
          { status: 400 }
        );
      }

      // Get original order
      const originalOrder = await OrderGroupService.getById(orderGroupId);

      if (!originalOrder) {
        return NextResponse.json(
          { success: false, error: 'Original order not found' },
          { status: 404 }
        );
      }

      console.log('✅ Found original order:', {
        orderId: orderGroupId,
        currentStatus: originalOrder.paymentStatus,
      });

      // ============ Handle Resume Payment Status ============
      if (paymentStatus === 'completed') {
        console.log('✅ Resume payment COMPLETED - updating original order');

        // Store transaction ID
        if (midtransTransactionId) {
          await OrderGroupService.updateTransactionId(
            orderGroupId,
            midtransTransactionId
          );
        }

        // Mark stocks as paid
        if (originalOrder.stockIds && originalOrder.stockIds.length > 0) {
          for (const stockId of originalOrder.stockIds) {
            await StockService.markStockAsPaid(stockId.toString(), orderGroupId);
          }
        }

        // Complete the order
        const completedOrder = await OrderGroupService.completePayment(
          orderGroupId,
          midtransTransactionId || `resume-${Date.now()}`
        );

        console.log('✅ Resume payment completed successfully');

        return NextResponse.json({
          success: true,
          data: completedOrder,
          message: 'Resume payment completed successfully',
          paymentStatus: 'completed',
          isResume: true,
        });
      }

      if (paymentStatus === 'pending') {
        console.log('⏳ Resume payment still PENDING');

        // Just update status, stocks stay reserved
        const pendingOrder = await OrderGroupService.updatePaymentStatus(
          orderGroupId,
          'pending'
        );

        return NextResponse.json({
          success: true,
          data: pendingOrder,
          message: 'Resume payment status: pending',
          paymentStatus: 'pending',
          isResume: true,
        });
      }

      if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        console.log('❌ Resume payment FAILED - releasing order');

        // Release stocks
        if (originalOrder.stockIds && originalOrder.stockIds.length > 0) {
          for (const stockId of originalOrder.stockIds) {
            await StockService.markStockAsAvailable(stockId.toString());
          }
        }

        // Mark order as failed
        const failedOrder = await OrderGroupService.failPayment(orderGroupId);

        console.log('✅ Order released after failed resume payment');

        return NextResponse.json(
          {
            success: false,
            error: 'Resume payment failed',
            data: failedOrder,
            paymentStatus: 'failed',
            isResume: true,
          },
          { status: 400 }
        );
      }
    }

    // ============ CASE 2: NEW PAYMENT (Initial checkout) ============
    else {
      console.log('🆕 NEW PAYMENT - Creating new OrderGroup');

      const {
        tempMidtransOrderId,
        tempStockIds,
        productId,
        quantity,
        totalPaid,
        userId,
        midtransTransactionId,
        paymentStatus,
        snapToken,
      } = body;

      // Validate required fields
      if (!tempMidtransOrderId || !tempStockIds || !productId || !quantity || !totalPaid || !userId) {
        console.error('❌ Missing required fields:', {
          tempMidtransOrderId: !!tempMidtransOrderId,
          tempStockIds: !!tempStockIds,
          productId: !!productId,
          quantity: !!quantity,
          totalPaid: !!totalPaid,
          userId: !!userId,
        });

        return NextResponse.json(
          { success: false, error: 'Missing required fields for new payment' },
          { status: 400 }
        );
      }

      console.log('✅ Creating OrderGroup with:', {
        midtransOrderId: tempMidtransOrderId,
        stockCount: tempStockIds.length,
        totalPaid,
        paymentStatus,
        hasSnapToken: !!snapToken,
      });

      // ============ STEP 1: Create OrderGroup with snapToken ============
      const orderGroup = await OrderGroupService.createOrderGroup(
        userId,
        productId,
        tempStockIds,
        quantity,
        totalPaid,
        tempMidtransOrderId,
        snapToken // ✅ PASS THE TOKEN HERE
      );

      const orderGroupId = orderGroup._id!.toString();

      console.log('✅ OrderGroup created:', {
        id: orderGroupId,
        midtransOrderId: tempMidtransOrderId,
        hasSnapToken: !!snapToken,
      });

      // ============ STEP 2: Explicitly save Snap token (redundant but ensures it's saved) ============
      if (snapToken) {
        console.log('💾 Saving Snap token to database...');
        await OrderGroupService.updateSnapToken(orderGroupId, snapToken);
        console.log('✅ Snap token stored in database');
      } else {
        console.warn('⚠️ No snapToken provided in payment confirmation');
      }

      // ============ STEP 3: Store transaction ID ============
      if (midtransTransactionId) {
        console.log('💾 Storing transaction ID:', midtransTransactionId);

        await OrderGroupService.updateTransactionId(
          orderGroupId,
          midtransTransactionId
        );
      }

      // ============ STEP 4: Handle payment status ============
      if (paymentStatus === 'completed') {
        console.log('✅ NEW payment COMPLETED - marking stocks as PAID');

        // Mark all stocks as paid
        for (const stockId of tempStockIds) {
          await StockService.markStockAsPaid(stockId, orderGroupId);
        }

        // Complete the order
        const completedOrder = await OrderGroupService.completePayment(
          orderGroupId,
          midtransTransactionId || `auto-${Date.now()}`
        );

        console.log('✅ New payment completed successfully');

        return NextResponse.json({
          success: true,
          data: completedOrder,
          message: 'Order created and payment completed',
          paymentStatus: 'completed',
          isResume: false,
        });
      }

      if (paymentStatus === 'pending') {
        console.log('⏳ NEW payment PENDING - stocks reserved via OrderGroup');

        const pendingOrder = await OrderGroupService.updatePaymentStatus(
          orderGroupId,
          'pending'
        );

        console.log('✅ Order created with pending status - stocks reserved');

        return NextResponse.json({
          success: true,
          data: pendingOrder,
          message: 'Order created - payment pending. Stocks reserved.',
          paymentStatus: 'pending',
          isResume: false,
        });
      }

      if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        console.log('❌ NEW payment FAILED - releasing stocks');

        // Release stocks
        for (const stockId of tempStockIds) {
          try {
            await StockService.markStockAsAvailable(stockId);
          } catch (releaseError) {
            console.error('Stock release error:', releaseError);
          }
        }

        // Mark order as failed
        const failedOrder = await OrderGroupService.failPayment(orderGroupId);

        console.log('✅ Order released after failed payment');

        return NextResponse.json(
          {
            success: false,
            error: 'Payment failed',
            data: failedOrder,
            paymentStatus: 'failed',
            isResume: false,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment status or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error confirming payment:', error);

    // ============ ROLLBACK: Try to release stocks on error ============
    try {
      const body = await request.json();

      // For new payments
      if (body.tempStockIds && body.tempStockIds.length > 0) {
        console.log('🔄 Rollback - releasing stocks from failed new payment');

        for (const stockId of body.tempStockIds) {
          try {
            await StockService.markStockAsAvailable(stockId);
          } catch (releaseError) {
            console.error('❌ Stock release error:', releaseError);
          }
        }

        console.log('✅ Stocks released during rollback');
      }

      // For resume payments - don't release, just log
      if (body.orderGroupId) {
        console.log('⚠️ Resume payment confirmation failed - order still pending');
      }
    } catch (parseError) {
      console.error('Error during rollback:', parseError);
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