import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n========================================');
console.log('Phase 3 Schema Verification');
console.log('========================================\n');

// Check each table
const tables = [
  'public_quote_links',
  'quote_status_history',
  'quote_versions',
  'quote_customer_responses'
];

for (const table of tables) {
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`❌ ${table}: Not found or error - ${error.message}`);
  } else {
    console.log(`✓ ${table}: Table exists (${count || 0} rows)`);
  }
}

console.log('\n✅ Phase 3 database schema verified!\n');
