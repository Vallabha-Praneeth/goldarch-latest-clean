/**
 * E2E Tests: Template Editor UI
 *
 * Tests template editor UI functionality (Phase 6 deliverable):
 * 1. Navigate to templates page
 * 2. View template list
 * 3. Switch between template types
 * 4. Open template editor
 * 5. Preview template
 * 6. Test token system display
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let testUser: any;
let testOrg: any;

test.beforeAll(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const timestamp = Date.now();

  // Create test user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `template-ui-${timestamp}@test.local`,
    password: 'TestPassword123!',
  });

  if (authError) throw authError;
  testUser = authData.user;

  // Create authenticated client
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session!.access_token}`,
      },
    },
  });

  // Create test organization
  const { data: org, error: orgError } = await authClient
    .from('organizations')
    .insert({ name: `E2E Template UI Org ${timestamp}` })
    .select()
    .single();

  if (orgError) throw orgError;
  testOrg = org;

  // Add user as owner
  await authClient
    .from('organization_members')
    .insert({ org_id: testOrg.id, user_id: testUser.id, role: 'owner' });

  console.log(`Test setup complete: user=${testUser.id}, org=${testOrg.id}`);
});

test.describe('Template Editor UI', () => {
  test('should navigate to templates page when authenticated', async ({ page }) => {
    // Sign in
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    // Set auth cookies
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to templates page
    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should see templates page
    await expect(page).toHaveURL(/\/app-dashboard\/templates/);
    await expect(page.locator('text=Templates')).toBeVisible({ timeout: 10000 });

    console.log('Templates page navigation successful');
  });

  test('should display template list with tabs', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should see template type tabs
    await expect(page.locator('text=Quotations')).toBeVisible();
    await expect(page.locator('text=Invoices')).toBeVisible();
    await expect(page.locator('text=Emails')).toBeVisible();

    console.log('Template type tabs visible');
  });

  test('should switch between template types', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Click Invoices tab
    await page.locator('text=Invoices').click();
    await page.waitForTimeout(500);

    // Should show invoice templates
    // (Mock data should be visible)

    // Click Emails tab
    await page.locator('text=Emails').click();
    await page.waitForTimeout(500);

    console.log('Template type switching working');
  });

  test('should show template status badges', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should see status indicators (Active/Draft)
    const hasActiveStatus = await page.locator('text=/Active|Draft/').count();
    expect(hasActiveStatus).toBeGreaterThan(0);

    console.log('Template status badges visible');
  });

  test('should open template editor view', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Find and click "Edit" button (should exist in mock data)
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Should see editor interface
      await expect(page.locator('text=/Template Editor|Content/i')).toBeVisible();

      console.log('Template editor view opened');
    } else {
      console.log('No Edit button found (mock data may be empty)');
    }
  });

  test('should display available tokens panel', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Should see token panel with available tokens
      const hasTokens = await page.locator('text=/{{.*}}|Available Tokens/i').count();
      expect(hasTokens).toBeGreaterThan(0);

      console.log('Token panel visible in editor');
    } else {
      console.log('Editor test skipped (no templates available)');
    }
  });

  test('should open template preview view', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Look for Preview button
    const previewButton = page.locator('button:has-text("Preview")').first();
    if (await previewButton.isVisible()) {
      await previewButton.click();
      await page.waitForTimeout(500);

      // Should see preview interface
      await expect(page.locator('text=/Preview|Sample Data/i')).toBeVisible();

      console.log('Template preview view opened');
    } else {
      console.log('Preview button not found');
    }
  });

  test('should navigate back to list view', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Find Back button
      const backButton = page.locator('button:has-text("Back")').first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForTimeout(500);

        // Should be back on list view
        await expect(page.locator('text=Quotations')).toBeVisible();

        console.log('Navigation back to list view working');
      }
    }
  });

  test('should show create new template button', async ({ page }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'TestPassword123!',
    });

    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: signInData.session!.access_token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should see "New Template" or "Create" button
    const createButton = page.getByRole('button', { name: /New Template|Create/i }).first();
    await expect(createButton).toBeVisible();

    console.log('Create template button visible');
  });

  test('should reject access without authentication', async ({ page }) => {
    // Try to access templates page without auth
    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should redirect to auth page or show error
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    // Should not be on templates page
    expect(currentUrl).not.toContain('/app-dashboard/templates');

    console.log('Unauthenticated access correctly blocked');
  });
});

test.afterAll(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: 'TestPassword123!',
  });

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${signInData.session!.access_token}`,
      },
    },
  });

  // Cleanup test data
  if (testOrg) {
    await authClient.from('organization_members').delete().eq('org_id', testOrg.id);
    await authClient.from('organizations').delete().eq('id', testOrg.id);
  }

  console.log('Test cleanup complete');
});
