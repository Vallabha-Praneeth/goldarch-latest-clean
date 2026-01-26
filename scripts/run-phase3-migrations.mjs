import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const sql = readFileSync('/tmp/phase3-migration.sql', 'utf8');

console.log('Executing Phase 3 migrations via HTTP...\n');

// Execute SQL via Supabase REST API
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  },
  body: JSON.stringify({ query: sql })
});

if (!response.ok) {
  console.log('⚠️  Direct SQL execution not available');
  console.log('\nSQL file ready at: /tmp/phase3-migration.sql');
  console.log('\nFor now, continuing with file copying...');
} else {
  console.log('✓ Migrations completed!');
}
