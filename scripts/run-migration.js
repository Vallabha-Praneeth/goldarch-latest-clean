const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Adding rule_data JSONB column to supplier_access_rules...');

    // Note: Supabase JS client doesn't support DDL directly
    // We need to run this via the Supabase dashboard SQL editor

    console.log('\n=== MIGRATION SQL ===');
    console.log('Please run this SQL in your Supabase dashboard (SQL Editor):');
    console.log('\nALTER TABLE supplier_access_rules ADD COLUMN IF NOT EXISTS rule_data JSONB;');
    console.log('\nOr visit: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/sql/new');
    console.log('\n=== END SQL ===\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

runMigration();
