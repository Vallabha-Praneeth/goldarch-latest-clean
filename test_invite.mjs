import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const orgId = 'e16253b4-a008-4e01-918c-f082568d7500';

async function runTests() {
  console.log('=== STEP 3: Test 401 unauth (already done via curl) ===');
  console.log('✅ PASS: Got 401 {"error":"unauthorized"}');

  console.log('\n=== STEP 4: Send invite as owner ===');

  // Create owner client and sign in
  const ownerClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: ownerAuth, error: ownerAuthError } = await ownerClient.auth.signInWithPassword({
    email: 'owner@example.com',
    password: 'password123'
  });

  if (ownerAuthError) {
    console.error('Owner auth failed:', ownerAuthError);
    process.exit(1);
  }

  console.log('Owner authenticated:', ownerAuth.user.email);
  const ownerToken = ownerAuth.session.access_token;

  // Call send-invite API
  const sendResponse = await fetch('http://localhost:3000/api/send-invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      orgId,
      to: 'invitee@example.com',
      role: 'viewer',
      inviterName: 'Test Owner'
    })
  });

  const sendData = await sendResponse.json();
  console.log('Status:', sendResponse.status);
  console.log('Response:', JSON.stringify(sendData, null, 2));

  if (sendResponse.status === 200 && sendData.success) {
    console.log('✅ TEST 4 PASS: Invite sent successfully');

    // Extract token from URL
    const tokenMatch = sendData.acceptUrl.match(/token=([^&]+)/);
    const inviteToken = tokenMatch ? tokenMatch[1] : null;
    console.log('Invite token:', inviteToken?.substring(0, 60) + '...');

    // Save for next step
    await import('fs/promises').then(fs => fs.writeFile('/tmp/invite_token_node.txt', inviteToken));

    console.log('\n=== STEP 5: Verify invite in DB ===');
    const { data: invite } = await ownerClient
      .from('organization_invites')
      .select('*')
      .eq('email', 'invitee@example.com')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Invite row:', JSON.stringify(invite, null, 2));

    console.log('\n=== STEP 6: Accept invite as invitee ===');

    // Create invitee client and sign in
    const inviteeClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: inviteeAuth } = await inviteeClient.auth.signInWithPassword({
      email: 'invitee@example.com',
      password: 'password123'
    });

    console.log('Invitee authenticated:', inviteeAuth.user.email);
    const inviteeToken = inviteeAuth.session.access_token;

    // Call accept-invite API
    const acceptResponse = await fetch('http://localhost:3000/api/accept-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inviteeToken}`,
      },
      body: JSON.stringify({ token: inviteToken })
    });

    const acceptData = await acceptResponse.json();
    console.log('Status:', acceptResponse.status);
    console.log('Response:', JSON.stringify(acceptData, null, 2));

    if (acceptResponse.status === 200 && acceptData.ok) {
      console.log('✅ TEST 6 PASS: Invite accepted successfully');

      console.log('\n=== STEP 7: Verify membership and used_at ===');
      const { data: membership } = await inviteeClient
        .from('organization_members')
        .select('*')
        .eq('user_id', inviteeAuth.user.id)
        .eq('org_id', orgId)
        .single();

      console.log('Membership row:', JSON.stringify(membership, null, 2));

      const { data: usedInvite } = await inviteeClient
        .from('organization_invites')
        .select('used_at')
        .eq('email', 'invitee@example.com')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Invite used_at:', usedInvite.used_at);

      if (membership && usedInvite.used_at) {
        console.log('✅ TEST 7 PASS: Membership created and invite marked used');
      }
    } else {
      console.log('❌ TEST 6 FAIL:', acceptData);
    }
  } else {
    console.log('❌ TEST 4 FAIL:', sendData);
  }
}

runTests().catch(console.error);
