/**
 * Apply Quote Builder Database Schema
 * Runs the migration to create all Quote Builder tables
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('🚀 Applying Quote Builder database schema...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260116_quote_builder_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log(`   File: ${migrationPath}`);
    console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Execute migration
    console.log('⏳ Executing SQL migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying alternative approach...\n');

      // Split SQL into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements to execute\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        // Skip comments and empty statements
        if (stmt.startsWith('--') || stmt.length < 10) continue;

        try {
          // Extract table name for better logging
          const tableMatch = stmt.match(/CREATE TABLE (\w+)/i) ||
                            stmt.match(/ALTER TABLE (\w+)/i) ||
                            stmt.match(/INSERT INTO (\w+)/i);

          const operation = stmt.substring(0, Math.min(50, stmt.length)).replace(/\s+/g, ' ');

          console.log(`   [${i + 1}/${statements.length}] ${operation}...`);

          if (tableMatch) {
            console.log(`      → Table: ${tableMatch[1]}`);
          }

          // Note: Supabase client doesn't support arbitrary SQL execution
          // This needs to be run via psql or Supabase dashboard SQL editor
          console.log(`      ⚠️  Skipping (requires SQL editor or psql)\n`);

        } catch (err) {
          console.error(`   ❌ Error:`, err.message, '\n');
          errorCount++;
        }
      }

      console.log('\n⚠️  MIGRATION REQUIRES MANUAL EXECUTION\n');
      console.log('The Supabase JavaScript client cannot execute DDL statements.');
      console.log('\nPlease run the migration using ONE of these methods:\n');
      console.log('METHOD 1: Supabase Dashboard (Recommended)');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Click "SQL Editor" in the left sidebar');
      console.log('   4. Click "New Query"');
      console.log('   5. Paste the contents of:');
      console.log(`      supabase/migrations/20260116_quote_builder_schema.sql`);
      console.log('   6. Click "Run" to execute\n');

      console.log('METHOD 2: psql Command Line');
      console.log('   Install PostgreSQL client, then run:');
      console.log('   psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 \\');
      console.log('        -U postgres.oszfxrubmstdavcehhkn -d postgres \\');
      console.log('        -f supabase/migrations/20260116_quote_builder_schema.sql\n');

      console.log('METHOD 3: Supabase CLI (if installed)');
      console.log('   supabase db push\n');

      process.exit(1);
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .or('tablename.like.quote%,tablename.like.quotation%')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.error('❌ Could not verify tables:', tablesError.message);
    } else {
      console.log(`✅ Created ${tables.length} new tables:`);
      tables.forEach(t => console.log(`   - ${t.tablename}`));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
