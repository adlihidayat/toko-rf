// lib/db/services/order-group.ts - COMPLETE VERSION
import connectDB from '../mongodb';
import OrderGroup from '../models/OrderGroup';
import Stock from '../models/Stock';
import Product from '../models/Product';
import User from '../models/User';
import { OrderGroupDocument } from '../models/OrderGroup';
import { MidtransService } from '@/lib/midtrans/service';

export interface OrderGroupWithDetails extends OrderGroupDocument {
  productName: string;
  productPrice: number;
  userName: string;
  stocks: any[];
  redeemCodes: string[];
}

export class OrderGroupService {
  /**
   * Create a new order group with pending stocks
   */
  static async createOrderGroup(
    userId: string,
    productId: string,
    stockIds: string[],
    quantity: number,
    totalPaid: number,
    midtransOrderId: string
  ): Promise<OrderGroupDocument> {
    await connectDB();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 min expiry

    const orderGroup = await OrderGroup.create({
      userId,
      productId,
      stockIds,
      quantity,
      totalPaid,
      midtransOrderId,
      paymentStatus: 'pending',
      reservedAt: new Date(),
      expiresAt,
    });

    console.log('✅ OrderGroup created:', orderGroup._id);

    // Link stocks to this order group
    await Stock.updateMany(
      { _id: { $in: stockIds } },
      {
        orderGroupId: orderGroup._id.toString(),
        status: 'pending',
        reservedAt: new Date(),
      }
    );

    console.log('🔗 Stocks linked to OrderGroup');
    return orderGroup.toObject();
  }

  /**
   * Update the Midtrans order ID for an OrderGroup
   * Used after OrderGroup is created but before Midtrans transaction
   */
  static async updateMidtransOrderId(
    orderGroupId: string,
    midtransOrderId: string
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    const orderGroup = await OrderGroup.findByIdAndUpdate(
      orderGroupId,
      { midtransOrderId },
      { new: true }
    ).lean();

    if (!orderGroup) {
      console.error('❌ OrderGroup not found:', orderGroupId);
      return null;
    }

    console.log('✅ Midtrans Order ID updated:', midtransOrderId);
    return orderGroup;
  }

  /**
   * Get order group by Midtrans order ID
   */
  static async getByMidtransOrderId(
    midtransOrderId: string
  ): Promise<OrderGroupDocument | null> {
    await connectDB();
    return await OrderGroup.findOne({ midtransOrderId }).lean();
  }

  /**
   * Get order group by ID
   */
  static async getById(id: string): Promise<OrderGroupDocument | null> {
    await connectDB();
    return await OrderGroup.findById(id).lean();
  }

  /**
   * Update payment status (generic)
   */
  static async updatePaymentStatus(
    orderGroupId: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    return await OrderGroup.findByIdAndUpdate(
      orderGroupId,
      { paymentStatus: status },
      { new: true }
    ).lean();
  }

