
// lib/db/purchases.ts
import { PurchaseDocument, PurchaseWithDetails } from "@/lib/types";
import { MOCK_PURCHASES, MOCK_PRODUCTS, MOCK_STOCKS, MOCK_USERS } from "./mock-data";

export class PurchaseService {
  /**
   * Get purchase history for a user
   */
  static async getUserPurchases(userId: string): Promise<PurchaseWithDetails[]> {
    const purchases = MOCK_PURCHASES.filter((purchase) => purchase.userId === userId);

    return purchases.map((purchase) => {
      const product = MOCK_PRODUCTS.find((p) => p._id === purchase.productId);
      const stock = MOCK_STOCKS.find((s) => s._id === purchase.stockId);
      return {
        ...purchase,
        productName: product?.name || "Unknown",
        productPrice: product?.price || 0,
        redeemCode: stock?.redeemCode || "Unknown",
        userName: "User",
      };
    });
  }

  /**
   * Get all purchases (for admin dashboard)
   */
  static async getAllPurchases(): Promise<PurchaseWithDetails[]> {
    return MOCK_PURCHASES.map((purchase) => {
      const product = MOCK_PRODUCTS.find((p) => p._id === purchase.productId);
      const stock = MOCK_STOCKS.find((s) => s._id === purchase.stockId);
      const user = MOCK_USERS.find((u) => u._id === purchase.userId);
      return {
        ...purchase,
        productName: product?.name || "Unknown",
        productPrice: product?.price || 0,
        redeemCode: stock?.redeemCode || "Unknown",
        userName: user?.username || "Unknown",
      };
    });
  }

  /**
   * Update purchase rating
   */
  static async updatePurchaseRating(
    purchaseId: string,
    rating: number | null
  ): Promise<PurchaseDocument | null> {
    const index = MOCK_PURCHASES.findIndex((p) => p._id === purchaseId);
    if (index === -1) return null;

    MOCK_PURCHASES[index] = {
      ...MOCK_PURCHASES[index],
      rating,
      updatedAt: new Date(),
    };
    return MOCK_PURCHASES[index];
  }

  /**
   * Get purchase statistics for user
   */
  static async getUserStats(userId: string) {
    const purchases = await this.getUserPurchases(userId);

    const totalSpent = purchases.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalPurchases = purchases.length;
    const ratedPurchases = purchases.filter((p) => p.rating !== null);
    const avgRating =
      ratedPurchases.length > 0
        ? (
          ratedPurchases.reduce((sum, p) => sum + (p.rating || 0), 0) /
          ratedPurchases.length
        ).toFixed(1)
        : "0";

    return {
      totalSpent,
      totalPurchases,
      avgRating,
    };
  }

  /**
   * Get purchase statistics for admin
   */
  static async getAdminStats() {
    const purchases = await this.getAllPurchases();

    const totalSales = purchases.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalTransactions = purchases.length;
    const ratedCount = purchases.filter((p) => p.rating !== null).length;

    return {
      totalSales,
      totalTransactions,
      ratedCount,
    };
  }
}