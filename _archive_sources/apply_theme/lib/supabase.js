import { createClient } from '@supabase/supabase-js';

// Clean and validate environment variables
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oszfxrubmstdavcehhkn.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zemZ4cnVibXN0ZGF2Y2VoaGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzI4MDksImV4cCI6MjA3OTY0ODgwOX0.6kxvu-RS4lmsg3Z60S_XWEogGPKqawFf5TTG1H-t_Pk').trim();

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});
