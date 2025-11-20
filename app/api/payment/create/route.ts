// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';
import { MidtransService } from '@/lib/midtrans/service';
import { ProductService } from '@/lib/db/services/products';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, quantity, totalPaid } = body;

    console.log('💳 Payment creation request:', {
      userId,
      productId,
      quantity,
      totalPaid,
    });

    // ============ VALIDATION ============
    if (!userId || !productId || !quantity || totalPaid === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ============ FETCH PRODUCT DATA ============
    const product = await ProductService.getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('📦 Product found:', {
      name: product.name,
      minimumPurchase: product.minimumPurchase,
    });

    // ============ SECURITY CHECK: Verify minimum purchase ============
    if (quantity < (product.minimumPurchase || 1)) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum purchase is ${product.minimumPurchase}. You requested ${quantity}.`,
        },
        { status: 400 }
      );
    }

    // ============ SECURITY CHECK: Verify available stock ============
    const availableCount = await StockService.getAvailableStockCount(productId);
    console.log('📦 Available stock count:', availableCount);

    if (availableCount < (product.minimumPurchase || 1)) {
      return NextResponse.json(
        { success: false, error: 'Product is out of stock' },
        { status: 400 }
      );
    }

    if (quantity > availableCount) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${availableCount} items available. You requested ${quantity}.`,
        },
        { status: 400 }
      );
    }

    // ============ STEP 1: Reserve and pick random stocks ============
    let reservedStocks: any[] = [];
    const tempStockIds: string[] = [];

    try {
      console.log('🔒 Reserving stocks atomically...');

      reservedStocks = await StockService.pickRandomAvailableStocks(
        productId,
        quantity,
        []
      );

      if (reservedStocks.length !== quantity) {
        throw new Error(
          `Expected ${quantity} stocks, got ${reservedStocks.length}`
        );
      }

      tempStockIds.push(...reservedStocks.map((s) => s._id.toString()));
      console.log('✅ Stocks reserved:', tempStockIds);

      // ============ STEP 2: Generate Midtrans Order ID ============
      // ✅ CHANGED: Just return a temporary ID, don't create OrderGroup yet
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const midtransOrderId = `temp_${timestamp}_${random}`;

      console.log('📝 Generated temporary Midtrans Order ID:', midtransOrderId);

      // ============ STEP 3: Create Midtrans transaction WITHOUT creating OrderGroup ============
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY is missing');
      }

      console.log('💳 Creating Midtrans transaction...');

      const snapResponse = await MidtransService.createTransaction(
        midtransOrderId,
        totalPaid,
        {
          first_name: userId,
          email: 'customer@example.com',
          phone: '08123456789',
        },
        [
          {
            id: productId,
            price: Math.round(totalPaid / quantity),
            quantity: quantity,
            name: `Product Purchase x${quantity}`,
          },
        ]
      );

      console.log('✅ Midtrans token created');

      return NextResponse.json(
        {
          success: true,
          data: {
            token: snapResponse.token,
            redirectUrl: snapResponse.redirect_url,
            // ✅ CHANGED: Return temp data instead of orderGroupId
            tempMidtransOrderId: midtransOrderId,
            tempStockIds: tempStockIds,
            productId,
            quantity,
            totalPaid,
            userId,
          },
        },
        { status: 201 }
      );
    } catch (reservationError) {
      // ============ ROLLBACK: Release reserved stocks ============
      console.error('❌ Reservation/Transaction failed:', reservationError);

      for (const stockId of tempStockIds) {
        try {
          await StockService.markStockAsAvailable(stockId);
        } catch (releaseError) {
          console.error('Stock release error:', releaseError);
        }
      }

      const errorMsg =
        reservationError instanceof Error
          ? reservationError.message
          : 'Failed to process payment. Please try again.';

      console.error('❌ Error message:', errorMsg);

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