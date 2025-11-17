// lib/db/services/products.ts
import connectDB from '../mongodb';
import Product from '../models/Product';
import Stock from '../models/Stock';
import { ProductDocument, CreateProductInput, UpdateProductInput } from '@/lib/types';

export class ProductService {
  static async getAllProducts(): Promise<ProductDocument[]> {
    await connectDB();
    const products = await Product.find().lean();

    // Convert _id and categoryId to strings for consistency
    return products.map(product => ({
      ...product,
      _id: product._id?.toString(),
      categoryId: product.categoryId.toString(),
    }));
  }

  static async getFeaturedProducts() {
    await connectDB();

    // Get products with badges, limit to 3, sorted by badge priority
    const badgePriority = { 'popular': 1, 'best-deal': 2, 'new': 3 };

    const products = await Product.find({
      badge: { $ne: null }
    })
      .limit(3)
      .lean();

    // Sort by badge priority
    const sortedProducts = products.sort((a, b) => {
      const priorityA = a.badge ? badgePriority[a.badge as keyof typeof badgePriority] || 999 : 999;
      const priorityB = b.badge ? badgePriority[b.badge as keyof typeof badgePriority] || 999 : 999;
      return priorityA - priorityB;
    });

    // Get stock info for each product
    const productsWithStock = await Promise.all(
      sortedProducts.map(async (product) => {
        const productId = product._id.toString();
        const [totalStock, availableStock] = await Promise.all([
          Stock.countDocuments({ productId }),
          Stock.countDocuments({ productId, purchaseId: null }),
        ]);

        return {
          ...product,
          _id: productId,
          categoryId: product.categoryId.toString(),
          totalStock,
          availableStock,
        };
      })
    );

    return productsWithStock;
  }

  static async getProductById(id: string): Promise<ProductDocument | null> {
    await connectDB();
    return await Product.findById(id).lean();
  }

  static async getProductWithStock(id: string) {
    await connectDB();

    const product = await Product.findById(id).lean();
    if (!product) return null;

    const [totalStock, availableStock] = await Promise.all([
      Stock.countDocuments({ productId: id }),
      Stock.countDocuments({ productId: id, purchaseId: null }),
    ]);

    return {
      ...product,
      _id: product._id.toString(),
      totalStock,
      availableStock,
    };
  }

  static async createProduct(productData: CreateProductInput): Promise<ProductDocument> {
    await connectDB();
    const product = await Product.create(productData);
    return product.toObject();
  }

  static async updateProduct(
    id: string,
    updates: UpdateProductInput
  ): Promise<ProductDocument | null> {
    await connectDB();
    return await Product.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  static async deleteProduct(id: string): Promise<boolean> {
    await connectDB();

    await Stock.deleteMany({ productId: id });

    const result = await Product.findByIdAndDelete(id);
    return result !== null;
  }

  static async getProductsByCategory(categoryId: string): Promise<ProductDocument[]> {
    await connectDB();
    return await Product.find({ categoryId }).lean();
  }
}