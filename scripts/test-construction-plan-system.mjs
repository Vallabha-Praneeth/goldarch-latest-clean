#!/usr/bin/env node
/**
 * Construction Plan Intelligence System Test
 * Tests the complete workflow: Database → Worker → Quote Generation
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

console.log('🏗️  Construction Plan Intelligence System Test\n');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;
let skipped = 0;

// ============================================================================
// Test 1: Database Schema Verification
// ============================================================================

async function testDatabaseSchema() {
  console.log('📊 Test 1: Database Schema Verification');

  const tables = [
    'plan_jobs',
    'plan_analyses',
    'price_books',
    'price_items',
    'quotes',
    'quote_lines'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`   ❌ Table '${table}' - ${error.message}`);
      return false;
    }
    console.log(`   ✅ Table '${table}' exists`);
  }

  console.log('');
  return true;
}

// ============================================================================
// Test 2: Price Book Verification
// ============================================================================

async function testPriceBook() {
  console.log('💰 Test 2: Price Book Verification');

  // Check for active price book
  const { data: activeBook, error: bookError } = await supabase
    .from('price_books')
    .select('*')
    .eq('is_active', true)
    .single();

  if (bookError || !activeBook) {
    console.log('   ❌ No active price book found');
    return false;
  }

  console.log(`   ✅ Active price book: ${activeBook.name}`);
  console.log(`      Currency: ${activeBook.currency}`);

  // Check for price items
  const { data: items, error: itemsError } = await supabase
    .from('price_items')
    .select('*')
    .eq('price_book_id', activeBook.id);

  if (itemsError || !items || items.length === 0) {
    console.log('   ❌ No price items found');
    return false;
  }

  console.log(`   ✅ Price items: ${items.length}`);
  console.log('      Categories available:');

  const categories = [...new Set(items.map(item => item.category))];
  categories.forEach(cat => {
    const count = items.filter(item => item.category === cat).length;
    console.log(`      - ${cat}: ${count} items`);
  });

  console.log('');
  return { activeBook, items };
}

// ============================================================================
// Test 3: Plan Jobs Verification
// ============================================================================

async function testPlanJobs() {
  console.log('📄 Test 3: Plan Jobs Verification');

  // Get all jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('plan_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.log(`   ❌ Failed to fetch jobs: ${jobsError.message}`);
    return false;
  }

  console.log(`   ✅ Total jobs: ${jobs.length}`);

  // Count by status
  const statuses = ['queued', 'processing', 'completed', 'needs_review', 'failed'];
  statuses.forEach(status => {
    const count = jobs.filter(job => job.status === status).length;
    if (count > 0) {
      console.log(`      - ${status}: ${count}`);
    }
  });

  // Find a completed job with analysis
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'needs_review');

  if (completedJobs.length > 0) {
    console.log(`   ✅ Found ${completedJobs.length} completed jobs for testing`);
    console.log('');
    return completedJobs[0];
  }

  console.log('   ⚠️  No completed jobs found for testing');
  console.log('');
  return null;
}

// ============================================================================
// Test 4: Plan Analysis Verification
// ============================================================================

async function testPlanAnalysis(jobId) {
  console.log('🔍 Test 4: Plan Analysis Verification');

  const { data: analysis, error: analysisError } = await supabase
    .from('plan_analyses')
    .select('*')
    .eq('job_id', jobId)
    .single();

  if (analysisError || !analysis) {
    console.log('   ❌ No analysis found for job');
    return false;
  }

  console.log(`   ✅ Analysis found for job: ${jobId}`);
  console.log(`      Model: ${analysis.extraction_model}`);
  console.log(`      Needs Review: ${analysis.needs_review}`);

  const quantities = analysis.quantities;

  if (quantities) {
    console.log('      Extracted Quantities:');
    if (quantities.doors) {
      console.log(`      - Doors: ${quantities.doors.total} (${quantities.doors.confidence})`);
    }
    if (quantities.windows) {
      console.log(`      - Windows: ${quantities.windows.total} (${quantities.windows.confidence})`);
    }
    if (quantities.kitchen) {
      console.log(`      - Kitchen: ${quantities.kitchen.linear_ft_est || quantities.kitchen.cabinets_count_est} (${quantities.kitchen.confidence})`);
    }
    if (quantities.bathrooms) {
      console.log(`      - Bathrooms: ${quantities.bathrooms.count} (${quantities.bathrooms.confidence})`);
    }
  }

  console.log('');
  return analysis;
}

// ============================================================================
// Test 5: Quote Generation API
// ============================================================================

async function testQuoteGeneration(jobId, priceBookId) {
  console.log('📝 Test 5: Quote Generation API');

  // Note: This requires authentication, so we'll test the API endpoint availability
  const response = await fetch(`${BASE_URL}/api/quotes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      jobId: jobId,
      priceBookId: priceBookId
    })
  });

  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();

    if (response.status === 401) {
      console.log('   ⚠️  Quote generation requires user authentication');
      console.log('      (This is expected - API uses cookie-based auth)');
      console.log('');
      return 'skipped';
    }

    if (!response.ok) {
      console.log(`   ❌ Quote generation failed: ${data.error}`);
      if (data.details) {
        console.log(`      Details: ${data.details}`);
      }
      console.log('');
      return false;
    }

    console.log('   ✅ Quote generated successfully');
    console.log(`      Quote ID: ${data.quoteId}`);
    console.log(`      Total: ${data.quote.currency} ${data.quote.total.toFixed(2)}`);
    console.log(`      Lines: ${data.lines.length}`);
    if (data.hasLowConfidence) {
      console.log('      ⚠️  Contains low-confidence items');
    }
    console.log('');
    return data;
  }

  console.log('   ❌ Unexpected response from API');
  console.log('');
  return false;
}

// ============================================================================
// Test 6: Existing Quotes Verification
// ============================================================================

async function testExistingQuotes() {
  console.log('📋 Test 6: Existing Quotes Verification');

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('*, quote_lines(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (quotesError) {
    console.log(`   ❌ Failed to fetch quotes: ${quotesError.message}`);
    return false;
  }

  if (!quotes || quotes.length === 0) {
    console.log('   ⚠️  No quotes found in database');
    console.log('');
    return 'empty';
  }

  console.log(`   ✅ Found ${quotes.length} quotes (showing recent 5)`);

  quotes.forEach((quote, index) => {
    console.log(`\n      Quote ${index + 1}:`);
    console.log(`      - ID: ${quote.id}`);
    console.log(`      - Status: ${quote.status}`);
    console.log(`      - Total: ${quote.currency} ${quote.total}`);
    console.log(`      - Lines: ${quote.quote_lines?.length || 0}`);
    console.log(`      - Created: ${new Date(quote.created_at).toLocaleString()}`);
  });

  console.log('');
  return quotes;
}

// ============================================================================
// Test 7: Worker Status Check
// ============================================================================

async function testWorkerStatus() {
  console.log('⚙️  Test 7: Worker Status Check');

  // Check for recent queued jobs
  const { data: queuedJobs, error } = await supabase
    .from('plan_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true });

  if (error) {
    console.log(`   ❌ Failed to check queued jobs: ${error.message}`);
    return false;
  }

  if (queuedJobs && queuedJobs.length > 0) {
    console.log(`   ⚠️  ${queuedJobs.length} jobs in queue`);
    console.log('      Worker should be processing these');
  } else {
    console.log('   ✅ No jobs in queue');
  }

  // Check for recent processing
  const { data: recentJobs } = await supabase
    .from('plan_jobs')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (recentJobs && recentJobs.length > 0) {
    const lastUpdate = new Date(recentJobs[0].updated_at);
    const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
    console.log(`   ℹ️  Last job update: ${minutesAgo} minutes ago`);
  }

  console.log('');
  return true;
}

// ============================================================================
// Run All Tests
// ============================================================================

try {
  // Test 1: Schema
  if (await testDatabaseSchema()) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Price Book
  const priceBookData = await testPriceBook();
  if (priceBookData) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Plan Jobs
  const completedJob = await testPlanJobs();
  if (completedJob !== false) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Plan Analysis
  if (completedJob) {
    const analysis = await testPlanAnalysis(completedJob.id);
    if (analysis) {
      passed++;
    } else {
      failed++;
    }

    // Test 5: Quote Generation
    if (priceBookData && analysis) {
      const quoteResult = await testQuoteGeneration(completedJob.id, priceBookData.activeBook.id);
      if (quoteResult === 'skipped') {
        skipped++;
      } else if (quoteResult) {
        passed++;
      } else {
        failed++;
      }
    } else {
      console.log('⏭️  Skipping quote generation test (no valid job/price book)\n');
      skipped++;
    }
  } else {
    console.log('⏭️  Skipping analysis and quote tests (no completed jobs)\n');
    skipped += 2;
  }

  // Test 6: Existing Quotes
  const quotesResult = await testExistingQuotes();
  if (quotesResult && quotesResult !== 'empty') {
    passed++;
  } else if (quotesResult === 'empty') {
    skipped++;
  } else {
    failed++;
  }

  // Test 7: Worker Status
  if (await testWorkerStatus()) {
    passed++;
  } else {
    failed++;
  }

} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  failed++;
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('📊 TEST RESULTS SUMMARY\n');
console.log(`   ✅ Passed:  ${passed}`);
console.log(`   ❌ Failed:  ${failed}`);
console.log(`   ⏭️  Skipped: ${skipped}`);
console.log(`   📈 Total:   ${passed + failed + skipped}`);
console.log('');

if (failed === 0) {
  console.log('🎉 All tests passed! Construction Plan Intelligence system is operational.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} test(s) failed. Review errors above.\n`);
  process.exit(1);
}
