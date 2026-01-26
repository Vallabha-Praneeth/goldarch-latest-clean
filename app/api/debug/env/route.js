// GET /api/_debug/env
// Returns booleans for required env vars and current node/vercel envs

export async function GET() {
  if (process.env.DISABLE_DEBUG_ENDPOINTS === 'true') {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }
  const env = process.env;
  return Response.json({
    has_NEXT_PUBLIC_SUPABASE_URL: !!env.NEXT_PUBLIC_SUPABASE_URL,
    has_NEXT_PUBLIC_SUPABASE_ANON_KEY: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_SUPABASE_SERVICE_ROLE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY,
    node_env: env.NODE_ENV || null,
    vercel_env: env.VERCEL_ENV || null,
  });
}
