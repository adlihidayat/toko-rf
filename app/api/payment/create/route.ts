// app/api/payment/create/route.ts - SIMPLIFIED
import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';
import { MidtransService } from '@/lib/midtrans/service';
import { OrderGroupService } from '@/lib/db/services/order-group';

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

    // ============ SECURITY CHECK: Verify available stock ============
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

      // ============ STEP 2: Generate temporary Midtrans Order ID ============
      // Use a simple format: ogid_{timestamp}_{random}
      // This will be the same as OrderGroup ID after creation
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const tempMidtransOrderId = `ogid_${timestamp}_${random}`;

      console.log('📝 Generated temporary Midtrans Order ID:', tempMidtransOrderId);

      // ============ STEP 3: Create OrderGroup with Midtrans Order ID ============
      const orderGroup = await OrderGroupService.createOrderGroup(
        userId,
        productId,
        tempStockIds,
        quantity,
        totalPaid,
        tempMidtransOrderId // Pass ID immediately
      );

      console.log('✅ OrderGroup created:', orderGroup._id);

      // ============ STEP 4: Now update with the actual OrderGroup MongoDB ID ============
      const orderGroupId = orderGroup._id!.toString();
      const midtransOrderId = orderGroupId; // Use MongoDB ID as final order ID

      console.log('📝 Updating to final Midtrans Order ID:', midtransOrderId);
      console.log('   Order ID length:', midtransOrderId.length, 'chars');

      await OrderGroupService.updateMidtransOrderId(orderGroupId, midtransOrderId);

      // ============ STEP 5: Create Midtrans transaction ============
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY is missing');
      }

      console.log('💳 Creating Midtrans transaction...');

      const snapResponse = await MidtransService.createTransaction(
        midtransOrderId, // Use OrderGroup's MongoDB ID (24 chars)
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
            orderGroupId: orderGroupId,
            midtransOrderId: midtransOrderId,
            quantity,
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