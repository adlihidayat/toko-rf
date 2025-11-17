// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db/services/categories';

export async function GET() {
  try {
    const categories = await CategoryService.getAllCategoriesWithStockCount();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📝 Creating category:', body);

    if (!body.name || !body.icon) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name and icon' },
        { status: 400 }
      );
    }

    const category = await CategoryService.createCategory(body);
    console.log('✅ Category created:', category);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create category'
      },
      { status: 500 }
    );
  }
}