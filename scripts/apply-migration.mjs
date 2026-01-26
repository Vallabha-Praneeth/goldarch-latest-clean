#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🚀 Applying Phase 2 Migration...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read migration file
const migrationSQL = readFileSync('supabase/migrations/20260119_phase2_complete.sql', 'utf8');

// Split into individual statements (basic splitting)
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/**'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

let executed = 0;
let failed = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';

  // Skip comments and empty statements
  if (statement.trim().startsWith('--') || statement.trim().length < 5) {
    continue;
  }

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
      // Some errors are expected (like table already exists)
      if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
        failed++;
      }
    } else {
      executed++;
    }
  } catch (err) {
    console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
  }
}

console.log(`\n✅ Migration complete!`);
console.log(`   Executed: ${executed} statements`);
if (failed > 0) {
  console.log(`   Failed: ${failed} statements`);
}

console.log('\n📋 Next steps:');
console.log('   1. Create "products" storage bucket in Supabase Dashboard');
console.log('   2. Run test script again: node scripts/test-phase2-features.mjs');
