// app/api/purchase/user/[userId]/route.ts
// NOTE: Folder should be named [userId] (lowercase 'u'), not [UserId]
import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/services/purchases';
import { StockService } from '@/lib/db/services/stocks';

// GET: Fetch all purchases for a specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    console.log('🔍 Fetching purchases for userId:', userId);

    // Fetch user purchases with details (all purchases, not just completed)
    const purchases = await PurchaseService.getUserPurchases(userId);

    console.log('📦 Purchases found:', purchases.length);
    if (purchases.length > 0) {
      console.log('📦 First purchase:', {
        id: purchases[0]._id,
        productName: purchases[0].productName,
        status: purchases[0].paymentStatus,
        redeemCode: purchases[0].redeemCode
      });
    }

    // Fetch user stats (only from completed purchases)
    const stats = await PurchaseService.getUserStats(userId);

    console.log('📊 Stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching user purchases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user purchases',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update a specific purchase (kept from your original code)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const body = await request.json();

    // This needs a purchaseId from the body since the route param is userId
    const { purchaseId } = body;

    if (!purchaseId) {
      return NextResponse.json(
        { success: false, error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    // Handle payment completion
    if (body.paymentStatus === "completed") {
      const purchase = await PurchaseService.getPurchaseById(purchaseId);

      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      // Verify this purchase belongs to this user
      if (purchase.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Mark the stock as PAID (payment confirmed, redeem code ready)
      if (purchase.stockId) {
        await StockService.markStockAsPaid(purchase.stockId, purchaseId);
      }

      // Update purchase status to completed
      const updatedPurchase = await PurchaseService.updatePurchaseStatus(
        purchaseId,
        "completed"
      );

      if (!updatedPurchase) {
        return NextResponse.json(
          { success: false, error: 'Failed to update purchase' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updatedPurchase });
    }

    // Handle payment cancellation/failure
    if (body.paymentStatus === "cancelled") {
      const purchase = await PurchaseService.getPurchaseById(purchaseId);

      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      // Verify this purchase belongs to this user
      if (purchase.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Mark the stock back to AVAILABLE (release the reservation)
      if (purchase.stockId) {
        await StockService.markStockAsAvailable(purchase.stockId);
      }

      // Update purchase status to cancelled
      const updatedPurchase = await PurchaseService.updatePurchaseStatus(
        purchaseId,
        "cancelled"
      );

      if (!updatedPurchase) {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel purchase' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updatedPurchase });
    }

    // Handle rating
    if (body.rating !== undefined) {
      const purchase = await PurchaseService.updatePurchaseRating(purchaseId, body.rating);

      if (!purchase) {
        return NextResponse.json(
          { success: false, error: 'Purchase not found' },
          { status: 404 }
        );
      }

      // Verify this purchase belongs to this user
      if (purchase.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
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