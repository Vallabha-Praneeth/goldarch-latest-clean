/**
 * MODULE-0A: Auth Enforcement Layer
 * File: middleware/api-auth.ts
 *
 * Purpose: API route protection middleware
 * Status: INTEGRATED - Real Supabase authentication
 *
 * This middleware wraps API routes to enforce authentication.
 * Use this to protect API endpoints from unauthorized access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export interface ApiAuthOptions {
  /**
   * Whether to require authentication (default: true)
   */
  requireAuth?: boolean;

  /**
   * Required role to access this endpoint (optional)
   * If specified, user must have this role in user_roles table
   */
  requiredRole?: 'Admin' | 'Manager' | 'Viewer' | 'Procurement';

  /**
   * Custom error message for unauthorized access
   */
  unauthorizedMessage?: string;
}

export type ApiHandler = (
  req: AuthenticatedRequest
) => Promise<NextResponse> | NextResponse;

// ============================================================================
// SKELETON IMPLEMENTATION
// ============================================================================

/**
 * Wraps an API route handler with authentication enforcement
 *
 * @example
 * ```typescript
 * // In app/api/suppliers/route.ts
 * import { withApiAuth } from '@/modules/MODULE-0A/middleware/api-auth';
 *
 * export const GET = withApiAuth(async (req) => {
 *   // req.user is available here
 *   const userId = req.user?.id;
 *   // ... your logic
 *   return NextResponse.json({ data: [] });
 * }, { requireAuth: true });
 * ```
 */
export function withApiAuth(
  handler: ApiHandler,
  options: ApiAuthOptions = {}
): ApiHandler {
  return async (req: AuthenticatedRequest) => {
    const {
      requireAuth = true,
      requiredRole,
      unauthorizedMessage = 'Unauthorized',
    } = options;

    if (requireAuth) {
      // Create server-side Supabase client that reads from request cookies
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              // Not needed for API routes
            },
            remove(name: string, options: any) {
              // Not needed for API routes
            },
          },
        }
      );

      // Get user from session (reads from cookies)
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return unauthorized(unauthorizedMessage);
      }

      // Get user role from database
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email || '',
        role: userRole?.role || undefined,
      };

      // Check role requirements
      if (requiredRole && req.user.role !== requiredRole) {
        return forbidden(`This endpoint requires ${requiredRole} role`);
      }
    }

    // Call the actual handler
    return handler(req);
  };
}

/**
 * Returns a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Returns a 403 Forbidden response
 */
export function forbidden(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

// ============================================================================
// INTEGRATION NOTES
// ============================================================================

/**
 * INTEGRATION STEPS:
 *
 * 1. Import this middleware in your API route:
 *    import { withApiAuth } from '@/modules/MODULE-0A/middleware/api-auth';
 *
 * 2. Wrap your handler:
 *    export const GET = withApiAuth(async (req) => {
 *      // Your logic here
 *    });
 *
 * 3. Access user info:
 *    const userId = req.user?.id;
 *    const userRole = req.user?.role;
 *
 * 4. Specify options:
 *    withApiAuth(handler, {
 *      requireAuth: true,
 *      requiredRole: 'Admin'
 *    });
 *
 * DEPENDENCIES:
 * - Requires Supabase client for session validation
 * - Requires MODULE-0B (RBAC) for role checking
 * - Uses session-validator.ts for token validation
 *
 * TODO (Full Implementation):
 * - Extract token from Authorization header
 * - Validate token with Supabase auth.getUser()
 * - Fetch user role from user_roles table
 * - Implement proper error responses
 * - Add request logging/audit trail
 */
