// app/api/payment/create/route.ts - UPDATED
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

    try {
      // ============ STEP 1: Pick random stocks but DON'T mark as pending yet ============
      console.log('🔒 Reserving stocks temporarily...');

      // This picks stocks but marks them as 'pending' temporarily
      // They'll be officially tied to OrderGroup in /confirm endpoint
      const reservedStocks = await StockService.pickRandomAvailableStocks(
        productId,
        quantity,
        []
      );

      if (reservedStocks.length !== quantity) {
        throw new Error(
          `Expected ${quantity} stocks, got ${reservedStocks.length}`
        );
      }

      const tempStockIds = reservedStocks.map((s) => s._id.toString());
      console.log('✅ Stocks temporarily reserved:', tempStockIds);

      // ============ STEP 2: Generate temporary Midtrans Order ID ============
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const tempMidtransOrderId = `temp_${timestamp}_${random}`;

      console.log('📝 Generated temporary Midtrans Order ID:', tempMidtransOrderId);

      // ============ STEP 3: Create Midtrans transaction ============
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY is missing');
      }

      console.log('💳 Creating Midtrans transaction...');

      const snapResponse = await MidtransService.createTransaction(
        tempMidtransOrderId,
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
            tempMidtransOrderId: tempMidtransOrderId,
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

      // Get the stocks we tried to reserve and release them
      const availableStocks = await StockService.getStocksByStatus(
        productId,
        'pending'
      );

      const recentPendingStocks = availableStocks.filter(
        (s) => s.reservedAt &&
          new Date(s.reservedAt).getTime() > Date.now() - 5000 // Within last 5 seconds
      );

      for (const stock of recentPendingStocks) {
        try {
          await StockService.markStockAsAvailable(stock._id?.toString() || '');
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