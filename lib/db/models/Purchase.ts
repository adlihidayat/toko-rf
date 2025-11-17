// lib/db/models/Purchase.ts
import mongoose, { Schema, Model } from 'mongoose';
import { PurchaseDocument } from '@/lib/types';

const PurchaseSchema = new Schema<PurchaseDocument>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      ref: 'Product',
    },
    stockId: {
      type: String,
      ref: 'Stock',
      default: null,
      // Not required initially - will be set after stock reservation
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 1,
      min: 1,
    },
    totalPaid: {
      type: Number,
      required: [true, 'Total paid is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ userId: 1 });
PurchaseSchema.index({ productId: 1 });
PurchaseSchema.index({ stockId: 1 });
PurchaseSchema.index({ paymentStatus: 1 });
PurchaseSchema.index({ userId: 1, paymentStatus: 1 });

const Purchase: Model<PurchaseDocument> =
  mongoose.models.Purchase || mongoose.model<PurchaseDocument>('Purchase', PurchaseSchema);

export default Purchase;