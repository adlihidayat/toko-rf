
// lib/db/stocks.ts
import { StockDocument, CreateStockInput, StockWithProductInfo } from "@/lib/types";
import { MOCK_STOCKS, MOCK_PRODUCTS } from "./mock-data";

export class StockService {
  static async getAllStocks(): Promise<StockDocument[]> {
    return MOCK_STOCKS;
  }

  static async getStocksByProductId(productId: string): Promise<StockDocument[]> {
    return MOCK_STOCKS.filter((stock) => stock.productId === productId);
  }

  static async getAvailableStock(productId: string): Promise<StockDocument[]> {
    return MOCK_STOCKS.filter((stock) => stock.productId === productId && !stock.purchaseId);
  }

  static async getStockCount(productId: string): Promise<number> {
    return MOCK_STOCKS.filter((stock) => stock.productId === productId).length;
  }

  static async getAvailableStockCount(productId: string): Promise<number> {
    return MOCK_STOCKS.filter((stock) => stock.productId === productId && !stock.purchaseId).length;
  }

  static async getAllStocksWithProductInfo(): Promise<StockWithProductInfo[]> {
    return MOCK_STOCKS.map((stock) => {
      const product = MOCK_PRODUCTS.find((p) => p._id === stock.productId);
      return {
        ...stock,
        productName: product?.name || "Unknown",
        productPrice: product?.price || 0,
        isAvailable: !stock.purchaseId,
      };
    });
  }

  static async createStock(stockData: CreateStockInput): Promise<StockDocument> {
    const newStock: StockDocument = {
      _id: `stock_${Date.now()}`,
      productId: stockData.productId,
      redeemCode: stockData.redeemCode,
      addedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_STOCKS.push(newStock);
    return newStock;
  }

  static async updateStock(id: string, updates: Partial<StockDocument>): Promise<StockDocument | null> {
    const index = MOCK_STOCKS.findIndex((stock) => stock._id === id);
    if (index === -1) return null;

    MOCK_STOCKS[index] = {
      ...MOCK_STOCKS[index],
      ...updates,
      updatedAt: new Date(),
    };
    return MOCK_STOCKS[index];
  }

  static async deleteStock(id: string): Promise<boolean> {
    const index = MOCK_STOCKS.findIndex((stock) => stock._id === id);
    if (index === -1) return false;

    MOCK_STOCKS.splice(index, 1);
    return true;
  }

  static async getStockById(id: string): Promise<StockDocument | null> {
    return MOCK_STOCKS.find((stock) => stock._id === id) || null;
  }
}
