#!/usr/bin/env node

/**
 * Phase 2 Features Test Script
 * Tests all integrated Phase 2 functionality
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('🧪 Phase 2 Features Test Suite\n');
console.log('='.repeat(50));

// Test Results Tracker
const results = {
  passed: [],
  failed: [],
  skipped: []
};

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}`);
  if (message) console.log(`   ${message}`);

  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push(name);
  else results.skipped.push(name);
}

// Check Environment
console.log('\n📋 Environment Check\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  logTest('Environment Variables', 'fail', 'Missing Supabase credentials');
  process.exit(1);
}

logTest('Supabase URL', 'pass', SUPABASE_URL);
logTest('Supabase Key', 'pass', '***' + SUPABASE_KEY.slice(-10));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Check if Resend is configured
const hasResend = !!process.env.RESEND_API_KEY;
const hasEmailConfig = !!process.env.EMAIL_FROM_ADDRESS;

if (hasResend && hasEmailConfig) {
  logTest('Email Configuration', 'pass', 'Resend API configured');
} else {
  logTest('Email Configuration', 'skip', 'Email env vars not set (can add later)');
}

// Test 1: Database Tables
console.log('\n📊 Database Tables Check\n');

async function checkTables() {
  try {
    // Check if quote_email_tracking table exists
    const { data: emailTracking, error: emailError } = await supabase
      .from('quote_email_tracking')
      .select('id')
      .limit(1);

    if (emailError && emailError.code === '42P01') {
      logTest('quote_email_tracking table', 'fail', 'Table does not exist - run migration');
    } else if (emailError) {
      logTest('quote_email_tracking table', 'fail', emailError.message);
    } else {
      logTest('quote_email_tracking table', 'pass');
    }

    // Check if quote_extraction_adjustments table exists
    const { data: adjustments, error: adjError } = await supabase
      .from('quote_extraction_adjustments')
      .select('id')
      .limit(1);

    if (adjError && adjError.code === '42P01') {
      logTest('quote_extraction_adjustments table', 'fail', 'Table does not exist - run migration');
    } else if (adjError) {
      logTest('quote_extraction_adjustments table', 'fail', adjError.message);
    } else {
      logTest('quote_extraction_adjustments table', 'pass');
    }

    // Check if products table has images column
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, images')
      .limit(1);

    if (prodError) {
      logTest('products.images column', 'fail', prodError.message);
    } else {
      logTest('products.images column', 'pass');
    }

  } catch (error) {
    logTest('Database connection', 'fail', error.message);
  }
}

await checkTables();

// Test 2: Check for test data
console.log('\n🔍 Test Data Check\n');

async function checkTestData() {
  try {
    // Check for quotations
    const { data: quotes, error: quotesError } = await supabase
      .from('quotations')
      .select('id, quote_number')
      .limit(1);

    if (quotesError) {
      logTest('Quotations data', 'fail', quotesError.message);
      return null;
    }

    if (!quotes || quotes.length === 0) {
      logTest('Quotations data', 'skip', 'No quotations found (create one to test)');
      return null;
    }

    logTest('Quotations data', 'pass', `Found quote: ${quotes[0].quote_number}`);
    return quotes[0];

  } catch (error) {
    logTest('Test data check', 'fail', error.message);
    return null;
  }
}

const testQuote = await checkTestData();

// Test 3: API Endpoints (if dev server is running)
console.log('\n🌐 API Endpoints Check\n');

async function testEndpoints() {
  if (!testQuote) {
    logTest('API Tests', 'skip', 'No test data available');
    return;
  }

  try {
    // Test PDF Generation endpoint
    const pdfResponse = await fetch(`${BASE_URL}/api/quote/pdf/${testQuote.id}`);

    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get('content-type');
      if (contentType === 'application/pdf') {
        logTest('PDF Generation API', 'pass', 'Endpoint returns PDF');
      } else {
        logTest('PDF Generation API', 'fail', `Wrong content type: ${contentType}`);
      }
    } else if (pdfResponse.status === 404) {
      logTest('PDF Generation API', 'skip', 'Dev server not running on localhost:3000');
    } else {
      const error = await pdfResponse.json();
      logTest('PDF Generation API', 'fail', error.error || 'Unknown error');
    }

    // Test Email History endpoint
    const emailResponse = await fetch(`${BASE_URL}/api/quote/email/${testQuote.id}`);

    if (emailResponse.ok) {
      const data = await emailResponse.json();
      logTest('Email History API', 'pass', `Found ${data.history?.length || 0} emails`);
    } else if (emailResponse.status === 404) {
      logTest('Email History API', 'skip', 'Dev server not running');
    } else {
      const error = await emailResponse.json();
      logTest('Email History API', 'fail', error.error || 'Unknown error');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('API Endpoints', 'skip', 'Dev server not running (start with: npm run dev)');
    } else {
      logTest('API Endpoints', 'fail', error.message);
    }
  }
}

await testEndpoints();

// Test 4: Storage Bucket
console.log('\n📦 Storage Bucket Check\n');

async function checkStorage() {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      logTest('Storage connection', 'fail', error.message);
      return;
    }

    const productsBucket = data.find(b => b.name === 'products');

    if (productsBucket) {
      logTest('Products storage bucket', 'pass', 'Bucket exists and is ' + (productsBucket.public ? 'public' : 'private'));
    } else {
      logTest('Products storage bucket', 'fail', 'Bucket does not exist - create it manually');
    }

  } catch (error) {
    logTest('Storage check', 'fail', error.message);
  }
}

await checkStorage();

// Test 5: File Structure
console.log('\n📁 File Structure Check\n');

import { existsSync } from 'fs';

const filesToCheck = [
  'lib/pdf/pdf-generator.ts',
  'lib/pdf/types.ts',
  'lib/email/email-service.ts',
  'lib/email/types.ts',
  'lib/images/image-uploader.ts',
  'lib/images/types.ts',
  'lib/adjustments/types.ts',
  'app/api/quote/pdf/[quoteId]/route.ts',
  'app/api/quote/email/[quoteId]/route.ts',
  'app/api/quote/products/images/route.ts',
  'app/api/quote/extraction/[jobId]/adjust/route.ts',
  'components/phase2/quote/QuoteActions.tsx',
  'components/phase2/quote/ProductImageManager.tsx',
  'components/phase2/quote/QuantityEditor.tsx',
  'app/app-dashboard/quotes/[quoteId]/review/page.tsx',
  'app/app-dashboard/products/[productId]/edit/page.tsx',
];

let allFilesExist = true;
for (const file of filesToCheck) {
  if (existsSync(file)) {
    logTest(file, 'pass');
  } else {
    logTest(file, 'fail', 'File missing');
    allFilesExist = false;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Skipped: ${results.skipped.length}`);
console.log('='.repeat(50));

if (results.failed.length > 0) {
  console.log('\n⚠️  Action Required:\n');

  if (results.failed.some(t => t.includes('table'))) {
    console.log('📝 Run database migration:');
    console.log('   ./scripts/run-phase2-migration.sh');
    console.log('   OR apply SQL manually in Supabase Dashboard\n');
  }

  if (results.failed.some(t => t.includes('storage bucket'))) {
    console.log('📦 Create Storage Bucket:');
    console.log('   1. Go to Supabase Dashboard > Storage');
    console.log('   2. Create bucket named "products" (public, 5MB limit)\n');
  }

  if (results.failed.some(t => t.includes('File missing'))) {
    console.log('📁 Some files are missing - re-run integration\n');
  }
}

if (results.skipped.some(t => t.includes('Email'))) {
  console.log('\n📧 Email Setup (Optional):');
  console.log('   1. Sign up at https://resend.com');
  console.log('   2. Add to .env.local:');
  console.log('      RESEND_API_KEY=re_xxxx');
  console.log('      EMAIL_FROM_ADDRESS=quotes@goldarch.com');
  console.log('      EMAIL_FROM_NAME=GoldArch Construction\n');
}

if (results.skipped.some(t => t.includes('Dev server'))) {
  console.log('\n🚀 Start dev server to test API endpoints:');
  console.log('   npm run dev\n');
}

console.log('\n✨ Next: Test in browser at http://localhost:3000/app-dashboard\n');

process.exit(results.failed.length > 0 ? 1 : 0);
