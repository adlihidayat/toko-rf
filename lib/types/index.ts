export interface UserDocument {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
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
  phoneNumber: string;
  role: "admin" | "user";
  joinDate: Date;
}

export interface CategoryDocument {
  _id: string;
  name: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> { }

export interface CategoryWithStockCount extends CategoryDocument {
  stockCount: number;
}

export interface ProductDocument {
  _id: string;
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
  badge: "new" | "best-deal" | "popular" | null;
  createdAt: Date;
  updatedAt: Date;
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

// MAIN PURCHASE DOCUMENT - CONSOLIDATED
export interface PurchaseDocument {
  _id: string;
  userId: string;
  productId: string;
  stockId: string;
  quantity: number; // NEW - for bulk purchases
  totalPaid: number;
  paymentStatus: "pending" | "completed" | "failed"; // NEW - tracks payment
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