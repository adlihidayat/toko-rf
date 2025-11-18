// app/api/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/services/purchases';
import { StockService } from '@/lib/db/services/stocks';

export async function GET() {
  try {
    console.log('📋 Fetching all purchases...');

    const purchases = await PurchaseService.getAllPurchases();

    console.log('✅ Purchases fetched successfully:', purchases.length);
    return NextResponse.json({ success: true, data: purchases });
  } catch (error) {
    console.error('❌ Error fetching purchases:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch purchases',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, quantity, totalPaid } = body;

    console.log('Purchase request received:', { userId, productId, quantity, totalPaid });

    if (!userId || !productId || !quantity || totalPaid === undefined) {
      console.error('Missing required fields:', { userId, productId, quantity, totalPaid });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Check available stock count
    const availableCount = await StockService.getAvailableStockCount(productId);
    console.log('Available stock count:', availableCount);

    if (availableCount === 0) {
      console.error('Product out of stock');
      return NextResponse.json(
        { success: false, error: 'Product is out of stock' },
        { status: 400 }
      );
    }

    if (quantity > availableCount) {
      console.error('Not enough stock:', { requested: quantity, available: availableCount });
      return NextResponse.json(
        {
          success: false,
          error: `Only ${availableCount} items available. You requested ${quantity}.`
        },
        { status: 400 }
      );
    }

    // Step 2: Create pending purchases first
    const pricePerUnit = Math.round(totalPaid / quantity);
    const purchaseIds: string[] = [];
    const purchases = [];

    console.log('Creating pending purchases...');
    for (let i = 0; i < quantity; i++) {
      const purchase = await PurchaseService.createPendingPurchase(
        userId,
        productId,
        '', // stockId will be set later
        1, // quantity is always 1 per purchase
        pricePerUnit
      );

      if (!purchase._id) {
        throw new Error('Failed to create purchase');
      }

      purchaseIds.push(purchase._id.toString());
      purchases.push(purchase);
    }

    console.log('Pending purchases created:', purchaseIds);

    // Step 3: Atomically pick random available stocks and reserve them
    try {
      console.log('Attempting to pick and reserve stocks...');
      const reservedStocks = await StockService.pickRandomAvailableStocks(
        productId,
        quantity,
        purchaseIds
      );

      console.log('Stocks reserved:', reservedStocks.length);

      // Step 4: Update purchases with stockIds
      for (let i = 0; i < reservedStocks.length; i++) {
        const stock = reservedStocks[i];
        const purchase = purchases[i];

        if (!stock._id) {
          throw new Error('Stock ID is missing after reservation');
        }

        const stockId = stock._id.toString();
        await PurchaseService.linkStockToPurchase(
          purchase._id!.toString(),
          stockId
        );

        purchase.stockId = stockId;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            purchases: purchases.map(p => ({
              ...p,
              status: 'pending'
            }))
          }
        },
        { status: 201 }
      );
    } catch (reservationError) {
      // If stock reservation fails, mark all created purchases as cancelled
      console.error('Stock reservation failed:', reservationError);

      for (const purchaseId of purchaseIds) {
        try {
          await PurchaseService.updatePurchaseStatus(purchaseId, 'failed');
        } catch (cleanupError) {
          console.error('Failed to cleanup purchase:', purchaseId, cleanupError);
        }
      }

      const errorMsg = reservationError instanceof Error
        ? reservationError.message
        : 'Failed to reserve stock. Please try again.';

      console.error('Returning error response:', errorMsg);
      return NextResponse.json(
        {
          success: false,
          error: errorMsg
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error creating purchase:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}