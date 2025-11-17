// app/api/stocks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/db/services/stocks';

export async function GET() {
  try {
    const stocks = await StockService.getAllStocksWithProductInfo();
    return NextResponse.json({ success: true, data: stocks });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.productId || !body.redeemCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const stock = await StockService.createStock(body);
    return NextResponse.json({ success: true, data: stock }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stock' },
      { status: 500 }
    );
  }
}