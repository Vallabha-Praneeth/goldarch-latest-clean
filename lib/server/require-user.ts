import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function requireUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op in route handlers
        },
        remove() {
          // no-op in route handlers
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, user: null, supabase };
  }

  return { ok: true as const, user, supabase };
}
