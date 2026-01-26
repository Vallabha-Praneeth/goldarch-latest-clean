/**
 * Verify Quote Builder Schema
 * Checks if Quote Builder tables exist and are properly configured
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifySchema() {
  console.log('🔍 Verifying Quote Builder Schema\n');

  const requiredTables = [
    'quote_regions',
    'quote_customer_tiers',
    'quote_leads',
    'quote_compliance_rules',
    'quote_pricing_rules',
    'quotations',
    'quotation_lines',
    'quotation_versions',
    'quotation_audit_log',
    'quote_product_visibility',
    'quote_email_tracking'
  ];

  let allGood = true;

  for (const tableName of requiredTables) {
    try {
      // Try to query the table (limit 0 to just check existence)
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ Table missing: ${tableName}`);
          allGood = false;
        } else {
          console.log(`⚠️  Table ${tableName}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${tableName}`);
      }
    } catch (err) {
      console.log(`❌ Error checking ${tableName}:`, err.message);
      allGood = false;
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (!allGood) {
    console.log('❌ Schema verification FAILED\n');
    console.log('Some tables are missing. Please apply the migration:\n');
    console.log('📋 MIGRATION INSTRUCTIONS:\n');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in left sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Copy/paste contents of:');
    console.log('   supabase/migrations/20260116_quote_builder_schema.sql');
    console.log('6. Click "Run" to execute\n');
    console.log('7. Re-run this script to verify: node scripts/verify-quote-builder-schema.mjs\n');
    process.exit(1);
  } else {
    console.log('✅ All Quote Builder tables exist!\n');

    // Check seed data
    console.log('🔍 Checking seed data...\n');

    const { data: regions, error: regionsError } = await supabase
      .from('quote_regions')
      .select('code, name')
      .eq('code', 'los-angeles');

    if (regionsError) {
      console.log('⚠️  Could not check regions:', regionsError.message);
    } else if (regions && regions.length > 0) {
      console.log(`✅ Los Angeles region configured: ${regions[0].name}`);
    } else {
      console.log('⚠️  Los Angeles region not found (may need to run seed data)');
    }

    const { data: tiers, error: tiersError } = await supabase
      .from('quote_customer_tiers')
      .select('name, description');

    if (tiersError) {
      console.log('⚠️  Could not check tiers:', tiersError.message);
    } else if (tiers && tiers.length > 0) {
      console.log(`✅ Customer tiers configured: ${tiers.map(t => t.name).join(', ')}`);
    } else {
      console.log('⚠️  No customer tiers found (may need to run seed data)');
    }

    console.log('\n✅ Schema verification PASSED!\n');
    console.log('Quote Builder database is ready for use.\n');
  }
}

verifySchema().catch(err => {
  console.error('❌ Verification error:', err);
  process.exit(1);
});
