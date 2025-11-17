// lib/db/models/Category.ts
import mongoose, { Schema, Model } from 'mongoose';
import { CategoryDocument } from '@/lib/types';

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: [true, 'Icon URL is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ name: 1 });

const Category: Model<CategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<CategoryDocument>('Category', CategorySchema);

export default Category;