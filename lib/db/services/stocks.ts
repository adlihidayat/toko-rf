// lib/db/services/stocks.ts
import connectDB from '../mongodb';
import Stock from '../models/Stock';
import Product from '../models/Product';
import { StockDocument, StockWithProductInfo, CreateStockInput } from '@/lib/types';

export class StockService {
  /**
   * Get all stocks with product information
   */
  static async getAllStocksWithProductInfo(): Promise<StockWithProductInfo[]> {
    await connectDB();

    const stocks = await Stock.find().lean();

    const stocksWithProductInfo = await Promise.all(
      stocks.map(async (stock) => {
        const product = await Product.findById(stock.productId).lean();

        return {
          ...stock,
          _id: stock._id?.toString() || '',
          productName: product?.name || 'Unknown',
          productPrice: product?.price || 0,
        } as StockWithProductInfo;
      })
    );

    return stocksWithProductInfo;
  }

  /**
   * Get stock by ID
   */
  static async getStockById(id: string): Promise<StockDocument | null> {
    await connectDB();
    return await Stock.findById(id).lean();
  }

  /**
   * Get available stock count for a product
   */
  static async getAvailableStockCount(productId: string): Promise<number> {
    await connectDB();
    return await Stock.countDocuments({
      productId,
      status: 'available',
    });
  }

  /**
   * Create a new stock entry
   */
  static async createStock(input: CreateStockInput): Promise<StockDocument> {
    await connectDB();

    const stock = await Stock.create({
      productId: input.productId,
      redeemCode: input.redeemCode,
      status: input.status || 'available',
      addedDate: new Date(),
      purchaseId: input.purchaseId || null,
      reservedAt: input.reservedAt || null,
      paidAt: input.paidAt || null,
    });

    return stock.toObject();
  }

  /**
   * Update stock information
   */
  static async updateStock(
    id: string,
    updates: Partial<StockDocument>
  ): Promise<StockDocument | null> {
    await connectDB();
    return await Stock.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  /**
   * Delete a stock entry
   */
  static async deleteStock(id: string): Promise<boolean> {
    await connectDB();
    const result = await Stock.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Atomically pick random available stocks and mark them as pending (reserved)
   * This uses MongoDB's findOneAndUpdate with atomic operations to prevent race conditions
   */
  static async pickRandomAvailableStocks(
    productId: string,
    quantity: number,
    purchaseIds: string[]
  ): Promise<StockDocument[]> {
    await connectDB();

    const reservedStocks: StockDocument[] = [];
    const now = new Date();

    // Pick stocks one by one atomically
    for (let i = 0; i < quantity; i++) {
      const stock = await Stock.findOneAndUpdate(
        {
          productId,
          status: 'available',
        },
        {
          $set: {
            status: 'pending',
            purchaseId: purchaseIds[i],
            reservedAt: now,
          },
        },
        {
          new: true,
          sort: { _id: 1 }, // Pick randomly by sorting (you can change this)
        }
      ).lean();

      if (!stock) {
        // If we can't get enough stocks, rollback the ones we already reserved
        for (const reservedStock of reservedStocks) {
          await Stock.findByIdAndUpdate(reservedStock._id, {
            $set: {
              status: 'available',
              purchaseId: null,
              reservedAt: null,
            },
          });
        }

        throw new Error(
          `Could not reserve ${quantity} stocks. Only ${i} available.`
        );
      }

      reservedStocks.push(stock);
    }

    return reservedStocks;
  }

  /**
   * Mark a stock as PAID (payment completed, redeem code can be shown)
   */
  static async markStockAsPaid(
    stockId: string,
    purchaseId: string
  ): Promise<StockDocument | null> {
    await connectDB();

    return await Stock.findByIdAndUpdate(
      stockId,
      {
        $set: {
          status: 'paid',
          purchaseId,
          paidAt: new Date(),
        },
      },
      { new: true }
    ).lean();
  }

  /**
   * Mark a stock as AVAILABLE (release reservation, e.g., payment cancelled)
   */
  static async markStockAsAvailable(stockId: string): Promise<StockDocument | null> {
    await connectDB();

    return await Stock.findByIdAndUpdate(
      stockId,
      {
        $set: {
          status: 'available',
          purchaseId: null,
          reservedAt: null,
          paidAt: null,
        },
      },
      { new: true }
    ).lean();
  }

  /**
   * Get stocks by product ID
   */
  static async getStocksByProductId(productId: string): Promise<StockDocument[]> {
    await connectDB();
    return await Stock.find({ productId }).lean();
  }

  /**
   * Get available stocks by product ID
   */
  static async getAvailableStocksByProductId(productId: string): Promise<StockDocument[]> {
    await connectDB();
    return await Stock.find({
      productId,
      status: 'available',
    }).lean();
  }

  /**
   * Get stock statistics by product
   */
  static async getStockStatsByProduct(productId: string) {
    await connectDB();

    const [available, pending, paid] = await Promise.all([
      Stock.countDocuments({ productId, status: 'available' }),
      Stock.countDocuments({ productId, status: 'pending' }),
      Stock.countDocuments({ productId, status: 'paid' }),
    ]);

    return {
      available,
      pending,
      paid,
      total: available + pending + paid,
    };
  }

  /**
   * Bulk create stocks
   */
  static async bulkCreateStocks(
    productId: string,
    redeemCodes: string[]
  ): Promise<StockDocument[]> {
    await connectDB();

    const stocksToCreate = redeemCodes.map((code) => ({
      productId,
      redeemCode: code,
      status: 'available' as const,
      addedDate: new Date(),
      purchaseId: null,
    }));

    const stocks = await Stock.insertMany(stocksToCreate);
    return stocks.map((s) => s.toObject());
  }
}