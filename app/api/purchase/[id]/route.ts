// app/api/purchase/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/services/purchases';
import { StockService } from '@/lib/db/services/stocks';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const purchase = await PurchaseService.getPurchaseById(id);

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: purchase });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase' },
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

    // ============ HANDLE PAYMENT COMPLETION ============
    if (body.paymentStatus === "completed") {
      console.log('💳 Completing payment for purchase:', id);

      // Get the purchase first
      const purchase = await PurchaseService.getPurchaseById(id);

      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      // Verify purchase is still pending
      if (purchase.paymentStatus !== 'pending') {
        return NextResponse.json(
          { success: false, error: `Purchase is already ${purchase.paymentStatus}` },
          { status: 400 }
        );
      }

      // Mark the stock as paid
      if (purchase.stockId) {
        try {
          await StockService.markStockAsPaid(purchase.stockId, id);
          console.log('✅ Stock marked as PAID:', purchase.stockId);
        } catch (stockError) {
          console.error('Failed to mark stock as paid:', stockError);
          return NextResponse.json(
            { success: false, error: 'Failed to process payment' },
            { status: 500 }
          );
        }
      }

      // Update purchase status to completed
      const updatedPurchase = await PurchaseService.updatePurchaseStatus(id, "completed");

      if (!updatedPurchase) {
        return NextResponse.json(
          { success: false, error: 'Failed to update purchase' },
          { status: 500 }
        );
      }

      console.log('✅ Purchase completed successfully');
      return NextResponse.json({ success: true, data: updatedPurchase });
    }

    // ============ HANDLE PURCHASE CANCELLATION ============
    if (body.paymentStatus === "cancelled") {
      console.log('❌ Cancelling purchase:', id);

      // Get the purchase first
      const purchase = await PurchaseService.getPurchaseById(id);

      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      // Only allow cancellation of pending purchases
      if (purchase.paymentStatus !== 'pending') {
        return NextResponse.json(
          { success: false, error: `Cannot cancel ${purchase.paymentStatus} purchases` },
          { status: 400 }
        );
      }

      // Release the reserved stock back to available
      if (purchase.stockId) {
        try {
          await StockService.markStockAsAvailable(purchase.stockId);
          console.log('✅ Stock released to available:', purchase.stockId);
        } catch (stockError) {
          console.error('Failed to release stock:', stockError);
          return NextResponse.json(
            { success: false, error: 'Failed to cancel purchase' },
            { status: 500 }
          );
        }
      }

      // Update purchase status to cancelled
      const updatedPurchase = await PurchaseService.updatePurchaseStatus(id, "cancelled");

      if (!updatedPurchase) {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel purchase' },
          { status: 500 }
        );
      }

      console.log('✅ Purchase cancelled successfully');
      return NextResponse.json({ success: true, data: updatedPurchase });
    }

    // ============ HANDLE RATING UPDATE ============
    if (body.rating !== undefined) {
      console.log('⭐ Updating rating for purchase:', id);

      const purchase = await PurchaseService.updatePurchaseRating(id, body.rating);
      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      console.log('✅ Rating updated successfully');
      return NextResponse.json({ success: true, data: purchase });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update purchase' },
      { status: 500 }
    );
  }
}