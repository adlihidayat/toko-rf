// lib/types/purchase.ts
export interface PurchaseDocument {
  _id: string;
  userId: string;
  itemId: string;
  amount: number;
  totalPaid: number;
  rating?: number;
  redeemCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseWithDetails extends PurchaseDocument {
  itemName: string;
  itemPrice: number;
}

