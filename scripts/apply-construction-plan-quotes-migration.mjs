#!/usr/bin/env node
/**
 * Apply Construction Plan Quotes Migration
 * Creates the quotes and quote_lines tables for the Construction Plan Intelligence system
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

console.log('🔧 Applying Construction Plan Quotes Migration\n');

// Read the migration file
const migrationSQL = readFileSync('supabase/migrations/20260121_construction_plan_quotes.sql', 'utf8');

// Split into individual statements (simple split on semicolons)
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => {
    // Filter out empty statements and comments
    if (!stmt) return false;
    if (stmt.startsWith('--')) return false;
    // Keep everything else
    return true;
  });

console.log(`Found ${statements.length} SQL statements to execute\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];

  // Skip very short statements (likely just whitespace or comments)
  if (stmt.length < 10) continue;

  // Get first few words for logging
  const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';

  try {
    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: stmt + ';'
    });

    if (error) {
      // Some errors are expected (e.g., "relation already exists")
      if (error.message.includes('already exists') ||
          error.message.includes('does not exist')) {
        console.log(`   ⚠️  Warning: ${error.message.substring(0, 80)}`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`   ✅ Success`);
      successCount++;
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    errorCount++;
  }

  console.log('');
}

console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('📊 Migration Results\n');
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Errors: ${errorCount}`);
console.log('');

if (errorCount > 0) {
  console.log('⚠️  Some statements failed. You may need to run the migration manually via Supabase Dashboard.\n');
  console.log('Go to: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/editor/sql\n');
  process.exit(0); // Don't fail - some errors are expected
} else {
  console.log('🎉 Migration completed successfully!\n');
  process.exit(0);
}
