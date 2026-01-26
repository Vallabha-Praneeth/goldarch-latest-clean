// Supabase client for Next.js (browser-side with cookie storage)
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './supabase-types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use createBrowserClient from @supabase/ssr for cookie-based storage
// This allows sessions to be available to API routes via cookies
export const supabase = createBrowserClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
