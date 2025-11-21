// lib/db/services/stocks.ts - COMPLETE VERSION
import connectDB from '../mongodb';
import Stock from '../models/Stock';
import Product from '../models/Product';
import { StockDocument, CreateStockInput } from '@/lib/types';
import OrderGroup from '../models/OrderGroup';

export class StockService {
  /**
   * Get all stocks with product information
   */
  static async getAllStocksWithProductInfo(): Promise<any[]> {
    try {
      await connectDB();

      console.log('📦 Fetching all stocks with product info...');

      const stocks = await Stock.find().lean();

      // Enrich stocks with product info
      const stocksWithProduct = await Promise.all(
        stocks.map(async (stock) => {
          try {
            const product = await Product.findById(stock.productId).lean();
            return {
              ...stock,
              _id: stock._id?.toString(),
              productId: stock.productId?.toString(),
              orderGroupId: stock.orderGroupId?.toString() || null,
              productName: product?.name || 'Unknown Product',
              productPrice: product?.price || 0,
            };
          } catch (error) {
            console.error('Error enriching stock:', stock._id, error);
            return {
              ...stock,
              _id: stock._id?.toString(),
              productId: stock.productId?.toString(),
              orderGroupId: stock.orderGroupId?.toString() || null,
              productName: 'Error Loading',
              productPrice: 0,
            };
          }
        })
      );

      console.log(`✅ Fetched ${stocksWithProduct.length} stocks`);
      return stocksWithProduct;
    } catch (error) {
      console.error('❌ Error getting all stocks:', error);
      throw error;
    }
  }

  /**
   * Create a new stock
   */
  static async createStock(stockData: CreateStockInput): Promise<StockDocument> {
    try {
      await connectDB();

      console.log('🆕 Creating stock:', {
        productId: stockData.productId,
        redeemCode: stockData.redeemCode,
      });

      const stock = await Stock.create({
        ...stockData,
        status: stockData.status || 'available',
      });

      const created = stock.toObject();
      console.log('✅ Stock created:', created._id);

      return {
        ...created,
        _id: created._id?.toString(),
        productId: created.productId?.toString(),
        orderGroupId: created.orderGroupId?.toString() || null,
      };
    } catch (error) {
      console.error('❌ Error creating stock:', error);
      throw error;
    }
  }

  /**
   * Get stock by ID
   */
  static async getStockById(stockId: string): Promise<StockDocument | null> {
    try {
      await connectDB();

      const stock = await Stock.findById(stockId).lean();

      if (!stock) {
        console.warn('⚠️ Stock not found:', stockId);
        return null;
      }

      return {
        ...stock,
        _id: stock._id?.toString(),
        productId: stock.productId?.toString(),
        orderGroupId: stock.orderGroupId?.toString() || null,
      };
    } catch (error) {
      console.error('❌ Error getting stock:', error);
      throw error;
    }
  }

