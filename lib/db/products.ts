// lib/db/products.ts
import { ProductDocument, CreateProductInput, UpdateProductInput } from "@/lib/types";
import { MOCK_PRODUCTS, MOCK_STOCKS } from "./mock-data";

export class ProductService {
  static async getAllProducts(): Promise<ProductDocument[]> {
    return MOCK_PRODUCTS;
  }

  static async getProductById(id: string): Promise<ProductDocument | null> {
    return MOCK_PRODUCTS.find((item) => item._id === id) || null;
  }

  static async getProductWithStock(id: string) {
    const product = await this.getProductById(id);
    if (!product) return null;

    const stock = MOCK_STOCKS.filter((s) => s.productId === id);
    const availableStock = stock.filter((s) => !s.purchaseId).length;

    return {
      ...product,
      totalStock: stock.length,
      availableStock,
    };
  }

  static async createProduct(productData: CreateProductInput): Promise<ProductDocument> {
    const newProduct: ProductDocument = {
      _id: `item_${Date.now()}`,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_PRODUCTS.push(newProduct);
    return newProduct;
  }

  static async updateProduct(
    id: string,
    updates: UpdateProductInput
  ): Promise<ProductDocument | null> {
    const index = MOCK_PRODUCTS.findIndex((item) => item._id === id);
    if (index === -1) return null;

    MOCK_PRODUCTS[index] = {
      ...MOCK_PRODUCTS[index],
      ...updates,
      updatedAt: new Date(),
    };
    return MOCK_PRODUCTS[index];
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const productIndex = MOCK_PRODUCTS.findIndex((item) => item._id === id);
    if (productIndex === -1) return false;

    const stockIndicesToDelete = MOCK_STOCKS.map((s, idx) => s.productId === id ? idx : -1).filter(idx => idx !== -1);
    for (let i = stockIndicesToDelete.length - 1; i >= 0; i--) {
      MOCK_STOCKS.splice(stockIndicesToDelete[i], 1);
    }

    MOCK_PRODUCTS.splice(productIndex, 1);
    return true;
  }
}
