// lib/midtrans/config.ts
export const midtransConfig = {
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
  snapScriptUrl: process.env.NODE_ENV === 'production'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js',
};

// Helper to create Basic Auth string
export function createAuthString(serverKey: string): string {
  return Buffer.from(serverKey + ':').toString('base64');
}