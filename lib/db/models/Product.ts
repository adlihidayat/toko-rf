// lib/db/models/Product.ts
import mongoose, { Schema, Model } from 'mongoose';
import { ProductDocument } from '@/lib/types';

const ProductSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    minimumPurchase: {
      type: Number,
      required: [true, 'Minimum purchase is required'],
      min: [1, 'Minimum purchase must be at least 1'],
      default: 1,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    categoryId: {
      type: String,
      required: [true, 'Category ID is required'],
      ref: 'Category',
    },
    cpuCore: {
      type: String,
      required: true,
    },
    android: {
      type: String,
      required: true,
    },
    ram: {
      type: String,
      required: true,
    },
    rom: {
      type: String,
      required: true,
    },
    bit: {
      type: String,
      required: true,
    },
    processor: {
      type: String,
      required: true,
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews cannot be negative'],
    },
    badge: {
      type: String,
      enum: ['new', 'best-deal', 'popular', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ badge: 1 });

const Product: Model<ProductDocument> =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>('Product', ProductSchema);

export default Product;