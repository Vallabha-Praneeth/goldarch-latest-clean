#!/usr/bin/env node

/**
 * End-to-end test for Construction Plan Intelligence
 * Tests: Upload → Processing → Extraction → Quote Generation
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
config({ path: join(__dirname, '../construction_plan_intelligence/worker/.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test user credentials (you'll need to provide these)
const TEST_USER_EMAIL = 'anita@goldarch.com';  // Update with your test user
const TEST_USER_PASSWORD = '';  // Leave empty if using existing session

async function uploadTestPlan(filePath) {
  console.log('\n📤 Step 1: Uploading test plan...');

  // Sign in first if needed
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('User not authenticated. Please sign in first.');
    return null;
  }

  console.log(`Authenticated as: ${user.email}`);

  // Read file
  const fileBuffer = readFileSync(filePath);
  const filename = `${Date.now()}-test.pdf`;
  const filePathInStorage = `${user.id}/${filename}`;

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('plans')
    .upload(filePathInStorage, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return null;
  }

  console.log(`✅ File uploaded to: ${filePathInStorage}`);

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from('plan_jobs')
    .insert({
      user_id: user.id,
      file_path: filePathInStorage,
      file_type: 'pdf',
      status: 'queued',
    })
    .select()
    .single();

  if (jobError) {
    console.error('Job creation error:', jobError);
    return null;
  }

  console.log(`✅ Job created: ${job.id}`);
  return job.id;
}

async function monitorJob(jobId) {
  console.log('\n⏳ Step 2: Monitoring job processing...');

  let attempts = 0;
  const maxAttempts = 120; // 10 minutes

  while (attempts < maxAttempts) {
    const { data: job } = await supabase
      .from('plan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) break;

    const elapsed = attempts * 5;
    process.stdout.write(`\r[${elapsed}s] Status: ${job.status.padEnd(15)}`);

    if (job.status === 'completed' || job.status === 'needs_review') {
      console.log(`\n✅ Processing complete! Status: ${job.status}`);
      return job;
    }

    if (job.status === 'failed') {
      console.log(`\n❌ Processing failed: ${job.error}`);
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  console.log('\n⏱️  Timeout waiting for job completion');
  return null;
}

async function checkAnalysis(jobId) {
  console.log('\n🔍 Step 3: Checking extraction results...');

  const { data: analysis, error } = await supabase
    .from('plan_analyses')
    .select('*')
    .eq('job_id', jobId)
    .single();

  if (error || !analysis) {
    console.log('❌ No analysis found');
    return null;
  }

  console.log('\n📊 Extracted Quantities:');
  console.log(`  Doors: ${analysis.quantities.doors?.total || 0} (${analysis.quantities.doors?.confidence})`);
  console.log(`  Windows: ${analysis.quantities.windows?.total || 0} (${analysis.quantities.windows?.confidence})`);
  console.log(`  Kitchen: ${analysis.quantities.kitchen?.linear_ft_est || 0} linear ft (${analysis.quantities.kitchen?.confidence})`);
  console.log(`  Bathrooms: ${analysis.quantities.bathrooms?.bathroom_count || 0} (${analysis.quantities.bathrooms?.confidence})`);
  console.log(`\n  Model: ${analysis.model}`);
  console.log(`  Needs Review: ${analysis.needs_review}`);

  return analysis;
}

async function generateQuote(jobId) {
  console.log('\n💰 Step 4: Generating quote...');

  // Call the quote generation API
  const response = await fetch('http://localhost:3000/api/quotes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.log('❌ Quote generation failed:', error);
    return null;
  }

  const quote = await response.json();
  console.log('\n✅ Quote generated successfully!');
  console.log(`  Quote ID: ${quote.quoteId}`);
  console.log(`  Total: ${quote.quote.currency} ${quote.quote.total.toFixed(2)}`);
  console.log(`  Line Items: ${quote.quote.lines.length}`);

  return quote;
}

async function runTest(testFilePath) {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  Construction Plan Intelligence - E2E Test   ║');
  console.log('╚═══════════════════════════════════════════════╝');

  try {
    // Step 1: Upload
    const jobId = await uploadTestPlan(testFilePath);
    if (!jobId) {
      console.log('\n❌ Test failed at upload step');
      return;
    }

    // Step 2: Monitor processing
    const job = await monitorJob(jobId);
    if (!job || job.status === 'failed') {
      console.log('\n❌ Test failed at processing step');
      return;
    }

    // Step 3: Check analysis
    const analysis = await checkAnalysis(jobId);
    if (!analysis) {
      console.log('\n❌ Test failed at analysis step');
      return;
    }

    // Step 4: Generate quote
    const quote = await generateQuote(jobId);
    if (!quote) {
      console.log('\n❌ Test failed at quote generation step');
      return;
    }

    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║          ✅ ALL TESTS PASSED! ✅             ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Test error:', error);
  }
}

// Run test
const testFile = process.argv[2];
if (!testFile) {
  console.log('Usage: node test-plan-workflow.mjs <path-to-test-pdf>');
  process.exit(1);
}

runTest(testFile);
