import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oszfxrubmstdavcehhkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zemZ4cnVibXN0ZGF2Y2VoaGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3MjgwOSwiZXhwIjoyMDc5NjQ4ODA5fQ.HF5keNFFa_Br4H-25lIkkAvm7ubvE90v2Fsipw0awx4'
);

const { data: quotes, error } = await supabase
  .from('quotations')
  .select('id, quote_number, status, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Error:', error);
} else if (quotes && quotes.length > 0) {
  console.log('Found', quotes.length, 'quotes:\n');
  quotes.forEach(q => {
    console.log('- ID:', q.id);
    console.log('  Number:', q.quote_number);
    console.log('  Status:', q.status);
    console.log('  URL: http://localhost:3000/app-dashboard/quotes/' + q.id + '/review');
    console.log('');
  });
} else {
  console.log('No quotes found in database');
}
