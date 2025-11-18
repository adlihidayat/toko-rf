// lib/db/services/purchases.ts
import connectDB from '../mongodb';
import Purchase from '../models/Purchase';
import Product from '../models/Product';
import User from '../models/User';
import Stock from '../models/Stock';
import { PurchaseDocument, PurchaseWithDetails } from '@/lib/types';

export class PurchaseService {
  static async getAllPurchases(): Promise<PurchaseWithDetails[]> {
    try {
      await connectDB();
      console.log('📝 Connecting to database for getAllPurchases...');

      // Sort by createdAt descending (newest first)
      const purchases = await Purchase.find()
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      console.log('📦 Found total purchases:', purchases.length);

      if (purchases.length === 0) {
        console.log('ℹ️ No purchases found in database');
        return [];
      }

      const purchasesWithDetails = await Promise.all(
        purchases.map(async (purchase) => {
          try {
            // Fetch product
            const product = await Product.findById(purchase.productId).lean();
            if (!product) {
              console.warn(
                `⚠️ Product not found for ID: ${purchase.productId} in purchase ${purchase._id}`
              );
            }

            // Fetch user
            const user = await User.findById(purchase.userId).lean();
            if (!user) {
              console.warn(
                `⚠️ User not found for ID: ${purchase.userId} in purchase ${purchase._id}`
              );
            }

            // Fetch stock only if stockId exists
            let stock = null;
            if (purchase.stockId) {
              stock = await Stock.findById(purchase.stockId).lean();
              if (!stock) {
                console.warn(
                  `⚠️ Stock not found for ID: ${purchase.stockId} in purchase ${purchase._id}`
                );
              }
            }

            return {
              ...purchase,
              _id: purchase._id?.toString() || '',
              productName: product?.name || 'Unknown Product',
              productPrice: product?.price || 0,
              productId: purchase.productId,
              userId: purchase.userId,
              userName: user?.username || 'Unknown User',
              redeemCode:
                stock && stock.status === 'paid'
                  ? stock.redeemCode
                  : purchase.paymentStatus === 'completed'
                    ? 'Processing...'
                    : purchase.paymentStatus === 'pending'
                      ? 'Awaiting Payment'
                      : 'Payment Failed',
              rating: purchase.rating || null,
              paymentStatus: purchase.paymentStatus,
              totalPaid: purchase.totalPaid,
              createdAt: purchase.createdAt,
            } as PurchaseWithDetails;
          } catch (mappingError) {
            console.error('❌ Error mapping purchase:', purchase._id, mappingError);
            // Return a fallback object instead of throwing
            return {
              ...purchase,
              _id: purchase._id?.toString() || '',
              productName: 'Error Loading',
              productPrice: 0,
              productId: purchase.productId,
              userId: purchase.userId,
              userName: 'Error Loading',
              redeemCode: 'Error',
              rating: purchase.rating || null,
              paymentStatus: purchase.paymentStatus,
              totalPaid: purchase.totalPaid,
              createdAt: purchase.createdAt,
            } as PurchaseWithDetails;
          }
        })
      );

      console.log('✅ Successfully mapped all purchases with details');
      return purchasesWithDetails;
    } catch (error) {
      console.error('❌ Critical error in getAllPurchases:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  static async getUserPurchases(userId: string): Promise<PurchaseWithDetails[]> {
    try {
      await connectDB();

      console.log('🔍 Finding purchases for userId:', userId);

      // Sort by createdAt descending (newest first)
      const purchases = await Purchase.find({ userId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      console.log('📦 Found purchases:', purchases.length);

      if (purchases.length === 0) {
        console.log('ℹ️ No purchases found for this user');
        return [];
      }

      const purchasesWithDetails = await Promise.all(
        purchases.map(async (purchase) => {
          try {
            // Fetch product
            const product = await Product.findById(purchase.productId).lean();
            if (!product) {
              console.warn(`⚠️ Product not found for ID: ${purchase.productId}`);
            }

            // Fetch user
            const user = await User.findById(purchase.userId).lean();
            if (!user) {
              console.warn(`⚠️ User not found for ID: ${purchase.userId}`);
            }

            // Fetch stock only if stockId exists
            let stock = null;
            if (purchase.stockId) {
              stock = await Stock.findById(purchase.stockId).lean();
              if (!stock) {
                console.warn(`⚠️ Stock not found for ID: ${purchase.stockId}`);
              }
            } else {
              console.log(
                `ℹ️ No stockId for purchase ${purchase._id} (status: ${purchase.paymentStatus})`
              );
            }

            return {
              ...purchase,
              _id: purchase._id?.toString() || '',
              productName: product?.name || 'Unknown Product',
              productPrice: product?.price || 0,
              productId: purchase.productId,
              userId: purchase.userId,
              userName: user?.username || 'Unknown User',
              redeemCode:
                stock && stock.status === 'paid'
                  ? stock.redeemCode
                  : purchase.paymentStatus === 'completed'
                    ? 'Processing...'
                    : purchase.paymentStatus === 'pending'
                      ? 'Awaiting Payment'
                      : 'Payment Failed',
              rating: purchase.rating || null,
              paymentStatus: purchase.paymentStatus,
              totalPaid: purchase.totalPaid,
              createdAt: purchase.createdAt,
            } as PurchaseWithDetails;
          } catch (mappingError) {
            console.error('❌ Error mapping purchase:', purchase._id, mappingError);
            return {
              ...purchase,
              _id: purchase._id?.toString() || '',
              productName: 'Error Loading',
              productPrice: 0,
              productId: purchase.productId,
              userId: purchase.userId,
              userName: 'Error Loading',
              redeemCode: 'Error',
              rating: purchase.rating || null,
              paymentStatus: purchase.paymentStatus,
              totalPaid: purchase.totalPaid,
              createdAt: purchase.createdAt,
            } as PurchaseWithDetails;
          }
        })
      );

      console.log('✅ Successfully mapped purchases with details');
      return purchasesWithDetails;
    } catch (error) {
      console.error('❌ Error in getUserPurchases:', error);
      throw error;
    }
  }

  static async getUserStats(userId: string) {
    try {
      await connectDB();

      const purchases = await Purchase.find({
        userId,
        paymentStatus: 'completed',
      }).lean();

      const totalPurchases = purchases.length;
      const totalSpent = purchases.reduce((sum, p) => sum + p.totalPaid, 0);

      const ratedPurchases = purchases.filter((p) => p.rating !== null);
      const avgRating =
        ratedPurchases.length > 0
          ? (
            ratedPurchases.reduce((sum, p) => sum + (p.rating || 0), 0) /
            ratedPurchases.length
          ).toFixed(1)
          : '0';

      return {
        totalPurchases,
        totalSpent,
        avgRating,
      };
    } catch (error) {
      console.error('❌ Error in getUserStats:', error);
      throw error;
    }
  }

  static async createPendingPurchase(
    userId: string,
    productId: string,
    stockId: string = '',
    quantity: number = 1,
    totalPaid: number
  ): Promise<PurchaseDocument> {
    await connectDB();

    const purchase = await Purchase.create({
      userId,
      productId,
      stockId,
      quantity,
      totalPaid,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    return purchase.toObject();
  }

  static async getPurchaseById(id: string): Promise<PurchaseDocument | null> {
    await connectDB();
    return await Purchase.findById(id).lean();
  }

  static async linkStockToPurchase(
    purchaseId: string,
    stockId: string
  ): Promise<PurchaseDocument | null> {
    await connectDB();
    return await Purchase.findByIdAndUpdate(
      purchaseId,
      { stockId },
      { new: true }
    ).lean();
  }

  static async updatePurchaseStatus(
    id: string,
    paymentStatus: string
  ): Promise<PurchaseDocument | null> {
    await connectDB();
    return await Purchase.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    ).lean();
  }

  static async updatePurchaseRating(
    id: string,
    rating: number | null
  ): Promise<PurchaseDocument | null> {
    await connectDB();
    return await Purchase.findByIdAndUpdate(
      id,
      { rating },
      { new: true }
    ).lean();
  }
}