  /**
   * Update stock
   */
  static async updateStock(
    stockId: string,
    updates: Partial<CreateStockInput>
  ): Promise<StockDocument | null> {
    try {
      await connectDB();

      console.log('📝 Updating stock:', stockId, updates);

      const stock = await Stock.findByIdAndUpdate(stockId, updates, {
        new: true,
      }).lean();

      if (!stock) {
        console.warn('⚠️ Stock not found:', stockId);
        return null;
      }

      console.log('✅ Stock updated:', stockId);

      return {
        ...stock,
        _id: stock._id?.toString(),
        productId: stock.productId?.toString(),
        orderGroupId: stock.orderGroupId?.toString() || null,
      };
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Delete stock
   */
  static async deleteStock(stockId: string): Promise<boolean> {
    try {
      await connectDB();

      console.log('🗑️ Deleting stock:', stockId);

      const result = await Stock.findByIdAndDelete(stockId);

      if (!result) {
        console.warn('⚠️ Stock not found for deletion:', stockId);
        return false;
      }

      console.log('✅ Stock deleted:', stockId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting stock:', error);
      throw error;
    }
  }

  /**
   * Get available stock count for a product
   */
  static async getAvailableStockCount(productId: string): Promise<number> {
    try {
      await connectDB();

      const count = await Stock.countDocuments({
        productId,
        status: 'available',
      });

      console.log(`📦 Available stocks for ${productId}:`, count);
      return count;
    } catch (error) {
      console.error('❌ Error getting available stock count:', error);
      return 0;
    }
  }

  /**
   * Pick random available stocks and mark as pending
   * NO LONGER takes purchaseIds - those link to OrderGroup instead
   */
  static async pickRandomAvailableStocks(
    productId: string,
    quantity: number,
    _purchaseIds: string[] = [] // Deprecated param, kept for compatibility
  ): Promise<any[]> {
    try {
      await connectDB();

      console.log(
        `🎲 Picking ${quantity} random available stocks for product ${productId}`
      );

      // Use aggregation to pick random stocks efficiently
      const stocks = await Stock.aggregate([
        {
          $match: {
            productId,
            status: 'available',
          },
        },
        {
          $sample: { size: quantity },
        },
      ]);

      if (stocks.length < quantity) {
        throw new Error(
          `Only ${stocks.length} stocks available, requested ${quantity}`
        );
      }

      // Mark selected stocks as pending but DON'T link to purchases
      // They'll be linked to OrderGroup later
      const stockIds = stocks.map((s) => s._id);

      await Stock.updateMany(
        { _id: { $in: stockIds } },
        {
          status: 'pending',
          reservedAt: new Date(),
          // orderGroupId will be set by OrderGroupService
        }
      );

      console.log(`✅ ${stocks.length} stocks marked as pending`);
      return stocks;
    } catch (error) {
      console.error('❌ Error picking random stocks:', error);
      throw error;
    }
  }

  /**
   * Mark stock as available (release from pending/paid)
   */
  static async markStockAsAvailable(stockId: string): Promise<boolean> {
    try {
      await connectDB();

      const result = await Stock.findByIdAndUpdate(
        stockId,
        {
          status: 'available',
          orderGroupId: null,
          reservedAt: null,
          paidAt: null,
        },
        { new: true }
      );

      if (!result) {
        console.error('❌ Stock not found:', stockId);
        return false;
      }

      console.log('✅ Stock marked as available:', stockId);
      return true;
    } catch (error) {
      console.error('❌ Error marking stock as available:', error);
      return false;
    }
  }

  /**
   * Mark stock as paid (payment complete, redeem code available)
   */
  static async markStockAsPaid(
    stockId: string,
    _purchaseId?: string
  ): Promise<boolean> {
    try {
      await connectDB();

      const result = await Stock.findByIdAndUpdate(
        stockId,
        {
          status: 'paid',
          paidAt: new Date(),
          // orderGroupId is already set, no need to update
        },
        { new: true }
      );

      if (!result) {
        console.error('❌ Stock not found:', stockId);
        return false;
      }

      console.log('✅ Stock marked as paid:', stockId);
      return true;
    } catch (error) {
      console.error('❌ Error marking stock as paid:', error);
      return false;
    }
  }

  /**
   * Get all stocks for a product
   */
  static async getProductStocks(productId: string): Promise<StockDocument[]> {
    try {
      await connectDB();

      const stocks = await Stock.find({ productId }).lean();

      return stocks.map((stock) => ({
        ...stock,
        _id: stock._id?.toString(),
        productId: stock.productId?.toString(),
        orderGroupId: stock.orderGroupId?.toString() || null,
      }));
    } catch (error) {
      console.error('❌ Error getting product stocks:', error);
      return [];
    }
  }

  /**
   * Get stocks by status
   */
  static async getStocksByStatus(
    productId: string,
    status: 'available' | 'pending' | 'paid'
  ): Promise<StockDocument[]> {
    try {
      await connectDB();

      const stocks = await Stock.find({ productId, status }).lean();

      return stocks.map((stock) => ({
        ...stock,
        _id: stock._id?.toString(),
        productId: stock.productId?.toString(),
        orderGroupId: stock.orderGroupId?.toString() || null,
      }));
    } catch (error) {
      console.error('❌ Error getting stocks by status:', error);
      return [];
    }
  }

  /**
     * Get all stocks for an order group
     * Used ONLY by redeem-codes endpoint
     */
  static async getOrderGroupStocks(orderGroupId: string) {
    await connectDB();

    const stocks = await Stock.find({
      _id: { $in: (await OrderGroup.findById(orderGroupId))?.stockIds || [] }
    }).lean();

    return stocks;
  }

  /**
   * Get redeem codes for a specific order group
   */
  static async getRedeemCodesForOrderGroup(
    orderGroupId: string
  ): Promise<string[]> {
    try {
      await connectDB();

      const stocks = await Stock.find(
        { orderGroupId },
        { redeemCode: 1 }
      ).lean();

      return stocks.map((s) => s.redeemCode);
    } catch (error) {
      console.error('❌ Error getting redeem codes:', error);
      return [];
    }
  }

  /**
   * Get total stock count for a product
   */
  static async getTotalStockCount(productId: string): Promise<number> {
    try {
      await connectDB();

      const count = await Stock.countDocuments({ productId });
      console.log(`📊 Total stocks for ${productId}:`, count);
      return count;
    } catch (error) {
      console.error('❌ Error getting total stock count:', error);
      return 0;
    }
  }

  /**
   * Get stock counts by status for a product
   */
  static async getStockCountsByStatus(productId: string): Promise<{
    available: number;
    pending: number;
    paid: number;
    total: number;
  }> {
    try {
      await connectDB();

      const [available, pending, paid, total] = await Promise.all([
        Stock.countDocuments({ productId, status: 'available' }),
        Stock.countDocuments({ productId, status: 'pending' }),
        Stock.countDocuments({ productId, status: 'paid' }),
        Stock.countDocuments({ productId }),
      ]);

      return { available, pending, paid, total };
    } catch (error) {
      console.error('❌ Error getting stock counts by status:', error);
      return { available: 0, pending: 0, paid: 0, total: 0 };
    }
  }
}