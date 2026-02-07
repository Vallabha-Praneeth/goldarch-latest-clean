/**
 * E2E Test Authentication Helpers
 *
 * Provides utilities for setting up Supabase SSR-compatible authentication
 * in Playwright tests. The API routes use cookie-based auth via @supabase/ssr,
 * so tests must set proper cookies instead of Bearer tokens.
 */

import { Page, BrowserContext } from '@playwright/test';
import { createClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Get the cookie name used by Supabase SSR
 * Format: sb-<host>-auth-token
 */
function getSupabaseCookieName(): string {
  try {
    const url = new URL(SUPABASE_URL);
    // For local: 127.0.0.1 -> sb-127-auth-token
    // For hosted: xyz.supabase.co -> sb-xyz-auth-token
    const host = url.hostname.split('.')[0];
    return `sb-${host}-auth-token`;
  } catch {
    return 'sb-localhost-auth-token';
  }
}

/**
 * Create a test user and return the session
 */
export async function createTestUser(emailPrefix: string = 'e2e-test'): Promise<{
  user: any;
  session: Session;
  supabase: ReturnType<typeof createClient>;
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const timestamp = Date.now();
  const email = `${emailPrefix}-${timestamp}@test.local`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'TestPassword123!',
  });

  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Failed to create test user');

  // Create authenticated client for DB operations
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    },
  });

  return {
    user: data.user,
    session: data.session,
    supabase: authClient,
  };
}

/**
 * Set Supabase auth cookies on a Playwright page context
 * This enables cookie-based authentication for API routes
 */
export async function setAuthCookies(
  context: BrowserContext,
  session: Session
): Promise<void> {
  const cookieName = getSupabaseCookieName();

  // Supabase SSR stores the session as a JSON-encoded cookie
  // The cookie value format depends on the Supabase version
  // Modern @supabase/ssr uses chunked cookies for large tokens
  const sessionData = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

  // For local development, set on localhost
  const domain = new URL(BASE_URL).hostname;

  // Set the main auth cookie
  await context.addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(sessionData),
      domain,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    // Also set as base64 for compatibility
    {
      name: `${cookieName}.0`,
      value: Buffer.from(sessionData).toString('base64'),
      domain,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Make an authenticated API request using cookies
 * This is the preferred method for E2E tests
 */
export async function authenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any
): Promise<any> {
  const options: any = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.data = data;
  }

  const response = await page.request[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
    url,
    options
  );

  return response;
}

/**
 * Clean up test user (for afterAll hooks)
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // Note: In local dev, test users persist unless explicitly deleted
  // For production tests, use Supabase Admin API to delete users
  console.log(`[E2E] Test user ${userId} should be cleaned up manually or via admin API`);
}
