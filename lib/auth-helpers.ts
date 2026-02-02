/**
 * Authentication Helpers for API Routes
 * Provides reusable authentication and user retrieval functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Get authenticated user from request
 * Returns user object or null if not authenticated
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: User | null; error: Error | null }> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { user: null, error: authError };
    }

    if (!user) {
      return { user: null, error: new Error('User not authenticated') };
    }

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Authentication failed'),
    };
  }
}

/**
 * Require authentication middleware
 * Returns 401 response if user is not authenticated
 * Returns user object if authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User; response: null } | { user: null; response: NextResponse }> {
  const { user, error } = await getAuthenticatedUser(request);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource',
        },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

/**
 * Create Supabase server client for authenticated requests
 */
export async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

/**
 * Rate limiting using Upstash Redis
 * Production-grade with persistence and sliding window algorithm
 *
 * Note: This is a compatibility wrapper. For better type safety,
 * use the specific rate limiters from lib/rate-limit.ts directly.
 */

/**
 * Check rate limit with Upstash Redis
 * @param userId - User ID to rate limit
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 1 minute)
 *
 * Note: For production use, prefer the specific rate limiters from lib/rate-limit.ts
 */
export async function checkRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; retryAfter?: number; limit?: number; remaining?: number }> {
  try {
    // Lazy import to avoid circular dependencies
    const { createRateLimit, checkRateLimit: checkRL } = await import('./rate-limit');

    // Create a dynamic rate limiter for this specific limit
    const windowSeconds = Math.ceil(windowMs / 1000);
    const rateLimiter = createRateLimit(maxRequests, `${windowSeconds} s`, 'dynamic');

    // Check the limit
    const result = await checkRL(rateLimiter, userId);

    return {
      allowed: result.allowed,
      retryAfter: result.retryAfter,
      limit: result.limit,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow the request if Redis is down
    // In production, you might want to fail closed instead
    return { allowed: true };
  }
}

/**
 * CORS headers for API routes
 * In production, restrict to allowed origins via ALLOWED_ORIGINS env var
 * In development, allows all origins for local testing
 */
export function getCORSHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

  // In production with ALLOWED_ORIGINS set, validate origin
  const allowedOrigin =
    process.env.NODE_ENV === 'production' && allowedOrigins.length > 0
      ? (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
      : (origin || '*'); // Development: allow all

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleCORSOptions(origin?: string) {
  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders(origin),
  });
}
