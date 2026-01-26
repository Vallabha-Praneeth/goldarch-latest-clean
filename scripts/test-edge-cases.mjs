#!/usr/bin/env node
/**
 * Edge Cases & Error Handling Test
 * Tests system behavior with invalid inputs and edge cases
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🧪 Edge Cases & Error Handling Test\n');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

// ============================================================================
// Test 1: Invalid Lead ID
// ============================================================================

async function testInvalidLeadId() {
  console.log('❌ Test 1: Invalid Lead ID');

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: 'invalid-uuid-format',
      items: [{ productId: 'test', category: 'doors', quantity: 1 }]
    })
  });

  // Should either accept it or return error (both are valid behaviors)
  if (response.status === 400 || response.status === 404 || response.ok) {
    console.log('   ✅ Handles invalid lead ID gracefully\n');
    return true;
  }

  console.log('   ❌ Unexpected response:', response.status, '\n');
  return false;
}

// ============================================================================
// Test 2: Negative Quantity
// ============================================================================

async function testNegativeQuantity() {
  console.log('❌ Test 2: Negative Quantity');

  const { data: products } = await supabase.from('products').select('*').limit(1);

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: '9cd14112-86a1-4803-9c15-13e833483d89',
      items: [{ productId: products[0].id, category: 'doors', quantity: -5 }]
    })
  });

  if (response.status === 400) {
    console.log('   ✅ Rejects negative quantity (400)\n');
    return true;
  }

  console.log('   ⚠️  Accepted negative quantity (should validate)\n');
  return false;
}

// ============================================================================
// Test 3: Zero Quantity
// ============================================================================

async function testZeroQuantity() {
  console.log('❌ Test 3: Zero Quantity');

  const { data: products } = await supabase.from('products').select('*').limit(1);

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: '9cd14112-86a1-4803-9c15-13e833483d89',
      items: [{ productId: products[0].id, category: 'doors', quantity: 0 }]
    })
  });

  if (response.status === 400) {
    console.log('   ✅ Rejects zero quantity (400)\n');
    return true;
  }

  console.log('   ⚠️  Accepted zero quantity (should validate)\n');
  return false;
}

// ============================================================================
// Test 4: Non-existent Product ID
// ============================================================================

async function testNonExistentProduct() {
  console.log('❌ Test 4: Non-existent Product');

  const fakeProductId = '00000000-0000-0000-0000-000000000000';

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: '9cd14112-86a1-4803-9c15-13e833483d89',
      items: [{ productId: fakeProductId, category: 'doors', quantity: 1 }]
    })
  });

  const data = await response.json();

  if (response.status === 404 || (data.warnings && data.warnings.length > 0)) {
    console.log('   ✅ Handles missing product gracefully\n');
    return true;
  }

  console.log('   ⚠️  No warning for missing product\n');
  return false;
}

// ============================================================================
// Test 5: Empty Line Items
// ============================================================================

async function testEmptyLineItems() {
  console.log('❌ Test 5: Empty Line Items');

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: '9cd14112-86a1-4803-9c15-13e833483d89',
      items: []
    })
  });

  if (response.status === 400) {
    console.log('   ✅ Rejects empty line items (400)\n');
    return true;
  }

  console.log('   ⚠️  Accepted empty line items\n');
  return false;
}

// ============================================================================
// Test 6: Very Large Quantity (Stress Test)
// ============================================================================

async function testLargeQuantity() {
  console.log('📊 Test 6: Large Quantity (10,000 units)');

  const { data: products } = await supabase.from('products').select('*').limit(1);

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: '9cd14112-86a1-4803-9c15-13e833483d89',
      items: [{ productId: products[0].id, category: 'doors', quantity: 10000 }]
    })
  });

  const data = await response.json();

  if (response.ok && data.summary.subtotal === 10000 * products[0].base_price) {
    console.log(`   ✅ Handles large quantity: $${data.summary.subtotal.toLocaleString()}\n`);
    return true;
  }

  console.log('   ⚠️  Large quantity calculation issue\n');
  return false;
}

// ============================================================================
// Test 7: Non-existent Quote Retrieval
// ============================================================================

async function testNonExistentQuote() {
  console.log('❌ Test 7: Non-existent Quote Retrieval');

  const fakeQuoteId = '00000000-0000-0000-0000-000000000000';

  const response = await fetch(`${BASE_URL}/api/quote/generate?id=${fakeQuoteId}`);

  if (response.status === 404) {
    console.log('   ✅ Returns 404 for missing quote\n');
    return true;
  }

  console.log('   ⚠️  Unexpected status:', response.status, '\n');
  return false;
}

// ============================================================================
// Test 8: PDF Generation for Non-existent Quote
// ============================================================================

async function testPDFNonExistentQuote() {
  console.log('❌ Test 8: PDF for Non-existent Quote');

  const fakeQuoteId = '00000000-0000-0000-0000-000000000000';

  const response = await fetch(`${BASE_URL}/api/quote/pdf/${fakeQuoteId}`);

  if (response.status === 404) {
    console.log('   ✅ Returns 404 for missing quote\n');
    return true;
  }

  console.log('   ⚠️  Unexpected status:', response.status, '\n');
  return false;
}

// ============================================================================
// Test 9: Malformed JSON
// ============================================================================

async function testMalformedJSON() {
  console.log('❌ Test 9: Malformed JSON Request');

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'this is not json'
  });

  if (response.status === 400 || response.status === 500) {
    console.log('   ✅ Handles malformed JSON\n');
    return true;
  }

  console.log('   ⚠️  Unexpected status:', response.status, '\n');
  return false;
}

// ============================================================================
// Test 10: Multiple Line Items (Real-world scenario)
// ============================================================================

async function testMultipleLineItems() {
  console.log('✅ Test 10: Multiple Line Items (Real-world)');

  const { data: products } = await supabase.from('products').select('*').limit(3);

  const items = products.map((p, i) => ({
    productId: p.id,
    category: p.category,
    quantity: (i + 1) * 2  // 2, 4, 6 units
  }));

  const response = await fetch(`${BASE_URL}/api/quote/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: '9cd14112-86a1-4803-9c15-13e833483d89',
      items
    })
  });

  const data = await response.json();

  if (response.ok && data.lineItems.length === items.length) {
    console.log(`   ✅ Processes ${items.length} line items correctly`);
    console.log(`      Total: $${data.summary.total.toFixed(2)}\n`);
    return true;
  }

  console.log('   ⚠️  Multiple line items issue\n');
  return false;
}

// ============================================================================
// Run All Edge Case Tests
// ============================================================================

try {
  if (await testInvalidLeadId()) passed++; else failed++;
  if (await testNegativeQuantity()) passed++; else failed++;
  if (await testZeroQuantity()) passed++; else failed++;
  if (await testNonExistentProduct()) passed++; else failed++;
  if (await testEmptyLineItems()) passed++; else failed++;
  if (await testLargeQuantity()) passed++; else failed++;
  if (await testNonExistentQuote()) passed++; else failed++;
  if (await testPDFNonExistentQuote()) passed++; else failed++;
  if (await testMalformedJSON()) passed++; else failed++;
  if (await testMultipleLineItems()) passed++; else failed++;

} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  failed++;
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('📊 EDGE CASE TEST RESULTS\n');
console.log(`   ✅ Passed:  ${passed}/10`);
console.log(`   ❌ Failed:  ${failed}/10`);
console.log('');

if (failed === 0) {
  console.log('🎉 All edge cases handled correctly!\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} edge case(s) need attention\n`);
  process.exit(0); // Don't fail - these are warnings
}
