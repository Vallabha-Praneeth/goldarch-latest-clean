import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function requireUser() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Check for Authorization header (for e2e testing)
  const authHeader = headerStore.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

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
      // If Authorization header is present, use it instead of cookies
      ...(accessToken ? {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      } : {}),
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken || undefined);

  if (error || !user) {
    return { ok: false as const, user: null, supabase };
  }

  return { ok: true as const, user, supabase };
}
