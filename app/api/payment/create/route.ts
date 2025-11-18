// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/services/purchases';
import { StockService } from '@/lib/db/services/stocks';
import { MidtransService } from '@/lib/midtrans/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, quantity, totalPaid } = body;

    console.log('💳 Payment creation request:', { userId, productId, quantity, totalPaid });

    if (!userId || !productId || !quantity || totalPaid === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ============ SECURITY CHECK 1: Verify available stock ============
    const availableCount = await StockService.getAvailableStockCount(productId);
    console.log('📦 Available stock count:', availableCount);

    if (availableCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Product is out of stock' },
        { status: 400 }
      );
    }

    if (quantity > availableCount) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${availableCount} items available. You requested ${quantity}.`
        },
        { status: 400 }
      );
    }

    // ============ STEP 1: Create pending purchases ============
    const pricePerUnit = Math.round(totalPaid / quantity);
    const purchaseIds: string[] = [];
    const purchases = [];

    console.log('📝 Creating pending purchases...');
    for (let i = 0; i < quantity; i++) {
      const purchase = await PurchaseService.createPendingPurchase(
        userId,
        productId,
        '', // stockId will be set after reservation
        1,
        pricePerUnit
      );

      if (!purchase._id) {
        throw new Error('Failed to create purchase');
      }

      purchaseIds.push(purchase._id.toString());
      purchases.push(purchase);
    }

    console.log('✅ Pending purchases created:', purchaseIds);

    // ============ STEP 2: Atomically reserve stocks ============
    let reservedStocks: any[] = [];
    try {
      console.log('🔒 Reserving stocks atomically...');
      reservedStocks = await StockService.pickRandomAvailableStocks(
        productId,
        quantity,
        purchaseIds
      );

      console.log('✅ Stocks reserved successfully:', reservedStocks.length);

      // ============ STEP 3: Link stocks to purchases ============
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

      console.log('✅ Stocks linked to purchases');

      // ============ STEP 4: Create Midtrans transaction ============
      const orderId = purchaseIds.join('-'); // Multiple purchase IDs joined
      console.log('💳 Creating Midtrans transaction for order:', orderId);

      // ============ DEBUG: Check env variables ============
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const nodeEnv = process.env.NODE_ENV;

      console.log('🔑 Environment Check:', {
        hasServerKey: !!serverKey,
        serverKeyPrefix: serverKey?.substring(0, 10) + '...',
        nodeEnv,
        totalPaid,
        quantity,
      });

      if (!serverKey) {
        console.error('❌ MIDTRANS_SERVER_KEY is missing!');
        throw new Error(
          `Missing MIDTRANS_SERVER_KEY. Please check Vercel environment variables.`
        );
      }

      const snapResponse = await MidtransService.createTransaction(
        orderId,
        totalPaid,
        {
          first_name: userId,
          email: 'customer@example.com', // Should come from user data
          phone: '08123456789', // Should come from user data
        },
        [
          {
            id: productId,
            price: pricePerUnit,
            quantity: quantity,
            name: `Product Purchase x${quantity}`,
          }
        ]
      );

      console.log('✅ Midtrans token created');

      return NextResponse.json(
        {
          success: true,
          data: {
            token: snapResponse.token,
            redirectUrl: snapResponse.redirect_url,
            purchaseIds,
            orderId,
          }
        },
        { status: 201 }
      );

    } catch (reservationError) {
      // ============ ROLLBACK: If anything fails, mark purchases as failed ============
      console.error('❌ Reservation/Transaction failed:', reservationError);

      for (const purchaseId of purchaseIds) {
        try {
          await PurchaseService.updatePurchaseStatus(purchaseId, 'failed');
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      // Release any reserved stocks
      for (const stock of reservedStocks) {
        try {
          await StockService.markStockAsAvailable(stock._id.toString());
        } catch (releaseError) {
          console.error('Stock release error:', releaseError);
        }
      }

      const errorMsg = reservationError instanceof Error
        ? reservationError.message
        : 'Failed to process payment. Please try again.';

      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}