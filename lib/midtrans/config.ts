// lib/midtrans/config.ts
export const midtransConfig = {
  // Server-side only (for API calls)
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',

  // Public client key (can be used in frontend)
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',

  isProduction: process.env.NODE_ENV === 'production',

  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions',

  snapScriptUrl: process.env.NODE_ENV === 'production'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js',
};

// Helper to create Basic Auth string (server-side only)
export function createAuthString(serverKey: string): string {
  return Buffer.from(serverKey + ':').toString('base64');
}