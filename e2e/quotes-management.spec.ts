/**
 * E2E Tests: Quotes Management (MODULE-1C)
 *
 * Tests complete quote approval workflow:
 * 1. Create quote directly in database
 * 2. Submit quote for approval
 * 3. Approve quote
 * 4. Accept approved quote
 * 5. Test rejection workflow
 * 6. Test decline workflow
 * 7. Bulk operations
 *
 * Uses cookie-based auth compatible with @supabase/ssr
 */

import { test, expect, BrowserContext } from '@playwright/test';
import { createClient, Session } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let testUser: any;
let testOrg: any;
let testQuote: any;
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
    email: `quotes-test-${timestamp}@test.local`,
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
    .insert({ name: `E2E Quotes Org ${timestamp}` })
    .select()
    .single();

  if (orgError) throw orgError;
  testOrg = org;

  // Add user as owner
  await authClient
    .from('organization_members')
    .insert({ org_id: testOrg.id, user_id: testUser.id, role: 'owner' });

  // Make user a Manager for approval tests
  await authClient
    .from('user_roles')
    .upsert({ user_id: testUser.id, role: 'Manager' });

  // Create test quote
  const { data: quote, error: quoteError } = await authClient
    .from('quotes')
    .insert({
      quote_number: `QT-E2E-${timestamp}`,
      title: 'E2E Test Quote',
      status: 'draft',
      subtotal: 1000.00,
      tax: 180.00,
      total: 1180.00,
      currency: 'USD',
      notes: 'Quote for E2E testing',
      created_by: testUser.id,
    })
    .select()
    .single();

  if (quoteError) throw quoteError;
  testQuote = quote;

  console.log(`Test setup complete: user=${testUser.id}, org=${testOrg.id}, quote=${testQuote.id}`);
});

