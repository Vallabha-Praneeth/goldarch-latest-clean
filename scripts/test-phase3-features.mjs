#!/usr/bin/env node
/**
 * Phase 3 Features End-to-End Test
 * Tests all 4 modules: Quote Sharing, Status Tracking, Versioning, Customer Responses
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = 'http://localhost:3000';

console.log('\n========================================');
console.log('Phase 3 Features Test');
console.log('========================================\n');

let testQuoteId = null;
let shareToken = null;

// Test 1: Find or create a test quotation
console.log('📋 Test 1: Getting test quotation...');
const { data: quotes } = await supabase
  .from('quotations')
  .select('id, quote_number, status')
  .limit(1);

if (!quotes || quotes.length === 0) {
  console.log('⚠️  No quotations found. Please create a quote first.');
  process.exit(1);
}

testQuoteId = quotes[0].id;
console.log(`✓ Using quotation: ${quotes[0].quote_number} (ID: ${testQuoteId})`);
console.log(`  Current status: ${quotes[0].status}\n`);

// Test 2: Generate Share Link
console.log('📋 Test 2: Generating share link...');
try {
  const response = await fetch(`${BASE_URL}/api/quote/${testQuoteId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresInDays: 7 })
  });

  const data = await response.json();

  if (response.ok && data.token) {
    shareToken = data.token;
    console.log(`✓ Share link generated`);
    console.log(`  Token: ${shareToken.substring(0, 20)}...`);
    console.log(`  Expires: ${data.expiresAt}`);
    console.log(`  Public URL: ${data.shareUrl}\n`);
  } else {
    console.log(`❌ Failed: ${data.error || 'Unknown error'}\n`);
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}\n`);
}

// Test 3: View Public Quote
if (shareToken) {
  console.log('📋 Test 3: Viewing public quote...');
  try {
    const response = await fetch(`${BASE_URL}/api/quote/public/${shareToken}`);
    const data = await response.json();

    if (response.ok && data.quote_number) {
      console.log(`✓ Public quote retrieved`);
      console.log(`  Quote Number: ${data.quote_number}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Line Items: ${data.lineItems?.length || 0}`);
      console.log(`  Total: ${data.currency} ${data.total}`);
      console.log(`  Can Respond: ${data.canRespond}\n`);
    } else {
      console.log(`❌ Failed: ${data.error || 'Unknown error'}\n`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
  }
}

// Test 4: Quote Status Tracking
console.log('📋 Test 4: Testing status tracking...');
try {
  // Get current status and history
  const response = await fetch(`${BASE_URL}/api/quote/${testQuoteId}/status`);
  const data = await response.json();

  if (response.ok) {
    console.log(`✓ Status tracking working`);
    console.log(`  Current Status: ${data.current_status}`);
    console.log(`  History Entries: ${data.status_history?.length || 0}`);
    console.log(`  Allowed Transitions: ${data.can_transition_to?.join(', ') || 'none'}\n`);
  } else {
    console.log(`❌ Failed: ${data.error || 'Unknown error'}\n`);
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}\n`);
}

// Test 5: Create Quote Version
console.log('📋 Test 5: Creating quote version...');
try {
  const response = await fetch(`${BASE_URL}/api/quote/${testQuoteId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test version snapshot' })
  });

  const data = await response.json();

  if (response.ok) {
    console.log(`✓ Version created successfully`);
    console.log(`  Version Number: ${data.version || 'N/A'}\n`);
  } else {
    console.log(`❌ Failed: ${data.error || 'Unknown error'}\n`);
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}\n`);
}

// Test 6: List Versions
console.log('📋 Test 6: Listing quote versions...');
try {
  const response = await fetch(`${BASE_URL}/api/quote/${testQuoteId}/versions`);
  const data = await response.json();

  if (response.ok) {
    console.log(`✓ Versions retrieved`);
    console.log(`  Total Versions: ${data.count}\n`);
  } else {
    console.log(`❌ Failed: ${data.error || 'Unknown error'}\n`);
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}\n`);
}

// Test 7: Customer Response (via public link)
if (shareToken) {
  console.log('📋 Test 7: Testing customer response...');
  try {
    const response = await fetch(`${BASE_URL}/api/quote/public/${shareToken}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'request_changes',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        notes: 'This is a test response'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✓ Customer response submitted`);
      console.log(`  Message: ${data.message}\n`);
    } else {
      console.log(`⚠️  Response: ${data.error || 'Unknown error'}`);
      console.log(`  (This might fail if already responded)\n`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
  }
}

// Test 8: List Customer Responses
console.log('📋 Test 8: Listing customer responses...');
try {
  const response = await fetch(`${BASE_URL}/api/quote/${testQuoteId}/responses`);
  const data = await response.json();

  if (response.ok) {
    console.log(`✓ Responses retrieved`);
    console.log(`  Total Responses: ${data.count}`);

    if (data.responses && data.responses.length > 0) {
      data.responses.forEach((r, i) => {
        console.log(`  Response ${i + 1}: ${r.response_type} by ${r.customer_name}`);
      });
    }
    console.log('');
  } else {
    console.log(`❌ Failed: ${data.error || 'Unknown error'}\n`);
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}\n`);
}

console.log('========================================');
console.log('✅ Phase 3 Feature Tests Complete!');
console.log('========================================\n');

if (shareToken) {
  console.log('🔗 Test your public quote link:');
  console.log(`   ${BASE_URL}/quote/${shareToken}\n`);
}
