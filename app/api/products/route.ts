// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db/services/products';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const products = await ProductService.getAllProducts();

    return NextResponse.json({
      success: true,
      data: products,
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

// POST /api/products - Create a new product
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