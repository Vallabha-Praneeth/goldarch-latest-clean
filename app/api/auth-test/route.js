/**
 * Test API Route - Verify MODULE-0A authentication works
 *
 * This endpoint tests the auth middleware integration.
 * Access: http://localhost:3000/api/auth-test
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../lib/middleware/api-auth';

async function handler(req) {
  return NextResponse.json({
    success: true,
    message: '✅ Authentication working!',
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
    },
    timestamp: new Date().toISOString(),
  });
}

// Export with authentication middleware
export const GET = withApiAuth(handler);
