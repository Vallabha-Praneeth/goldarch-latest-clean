#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from worker .env file
config({ path: join(__dirname, '../construction_plan_intelligence/worker/.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('\n=== Checking Plan Jobs Status ===\n');

// Get all jobs
const { data: jobs, error: jobsError } = await supabase
  .from('plan_jobs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

if (jobsError) {
  console.error('Error fetching jobs:', jobsError);
  process.exit(1);
}

console.log(`Found ${jobs.length} jobs:\n`);

for (const job of jobs) {
  const filename = job.file_path.split('/').pop();
  console.log(`Job ID: ${job.id}`);
  console.log(`  File: ${filename}`);
  console.log(`  Status: ${job.status}`);
  console.log(`  Created: ${new Date(job.created_at).toLocaleString()}`);
  console.log(`  Updated: ${new Date(job.updated_at).toLocaleString()}`);
  if (job.error) {
    console.log(`  Error: ${job.error}`);
  }
  console.log('');
}

// Check for completed jobs
const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'needs_review');

if (completedJobs.length > 0) {
  console.log('\n=== Completed Jobs with Analysis ===\n');

  for (const job of completedJobs.slice(0, 2)) {
    const { data: analysis, error: analysisError } = await supabase
      .from('plan_analyses')
      .select('*')
      .eq('job_id', job.id)
      .single();

    if (analysis) {
      console.log(`Job: ${job.id}`);
      console.log(`  Model: ${analysis.model}`);
      console.log(`  Needs Review: ${analysis.needs_review}`);
      console.log('\n  Extracted Quantities:');
      console.log(`    Doors: ${analysis.quantities.doors?.total || 0} (${analysis.quantities.doors?.confidence})`);
      console.log(`    Windows: ${analysis.quantities.windows?.total || 0} (${analysis.quantities.windows?.confidence})`);
      console.log(`    Kitchen: ${analysis.quantities.kitchen?.linear_ft_est || 0} linear ft (${analysis.quantities.kitchen?.confidence})`);
      console.log(`    Bathrooms: ${analysis.quantities.bathrooms?.bathroom_count || 0} (${analysis.quantities.bathrooms?.confidence})`);

      // Check if quote exists
      const { data: quote } = await supabase
        .from('quotes')
        .select('id, status, total, currency')
        .eq('job_id', job.id)
        .single();

      if (quote) {
        console.log(`\n  Quote: ${quote.currency} ${quote.total} (${quote.status})`);
      } else {
        console.log('\n  Quote: Not generated yet');
      }
      console.log('');
    }
  }
} else {
  console.log('No completed jobs yet. All jobs are still queued or processing.\n');
}
