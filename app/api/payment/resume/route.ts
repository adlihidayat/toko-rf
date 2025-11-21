// app/api/payment/resume/route.ts - COMPLETE WITH REAL USER DATA

import { NextRequest, NextResponse } from 'next/server';
import { OrderGroupService } from '@/lib/db/services/order-group';
import { MidtransService } from '@/lib/midtrans/service';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('🔄 Resume payment request:', {
      productId: body.productId,
      orderGroupId: body.orderGroupId,
      userId: body.userId,
    });

    const { orderGroupId, userId } = body;

    if (!orderGroupId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderGroupId or userId' },
        { status: 400 }
      );
    }

    // ============ FETCH USER DATA FROM DATABASE ============
    await connectDB();

    const user = await User.findById(userId)
      .select('username email phoneNumber')
      .lean();

    if (!user) {
      console.error('❌ User not found:', userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User data fetched for resume:', {
      username: user.username,
      email: user.email,
      phone: user.phoneNumber,
    });

    // ============ STEP 1: Fetch the pending order ============
    console.log('📍 Fetching order by orderGroupId:', orderGroupId);

    // ✅ FIX: Use findById WITHOUT .lean() to get full document with all fields
    const OrderGroup = (await import('@/lib/db/models/OrderGroup')).default;
    const rawOrderGroup = await OrderGroup.findById(orderGroupId);

    if (!rawOrderGroup) {
      console.error('❌ Order not found:', orderGroupId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Convert to plain object for safety
    const orderGroup = rawOrderGroup.toObject();

    console.log('📋 DEBUG - Full order object:', {
      id: orderGroup._id,
      midtransOrderId: orderGroup.midtransOrderId,
      snapToken: orderGroup.snapToken,
      snapTokenType: typeof orderGroup.snapToken,
      snapTokenLength: orderGroup.snapToken?.length,
      allFields: Object.keys(orderGroup),
    });

    // Verify ownership
    if (orderGroup.userId.toString() !== userId) {
      console.warn('🚫 Unauthorized access to order:', orderGroupId);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Found pending order:', {
      orderId: orderGroup._id,
      midtransOrderId: orderGroup.midtransOrderId,
      expiresAt: orderGroup.expiresAt,
      hasSnapToken: !!orderGroup.snapToken && orderGroup.snapToken.length > 0,
    });

    // ============ STEP 2: Check if order has expired ============
    const now = new Date();
    if (orderGroup.expiresAt && orderGroup.expiresAt < now) {
      console.error('❌ Order has expired:', orderGroupId);
      return NextResponse.json(
        { success: false, error: 'Order payment window has expired' },
        { status: 400 }
      );
    }

    // ============ STEP 3: Check current Midtrans status ============
    console.log('🔍 Checking current Midtrans status...');

    try {
      const transactionStatus = await MidtransService.getTransactionStatus(
        orderGroup.midtransOrderId
      );

      const { status } = MidtransService.parseNotificationStatus(
        transactionStatus
      );

      console.log('📊 Current Midtrans status:', status);

      // If already completed, don't allow resume
      if (status === 'completed') {
        console.log('✅ Order already paid!');
        return NextResponse.json(
          {
            success: false,
            error: 'This order has already been paid',
            alreadyPaid: true,
          },
          { status: 400 }
        );
      }

      // If failed, can't resume
      if (status === 'failed' || status === 'cancelled') {
        console.log('❌ Payment failed, cannot resume');
        return NextResponse.json(
          {
            success: false,
            error: 'Previous payment failed. Please create a new order.',
            paymentFailed: true,
          },
          { status: 400 }
        );
      }
    } catch (gatewayError) {
      console.warn('⚠️ Could not reach gateway, proceeding with stored token:', gatewayError);
    }

    // ============ STEP 4: Retrieve or create Snap token ============
    console.log('🔍 Checking for stored Snap token...');

    let snapToken = orderGroup.snapToken;

    // ✅ FIX: Check if token is empty string or actually missing
    const hasValidToken = snapToken && snapToken.trim().length > 0;

    console.log('📋 Token validation:', {
      hasToken: !!snapToken,
      hasValidToken,
      tokenLength: snapToken?.length || 0,
      tokenPreview: snapToken?.substring(0, 30),
    });

    if (!hasValidToken) {
      console.log('⚠️ No valid stored Snap token, creating new one from Midtrans...');

      try {
        // ✅ FIX: Use real user data instead of dummy data
        const customerDetails = {
          first_name: user.username,
          email: user.email,
          phone: user.phoneNumber,
        };

        console.log('👤 Creating new token with real customer details:', customerDetails);

        const newTokenResponse = await MidtransService.createTransaction(
          orderGroup.midtransOrderId,
          orderGroup.totalPaid,
          customerDetails // ✅ Pass real user data
        );

        snapToken = newTokenResponse.token;

        console.log('✅ New token created from Midtrans:', {
          tokenPreview: snapToken.substring(0, 20) + '...',
        });

        // ✅ Save the newly created token back to database
        await OrderGroupService.updateSnapToken(orderGroupId, snapToken);
        console.log('💾 New token saved to database for future use');
      } catch (tokenError) {
        console.error('❌ Failed to create token:', tokenError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create payment token. Please try again.',
            details: tokenError instanceof Error ? tokenError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Using stored Snap token from database:', {
        tokenPreview: snapToken.substring(0, 20) + '...',
      });
    }

    // ============ STEP 5: Return token for payment ============
    return NextResponse.json({
      success: true,
      data: {
        token: snapToken,
        orderGroupId: orderGroupId,
        midtransOrderId: orderGroup.midtransOrderId,
        totalPaid: orderGroup.totalPaid,
        isExistingPayment: true,
        isNewToken: !orderGroup.snapToken || !orderGroup.snapToken.trim(),
      },
      message: 'Payment session retrieved. Please complete the payment.',
    });
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