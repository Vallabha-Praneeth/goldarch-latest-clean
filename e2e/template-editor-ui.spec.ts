/**
 * E2E Tests: Template Editor UI
 *
 * Tests template editor UI functionality (Phase 6 deliverable):
 * 1. Navigate to templates page
 * 2. View template list with tabs
 * 3. Switch between template types
 * 4. Open template editor via "New Template" button
 * 5. Test token system display in editor
 * 6. Navigate back to list view
 * 7. Authentication guard
 *
 * Migration: 20260206220000_create_templates_table.sql
 * Uses cookie-based auth compatible with @supabase/ssr
 */

import { test, expect, BrowserContext } from '@playwright/test';
import { createClient, Session } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let testUser: any;
let testOrg: any;
let testTemplate: any;
let testSession: Session;
let authClient: ReturnType<typeof createClient>;

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
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const timestamp = Date.now();

  // Create test user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `template-ui-${timestamp}@test.local`,
    password: 'TestPassword123!',
  });

  if (authError) throw authError;
  if (!authData.session) throw new Error('No session returned');

  testUser = authData.user;
  testSession = authData.session;

  // Create authenticated client for DB setup
  authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${testSession.access_token}`,
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

  // Create a test template for testing status badges and actions
  const { data: template } = await authClient
    .from('templates')
    .insert({
      name: `Test Template ${timestamp}`,
      type: 'quotation',
      status: 'active',
      description: 'Test template for E2E tests',
      content: { header: 'Test Header', body: 'Test Body', footer: 'Test Footer' },
      tokens: ['{{client_name}}', '{{quote_total}}'],
      created_by: testUser.id,
    })
    .select()
    .single();

  testTemplate = template;

  console.log(`Test setup complete: user=${testUser.id}, org=${testOrg.id}, template=${testTemplate?.id}`);
});

test.beforeEach(async ({ context }) => {
  // Set auth cookies before each test
  await setAuthCookies(context, testSession);
});

test.describe('Template Editor UI', () => {
  // Templates table is available via migration 20260206220000
  // Templates page UI is now implemented (Phase 6 complete)

  test('should navigate to templates page when authenticated', async ({ page }) => {
    // Navigate to templates page
    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should see templates page
    await expect(page).toHaveURL(/\/app-dashboard\/templates/);
    await expect(page.locator('h1:has-text("Templates")')).toBeVisible({ timeout: 10000 });

    console.log('Templates page navigation successful');
  });

  test('should display template list with tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Should see template type tabs
    await expect(page.getByRole('tab', { name: 'Quotations' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Invoices' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Emails' })).toBeVisible();

    console.log('Template type tabs visible');
  });

  test('should switch between template types', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Click Invoices tab
    await page.getByRole('tab', { name: 'Invoices' }).click();
    await page.waitForTimeout(300);

    // The invoices tab should now be selected
    await expect(page.getByRole('tab', { name: 'Invoices' })).toHaveAttribute('data-state', 'active');

    // Click Emails tab
    await page.getByRole('tab', { name: 'Emails' }).click();
    await page.waitForTimeout(300);

    // The emails tab should now be selected
    await expect(page.getByRole('tab', { name: 'Emails' })).toHaveAttribute('data-state', 'active');

    console.log('Template type switching working');
  });

  test('should show template status badges when templates exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // We created a test template with status 'active', so we should see the Active badge
    // Look for either Active or Draft status badges
    const statusBadge = page.locator('text=/Active|Draft/').first();
    await expect(statusBadge).toBeVisible({ timeout: 5000 });

    console.log('Template status badges visible');
  });

  test('should open template editor via New Template button', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Click New Template button
    await page.getByRole('button', { name: /New Template/i }).click();
    await page.waitForTimeout(500);

    // Should see editor interface with "Create Template" heading
    await expect(page.locator('h1:has-text("Create Template")')).toBeVisible();

    console.log('Template editor view opened');
  });

  test('should display token buttons in editor', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Open editor
    await page.getByRole('button', { name: /New Template/i }).click();
    await page.waitForTimeout(500);

    // Should see token buttons with {{...}} format
    const tokenButton = page.locator('button:has-text("{{")').first();
    await expect(tokenButton).toBeVisible();

    console.log('Token buttons visible in editor');
  });

  test('should navigate back to list view from editor', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Open editor
    await page.getByRole('button', { name: /New Template/i }).click();
    await page.waitForTimeout(500);

    // Confirm we're in editor
    await expect(page.locator('h1:has-text("Create Template")')).toBeVisible();

    // Find and click the back button (it's a ghost button with an arrow icon)
    // The back button is the first button in the header area
    const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') }).first();
    await backButton.click();
    await page.waitForTimeout(500);

    // Should be back on list view - tabs should be visible again
    await expect(page.getByRole('tab', { name: 'Quotations' })).toBeVisible();

    console.log('Navigation back to list view working');
  });

  test('should show create new template button', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Should see "New Template" button
    const createButton = page.getByRole('button', { name: /New Template/i });
    await expect(createButton).toBeVisible();

    console.log('Create template button visible');
  });

  test('should show editor sections with proper headings', async ({ page }) => {
    await page.goto(`${BASE_URL}/app-dashboard/templates`);
    await page.waitForLoadState('networkidle');

    // Open editor
    await page.getByRole('button', { name: /New Template/i }).click();
    await page.waitForTimeout(500);

    // Should see section headings
    await expect(page.locator('text=Header Section')).toBeVisible();
    await expect(page.locator('text=Body Section')).toBeVisible();
    await expect(page.locator('text=Footer Section')).toBeVisible();

    console.log('Editor sections visible');
  });

  test('should reject access without authentication', async ({ browser }) => {
    // Create a fresh context without auth cookies
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    // Try to access templates page without auth
    await page.goto(`${BASE_URL}/app-dashboard/templates`);

    // Should redirect to auth page or show error
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    // Should not be on templates page (should be redirected to login or similar)
    // Note: This depends on how auth middleware is configured
    const isRedirected = !currentUrl.includes('/app-dashboard/templates') ||
                         currentUrl.includes('/login') ||
                         currentUrl.includes('/auth');

    expect(isRedirected).toBe(true);

    await freshContext.close();

    console.log('Unauthenticated access correctly blocked');
  });
});

test.afterAll(async () => {
  // Cleanup test data
  if (testTemplate) {
    await authClient.from('templates').delete().eq('id', testTemplate.id);
  }
  if (testOrg) {
    await authClient.from('organization_members').delete().eq('org_id', testOrg.id);
    await authClient.from('organizations').delete().eq('id', testOrg.id);
  }

  console.log('Test cleanup complete');
});
