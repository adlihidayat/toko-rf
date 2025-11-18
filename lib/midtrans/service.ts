// lib/midtrans/service.ts
import { midtransConfig, createAuthString } from './config';

interface TransactionDetails {
  order_id: string;
  gross_amount: number;
}

interface CustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
}

interface ItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

interface SnapTokenRequest {
  transaction_details: TransactionDetails;
  customer_details: CustomerDetails;
  item_details?: ItemDetail[];
  credit_card?: {
    secure: boolean;
  };
}

interface SnapTokenResponse {
  token: string;
  redirect_url: string;
}

export class MidtransService {
  /**
   * Create Snap transaction token
   */
  static async createTransaction(
    orderId: string,
    grossAmount: number,
    customerDetails: CustomerDetails,
    itemDetails?: ItemDetail[]
  ): Promise<SnapTokenResponse> {
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY is not set');
      }

      const authString = createAuthString(serverKey);

      const requestBody: SnapTokenRequest = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        customer_details: customerDetails,
        credit_card: {
          secure: true,
        },
      };

      // Add item details if provided
      if (itemDetails && itemDetails.length > 0) {
        requestBody.item_details = itemDetails;
      }

      console.log('🔄 Midtrans API Request:', {
        url: midtransConfig.apiUrl,
        orderId,
        grossAmount,
        hasAuth: !!authString,
      });

      const response = await fetch(midtransConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Midtrans API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Midtrans API Error Response:', errorData);
        throw new Error(errorData.error_messages?.[0] || `Midtrans error: ${response.status}`);
      }

      const data: SnapTokenResponse = await response.json();
      console.log('✅ Midtrans token created successfully');
      return data;
    } catch (error) {
      console.error('❌ Midtrans transaction creation error:', error);
      throw error;
    }
  }

  /**
   * Verify transaction status from Midtrans notification
   */
  static async verifyTransactionStatus(orderId: string): Promise<any> {
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY is not set');
      }

      const authString = createAuthString(serverKey);
      const statusUrl = midtransConfig.isProduction
        ? `https://api.midtrans.com/v2/${orderId}/status`
        : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify transaction status');
      }

      return await response.json();
    } catch (error) {
      console.error('Transaction status verification error:', error);
      throw error;
    }
  }

  /**
   * Parse Midtrans notification to determine payment status
   */
  static parseNotificationStatus(notification: any): {
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    orderId: string;
    transactionStatus: string;
    fraudStatus: string;
  } {
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const orderId = notification.order_id;

    let status: 'pending' | 'completed' | 'failed' | 'cancelled' = 'pending';

    if (transactionStatus === 'capture') {
      status = fraudStatus === 'accept' ? 'completed' : 'pending';
    } else if (transactionStatus === 'settlement') {
      status = 'completed';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      status = 'failed';
    } else if (transactionStatus === 'pending') {
      status = 'pending';
    }

    return {
      status,
      orderId,
      transactionStatus,
      fraudStatus,
    };
  }
}