// lib/types/product.ts
export interface ProductDocument {
  _id: string;
  name: string;
  price: number;
  stock: number;
  minimumPurchase: number;
  description: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  rating: number;
  reviews: number;
  isMostPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductProfile {
  _id: string;
  name: string;
  price: number;
  stock: number;
  minimumPurchase: number;
  description: string;
  rating: number;
  reviews: number;
  isMostPopular: boolean;
}

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  minimumPurchase: number;
  description: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  rating: number;
  reviews: number;
  isMostPopular: boolean;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  stock?: number;
  minimumPurchase?: number;
  description?: string;
  cpuCore?: string;
  android?: string;
  ram?: string;
  rom?: string;
  bit?: string;
  processor?: string;
  rating?: number;
  reviews?: number;
  isMostPopular?: boolean;
}