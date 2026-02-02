/**
 * E2E Tests: Supplier Access Filtering
 *
 * Tests the complete supplier access control flow:
 * 1. Admin creates access rules
 * 2. Restricted users see filtered supplier lists
 * 3. Admin users see all suppliers
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseAdmin: ReturnType<typeof createClient>;
let testOrg: any;
let adminUser: any;
let restrictedUser: any;
let kitchenCategory: any;
let bathroomCategory: any;
let kitchenSupplier: any;
let bathroomSupplier: any;

test.beforeAll(async () => {
  // Initialize Supabase admin client
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Create test organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'E2E Test Org - Supplier Filter',
      slug: `e2e-supplier-filter-${Date.now()}`,
    })
    .select()
    .single();

  if (orgError) throw orgError;
  testOrg = org;

  // Create admin user
  const { data: authAdmin, error: adminAuthError } = await supabaseAdmin.auth.signUp({
    email: `admin-filter-${Date.now()}@test.local`,
    password: 'TestPassword123!',
  });

  if (adminAuthError) throw adminAuthError;
  adminUser = authAdmin.user;

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
  const { data: authRestricted, error: restrictedAuthError } = await supabaseAdmin.auth.signUp({
    email: `restricted-filter-${Date.now()}@test.local`,
    password: 'TestPassword123!',
  });

  if (restrictedAuthError) throw restrictedAuthError;
  restrictedUser = authRestricted.user;

  // Add restricted user to organization as viewer
  const { error: restrictedMemberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      org_id: testOrg.id,
      user_id: restrictedUser.id,
      role: 'viewer',
    });

  if (restrictedMemberError) throw restrictedMemberError;

  // Create test categories
  const { data: kitchen, error: kitchenError } = await supabaseAdmin
    .from('categories')
    .insert({ name: 'Kitchen' })
    .select()
    .single();

  if (kitchenError) throw kitchenError;
  kitchenCategory = kitchen;

  const { data: bathroom, error: bathroomError } = await supabaseAdmin
    .from('categories')
    .insert({ name: 'Bathroom' })
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
    // Login as admin using session
    const { data: sessionData } = await supabaseAdmin.auth.getSession();

    // Sign in as admin
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminUser.email,
      password: 'TestPassword123!',
    });

    if (signInError) throw signInError;

    // Create access rule via API
    const response = await page.request.post(`${BASE_URL}/api/suppliers/access-rules`, {
      headers: {
        'Authorization': `Bearer ${signInData.session.access_token}`,
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
    // Sign in as restricted user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: restrictedUser.email,
      password: 'TestPassword123!',
    });

    if (signInError) throw signInError;

    // Navigate to suppliers page
    await page.goto(`${BASE_URL}/app-dashboard/suppliers`);

    // Set auth cookie/session (Playwright can access cookies)
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session.access_token,
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);

    // Reload to apply auth
    await page.reload();

    // Wait for suppliers to load
    await page.waitForTimeout(2000);

    // Should see kitchen supplier
    await expect(page.getByText('Kitchen Suppliers Inc')).toBeVisible();

    // Should NOT see bathroom supplier
    await expect(page.getByText('Bathroom Fixtures Ltd')).not.toBeVisible();

    // Should see filter indicator
    await expect(page.getByText(/filtered/i)).toBeVisible();
  });

  test('admin sees all suppliers', async ({ page }) => {
    // Sign in as admin
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminUser.email,
      password: 'TestPassword123!',
    });

    if (signInError) throw signInError;

    // Navigate to suppliers page
    await page.goto(`${BASE_URL}/app-dashboard/suppliers`);

    // Set auth cookie/session
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session.access_token,
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);

    // Reload to apply auth
    await page.reload();

    // Wait for suppliers to load
    await page.waitForTimeout(2000);

    // Should see both suppliers
    await expect(page.getByText('Kitchen Suppliers Inc')).toBeVisible();
    await expect(page.getByText('Bathroom Fixtures Ltd')).toBeVisible();

    // Should NOT see filter indicator (admin has full access)
    await expect(page.getByText(/access.*limited/i)).not.toBeVisible();
  });

  test('admin can view and delete access rules', async ({ page }) => {
    // Sign in as admin
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminUser.email,
      password: 'TestPassword123!',
    });

    if (signInError) throw signInError;

    // Fetch access rules via API
    const response = await page.request.get(`${BASE_URL}/api/suppliers/access-rules`, {
      headers: {
        'Authorization': `Bearer ${signInData.session.access_token}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);

    const ruleId = data.data[0].id;

    // Delete the access rule
    const deleteResponse = await page.request.delete(`${BASE_URL}/api/suppliers/access-rules/${ruleId}`, {
      headers: {
        'Authorization': `Bearer ${signInData.session.access_token}`,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);
  });

  test('restricted user has no access after rule deletion', async ({ page }) => {
    // Sign in as restricted user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: restrictedUser.email,
      password: 'TestPassword123!',
    });

    if (signInError) throw signInError;

    // Navigate to suppliers page
    await page.goto(`${BASE_URL}/app-dashboard/suppliers`);

    // Set auth cookie/session
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session.access_token,
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);

    // Reload to apply auth
    await page.reload();

    // Wait for load
    await page.waitForTimeout(2000);

    // Should see no access indicator
    await expect(page.getByText(/no access/i)).toBeVisible();

    // Should NOT see any suppliers
    await expect(page.getByText('Kitchen Suppliers Inc')).not.toBeVisible();
    await expect(page.getByText('Bathroom Fixtures Ltd')).not.toBeVisible();
  });

  test('admin can navigate to supplier access management page', async ({ page }) => {
    // Sign in as admin
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminUser.email,
      password: 'TestPassword123!',
    });

    if (signInError) throw signInError;

    // Navigate to admin page
    await page.goto(`${BASE_URL}/app-dashboard/admin/supplier-access`);

    // Set auth cookie/session
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session.access_token,
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);

    // Reload to apply auth
    await page.reload();

    // Wait for page load
    await page.waitForTimeout(2000);

    // Should see page title
    await expect(page.getByText('Supplier Access Control')).toBeVisible();

    // Should see add button
    await expect(page.getByRole('button', { name: /add access rule/i })).toBeVisible();
  });
});
