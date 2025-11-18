// app/api/purchase/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/services/purchases';

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
      console.log('📦 Sample purchase:', {
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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

// PUT: Update a specific purchase rating
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const body = await request.json();

    // This needs a purchaseId from the body since the route param is userId
    const { purchaseId, rating } = body;

    if (!purchaseId) {
      return NextResponse.json(
        { success: false, error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    // Handle rating update
    if (rating !== undefined) {
      const purchase = await PurchaseService.updatePurchaseRating(purchaseId, rating);

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
      { success: false, error: 'Invalid request - rating is required' },
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