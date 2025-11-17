// lib/db/models/Stock.ts
import mongoose, { Schema, Model } from 'mongoose';
import { StockDocument } from '@/lib/types';

const StockSchema = new Schema<StockDocument>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      ref: 'Product',
      index: true,
    },
    redeemCode: {
      type: String,
      required: [true, 'Redeem code is required'],
      unique: true,
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
    purchaseId: {
      type: String,
      ref: 'Purchase',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['available', 'pending', 'paid'],
      default: 'available',
      index: true,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
StockSchema.index({ productId: 1, status: 1 });
StockSchema.index({ status: 1, productId: 1 });

const Stock: Model<StockDocument> =
  mongoose.models.Stock || mongoose.model<StockDocument>('Stock', StockSchema);

export default Stock;