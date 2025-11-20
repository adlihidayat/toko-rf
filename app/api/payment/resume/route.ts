// app/api/payment/resume/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { MidtransService } from '@/lib/midtrans/service';
import User from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderGroupId, userId } = body;

    if (!orderGroupId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderGroupId or userId' },
        { status: 400 }
      );
    }

    console.log('🔄 Attempting to resume payment for order group:', orderGroupId);

    // ============ STEP 1: Get the order group ============
    const orderGroup = await OrderGroupService.getById(orderGroupId);

    if (!orderGroup) {
      console.error('❌ Order group not found:', orderGroupId);
      return NextResponse.json(
        { success: false, error: 'Order group not found' },
        { status: 404 }
      );
    }

    // ============ STEP 2: Verify ownership and payment status ============
    if (orderGroup.userId !== userId) {
      console.error('❌ User is not the owner of this order group');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Can only resume pending orders
    if (orderGroup.paymentStatus !== 'pending') {
      console.error(`❌ Cannot resume ${orderGroup.paymentStatus} order group`);
      return NextResponse.json(
        {
          success: false,
          error: `Cannot resume ${orderGroup.paymentStatus} orders. Status must be pending.`,
        },
        { status: 400 }
      );
    }

    // ============ STEP 3: Check if order has expired ============
    if (orderGroup.expiresAt && new Date() > new Date(orderGroup.expiresAt)) {
      console.error('⏰ Order group has expired');
      return NextResponse.json(
        {
          success: false,
          error: 'This order has expired. Please create a new order.',
        },
        { status: 410 } // 410 Gone
      );
    }

    console.log('✅ Order group validation passed');
    console.log('   Midtrans Order ID:', orderGroup.midtransOrderId);
    console.log('   Current status:', orderGroup.paymentStatus);

    // ============ STEP 4: Fetch user details ============
    await connectDB();
    const user = await User.findById(userId).lean();

    if (!user) {
      console.error('❌ User not found:', userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', {
      email: user.email,
      username: user.username,
      phone: user.phoneNumber,
    });

    // ============ STEP 5: Create new Snap token using the SAME order ID ============
    try {
      console.log('🔑 Creating new Snap token for resuming payment...');
      console.log('   Order ID:', orderGroup.midtransOrderId);
      console.log('   Amount:', orderGroup.totalPaid);

      const snapResponse = await MidtransService.createTransaction(
        orderGroup.midtransOrderId, // ← REUSE the same order ID
        orderGroup.totalPaid,
        {
          first_name: user.username || 'Customer',
          email: user.email || 'noemail@example.com',
          phone: user.phoneNumber?.replace(/\D/g, '') || '0000000000',
        }
      );

      console.log('✅ New Snap token created successfully');
      console.log('   Token:', snapResponse.token.substring(0, 20) + '...');

      return NextResponse.json({
        success: true,
        data: {
          token: snapResponse.token,
          orderGroupId: orderGroup._id,
          midtransOrderId: orderGroup.midtransOrderId,
          amount: orderGroup.totalPaid,
          status: orderGroup.paymentStatus,
        },
        message: 'Payment session resumed. Please complete the transaction.',
      });
    } catch (midtransError) {
      console.error('❌ Failed to create Snap token:', midtransError);
      console.error(
        'Error details:',
        midtransError instanceof Error ? midtransError.message : 'Unknown error'
      );

      let errorMessage = 'Failed to create payment token';
      if (midtransError instanceof Error) {
        if (midtransError.message.includes('MIDTRANS_SERVER_KEY')) {
          errorMessage = 'Payment gateway not configured (missing MIDTRANS_SERVER_KEY)';
        } else if (midtransError.message.includes('401')) {
          errorMessage = 'Payment gateway authentication failed - check API keys';
        } else if (midtransError.message.includes('400')) {
          errorMessage = 'Invalid payment details - please contact support';
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: midtransError instanceof Error ? midtransError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error resuming payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resume payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}