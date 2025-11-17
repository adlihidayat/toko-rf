// lib/db/services/purchases.ts
import connectDB from '../mongodb';
import Purchase from '../models/Purchase';
import Product from '../models/Product';
import User from '../models/User';
import Stock from '../models/Stock';
import { PurchaseDocument, PurchaseWithDetails } from '@/lib/types';

export class PurchaseService {
  static async getAllPurchases(): Promise<PurchaseWithDetails[]> {
    await connectDB();

    const purchases = await Purchase.find().lean();

    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const product = await Product.findById(purchase.productId).lean();
        const user = await User.findById(purchase.userId).lean();
        const stock = await Stock.findById(purchase.stockId).lean();

        return {
          ...purchase,
          _id: purchase._id?.toString() || '',
          productName: product?.name || 'Unknown',
          productPrice: product?.price || 0,
          productId: purchase.productId,
          userName: user?.username || 'Unknown',
          redeemCode: stock?.redeemCode || 'N/A',
          rating: purchase.rating || null,
        } as PurchaseWithDetails;
      })
    );

    return purchasesWithDetails;
  }

  static async getUserPurchases(userId: string): Promise<PurchaseWithDetails[]> {
    await connectDB();

    const purchases = await Purchase.find({ userId }).lean();

    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const product = await Product.findById(purchase.productId).lean();
        const user = await User.findById(purchase.userId).lean();
        const stock = await Stock.findById(purchase.stockId).lean();

        return {
          ...purchase,
          _id: purchase._id?.toString() || '',
          productName: product?.name || 'Unknown',
          productPrice: product?.price || 0,
          productId: purchase.productId,
          userName: user?.username || 'Unknown',
          redeemCode: stock?.redeemCode || 'N/A',
          rating: purchase.rating || null,
        } as PurchaseWithDetails;
      })
    );

    return purchasesWithDetails;
  }

  static async getUserStats(userId: string) {
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
  }

  static async createPendingPurchase(
    userId: string,
    productId: string,
    stockId: string = '', // Can be empty initially
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
    });

    return purchase.toObject();
  }

  static async getPurchaseById(id: string): Promise<PurchaseDocument | null> {
    await connectDB();
    return await Purchase.findById(id).lean();
  }

  // Link a stock to a purchase after successful reservation
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