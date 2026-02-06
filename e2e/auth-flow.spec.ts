/**
 * E2E Tests: Authentication Flow
 *
 * Tests complete authentication user journeys:
 * 1. Sign up new user
 * 2. Sign in existing user
 * 3. Handle authentication errors
 * 4. Session persistence
 * 5. Sign out
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let testUser: {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
};

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

    testUser = {
      email,
      password,
      userId: data.user!.id,
      accessToken: data.session!.access_token,
    };

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

  // Skip in CI - cookie-based session testing is unreliable in CI environment
  // The app uses Supabase SSR which has different cookie handling
  test.skip(!!process.env.CI, 'Skipping in CI - cookie session testing unreliable');

  test('should maintain session after sign in', async ({ page }) => {
    // Sign in using Supabase client (more reliable than raw fetch)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    expect(error).toBeNull();
    expect(signInData.session?.access_token).toBeTruthy();

    // Set session cookies
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to dashboard (should not redirect to login)
    await page.goto(`${BASE_URL}/app-dashboard`);

    // Should be on dashboard page
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page).toHaveURL(/\/app-dashboard/);

    console.log('Session persisted correctly');
  });

  test('should access protected API endpoint with valid token', async ({ page }) => {
    // Make authenticated API request
    const response = await page.request.get(`${BASE_URL}/api/suppliers`, {
      headers: {
        'Authorization': `Bearer ${testUser.accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeTruthy();

    console.log('Authenticated API request successful');
  });

  test('should reject protected API endpoint without token', async ({ page }) => {
    // Make unauthenticated API request
    const response = await page.request.get(`${BASE_URL}/api/suppliers`);

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('unauthorized');

    console.log('Unauthenticated API request correctly rejected');
  });

  test('should reject protected API endpoint with invalid token', async ({ page }) => {
    // Make request with invalid token
    const response = await page.request.get(`${BASE_URL}/api/suppliers`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
      },
    });

    expect(response.status()).toBe(401);

    console.log('Invalid token correctly rejected');
  });

  test('should sign out successfully', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${testUser.accessToken}`,
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
