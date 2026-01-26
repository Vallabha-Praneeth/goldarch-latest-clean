import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = [
  'quote_regions',
  'quote_customer_rules', 
  'quote_leads',
  'quotes',
  'quote_lines'
];

for (const table of tables) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  console.log(table + ': ' + (count || 0) + ' rows');
  
  if (count > 0) {
    const { data } = await supabase.from(table).select('*').limit(1);
    if (data && data[0]) {
      console.log('  Columns: ' + Object.keys(data[0]).join(', '));
    }
  }
}
