// lib/types/index.ts
export interface UserDocument {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  joinDate: Date;
}

export interface ProductDocument {
  _id: string;
  name: string;
  price: number;
  minimumPurchase: number;
  description: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  reviews: number;
  badge: "new" | "best-deal" | "popular" | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  price: number;
  minimumPurchase: number;
  description: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  reviews: number;
  badge: "new" | "best-deal" | "popular" | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> { }

export interface StockDocument {
  _id: string;
  productId: string;
  redeemCode: string;
  addedDate: Date;
  purchaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockInput {
  productId: string;
  redeemCode: string;
}

export interface StockWithProductInfo extends StockDocument {
  productName: string;
  productPrice: number;
  isAvailable: boolean;
}

export interface PurchaseDocument {
  _id: string;
  userId: string;
  productId: string;
  stockId: string;
  totalPaid: number;
  rating: number | null; // 1-5 or null if not rated
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseWithDetails extends PurchaseDocument {
  productName: string;
  productPrice: number;
  redeemCode: string;
  userName: string;
}