// lib/db/services/categories.ts
import connectDB from '../mongodb';
import Category from '../models/Category';
import Product from '../models/Product';
import Stock from '../models/Stock';
import {
  CategoryDocument,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithStockCount,
} from '@/lib/types';

export class CategoryService {
  static async getAllCategories(): Promise<CategoryDocument[]> {
    await connectDB();
    return await Category.find().lean();
  }

  static async getCategoryById(id: string): Promise<CategoryDocument | null> {
    await connectDB();
    return await Category.findById(id).lean();
  }

  static async getAllCategoriesWithStockCount(): Promise<CategoryWithStockCount[]> {
    await connectDB();

    const categories = await Category.find().lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ categoryId: category._id.toString() }).lean();
        const productIds = products.map((p) => p._id.toString());

        const stockCount = await Stock.countDocuments({
          productId: { $in: productIds },
        });

        return {
          ...category,
          _id: category._id.toString(),
          stockCount,
        };
      })
    );

    return categoriesWithCount;
  }

  static async createCategory(categoryData: CreateCategoryInput): Promise<CategoryDocument> {
    await connectDB();
    const category = await Category.create(categoryData);
    return category.toObject();
  }

  static async updateCategory(
    id: string,
    updates: UpdateCategoryInput
  ): Promise<CategoryDocument | null> {
    await connectDB();
    return await Category.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  static async deleteCategory(id: string): Promise<boolean> {
    await connectDB();

    const productsUsingCategory = await Product.countDocuments({ categoryId: id });
    if (productsUsingCategory > 0) {
      throw new Error(
        'Cannot delete category that is assigned to products. Please reassign products first.'
      );
    }

    const result = await Category.findByIdAndDelete(id);
    return result !== null;
  }

  static async getCategoryStockCount(categoryId: string): Promise<number> {
    await connectDB();

    const products = await Product.find({ categoryId }).lean();
    const productIds = products.map((p) => p._id.toString());

    return await Stock.countDocuments({ productId: { $in: productIds } });
  }
}