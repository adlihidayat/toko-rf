// app/api/products/featured/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/db/services/products";

// GET /api/products/featured - Get products with badges (limit 3)
export async function GET(request: NextRequest) {
  try {
    const products = await ProductService.getFeaturedProducts();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch featured products",
      },
      { status: 500 }
    );
  }
}
