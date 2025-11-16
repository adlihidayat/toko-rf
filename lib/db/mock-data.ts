// lib/db/mock-data.ts
import { UserDocument, PurchaseDocument, ProductDocument, StockDocument, CategoryDocument } from "@/lib/types";

export const MOCK_CATEGORIES: CategoryDocument[] = [
  {
    _id: "cat_001",
    name: "Red Finger",
    icon: "https://play-lh.googleusercontent.com/rIQfXlGFPq43FSm08tXZZyZ4ACKfFakH9Co-qI7lN4i2JE3Ln_59SR6N2M0oQfd12H0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: "cat_002",
    name: "VSPhone",
    icon: "https://play-lh.googleusercontent.com/DnLMjCT5e9LI7nqywU9yFbh97oLdMnS1uaEcM5Id0UR4JS9OiByiKjsT9ytJE8uny4aj",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  },
];

export const MOCK_USERS: UserDocument[] = [
  {
    _id: "user_001",
    username: "Admin User",
    email: "admin@gmail.com",
    phoneNumber: "+62812345678", // NEW
    password: "admin123",
    role: "admin",
    joinDate: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: "user_002",
    username: "John Doe",
    email: "user@gmail.com",
    phoneNumber: "+62887654321", // NEW
    password: "user",
    role: "user",
    joinDate: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

export const MOCK_PRODUCTS: ProductDocument[] = [
  {
    _id: "item_001",
    name: "VIP 90 DAY",
    price: 150000,
    minimumPurchase: 1,
    description: "90 days premium access to all features",
    categoryId: "cat_001",
    cpuCore: "8 core cpu",
    android: "Android 12",
    ram: "4G RAM",
    rom: "64G ROM",
    bit: "64 BIT",
    processor: "Qualcomm",
    reviews: 6521,
    badge: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: "item_002",
    name: "VIP 30 DAY",
    price: 60000,
    minimumPurchase: 2,
    description: "30 days premium access to all features",
    categoryId: "cat_002",
    cpuCore: "6 core cpu",
    android: "Android 11",
    ram: "3G RAM",
    rom: "32G ROM",
    bit: "64 BIT",
    processor: "MediaTek",
    reviews: 3245,
    badge: "best-deal",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  },
  {
    _id: "item_003",
    name: "VIP 7 DAY",
    price: 19300,
    minimumPurchase: 5,
    description: "7 days premium access to all features",
    categoryId: "cat_002",
    cpuCore: "4 core cpu",
    android: "Android 10",
    ram: "2G RAM",
    rom: "16G ROM",
    bit: "32 BIT",
    processor: "Snapdragon",
    reviews: 1823,
    badge: null,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    _id: "item_004",
    name: "VIP 180 DAY",
    price: 280000,
    minimumPurchase: 1,
    description: "180 days premium access with bonus features",
    categoryId: "cat_002",
    cpuCore: "10 core cpu",
    android: "Android 13",
    ram: "8G RAM",
    rom: "128G ROM",
    bit: "64 BIT",
    processor: "Qualcomm Snapdragon 8",
    reviews: 8934,
    badge: null,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    _id: "item_005",
    name: "VIP STARTER",
    price: 29900,
    minimumPurchase: 3,
    description: "14 days starter package",
    categoryId: "cat_002",
    cpuCore: "4 core cpu",
    android: "Android 9",
    ram: "2G RAM",
    rom: "16G ROM",
    bit: "32 BIT",
    processor: "MediaTek Helio",
    reviews: 1250,
    badge: "new",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    _id: "item_006",
    name: "VIP 365 DAY",
    price: 500000,
    minimumPurchase: 1,
    description: "Full year premium access",
    categoryId: "cat_001",
    cpuCore: "12 core cpu",
    android: "Android 14",
    ram: "12G RAM",
    rom: "256G ROM",
    bit: "64 BIT",
    processor: "Qualcomm Snapdragon 8 Gen 3",
    reviews: 9876,
    badge: "popular",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

export const MOCK_STOCKS: StockDocument[] = [
  // VIP 90 DAY stocks (cat_001)
  { _id: "stock_001", productId: "item_001", redeemCode: "VIP90-001-ABC123", addedDate: new Date("2024-01-01"), createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01") },
  { _id: "stock_002", productId: "item_001", redeemCode: "VIP90-002-DEF456", addedDate: new Date("2024-01-01"), createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01") },
  { _id: "stock_003", productId: "item_001", redeemCode: "VIP90-003-GHI789", addedDate: new Date("2024-01-02"), purchaseId: "purchase_001", createdAt: new Date("2024-01-02"), updatedAt: new Date("2024-01-20") },
  { _id: "stock_004", productId: "item_001", redeemCode: "VIP90-004-JKL012", addedDate: new Date("2024-01-02"), createdAt: new Date("2024-01-02"), updatedAt: new Date("2024-01-02") },
  { _id: "stock_005", productId: "item_001", redeemCode: "VIP90-005-MNO345", addedDate: new Date("2024-01-03"), createdAt: new Date("2024-01-03"), updatedAt: new Date("2024-01-03") },

  // VIP 30 DAY stocks (cat_002)
  { _id: "stock_006", productId: "item_002", redeemCode: "VIP30-001-PQR678", addedDate: new Date("2024-01-05"), createdAt: new Date("2024-01-05"), updatedAt: new Date("2024-01-05") },
  { _id: "stock_007", productId: "item_002", redeemCode: "VIP30-002-STU901", addedDate: new Date("2024-01-05"), purchaseId: "purchase_002", createdAt: new Date("2024-01-05"), updatedAt: new Date("2024-02-05") },
  { _id: "stock_008", productId: "item_002", redeemCode: "VIP30-003-VWX234", addedDate: new Date("2024-01-06"), createdAt: new Date("2024-01-06"), updatedAt: new Date("2024-01-06") },
  { _id: "stock_009", productId: "item_002", redeemCode: "VIP30-004-YZA567", addedDate: new Date("2024-01-06"), createdAt: new Date("2024-01-06"), updatedAt: new Date("2024-01-06") },

  // VIP 7 DAY stocks (cat_002)
  { _id: "stock_010", productId: "item_003", redeemCode: "VIP7-001-BCD890", addedDate: new Date("2024-01-10"), purchaseId: "purchase_003", createdAt: new Date("2024-01-10"), updatedAt: new Date("2024-02-20") },

  // VIP 180 DAY stocks (cat_002)
  { _id: "stock_011", productId: "item_004", redeemCode: "VIP180-001-EFG123", addedDate: new Date("2024-01-15"), createdAt: new Date("2024-01-15"), updatedAt: new Date("2024-01-15") },
  { _id: "stock_012", productId: "item_004", redeemCode: "VIP180-002-HIJ456", addedDate: new Date("2024-01-15"), createdAt: new Date("2024-01-15"), updatedAt: new Date("2024-01-15") },

  // VIP STARTER stocks (cat_002)
  { _id: "stock_013", productId: "item_005", redeemCode: "VIPSTART-001-KLM789", addedDate: new Date("2024-01-12"), createdAt: new Date("2024-01-12"), updatedAt: new Date("2024-01-12") },
  { _id: "stock_014", productId: "item_005", redeemCode: "VIPSTART-002-NOP012", addedDate: new Date("2024-01-12"), createdAt: new Date("2024-01-12"), updatedAt: new Date("2024-01-12") },
  { _id: "stock_015", productId: "item_005", redeemCode: "VIPSTART-003-QRS345", addedDate: new Date("2024-01-13"), createdAt: new Date("2024-01-13"), updatedAt: new Date("2024-01-13") },

  // VIP 365 DAY stocks (cat_001)
  { _id: "stock_016", productId: "item_006", redeemCode: "VIP365-001-TUV678", addedDate: new Date("2024-01-20"), createdAt: new Date("2024-01-20"), updatedAt: new Date("2024-01-20") },
  { _id: "stock_017", productId: "item_006", redeemCode: "VIP365-002-WXY901", addedDate: new Date("2024-01-20"), createdAt: new Date("2024-01-20"), updatedAt: new Date("2024-01-20") },
];

export const MOCK_PURCHASES: PurchaseDocument[] = [
  {
    _id: "purchase_001",
    userId: "user_002",
    productId: "item_001",
    stockId: "stock_003",
    quantity: 1, // NEW
    totalPaid: 150000,
    paymentStatus: "completed", // NEW
    rating: 5,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    _id: "purchase_002",
    userId: "user_002",
    productId: "item_002",
    stockId: "stock_007",
    quantity: 2, // NEW
    totalPaid: 120000,
    paymentStatus: "completed", // NEW
    rating: 4,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    _id: "purchase_003",
    userId: "user_002",
    productId: "item_003",
    stockId: "stock_010",
    quantity: 5, // NEW
    totalPaid: 96500,
    paymentStatus: "completed", // NEW
    rating: null,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    _id: "purchase_004",
    userId: "user_002",
    productId: "item_004",
    stockId: "stock_011",
    quantity: 1, // NEW
    totalPaid: 280000,
    paymentStatus: "completed", // NEW
    rating: 5,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-05"),
  },
];