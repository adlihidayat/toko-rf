// lib/utils/admin-auth.ts
import { NextRequest } from 'next/server';

/**
 * Verify admin access for API routes
 * Returns true if user is admin, false otherwise
 */
export function verifyAdminAccess(request: NextRequest): boolean {
  const userRole = request.cookies.get('user-role')?.value;

  if (userRole !== 'admin') {
    console.warn('🚫 Admin API accessed by non-admin user (role: %s)', userRole || 'none');
    return false;
  }

  return true;
}