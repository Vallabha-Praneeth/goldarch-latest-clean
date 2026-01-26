/**
 * Supabase Service Role Client
 *
 * IMPORTANT: This client has ADMIN privileges and bypasses RLS.
 * Only use server-side (API routes, server components).
 * NEVER expose to the client.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Service role client - bypasses RLS, can access auth.users
 * Use ONLY for admin operations like:
 * - Inviting users
 * - Listing all users
 * - Managing roles
 */
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
