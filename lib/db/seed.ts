// lib/db/seed.ts
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 Checking environment variables...');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

import connectDB from './mongodb';
import User from './models/User';
import Category from './models/Category';
import Product from './models/Product';
import Stock from './models/Stock';
import Purchase from './models/Purchase';

async function seed() {
  try {
    console.log('🌱 Starting clean database seeding...');

    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Stock.deleteMany({}),
      Purchase.deleteMany({}),
    ]);

    console.log('✅ Old data cleared successfully!');

    // Seed Users
    console.log('👥 Seeding users...');
    const users = await User.insertMany([
      {
        username: "Admin User",
        email: "admin@gmail.com",
        phoneNumber: "+62812345678",
        password: "admin123",
        role: "admin",
        joinDate: new Date("2024-01-01"),
      },
      {
        username: "John Doe",
        email: "user@gmail.com",
        phoneNumber: "+62887654321",
        password: "user",
        role: "user",
        joinDate: new Date("2024-01-15"),
      },
    ]);

    // Seed Categories
    console.log('📁 Seeding categories...');
    const categories = await Category.insertMany([
      {
        name: "Red Finger",
        icon: "https://play-lh.googleusercontent.com/rIQfXlGFPq43FSm08tXZZyZ4ACKfFakH9Co-qI7lN4i2JE3Ln_59SR6N2M0oQfd12H0",
      },
      {
        name: "VSPhone",
        icon: "https://play-lh.googleusercontent.com/DnLMjCT5e9LI7nqywU9yFbh97oLdMnS1uaEcM5Id0UR4JS9OiByiKjsT9ytJE8uny4aj",
      },
    ]);

    // Seed Products
    console.log('📦 Seeding products...');
    const products = await Product.insertMany([
      {
        name: "VIP 90 DAY",
        price: 150000,
        minimumPurchase: 1,
        description: "90 days premium access to all features",
        categoryId: categories[0]._id.toString(),
        cpuCore: "8 core cpu",
        android: "Android 12",
        ram: "4G RAM",
        rom: "64G ROM",
        bit: "64 BIT",
        processor: "Qualcomm",
        reviews: 6521,
        badge: null,
      },
      {
        name: "VIP 30 DAY",
        price: 60000,
        minimumPurchase: 2,
        description: "30 days premium access to all features",
        categoryId: categories[1]._id.toString(),
        cpuCore: "6 core cpu",
        android: "Android 11",
        ram: "3G RAM",
        rom: "32G ROM",
        bit: "64 BIT",
        processor: "MediaTek",
        reviews: 3245,
        badge: "best-deal",
      },
      {
        name: "VIP 7 DAY",
        price: 19300,
        minimumPurchase: 5,
        description: "7 days premium access to all features",
        categoryId: categories[1]._id.toString(),
        cpuCore: "4 core cpu",
        android: "Android 10",
        ram: "2G RAM",
        rom: "16G ROM",
        bit: "32 BIT",
        processor: "Snapdragon",
        reviews: 1823,
        badge: null,
      },
      {
        name: "VIP 180 DAY",
        price: 280000,
        minimumPurchase: 1,
        description: "180 days premium access with bonus features",
        categoryId: categories[1]._id.toString(),
        cpuCore: "10 core cpu",
        android: "Android 13",
        ram: "8G RAM",
        rom: "128G ROM",
        bit: "64 BIT",
        processor: "Qualcomm Snapdragon 8",
        reviews: 8934,
        badge: null,
      },
      {
        name: "VIP STARTER",
        price: 29900,
        minimumPurchase: 3,
        description: "14 days starter package",
        categoryId: categories[1]._id.toString(),
        cpuCore: "4 core cpu",
        android: "Android 9",
        ram: "2G RAM",
        rom: "16G ROM",
        bit: "32 BIT",
        processor: "MediaTek Helio",
        reviews: 1250,
        badge: "new",
      },
      {
        name: "VIP 365 DAY",
        price: 500000,
        minimumPurchase: 1,
        description: "Full year premium access",
        categoryId: categories[0]._id.toString(),
        cpuCore: "12 core cpu",
        android: "Android 14",
        ram: "12G RAM",
        rom: "256G ROM",
        bit: "64 BIT",
        processor: "Qualcomm Snapdragon 8 Gen 3",
        reviews: 9876,
        badge: "popular",
      },
    ]);

    // Seed Stocks - All AVAILABLE with no purchase history
    console.log('📊 Seeding stocks - All available...');
    const now = new Date();
    const stocks = await Stock.insertMany([
      // VIP 90 DAY stocks (5 available)
      {
        productId: products[0]._id.toString(),
        redeemCode: "VIP90-001-ABC123",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[0]._id.toString(),
        redeemCode: "VIP90-002-DEF456",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[0]._id.toString(),
        redeemCode: "VIP90-003-GHI789",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[0]._id.toString(),
        redeemCode: "VIP90-004-JKL012",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[0]._id.toString(),
        redeemCode: "VIP90-005-MNO345",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      // VIP 30 DAY stocks (5 available)
      {
        productId: products[1]._id.toString(),
        redeemCode: "VIP30-001-PQR678",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[1]._id.toString(),
        redeemCode: "VIP30-002-STU901",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[1]._id.toString(),
        redeemCode: "VIP30-003-VWX234",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[1]._id.toString(),
        redeemCode: "VIP30-004-YZA567",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[1]._id.toString(),
        redeemCode: "VIP30-005-BCD890",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      // VIP 7 DAY stocks (4 available)
      {
        productId: products[2]._id.toString(),
        redeemCode: "VIP7-001-EFG123",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[2]._id.toString(),
        redeemCode: "VIP7-002-HIJ456",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[2]._id.toString(),
        redeemCode: "VIP7-003-KLM789",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[2]._id.toString(),
        redeemCode: "VIP7-004-NOP012",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      // VIP 180 DAY stocks (3 available)
      {
        productId: products[3]._id.toString(),
        redeemCode: "VIP180-001-QRS345",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[3]._id.toString(),
        redeemCode: "VIP180-002-TUV678",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[3]._id.toString(),
        redeemCode: "VIP180-003-WXY901",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      // VIP STARTER stocks (3 available)
      {
        productId: products[4]._id.toString(),
        redeemCode: "VIPSTART-001-ZAB234",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[4]._id.toString(),
        redeemCode: "VIPSTART-002-CDE567",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[4]._id.toString(),
        redeemCode: "VIPSTART-003-FGH890",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      // VIP 365 DAY stocks (5 available)
      {
        productId: products[5]._id.toString(),
        redeemCode: "VIP365-001-IJK123",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[5]._id.toString(),
        redeemCode: "VIP365-002-LMN456",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[5]._id.toString(),
        redeemCode: "VIP365-003-OPQ789",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[5]._id.toString(),
        redeemCode: "VIP365-004-RST012",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
      {
        productId: products[5]._id.toString(),
        redeemCode: "VIP365-005-UVW345",
        status: 'available',
        addedDate: now,
        purchaseId: null,
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Stocks: ${stocks.length}`);
    console.log(`    • 25 Available`);
    console.log(`    • 0 Pending`);
    console.log(`    • 0 Paid`);
    console.log(`  - Purchases: 0 (no purchase history)`);
    console.log('');
    console.log('✨ All stocks are ready to purchase!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();