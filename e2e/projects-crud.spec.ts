/**
 * E2E Tests: Projects CRUD Operations
 *
 * Tests complete project management flow:
 * 1. Create project
 * 2. List projects
 * 3. Get single project
 * 4. Update project
 * 5. Delete project (soft delete - archived)
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
let testSession: Session;
let authClient: ReturnType<typeof createClient>;
let createdProject: any;

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
    email: `projects-crud-${timestamp}@test.local`,
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
    .insert({ name: `E2E Projects Org ${timestamp}` })
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

test.beforeEach(async ({ context }) => {
  // Set auth cookies before each test
  await setAuthCookies(context, testSession);
});

test.describe('Projects CRUD Operations', () => {
  // Projects table now available via migration 20260206210000

  test('should create a new project via API', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/projects`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: 'E2E Test Project',
        description: 'Project created via E2E testing',
        client_name: 'Test Client Inc',
        client_email: 'client@testinc.com',
        location: 'Mumbai, India',
        budget: 1000000,
        start_date: '2026-03-01',
        end_date: '2026-06-30',
        status: 'planning',
        priority: 'high',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('E2E Test Project');
    expect(data.data.id).toBeTruthy();

    createdProject = data.data;
    console.log(`Project created: ${createdProject.id}`);
  });

  test('should list projects via API', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/projects`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    // Should include our created project
    const foundProject = data.data.find((p: any) => p.id === createdProject.id);
    expect(foundProject).toBeTruthy();
    expect(foundProject.name).toBe('E2E Test Project');

    console.log(`Projects listed: ${data.data.length} total`);
  });

  test('should get single project via API', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/projects/${createdProject.id}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(createdProject.id);
    expect(data.data.name).toBe('E2E Test Project');

    console.log('Single project fetched successfully');
  });

  test('should filter projects by status', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/projects?status=planning`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // All returned projects should have status='planning'
    const allPlanning = data.data.every((p: any) => p.status === 'planning');
    expect(allPlanning).toBe(true);

    console.log('Project status filtering working correctly');
  });

  test('should update project via API', async ({ page }) => {
    const response = await page.request.put(`${BASE_URL}/api/projects/${createdProject.id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: 'E2E Test Project - Updated',
        status: 'in_progress',
        completion_percentage: 25,
        notes: 'Updated via E2E test',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('E2E Test Project - Updated');
    expect(data.data.status).toBe('in_progress');

    console.log('Project updated successfully');
  });

  test('should reject project creation with missing name', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/projects`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        // Missing required field: name
        description: 'Invalid project',
        location: 'Mumbai',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');

    console.log('Invalid project creation correctly rejected');
  });

  test('should delete project via API (soft delete - archived)', async ({ page }) => {
    const response = await page.request.delete(`${BASE_URL}/api/projects/${createdProject.id}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('archived');

    console.log('Project soft deleted (status=archived)');
  });

  test('should reject unauthorized project access', async ({ browser }) => {
    // Create a fresh context without auth cookies
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    const response = await page.request.get(`${BASE_URL}/api/projects`);

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Unauthorized');

    await freshContext.close();

    console.log('Unauthorized access correctly rejected');
  });
});

test.afterAll(async () => {
  // Cleanup test data
  if (testOrg) {
    await authClient.from('organization_members').delete().eq('org_id', testOrg.id);
    await authClient.from('organizations').delete().eq('id', testOrg.id);
  }

  console.log('Test cleanup complete');
});
