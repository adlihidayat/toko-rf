import { StockService } from "@/lib/db/services/stocks";
import { NextRequest, NextResponse } from "next/server";

export async function GET_BY_ID(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const stock = await StockService.getStockById(id);

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    // ============ SECURITY: Strip redeem code ============
    const { redeemCode, ...safeStock } = stock;

    return NextResponse.json({ success: true, data: safeStock });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}

export async function PUT_BY_ID(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // ============ SECURITY: Prevent users from updating redeem codes ============
    if (body.redeemCode) {
      return NextResponse.json(
        { success: false, error: 'Cannot update redeem code' },
        { status: 403 }
      );
    }

    const stock = await StockService.updateStock(id, body);

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    // ============ SECURITY: Strip redeem code ============
    const { redeemCode, ...safeStock } = stock;

    return NextResponse.json({ success: true, data: safeStock });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

export async function DELETE_BY_ID(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await StockService.deleteStock(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Stock deleted' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete stock' },
      { status: 500 }
    );
  }
}