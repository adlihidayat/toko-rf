// ============================================================
// FILE 5: app/api/products/route.ts - UPDATE GET for minimumPurchase
// ============================================================
// ONLY UPDATE THE GET HANDLER

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db/services/products';
import { StockService } from '@/lib/db/services/stocks';

export async function GET(request: NextRequest) {
  try {
    const products = await ProductService.getAllProducts();

    // ✅ NEW: Get stock counts and check against minimumPurchase
    const productsWithStockStatus = await Promise.all(
      products.map(async (product) => {
        const availableCount = await StockService.getAvailableStockCount(
          product._id?.toString() || ''
        );

        // ✅ Changed: Out of stock = available < minimumPurchase
        const isOutOfStock = availableCount < (product.minimumPurchase || 1);

        return {
          ...product,
          availableStockCount: availableCount,
          isOutOfStock,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: productsWithStockStatus,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'name',
      'price',
      'minimumPurchase',
      'description',
      'categoryId',
      'cpuCore',
      'android',
      'ram',
      'rom',
      'bit',
      'processor',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    const product = await ProductService.createProduct(body);

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}