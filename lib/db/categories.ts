// lib/db/categories.ts
import {
  CategoryDocument,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithStockCount,
} from "@/lib/types";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_STOCKS } from "./mock-data";

export class CategoryService {
  static async getAllCategories(): Promise<CategoryDocument[]> {
    return MOCK_CATEGORIES;
  }

  static async getCategoryById(id: string): Promise<CategoryDocument | null> {
    return MOCK_CATEGORIES.find((cat) => cat._id === id) || null;
  }

  static async getAllCategoriesWithStockCount(): Promise<
    CategoryWithStockCount[]
  > {
    return MOCK_CATEGORIES.map((category) => {
      // Get all products in this category
      const productsInCategory = MOCK_PRODUCTS.filter(
        (p) => p.categoryId === category._id
      );

      // Get all stocks for products in this category
      const stockCount = MOCK_STOCKS.filter((stock) =>
        productsInCategory.some((p) => p._id === stock.productId)
      ).length;

      return {
        ...category,
        stockCount,
      };
    });
  }

  static async createCategory(
    categoryData: CreateCategoryInput
  ): Promise<CategoryDocument> {
    const newCategory: CategoryDocument = {
      _id: `cat_${Date.now()}`,
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_CATEGORIES.push(newCategory);
    return newCategory;
  }

  static async updateCategory(
    id: string,
    updates: UpdateCategoryInput
  ): Promise<CategoryDocument | null> {
    const index = MOCK_CATEGORIES.findIndex((cat) => cat._id === id);
    if (index === -1) return null;

    MOCK_CATEGORIES[index] = {
      ...MOCK_CATEGORIES[index],
      ...updates,
      updatedAt: new Date(),
    };
    return MOCK_CATEGORIES[index];
  }

  static async deleteCategory(id: string): Promise<boolean> {
    const index = MOCK_CATEGORIES.findIndex((cat) => cat._id === id);
    if (index === -1) return false;

    // Check if category is in use
    const productsUsingCategory = MOCK_PRODUCTS.filter(
      (p) => p.categoryId === id
    );
    if (productsUsingCategory.length > 0) {
      throw new Error(
        "Cannot delete category that is assigned to products. Please reassign products first."
      );
    }

    MOCK_CATEGORIES.splice(index, 1);
    return true;
  }

  static async getCategoryStockCount(categoryId: string): Promise<number> {
    const productsInCategory = MOCK_PRODUCTS.filter(
      (p) => p.categoryId === categoryId
    );

    return MOCK_STOCKS.filter((stock) =>
      productsInCategory.some((p) => p._id === stock.productId)
    ).length;
  }
}