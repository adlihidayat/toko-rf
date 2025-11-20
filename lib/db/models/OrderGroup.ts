// lib/db/models/OrderGroup.ts - FIXED
import mongoose, { Schema, Model } from 'mongoose';

export interface OrderGroupDocument {
  _id?: string;
  userId: string;
  productId: string;
  stockIds: string[];
  quantity: number;
  totalPaid: number;
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
  midtransOrderId: string;
  midtransTransactionId?: string;
  rating?: number | null;
  reservedAt?: Date;
  paidAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderGroupSchema = new Schema<OrderGroupDocument>(
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
    stockIds: {
      type: [String],
      required: [true, 'Stock IDs are required'],
      default: [],
      ref: 'Stock',
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
    midtransOrderId: {
      type: String,
      default: null, // Changed from required to optional with default
      unique: true,
      sparse: true, // Allow null values to be unique
      index: true,
    },
    midtransTransactionId: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
OrderGroupSchema.index({ userId: 1 });
OrderGroupSchema.index({ productId: 1 });
OrderGroupSchema.index({ paymentStatus: 1 });
OrderGroupSchema.index({ userId: 1, paymentStatus: 1 });
OrderGroupSchema.index({ midtransOrderId: 1 });
OrderGroupSchema.index({ expiresAt: 1 });
OrderGroupSchema.index({ createdAt: -1 });

// TTL index to auto-delete expired pending orders (optional)
OrderGroupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OrderGroup: Model<OrderGroupDocument> =
  mongoose.models.OrderGroup ||
  mongoose.model<OrderGroupDocument>('OrderGroup', OrderGroupSchema);

export default OrderGroup;