  /**
   * Complete payment and mark stocks as paid
   * Called when Midtrans notification confirms payment
   */
  static async completePayment(
    orderGroupId: string,
    midtransTransactionId: string
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    const orderGroup = await OrderGroup.findByIdAndUpdate(
      orderGroupId,
      {
        paymentStatus: 'completed',
        midtransTransactionId,
        paidAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!orderGroup) {
      console.error('❌ OrderGroup not found:', orderGroupId);
      return null;
    }

    // Update all stocks to 'paid' status
    const updateResult = await Stock.updateMany(
      { _id: { $in: orderGroup.stockIds } },
      {
        status: 'paid',
        paidAt: new Date(),
      }
    );

    console.log('✅ OrderGroup marked as completed');
    console.log(`📦 Updated ${updateResult.modifiedCount} stocks to paid`);

    return orderGroup;
  }

  /**
   * Fail payment and release all stocks
   * Called when payment fails or user cancels
   */
  static async failPayment(
    orderGroupId: string
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    const orderGroup = await OrderGroup.findByIdAndUpdate(
      orderGroupId,
      {
        paymentStatus: 'failed',
      },
      { new: true }
    ).lean();

    if (!orderGroup) {
      console.error('❌ OrderGroup not found:', orderGroupId);
      return null;
    }

    // Release all stocks back to available
    const updateResult = await Stock.updateMany(
      { _id: { $in: orderGroup.stockIds } },
      {
        status: 'available',
        orderGroupId: null,
        reservedAt: null,
        paidAt: null,
      }
    );

    console.log('✅ OrderGroup marked as failed');
    console.log(`📦 Released ${updateResult.modifiedCount} stocks to available`);

    return orderGroup;
  }

  /**
   * Cancel order group (user initiated)
   */
  static async cancelOrderGroup(
    orderGroupId: string
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    const orderGroup = await OrderGroup.findById(orderGroupId).lean();

    if (!orderGroup) {
      console.error('❌ OrderGroup not found:', orderGroupId);
      return null;
    }

    // Can only cancel pending orders
    if (orderGroup.paymentStatus !== 'pending') {
      console.error(
        `❌ Cannot cancel ${orderGroup.paymentStatus} order group`
      );
      throw new Error(
        `Cannot cancel ${orderGroup.paymentStatus} order groups`
      );
    }

    return await this.failPayment(orderGroupId);
  }

  static async getUserOrderGroups(
    userId: string
  ): Promise<OrderGroupWithDetails[]> {
    await connectDB();

    const orderGroups = await OrderGroup.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(
      orderGroups.map(async (og) => {
        try {
          const product = await Product.findById(og.productId).lean();
          const user = await User.findById(og.userId).lean();
          // Don't fetch stocks here - we don't need them

          return {
            ...og,
            productName: product?.name || 'Unknown',
            productPrice: product?.price || 0,
            userName: user?.username || 'Unknown',
            stocks: [], // ✅ Don't include stocks
            redeemCodes: [], // ✅ Don't include redeem codes
          } as OrderGroupWithDetails;
        } catch (error) {
          console.error('Error enriching order group:', og._id, error);
          return {
            ...og,
            productName: 'Error Loading',
            productPrice: 0,
            userName: 'Error Loading',
            stocks: [],
            redeemCodes: [],
          } as OrderGroupWithDetails;
        }
      })
    );
  }

  /**
   * Get user's statistics (only from completed orders)
   */
  static async getUserStats(userId: string) {
    await connectDB();

    const completedOrders = await OrderGroup.find({
      userId,
      paymentStatus: 'completed',
    }).lean();

    const totalOrders = completedOrders.length;
    const totalSpent = completedOrders.reduce(
      (sum, og) => sum + og.totalPaid,
      0
    );

    const ratedOrders = completedOrders.filter((og) => og.rating !== null);
    const avgRating =
      ratedOrders.length > 0
        ? (
          ratedOrders.reduce((sum, og) => sum + (og.rating || 0), 0) /
          ratedOrders.length
        ).toFixed(1)
        : '0';

    return {
      totalPurchases: totalOrders,
      totalSpent,
      avgRating,
    };
  }

  /**
   * Update order group rating
   */
  static async updateRating(
    orderGroupId: string,
    rating: number | null
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    return await OrderGroup.findByIdAndUpdate(
      orderGroupId,
      { rating },
      { new: true }
    ).lean();
  }

  /**
   * Auto-release expired pending orders
   * Call this via a Vercel cron job or Node scheduler
   */
  static async releaseExpiredOrders(): Promise<number> {
    await connectDB();

    const now = new Date();
    const expiredOrders = await OrderGroup.find({
      paymentStatus: 'pending',
      expiresAt: { $lt: now },
    }).lean();

    console.log(`⏰ Found ${expiredOrders.length} expired orders to release`);

    for (const og of expiredOrders) {
      try {
        await this.failPayment(og._id!.toString());
        console.log(`✅ Released expired order: ${og._id}`);
      } catch (error) {
        console.error(`❌ Failed to release expired order ${og._id}:`, error);
      }
    }

    return expiredOrders.length;
  }

  /**
   * Get all order groups (admin)
   */
  static async getAllOrderGroups(
    limit: number = 100,
    skip: number = 0
  ): Promise<OrderGroupWithDetails[]> {
    await connectDB();

    const orderGroups = await OrderGroup.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return Promise.all(
      orderGroups.map(async (og) => {
        const product = await Product.findById(og.productId).lean();
        const user = await User.findById(og.userId).lean();
        const stocks = await Stock.find({
          _id: { $in: og.stockIds },
        }).lean();

        const redeemCodes = stocks
          .filter((s) => s.status === 'paid')
          .map((s) => s.redeemCode);

        return {
          ...og,
          productName: product?.name || 'Unknown',
          productPrice: product?.price || 0,
          userName: user?.username || 'Unknown',
          stocks,
          redeemCodes,
        } as OrderGroupWithDetails;
      })
    );
  }

  /**
   * Count order groups by status
   */
  static async countByStatus(
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<number> {
    await connectDB();

    return await OrderGroup.countDocuments({ paymentStatus: status });
  }

  /**
 * Sync order status with Midtrans gateway
 * Called periodically or on-demand to update local DB based on gateway status
 */
  static async syncOrderStatusWithGateway(
    orderGroupId: string
  ): Promise<OrderGroupDocument | null> {
    await connectDB();

    const orderGroup = await OrderGroup.findById(orderGroupId).lean();

    if (!orderGroup) {
      console.error("❌ OrderGroup not found:", orderGroupId);
      return null;
    }

    // Only sync pending orders
    if (orderGroup.paymentStatus !== "pending") {
      console.log(
        `ℹ️ Skipping sync for ${orderGroup.paymentStatus} order`,
        orderGroupId
      );
      return orderGroup;
    }

    // Don't sync if no Midtrans ID
    if (!orderGroup.midtransOrderId) {
      console.warn("⚠️ No Midtrans order ID found", orderGroupId);
      return orderGroup;
    }

    try {
      console.log(
        "🔄 Syncing order status with Midtrans gateway:",
        orderGroup.midtransOrderId
      );

      // Query Midtrans for current transaction status
      const transactionStatus = await MidtransService.getTransactionStatus(
        orderGroup.midtransOrderId
      );

      const { status } = MidtransService.parseNotificationStatus(
        transactionStatus
      );

      console.log(
        `📊 Gateway status: ${status} | Local status: ${orderGroup.paymentStatus}`
      );

      // If gateway says completed but local says pending, update local DB
      if (status === "completed" && orderGroup.paymentStatus === "pending") {
        console.log("✅ Gateway confirmed payment - updating local DB");

        const updatedOrderGroup = await OrderGroup.findByIdAndUpdate(
          orderGroupId,
          {
            paymentStatus: "completed",
            midtransTransactionId: transactionStatus.transaction_id,
            paidAt: new Date(),
          },
          { new: true }
        ).lean();

        // Mark all stocks as paid
        if (orderGroup.stockIds && orderGroup.stockIds.length > 0) {
          await Stock.updateMany(
            { _id: { $in: orderGroup.stockIds } },
            {
              status: "paid",
              paidAt: new Date(),
            }
          );
        }

        console.log("✅ Order and stocks updated to completed");
        return updatedOrderGroup;
      }

      // If gateway says failed/cancelled but local says pending, mark as failed
      if (
        (status === "failed" || status === "cancelled") &&
        orderGroup.paymentStatus === "pending"
      ) {
        console.log("❌ Gateway shows failed/cancelled - releasing stocks");

        const failedOrderGroup = await OrderGroup.findByIdAndUpdate(
          orderGroupId,
          {
            paymentStatus: "failed",
          },
          { new: true }
        ).lean();

        // Release stocks back to available
        if (orderGroup.stockIds && orderGroup.stockIds.length > 0) {
          await Stock.updateMany(
            { _id: { $in: orderGroup.stockIds } },
            {
              status: "available",
              orderGroupId: null,
              reservedAt: null,
            }
          );
        }

        console.log("✅ Order marked as failed and stocks released");
        return failedOrderGroup;
      }

      // Status matches
      console.log("ℹ️ Status matches between gateway and local DB");
      return orderGroup;
    } catch (error) {
      console.error("❌ Error syncing order status:", error);
      return orderGroup; // Return current state on error
    }
  }

  /**
   * Sync all pending orders with gateway
   * Useful for scheduled jobs or cron tasks
   */
  static async syncAllPendingOrders(): Promise<{
    total: number;
    synced: number;
    completed: number;
    failed: number;
  }> {
    await connectDB();

    const pendingOrders = await OrderGroup.find({
      paymentStatus: "pending",
    }).lean();

    console.log(`🔄 Syncing ${pendingOrders.length} pending orders...`);

    let syncedCount = 0;
    let completedCount = 0;
    let failedCount = 0;

    for (const order of pendingOrders) {
      try {
        const synced = await this.syncOrderStatusWithGateway(
          order._id!.toString()
        );

        if (synced?.paymentStatus === "completed") {
          completedCount++;
        } else if (synced?.paymentStatus === "failed") {
          failedCount++;
        }

        syncedCount++;
      } catch (error) {
        console.error(`❌ Error syncing order ${order._id}:`, error);
      }
    }

    console.log(`✅ Sync complete:`, {
      total: pendingOrders.length,
      synced: syncedCount,
      completed: completedCount,
      failed: failedCount,
    });

    return {
      total: pendingOrders.length,
      synced: syncedCount,
      completed: completedCount,
      failed: failedCount,
    };
  }
}

