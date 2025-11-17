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

    if (body.paymentStatus === "completed") {
      // Get the purchase first
      const purchase = await PurchaseService.getPurchaseById(id);

      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      // Mark the stock as paid by setting purchaseId
      if (purchase.stockId) {
        await StockService.markStockAsPaid(purchase.stockId, id);
      }

      // Update purchase status to completed
      const updatedPurchase = await PurchaseService.updatePurchaseStatus(id, "completed");

      if (!updatedPurchase) {
        return NextResponse.json(
          { success: false, error: 'Failed to update purchase' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updatedPurchase });
    }

    if (body.rating !== undefined) {
      const purchase = await PurchaseService.updatePurchaseRating(id, body.rating);
      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: purchase });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
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