import { config } from 'dotenv';
import { readFileSync } from 'fs';
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Phase 3 Migrations');
console.log('=================\n');
console.log('SQL file: supabase/migrations/20260119_phase3_modules.sql\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const sql = readFileSync('supabase/migrations/20260119_phase3_modules.sql', 'utf8');

console.log(`📄 SQL size: ${sql.length} characters`);
console.log(`\n⚠️  Please run this SQL manually in Supabase SQL Editor:`);
console.log(`   https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/sql/new\n`);
console.log('Or use the Supabase CLI: supabase db push\n');
console.log('File location: supabase/migrations/20260119_phase3_modules.sql\n');
