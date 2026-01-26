#!/usr/bin/env node
/**
 * Phase 3 SQL Migration Runner
 * Executes Phase 3 database schema changes
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n========================================');
console.log('Phase 3 SQL Migration Runner');
console.log('========================================\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const sql = readFileSync('supabase/migrations/20260119_phase3_modules.sql', 'utf8');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`📄 SQL file: supabase/migrations/20260119_phase3_modules.sql`);
console.log(`📊 Size: ${sql.length} characters\n`);

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute\n`);
console.log('Executing migrations...\n');

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';
  const preview = statement.substring(0, 80).replace(/\s+/g, ' ') + '...';

  process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

  try {
    // Execute via direct SQL query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      // If exec_sql doesn't exist, try direct query execution
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  (RPC not available)');
        errorCount++;
        continue;
      }
      console.log(`❌ Error: ${error.message}`);
      errorCount++;
    } else {
      console.log('✓');
      successCount++;
    }
  } catch (err) {
    console.log(`❌ ${err.message}`);
    errorCount++;
  }
}

console.log('\n========================================');
console.log('Migration Summary');
console.log('========================================');
console.log(`✓ Successful: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📊 Total: ${statements.length}\n`);

if (errorCount > 0) {
  console.log('⚠️  Some migrations failed.');
  console.log('\n📝 Manual execution required:');
  console.log('1. Go to: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/sql/new');
  console.log('2. Copy the SQL from: supabase/migrations/20260119_phase3_modules.sql');
  console.log('3. Execute it in the SQL Editor\n');
  process.exit(1);
} else if (successCount === 0) {
  console.log('⚠️  Direct SQL execution not available via API.');
  console.log('\n📝 Please run migrations manually:');
  console.log('1. Go to: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/sql/new');
  console.log('2. Copy and paste the content from: supabase/migrations/20260119_phase3_modules.sql');
  console.log('3. Click "Run" to execute\n');
  console.log('Or use Supabase CLI:');
  console.log('  supabase db push\n');
} else {
  console.log('✅ All migrations completed successfully!\n');
}
