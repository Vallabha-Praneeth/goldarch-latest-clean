/**
 * E2E Tests: Authentication Flow
 *
 * Tests complete authentication user journeys:
 * 1. Sign up new user
 * 2. Sign in existing user
 * 3. Handle authentication errors
 * 4. Session persistence
 * 5. Sign out
 *
 * Uses cookie-based auth compatible with @supabase/ssr
 */

import { test, expect, BrowserContext } from '@playwright/test';
import { createClient, Session } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let testUser: {
  email: string;
  password: string;
  userId: string;
};
let testSession: Session;

/**
 * Get Supabase cookie name for local dev
 */
function getSupabaseCookieName(): string {
  try {
    const url = new URL(SUPABASE_URL);
    const host = url.hostname.split('.')[0];
    return `sb-${host}-auth-token`;
  } catch {
    return 'sb-localhost-auth-token';
  }
}

/**
 * Set auth cookies on browser context for API requests
 */
async function setAuthCookies(context: BrowserContext, session: Session): Promise<void> {
  const cookieName = getSupabaseCookieName();
  const domain = new URL(BASE_URL).hostname;

  const sessionData = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

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
  ]);
}

test.describe('Authentication Flow', () => {
  // Set up test user before all tests to ensure shared state is reliable
  test.beforeAll(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const timestamp = Date.now();
    const email = `auth-test-${timestamp}@example.com`;
    const password = 'SecurePassword123!';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error('No session returned');

    testUser = {
      email,
      password,
      userId: data.user!.id,
    };
    testSession = data.session;

    console.log(`Test user created: ${email}`);
  });

  test('should sign up a new user successfully', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const timestamp = Date.now();
    const email = `auth-test-signup-${timestamp}@example.com`;
    const password = 'SecurePassword123!';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
    expect(data.user?.email).toBe(email);
    expect(data.session).toBeTruthy();

    console.log(`User signed up successfully: ${email}`);
  });

  test('should reject duplicate sign up with same email', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: 'DifferentPassword123!',
    });

    // Supabase may return success for duplicate signups (email confirmation flow)
    // but the user should already exist
    if (!error) {
      // Verify it's the same user (not a new one)
      expect(data.user?.id).toBe(testUser.userId);
    }

    console.log('Duplicate signup handled correctly');
  });

  test('should sign in with correct credentials', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    expect(error).toBeNull();
    expect(data.session).toBeTruthy();
    expect(data.user?.id).toBe(testUser.userId);
    expect(data.session?.access_token).toBeTruthy();

    console.log('User signed in successfully');
  });

  test('should reject sign in with incorrect password', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'WrongPassword123!',
    });

    expect(error).toBeTruthy();
    expect(data.session).toBeNull();
    expect(error?.message).toContain('Invalid');

    console.log('Invalid password correctly rejected');
  });

  test('should reject sign in with non-existent email', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent-user-99999@example.com',
      password: 'SomePassword123!',
    });

    expect(error).toBeTruthy();
    expect(data.session).toBeNull();

    console.log('Non-existent user correctly rejected');
  });

  test('should maintain session after sign in', async ({ page }) => {
    // Sign in using Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    expect(error).toBeNull();
    expect(signInData.session?.access_token).toBeTruthy();

    // Set proper Supabase SSR session cookies
    await setAuthCookies(page.context(), signInData.session!);

    // Navigate to dashboard (should not redirect to login)
    await page.goto(`${BASE_URL}/app-dashboard`);

    // Should be on dashboard page
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page).toHaveURL(/\/app-dashboard/);

    console.log('Session persisted correctly');
  });

  test('should access protected API endpoint with valid session', async ({ page }) => {
    // Set auth cookies on context
    await setAuthCookies(page.context(), testSession);

    // Make authenticated API request (cookies are sent automatically)
    const response = await page.request.get(`${BASE_URL}/api/suppliers`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeTruthy();

    console.log('Authenticated API request successful');
  });

  test('should reject protected API endpoint without session', async ({ browser }) => {
    // Create a fresh context without auth cookies
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    // Make unauthenticated API request
    const response = await page.request.get(`${BASE_URL}/api/suppliers`);

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('unauthorized');

    await freshContext.close();

    console.log('Unauthenticated API request correctly rejected');
  });

  test('should sign out successfully', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
      },
    });

    const { error } = await supabase.auth.signOut();

    expect(error).toBeNull();

    // Verify session is cleared
    const { data: sessionData } = await supabase.auth.getSession();
    expect(sessionData.session).toBeNull();

    console.log('User signed out successfully');
  });
});
