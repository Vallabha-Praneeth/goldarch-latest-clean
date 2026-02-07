/**
 * E2E Tests: Supplier Access Filtering
 *
 * Tests the complete supplier access control flow:
 * 1. Admin creates access rules
 * 2. Restricted users see filtered supplier lists
 * 3. Admin users see all suppliers
 *
 * Uses cookie-based auth compatible with @supabase/ssr
 */

import { test, expect, BrowserContext } from '@playwright/test';
import { createClient, Session } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let supabaseAdmin: ReturnType<typeof createClient>;
let testOrg: any;
let adminUser: any;
let adminSession: Session;
let restrictedUser: any;
let restrictedSession: Session;
let kitchenCategory: any;
let bathroomCategory: any;
let kitchenSupplier: any;
let bathroomSupplier: any;

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

test.beforeAll(async () => {
  // Initialize Supabase anon client
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Create admin user first
  const { data: authAdmin, error: adminAuthError } = await anonClient.auth.signUp({
    email: `admin-filter-${Date.now()}@test.local`,
    password: 'TestPassword123!',
  });

  if (adminAuthError) throw adminAuthError;
  if (!authAdmin.user || !authAdmin.session) {
    throw new Error('Failed to create admin user or get session');
  }
  adminUser = authAdmin.user;
  adminSession = authAdmin.session;

  // Create authenticated client for admin
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authAdmin.session.access_token}`,
      },
    },
  });

  // Create test organization (with authenticated user, created_by will be set)
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name: 'E2E Test Org - Supplier Filter',
    })
    .select()
    .single();

  if (orgError) throw orgError;
  testOrg = org;

  // Use admin client as the main test client for subsequent operations
  supabaseAdmin = adminClient;

  // Add admin to organization as owner
  const { error: adminMemberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      org_id: testOrg.id,
      user_id: adminUser.id,
      role: 'owner',
    });

  if (adminMemberError) throw adminMemberError;

  // Create restricted user
  const { data: authRestricted, error: restrictedAuthError } = await anonClient.auth.signUp({
    email: `restricted-filter-${Date.now()}@test.local`,
    password: 'TestPassword123!',
  });

  if (restrictedAuthError) throw restrictedAuthError;
  if (!authRestricted.session) throw new Error('No session for restricted user');
  restrictedUser = authRestricted.user;
  restrictedSession = authRestricted.session;

  // Add restricted user to organization as viewer
  const { error: restrictedMemberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      org_id: testOrg.id,
      user_id: restrictedUser.id,
      role: 'viewer',
    });

  if (restrictedMemberError) throw restrictedMemberError;

  // Create unique test categories (don't use seeded data)
  const timestamp = Date.now();
  const { data: kitchen, error: kitchenError } = await supabaseAdmin
    .from('categories')
    .insert({
      name: `Test-Kitchen-${timestamp}`,
      description: 'Test category for e2e - Kitchen fixtures and appliances',
    })
    .select()
    .single();

  if (kitchenError) throw kitchenError;
  kitchenCategory = kitchen;

  const { data: bathroom, error: bathroomError } = await supabaseAdmin
    .from('categories')
    .insert({
      name: `Test-Bathroom-${timestamp}`,
      description: 'Test category for e2e - Bathroom fixtures and fittings',
    })
    .select()
    .single();

  if (bathroomError) throw bathroomError;
  bathroomCategory = bathroom;

  // Create test suppliers
  const { data: kitchenSup, error: kitchenSupError } = await supabaseAdmin
    .from('suppliers')
    .insert({
      name: 'Kitchen Suppliers Inc',
      category_id: kitchenCategory.id,
      region: 'north',
      city: 'Mumbai',
      email: 'kitchen@suppliers.test',
    })
    .select()
    .single();

  if (kitchenSupError) throw kitchenSupError;
  kitchenSupplier = kitchenSup;

  const { data: bathroomSup, error: bathroomSupError } = await supabaseAdmin
    .from('suppliers')
    .insert({
      name: 'Bathroom Fixtures Ltd',
      category_id: bathroomCategory.id,
      region: 'south',
      city: 'Bangalore',
      email: 'bathroom@fixtures.test',
    })
    .select()
    .single();

  if (bathroomSupError) throw bathroomSupError;
  bathroomSupplier = bathroomSup;
});

test.afterAll(async () => {
  // Cleanup: Delete test data
  if (kitchenSupplier) {
    await supabaseAdmin.from('suppliers').delete().eq('id', kitchenSupplier.id);
  }
  if (bathroomSupplier) {
    await supabaseAdmin.from('suppliers').delete().eq('id', bathroomSupplier.id);
  }
  if (kitchenCategory) {
    await supabaseAdmin.from('categories').delete().eq('id', kitchenCategory.id);
  }
  if (bathroomCategory) {
    await supabaseAdmin.from('categories').delete().eq('id', bathroomCategory.id);
  }
  if (restrictedUser) {
    await supabaseAdmin.from('organization_members').delete().eq('user_id', restrictedUser.id);
  }
  if (adminUser) {
    await supabaseAdmin.from('organization_members').delete().eq('user_id', adminUser.id);
  }
  if (testOrg) {
    await supabaseAdmin.from('organizations').delete().eq('id', testOrg.id);
  }
});

test.describe('Supplier Access Control', () => {
  test('admin can create access rule for restricted user', async ({ page }) => {
    // Set admin auth cookies
    await setAuthCookies(page.context(), adminSession);

    // Create access rule via API
    const response = await page.request.post(`${BASE_URL}/api/suppliers/access-rules`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        user_id: restrictedUser.id,
        rule_data: {
          categories: [kitchenCategory.id],
          regions: ['north'],
        },
        notes: 'Test access rule - Kitchen suppliers in North region only',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user_id).toBe(restrictedUser.id);
  });

  test('restricted user sees only filtered suppliers', async ({ page }) => {
    // Set restricted user auth cookies
    await setAuthCookies(page.context(), restrictedSession);

    // Fetch suppliers via API
    const response = await page.request.get(`${BASE_URL}/api/suppliers`);

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    const suppliers = responseData.data || [];

    // Should see kitchen supplier (filtered)
    const kitchenSup = suppliers.find((s: any) => s.name === 'Kitchen Suppliers Inc');
    expect(kitchenSup).toBeDefined();

    // Should NOT see bathroom supplier (filtered out)
    const bathroomSup = suppliers.find((s: any) => s.name === 'Bathroom Fixtures Ltd');
    expect(bathroomSup).toBeUndefined();
  });

  test('admin sees all suppliers', async ({ page }) => {
    // Set admin auth cookies
    await setAuthCookies(page.context(), adminSession);

    // Fetch suppliers via API
    const response = await page.request.get(`${BASE_URL}/api/suppliers`);

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    const suppliers = responseData.data || [];

    // Admin should see both suppliers (no filtering)
    const kitchenSup = suppliers.find((s: any) => s.name === 'Kitchen Suppliers Inc');
    expect(kitchenSup).toBeDefined();

    const bathroomSup = suppliers.find((s: any) => s.name === 'Bathroom Fixtures Ltd');
    expect(bathroomSup).toBeDefined();
  });

  test('admin can view and delete access rules', async ({ page }) => {
    // Set admin auth cookies
    await setAuthCookies(page.context(), adminSession);

    // Fetch access rules via API
    const response = await page.request.get(`${BASE_URL}/api/suppliers/access-rules`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);

    const ruleId = data.data[0].id;

    // Delete the access rule
    const deleteResponse = await page.request.delete(`${BASE_URL}/api/suppliers/access-rules/${ruleId}`);

    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);
  });

  test('restricted user has no access after rule deletion', async ({ page }) => {
    // Set restricted user auth cookies
    await setAuthCookies(page.context(), restrictedSession);

    // Fetch suppliers via API
    const response = await page.request.get(`${BASE_URL}/api/suppliers`);

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    const suppliers = responseData.data || [];

    // After rule deletion, restricted user should see NO suppliers
    expect(suppliers.length).toBe(0);
  });

  test('admin can check if supplier access management API responds', async ({ page }) => {
    // Set admin auth cookies
    await setAuthCookies(page.context(), adminSession);

    // Test that the admin API endpoint exists and responds
    const response = await page.request.get(`${BASE_URL}/api/suppliers/access-rules`);

    // Should return successfully (even if empty list)
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
