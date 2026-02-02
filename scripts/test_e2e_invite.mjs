#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

// Use the remote Supabase from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oszfxrubmstdavcehhkn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zemZ4cnVibXN0ZGF2Y2VoaGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzI4MDksImV4cCI6MjA3OTY0ODgwOX0.6kxvu-RS4lmsg3Z60S_XWEogGPKqawFf5TTG1H-t_Pk';
const BASE_URL = 'http://localhost:3000';

console.log('=== E2E Invite Flow Test ===');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Base URL:', BASE_URL);

async function runTests() {
  // Step 1: Setup - Create test org and users if needed
  console.log('\n=== STEP 1: Setup Test Data ===');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Try to sign in as test owner (use existing users from local testing)
  let ownerAuth = await adminClient.auth.signInWithPassword({
    email: 'owner@example.com',
    password: 'password123'
  });

  if (ownerAuth.error) {
    console.log('Creating test owner user...');
    ownerAuth = await adminClient.auth.signUp({
      email: 'owner@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'http://localhost:3000'
      }
    });
  }

  if (!ownerAuth.data.user) {
    throw new Error('Failed to create/login owner: ' + JSON.stringify(ownerAuth.error));
  }

  console.log('✓ Owner authenticated:', ownerAuth.data.user.email);
  const ownerId = ownerAuth.data.user.id;
  const ownerSession = ownerAuth.data.session;

  // Try to sign in as test invitee
  let inviteeAuth = await adminClient.auth.signInWithPassword({
    email: 'invitee@example.com',
    password: 'password123'
  });

  if (inviteeAuth.error) {
    console.log('Creating test invitee user...');
    inviteeAuth = await adminClient.auth.signUp({
      email: 'invitee@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'http://localhost:3000'
      }
    });
  }

  if (!inviteeAuth.data.user) {
    throw new Error('Failed to create/login invitee: ' + JSON.stringify(inviteeAuth.error));
  }

  console.log('✓ Invitee authenticated:', inviteeAuth.data.user.email);
  const inviteeSession = inviteeAuth.data.session;

  // Create test organization (sign in as owner first)
  const ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${ownerSession.access_token}`
      }
    }
  });

  // Check if org exists
  let { data: existingOrgs } = await ownerClient
    .from('organizations')
    .select('*')
    .eq('name', 'E2E Test Org')
    .limit(1);

  let orgId;
  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id;
    console.log('✓ Using existing org:', orgId);
  } else {
    const { data: newOrg, error: orgError } = await ownerClient
      .from('organizations')
      .insert({ name: 'E2E Test Org', created_by: ownerId })
      .select()
      .single();

    if (orgError) {
      console.error('Org creation error:', orgError);
      throw new Error('Failed to create org');
    }

    orgId = newOrg.id;
    console.log('✓ Created new org:', orgId);

    // Add owner membership
    const { error: memberError } = await ownerClient
      .from('organization_members')
      .insert({ org_id: orgId, user_id: ownerId, role: 'owner' });

    if (memberError && memberError.code !== '23505') { // Ignore duplicate key
      console.error('Membership error:', memberError);
      throw new Error('Failed to create owner membership');
    }

    console.log('✓ Owner membership created');
  }

  // Step 2: Test send-invite with cookie-based auth
  console.log('\n=== STEP 2: Send Invite (as owner) ===');

  // Construct Supabase SSR cookie
  const cookieName = `sb-${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}-auth-token`;
  const cookieValue = JSON.stringify({
    access_token: ownerSession.access_token,
    refresh_token: ownerSession.refresh_token,
    expires_at: ownerSession.expires_at,
    expires_in: ownerSession.expires_in,
    token_type: ownerSession.token_type,
    user: ownerSession.user
  });

  console.log('Cookie name:', cookieName);
  console.log('Using access token:', ownerSession.access_token.substring(0, 30) + '...');

  const sendResponse = await fetch(`${BASE_URL}/api/send-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${cookieName}=${encodeURIComponent(cookieValue)}`
    },
    body: JSON.stringify({
      orgId,
      to: 'invitee@example.com',
      role: 'viewer',
      inviterName: 'E2E Test Owner'
    })
  });

  const sendData = await sendResponse.json();

  console.log('**Request:**');
  console.log(JSON.stringify({
    orgId,
    to: 'invitee@example.com',
    role: 'viewer',
    inviterName: 'E2E Test Owner'
  }, null, 2));

  console.log('\n**Response:**');
  console.log('Status:', sendResponse.status);
  console.log('Body:', JSON.stringify(sendData, null, 2));

  if (sendResponse.status !== 200 || !sendData.success) {
    throw new Error('❌ Send invite failed');
  }

  console.log('\n✅ TEST PASS: Send invite returned 200');

  // Extract token from acceptUrl
  const tokenMatch = sendData.acceptUrl?.match(/token=([^&]+)/);
  if (!tokenMatch) {
    throw new Error('No token in acceptUrl');
  }

  const inviteToken = decodeURIComponent(tokenMatch[1]);
  console.log('Invite token:', inviteToken.substring(0, 40) + '...');

  // Step 3: Verify invite in DB
  console.log('\n=== STEP 3: Verify Invite in DB ===');

  const { data: invite } = await ownerClient
    .from('organization_invites')
    .select('*')
    .eq('email', 'invitee@example.com')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('Invite row:');
  console.log(JSON.stringify({
    id: invite.id,
    org_id: invite.org_id,
    email: invite.email,
    role: invite.role,
    used_at: invite.used_at,
    expires_at: invite.expires_at,
    token_hash: invite.token_hash.substring(0, 20) + '...'
  }, null, 2));

  if (invite.used_at) {
    throw new Error('Invite already used!');
  }

  console.log('✅ Invite exists with used_at = NULL');

  // Step 4: Accept invite (as invitee)
  console.log('\n=== STEP 4: Accept Invite (as invitee) ===');

  const inviteeCookieName = `sb-${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}-auth-token`;
  const inviteeCookieValue = JSON.stringify({
    access_token: inviteeSession.access_token,
    refresh_token: inviteeSession.refresh_token,
    expires_at: inviteeSession.expires_at,
    expires_in: inviteeSession.expires_in,
    token_type: inviteeSession.token_type,
    user: inviteeSession.user
  });

  const acceptResponse = await fetch(`${BASE_URL}/api/accept-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${inviteeCookieName}=${encodeURIComponent(inviteeCookieValue)}`
    },
    body: JSON.stringify({ token: inviteToken })
  });

  const acceptData = await acceptResponse.json();

  console.log('**Request:**');
  console.log(JSON.stringify({ token: inviteToken.substring(0, 40) + '...' }, null, 2));

  console.log('\n**Response:**');
  console.log('Status:', acceptResponse.status);
  console.log('Body:', JSON.stringify(acceptData, null, 2));

  if (acceptResponse.status !== 200 || !acceptData.ok) {
    throw new Error('❌ Accept invite failed');
  }

  console.log('\n✅ TEST PASS: Accept invite returned 200');

  // Step 5: Verify membership created
  console.log('\n=== STEP 5: Verify Membership Created ===');

  const inviteeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${inviteeSession.access_token}`
      }
    }
  });

  const { data: membership } = await inviteeClient
    .from('organization_members')
    .select('*')
    .eq('user_id', inviteeAuth.data.user.id)
    .eq('org_id', orgId)
    .single();

  console.log('Membership row:');
  console.log(JSON.stringify(membership, null, 2));

  if (!membership) {
    throw new Error('Membership not created!');
  }

  console.log('✅ Membership created successfully');

  // Step 6: Verify invite marked used
  console.log('\n=== STEP 6: Verify Invite Marked Used ===');

  const { data: usedInvite } = await inviteeClient
    .from('organization_invites')
    .select('used_at')
    .eq('email', 'invitee@example.com')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('Invite used_at:', usedInvite.used_at);

  if (!usedInvite.used_at) {
    throw new Error('Invite not marked as used!');
  }

  console.log('✅ Invite marked as used');

  // Step 7: Negative test - duplicate accept (409)
  console.log('\n=== STEP 7: Negative Test - Duplicate Accept ===');

  const dupResponse = await fetch(`${BASE_URL}/api/accept-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${inviteeCookieName}=${encodeURIComponent(inviteeCookieValue)}`
    },
    body: JSON.stringify({ token: inviteToken })
  });

  const dupData = await dupResponse.json();

  console.log('Status:', dupResponse.status);
  console.log('Body:', JSON.stringify(dupData, null, 2));

  if (dupResponse.status !== 409) {
    throw new Error('Expected 409, got ' + dupResponse.status);
  }

  console.log('✅ TEST PASS: Duplicate accept returned 409');

  // Step 8: Negative test - wrong token (404)
  console.log('\n=== STEP 8: Negative Test - Wrong Token ===');

  const wrongResponse = await fetch(`${BASE_URL}/api/accept-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${inviteeCookieName}=${encodeURIComponent(inviteeCookieValue)}`
    },
    body: JSON.stringify({
      token: '0000000000000000000000000000000000000000000000000000000000000000'
    })
  });

  const wrongData = await wrongResponse.json();

  console.log('Status:', wrongResponse.status);
  console.log('Body:', JSON.stringify(wrongData, null, 2));

  if (wrongResponse.status !== 404) {
    throw new Error('Expected 404, got ' + wrongResponse.status);
  }

  console.log('✅ TEST PASS: Wrong token returned 404');

  console.log('\n=== ALL TESTS PASSED ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  console.error(err);
  process.exit(1);
});
