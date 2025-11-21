// lib/db/models/OrderGroup.ts - COMPLETE FIX

import mongoose, { Schema, Document } from 'mongoose';

export interface OrderGroupDocument extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  stockIds: mongoose.Types.ObjectId[];
  quantity: number;
  totalPaid: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  midtransOrderId: string;
  midtransTransactionId?: string;
  snapToken?: string; // ✅ ADD THIS TO INTERFACE
  rating?: number | null;
  reservedAt: Date;
  paidAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderGroupSchema = new Schema<OrderGroupDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    stockIds: [{ type: Schema.Types.ObjectId, ref: 'Stock' }],
    quantity: { type: Number, required: true },
    totalPaid: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    midtransOrderId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    midtransTransactionId: {
      type: String,
      sparse: true,
    },
    // ✅ FIX: ADD THIS FIELD TO SCHEMA
    snapToken: {
      type: String,
      default: null,
      sparse: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
      sparse: true,
    },
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Optional: Add index for faster lookups
OrderGroupSchema.index({ midtransOrderId: 1 });
OrderGroupSchema.index({ userId: 1, paymentStatus: 1 });
OrderGroupSchema.index({ paymentStatus: 1 });

const OrderGroup = mongoose.models.OrderGroup || mongoose.model<OrderGroupDocument>('OrderGroup', OrderGroupSchema);

export default OrderGroup;