// Helper to get auth headers for API requests
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testSession.access_token}`,
  };
}

test.describe('Quotes Management - MODULE-1C', () => {
  test('should submit quote for approval (draft → pending)', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/quotes/${testQuote.id}/submit`, {
      headers: getAuthHeaders(),
      data: {
        notes: 'Submitting for approval',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.quote.status).toBe('pending');
    expect(data.quote.submitted_at).toBeTruthy();

    console.log('Quote submitted for approval');
  });

  test('should approve quote (pending → approved)', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/quotes/${testQuote.id}/approve`, {
      headers: getAuthHeaders(),
      data: {
        notes: 'Approved via E2E test',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.quote.status).toBe('approved');
    expect(data.quote.approved_by).toBe(testUser.id);
    expect(data.quote.approved_at).toBeTruthy();
    expect(data.quote.approval_notes).toBe('Approved via E2E test');

    console.log('Quote approved successfully');
  });

  test('should accept approved quote (approved → accepted)', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/quotes/${testQuote.id}/accept`, {
      headers: getAuthHeaders(),
      data: {
        notes: 'Accepted via E2E test',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.quote.status).toBe('accepted');

    console.log('Quote accepted successfully');
  });

  test('should test rejection workflow', async ({ page, context }) => {
    const timestamp = Date.now();

    // Create a new quote for rejection test
    const { data: rejectQuote, error } = await authClient
      .from('quotes')
      .insert({
        quote_number: `QT-REJ-${timestamp}`,
        title: 'Quote for Rejection Test',
        status: 'draft',
        subtotal: 500.00,
        tax: 90.00,
        total: 590.00,
        currency: 'USD',
        created_by: testUser.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Submit it
    await page.request.post(`${BASE_URL}/api/quotes/${rejectQuote.id}/submit`, {
      headers: getAuthHeaders(),
      data: {},
    });

    // Reject it
    const rejectResponse = await page.request.post(`${BASE_URL}/api/quotes/${rejectQuote.id}/reject`, {
      headers: getAuthHeaders(),
      data: {
        reason: 'Pricing needs adjustment',
      },
    });

    expect(rejectResponse.ok()).toBeTruthy();
    const data = await rejectResponse.json();
    expect(data.success).toBe(true);
    expect(data.quote.status).toBe('rejected');
    expect(data.quote.rejected_by).toBe(testUser.id);
    expect(data.quote.rejection_reason).toBe('Pricing needs adjustment');

    // Cleanup
    await authClient.from('quotes').delete().eq('id', rejectQuote.id);

    console.log('Rejection workflow tested successfully');
  });

  test('should test decline workflow', async ({ page }) => {
    const timestamp = Date.now();

    // Create a new quote for decline test
    const { data: declineQuote, error } = await authClient
      .from('quotes')
      .insert({
        quote_number: `QT-DEC-${timestamp}`,
        title: 'Quote for Decline Test',
        status: 'draft',
        subtotal: 750.00,
        tax: 135.00,
        total: 885.00,
        currency: 'USD',
        created_by: testUser.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Submit → Approve → Decline
    await page.request.post(`${BASE_URL}/api/quotes/${declineQuote.id}/submit`, {
      headers: getAuthHeaders(),
      data: {},
    });

    await page.request.post(`${BASE_URL}/api/quotes/${declineQuote.id}/approve`, {
      headers: getAuthHeaders(),
      data: { notes: 'Approving for decline test' },
    });

    const declineResponse = await page.request.post(`${BASE_URL}/api/quotes/${declineQuote.id}/decline`, {
      headers: getAuthHeaders(),
      data: {},
    });

    expect(declineResponse.ok()).toBeTruthy();
    const data = await declineResponse.json();
    expect(data.success).toBe(true);
    expect(data.quote.status).toBe('declined');

    // Cleanup
    await authClient.from('quotes').delete().eq('id', declineQuote.id);

    console.log('Decline workflow tested successfully');
  });

  test('should test bulk approval', async ({ page }) => {
    const timestamp = Date.now();

    // Create multiple pending quotes
    const quoteIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { data: quote } = await authClient
        .from('quotes')
        .insert({
          quote_number: `QT-BULK-${timestamp}-${i}`,
          title: `Bulk Test Quote ${i}`,
          status: 'pending',
          subtotal: 100.00 * (i + 1),
          tax: 18.00 * (i + 1),
          total: 118.00 * (i + 1),
          currency: 'USD',
          created_by: testUser.id,
        })
        .select()
        .single();

      if (quote) quoteIds.push(quote.id);
    }

    // Bulk approve
    const response = await page.request.post(`${BASE_URL}/api/quotes/bulk`, {
      headers: getAuthHeaders(),
      data: {
        action: 'approve',
        quoteIds,
        notes: 'Bulk approved via E2E test',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.summary.succeeded).toBe(3);
    expect(data.summary.failed).toBe(0);

    // Cleanup
    for (const id of quoteIds) {
      await authClient.from('quotes').delete().eq('id', id);
    }

    console.log('Bulk approval working correctly');
  });

  test('should validate required fields', async ({ page }) => {
    // Create a pending quote for validation test
    const timestamp = Date.now();
    const { data: validationQuote } = await authClient
      .from('quotes')
      .insert({
        quote_number: `QT-VAL-${timestamp}`,
        title: 'Validation Test Quote',
        status: 'pending',
        subtotal: 100.00,
        tax: 18.00,
        total: 118.00,
        currency: 'USD',
        created_by: testUser.id,
      })
      .select()
      .single();

    // Try to approve without notes
    const response = await page.request.post(`${BASE_URL}/api/quotes/${validationQuote!.id}/approve`, {
      headers: getAuthHeaders(),
      data: {}, // Missing required notes
    });

    // Should fail with 400
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('notes');

    // Cleanup
    await authClient.from('quotes').delete().eq('id', validationQuote!.id);

    console.log('Validation working correctly');
  });
});

test.afterAll(async () => {
  // Cleanup test data
  if (testQuote) {
    await authClient.from('quotes').delete().eq('id', testQuote.id);
  }
  if (testOrg) {
    await authClient.from('user_roles').delete().eq('user_id', testUser.id);
    await authClient.from('organization_members').delete().eq('org_id', testOrg.id);
    await authClient.from('organizations').delete().eq('id', testOrg.id);
  }

  console.log('Test cleanup complete');
});
