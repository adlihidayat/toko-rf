// lib/types/index.ts

// ============ USER TYPES ============
export interface UserDocument {
  _id?: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "admin" | "user";
  joinDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "user";
  joinDate?: Date;
}

export interface UserStatsDocument {
  totalPurchases: number;
  totalSpent: number;
  averageRating: number;
}

// ============ CATEGORY TYPES ============
export interface CategoryDocument {
  _id?: string;
  name: string;
  icon: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> { }

export interface CategoryWithStockCount extends CategoryDocument {
  stockCount?: number;
}

// ============ PRODUCT TYPES ============
export interface ProductDocument {
  _id?: string;
  name: string;
  price: number;
  minimumPurchase: number;
  description: string;
  categoryId: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  reviews: number;
  badge?: "new" | "best-deal" | "popular" | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductInput {
  name: string;
  price: number;
  minimumPurchase: number;
  description: string;
  categoryId: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  reviews: number;
  badge?: "new" | "best-deal" | "popular" | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> { }

// ============ STOCK TYPES ============
export interface StockDocument {
  _id?: string;
  productId: string;
  redeemCode: string;
  addedDate?: Date;
  purchaseId?: string | null;
  status: "available" | "pending" | "paid";
  reservedAt?: Date | null;
  paidAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateStockInput {
  productId: string;
  redeemCode: string;
  status?: "available" | "pending" | "paid";
  purchaseId?: string | null;
  reservedAt?: Date | null;
  paidAt?: Date | null;
}

export interface StockWithProductInfo extends StockDocument {
  productName: string;
  productPrice: number;
}

// ============ PURCHASE TYPES ============
export interface PurchaseDocument {
  _id?: string;
  userId: string;
  productId: string;
  stockId: string;
  quantity: number;
  totalPaid: number;
  paymentStatus: "pending" | "completed" | "cancelled";
  rating?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseWithDetails extends PurchaseDocument {
  productName: string;
  productPrice: number;
  redeemCode: string;
  userName: string;
}