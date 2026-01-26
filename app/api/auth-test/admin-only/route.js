/**
 * Admin-Only Test Route - Verify role-based access control
 *
 * This endpoint requires Admin role.
 * Access: http://localhost:3000/api/auth-test/admin-only
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/middleware/api-auth';

async function handler(req) {
  return NextResponse.json({
    success: true,
    message: '✅ Admin access granted!',
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
    },
    timestamp: new Date().toISOString(),
  });
}

// Export with Admin role requirement
export const GET = withApiAuth(handler, { requiredRole: 'Admin' });
