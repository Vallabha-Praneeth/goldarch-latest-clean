/**
 * E2E Tests: Organization Invite Flow
 *
 * Tests the complete organization invite flow:
 * 1. Owner sends invite
 * 2. Invitee accepts invite
 * 3. Verify membership created
 * 4. Verify invite marked as used
 * 5. Reject duplicate accept
 *
 * Uses cookie-based auth compatible with @supabase/ssr
 */

import { test, expect, BrowserContext } from '@playwright/test';
import { createClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestUser {
  email: string;
  password: string;
  userId: string;
  session: Session;
}

interface TestOrg {
  id: string;
  name: string;
}

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

test.describe('Organization Invite Flow', () => {
  let ownerUser: TestUser;
  let inviteeUser: TestUser;
  let testOrg: TestOrg;
  let inviteToken: string;
  let ownerClient: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create unique test users and org for this run
    const timestamp = Date.now();
    const ownerEmail = `owner-${timestamp}@example.com`;
    const inviteeEmail = `invitee-${timestamp}@example.com`;
    const orgName = `E2E Test Org ${timestamp}`;

    // Create owner user
    const ownerAuth = await supabase.auth.signUp({
      email: ownerEmail,
      password: 'password123',
    });

    if (!ownerAuth.data.user || !ownerAuth.data.session) {
      throw new Error('Failed to create owner user');
    }

    ownerUser = {
      email: ownerEmail,
      password: 'password123',
      userId: ownerAuth.data.user.id,
      session: ownerAuth.data.session,
    };

    // Create invitee user
    const inviteeAuth = await supabase.auth.signUp({
      email: inviteeEmail,
      password: 'password123',
    });

    if (!inviteeAuth.data.user || !inviteeAuth.data.session) {
      throw new Error('Failed to create invitee user');
    }

    inviteeUser = {
      email: inviteeEmail,
      password: 'password123',
      userId: inviteeAuth.data.user.id,
      session: inviteeAuth.data.session,
    };

    // Create test organization as owner
    ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${ownerUser.session.access_token}`,
        },
      },
    });

    // Let created_by default to auth.uid() (table has default auth.uid())
    const { data: org, error: orgError } = await ownerClient
      .from('organizations')
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to create org: ${orgError?.message}`);
    }

    testOrg = { id: org.id, name: orgName };

    // Add owner membership
    const { error: memberError } = await ownerClient
      .from('organization_members')
      .insert({ org_id: testOrg.id, user_id: ownerUser.userId, role: 'owner' });

    if (memberError && memberError.code !== '23505') {
      throw new Error(`Failed to create owner membership: ${memberError.message}`);
    }

    console.log(`Test setup complete: owner=${ownerEmail}, invitee=${inviteeEmail}, org=${testOrg.id}`);
  });

  test('should send invite as owner', async ({ page }) => {
    // Set owner auth cookies
    await setAuthCookies(page.context(), ownerUser.session);

    // Send invite via API request
    const response = await page.request.post(`${BASE_URL}/api/send-invite`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        orgId: testOrg.id,
        to: inviteeUser.email,
        role: 'viewer',
        inviterName: 'E2E Test Owner',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.acceptUrl).toContain('token=');

    // Extract token
    const tokenMatch = data.acceptUrl.match(/token=([^&]+)/);
    expect(tokenMatch).toBeTruthy();
    inviteToken = decodeURIComponent(tokenMatch![1]);

    console.log(`Invite sent successfully, token: ${inviteToken.substring(0, 40)}...`);
  });

  test('should accept invite as invitee', async ({ page }) => {
    // Set invitee auth cookies
    await setAuthCookies(page.context(), inviteeUser.session);

    // Accept invite via API request
    const response = await page.request.post(`${BASE_URL}/api/accept-invite`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        token: inviteToken,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.orgId).toBe(testOrg.id);
    expect(data.role).toBe('viewer');

    console.log('Invite accepted successfully');
  });

  test('should verify membership was created', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${inviteeUser.session.access_token}`,
        },
      },
    });

    const { data: membership, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', inviteeUser.userId)
      .eq('org_id', testOrg.id)
      .single();

    expect(error).toBeNull();
    expect(membership).toBeTruthy();
    expect(membership?.role).toBe('viewer');

    console.log('Membership verified in database');
  });

  test('should verify invite was marked used', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${inviteeUser.session.access_token}`,
        },
      },
    });

    const { data: invite, error } = await supabase
      .from('organization_invites')
      .select('used_at')
      .eq('email', inviteeUser.email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(error).toBeNull();
    expect(invite).toBeTruthy();
    expect(invite?.used_at).toBeTruthy();

    console.log('Invite marked as used in database');
  });

  test('should reject duplicate accept with 409', async ({ page }) => {
    // Set invitee auth cookies
    await setAuthCookies(page.context(), inviteeUser.session);

    // Try to accept same invite again
    const response = await page.request.post(`${BASE_URL}/api/accept-invite`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        token: inviteToken,
      },
    });

    expect(response.status()).toBe(409);

    const data = await response.json();
    expect(data.error).toContain('already used');

    console.log('Duplicate accept correctly rejected with 409');
  });

  test.afterAll(async () => {
    // Cleanup test data
    if (testOrg && ownerClient) {
      await ownerClient.from('organization_members').delete().eq('org_id', testOrg.id);
      await ownerClient.from('organization_invites').delete().eq('org_id', testOrg.id);
      await ownerClient.from('organizations').delete().eq('id', testOrg.id);
    }

    console.log('Test cleanup complete');
  });
});
