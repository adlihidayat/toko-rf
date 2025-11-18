// lib/midtrans/config.ts
// FORCE SANDBOX MODE FOR CLIENT DEMO

// Determine if we should use sandbox (forced to true for now)
const USE_SANDBOX = true; // Change to false when ready for production

export const midtransConfig = {
  // Server-side only (for API calls)
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',

  // Public client key (can be used in frontend)
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',

  // Force sandbox mode
  isProduction: !USE_SANDBOX,
  isSandbox: USE_SANDBOX,

  // Always use sandbox URLs when USE_SANDBOX is true
  apiUrl: USE_SANDBOX
    ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
    : 'https://app.midtrans.com/snap/v1/transactions',

  snapScriptUrl: USE_SANDBOX
    ? 'https://app.sandbox.midtrans.com/snap/snap.js'
    : 'https://app.midtrans.com/snap/snap.js',
};

// Helper to create Basic Auth string (server-side only)
export function createAuthString(serverKey: string): string {
  return Buffer.from(serverKey + ':').toString('base64');
}

// Export the environment mode for easy checking
export const MIDTRANS_MODE = USE_SANDBOX ? 'SANDBOX' : 'PRODUCTION';

console.log(`🔧 Midtrans Config: Running in ${MIDTRANS_MODE} mode`);