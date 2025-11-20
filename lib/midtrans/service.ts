// lib/midtrans/service.ts - COMPLETE UPDATED VERSION
import { midtransConfig, createAuthString, MIDTRANS_MODE } from './config';

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
  // lib/midtrans/service.ts - ADD THIS TO YOUR EXISTING FILE
  // Replace the createTransaction method with this improved version:

  static async createTransaction(
    orderId: string,
    grossAmount: number,
    customerDetails: CustomerDetails,
    itemDetails?: ItemDetail[]
  ): Promise<SnapTokenResponse> {
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        console.error('❌ MIDTRANS_SERVER_KEY is not set in environment variables');
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
        mode: MIDTRANS_MODE,
        url: midtransConfig.apiUrl,
        orderId,
        grossAmount,
        customerEmail: customerDetails.email,
        serverKey: serverKey.substring(0, 15) + '...',
      });

      console.log('📤 Request body being sent:', JSON.stringify(requestBody, null, 2));

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
      console.log('📡 Response Headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });

      const responseText = await response.text();
      console.log('📡 Response Body:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error_message: responseText };
        }

        console.error('❌ Midtrans API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        const errorMessage =
          errorData.error_messages?.[0] ||
          errorData.error_message ||
          `Midtrans error: ${response.status} ${response.statusText}`;

        throw new Error(errorMessage);
      }

      let data: SnapTokenResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse Midtrans response:', parseError);
        console.error('Response was:', responseText);
        throw new Error('Invalid response from Midtrans API');
      }

      if (!data.token) {
        console.error('❌ No token in Midtrans response:', data);
        throw new Error('No token received from Midtrans');
      }

      console.log('✅ Midtrans token created successfully:', {
        tokenPreview: data.token.substring(0, 20) + '...',
        mode: MIDTRANS_MODE,
        redirectUrl: data.redirect_url,
      });

      return data;
    } catch (error) {
      console.error('❌ Midtrans transaction creation error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * Get transaction status from Midtrans
   * Used to verify payment status from gateway
   * 
   * @param orderId The order ID to check
   * @returns Transaction details from Midtrans including status, transaction ID, etc.
   */
  static async getTransactionStatus(orderId: string): Promise<any> {
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY is not set');
      }

      const authString = createAuthString(serverKey);

      // Use the correct URL based on sandbox/production mode
      const statusUrl = midtransConfig.isSandbox
        ? `https://api.sandbox.midtrans.com/v2/${orderId}/status`
        : `https://api.midtrans.com/v2/${orderId}/status`;

      console.log('🔍 Querying Midtrans transaction status:', {
        orderId,
        mode: MIDTRANS_MODE,
        url: statusUrl,
      });

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Midtrans status query failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          `Failed to query transaction status: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log('📊 Midtrans transaction status response:', {
        order_id: data.order_id,
        transaction_id: data.transaction_id,
        status_code: data.status_code,
        transaction_status: data.transaction_status,
        fraud_status: data.fraud_status,
        settlement_time: data.settlement_time,
        gross_amount: data.gross_amount,
      });

      return data;
    } catch (error) {
      console.error('❌ Transaction status verification error:', error);
      throw error;
    }
  }

  /**
   * Verify transaction status from Midtrans notification
   * @deprecated Use getTransactionStatus instead
   */
  static async verifyTransactionStatus(orderId: string): Promise<any> {
    console.warn('⚠️ verifyTransactionStatus is deprecated. Use getTransactionStatus instead.');
    return this.getTransactionStatus(orderId);
  }

  /**
   * Parse Midtrans notification to determine payment status
   * 
   * @param notification Midtrans webhook notification object
   * @returns Parsed status information
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

    // Settlement is always success
    if (transactionStatus === 'settlement') {
      status = 'completed';
      console.log('✅ Transaction settled - status: completed');
    }
    // Capture might be challenged
    else if (transactionStatus === 'capture') {
      status = fraudStatus === 'accept' ? 'completed' : 'pending';
      if (fraudStatus === 'accept') {
        console.log('✅ Transaction captured and accepted - status: completed');
      } else if (fraudStatus === 'challenge') {
        console.log('⚠️ Transaction captured but challenged - status: pending');
      }
    }
    // Pending is still pending
    else if (transactionStatus === 'pending') {
      status = 'pending';
      console.log('⏳ Transaction still pending - status: pending');
    }
    // Deny, cancel, expire are all failures
    else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      status = 'failed';
      console.log(`❌ Transaction ${transactionStatus} - status: failed`);
    }

    console.log('📊 Parsed notification:', {
      status,
      transactionStatus,
      fraudStatus,
      orderId,
      mode: MIDTRANS_MODE,
    });

    return {
      status,
      orderId,
      transactionStatus,
      fraudStatus,
    };
  }

  /**
   * Check if transaction is actually paid (safe to release redeem codes)
   * 
   * @param transactionStatus Status from Midtrans
   * @param fraudStatus Fraud status from Midtrans
   * @returns true if payment is confirmed and safe to use
   */
  static isTransactionSuccessful(
    transactionStatus: string,
    fraudStatus?: string
  ): boolean {
    // Settlement is always success
    if (transactionStatus === 'settlement') {
      console.log('✅ Transaction is successful (settlement)');
      return true;
    }

    // Capture without challenge is success
    if (transactionStatus === 'capture' && fraudStatus === 'accept') {
      console.log('✅ Transaction is successful (capture accepted)');
      return true;
    }

    console.log('❌ Transaction is not successful:', {
      transactionStatus,
      fraudStatus,
    });
    return false;
  }

  /**
   * Get user-friendly status message
   * 
   * @param status Payment status
   * @returns User-friendly message
   */
  static getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      completed: '✅ Payment successful! Your redeem codes are ready.',
      pending: '⏳ Payment is still pending. Please complete the transaction.',
      failed: '❌ Payment failed or was cancelled. Please try again.',
      cancelled: '❌ Payment was cancelled. Please try again.',
    };

    return messages[status] || '❓ Unknown status. Please contact support.';
  }

  /**
   * Get transaction details with full information
   * 
   * @param orderId The order ID
   * @returns Transaction object with all details
   */
  static async getTransactionDetails(orderId: string): Promise<any> {
    try {
      console.log('📋 Fetching full transaction details for:', orderId);

      const transactionData = await this.getTransactionStatus(orderId);
      const parsedStatus = this.parseNotificationStatus(transactionData);
      const isSuccessful = this.isTransactionSuccessful(
        transactionData.transaction_status,
        transactionData.fraud_status
      );

      return {
        orderId: transactionData.order_id,
        transactionId: transactionData.transaction_id,
        status: parsedStatus.status,
        isSuccessful,
        transactionStatus: transactionData.transaction_status,
        fraudStatus: transactionData.fraud_status,
        amount: transactionData.gross_amount,
        paymentType: transactionData.payment_type,
        bank: transactionData.bank,
        settlementTime: transactionData.settlement_time,
        transactionTime: transactionData.transaction_time,
        statusMessage: this.getStatusMessage(parsedStatus.status),
      };
    } catch (error) {
      console.error('❌ Failed to get transaction details:', error);
      throw error;
    }
  }
}