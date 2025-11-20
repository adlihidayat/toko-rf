// lib/db/models/Stock.ts - UPDATED
import mongoose, { Schema, Model } from 'mongoose';

export interface StockDocument {
  _id?: string;
  productId: string;
  redeemCode: string;
  addedDate?: Date;
  orderGroupId?: string | null; // Links to OrderGroup instead of individual purchase
  status: "available" | "pending" | "paid";
  reservedAt?: Date | null;
  paidAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

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
      sparse: true,
    },
    addedDate: {
      type: Date,
      default: () => new Date(),
    },
    orderGroupId: {
      type: String,
      default: null,
      ref: 'OrderGroup',
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

StockSchema.index({ productId: 1, status: 1 });
StockSchema.index({ orderGroupId: 1 });
StockSchema.index({ status: 1 });

const Stock: Model<StockDocument> =
  mongoose.models.Stock || mongoose.model<StockDocument>('Stock', StockSchema);

export default Stock;
