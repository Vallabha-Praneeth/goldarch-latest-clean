# Repo Scan Map (Standards 13.3 Q1)

## Supabase client setup
- `/Users/anitavallabha/goldarch_web_copy/lib/supabase-client.ts` — browser/client Supabase init using `@supabase/ssr`.
- `/Users/anitavallabha/goldarch_web_copy/docs/TECHNICAL_DOCUMENTATION.md` — references `supabase-client.ts` and supabase patterns.
- `/Users/anitavallabha/goldarch_web_copy/supabase/migrations/add_quote_approval_columns.sql` — example migration file location.

## Rules/config table patterns
- `/Users/anitavallabha/goldarch_web_copy/supabase/migrations/add_quote_approval_columns.sql` — shows Supabase migration location and naming.
- `/Users/anitavallabha/goldarch_web_copy/docs/TECHNICAL_DOCUMENTATION.md` — general DB and client usage patterns.

## Upstash Redis wrapper
- `/Users/anitavallabha/goldarch_web_copy/lib/rate-limit.ts` — Upstash Redis client setup; reusable pattern for Redis instantiation.
- `/Users/anitavallabha/goldarch_web_copy/scripts/test-redis-rate-limit.mjs` — example Redis usage in scripts.

## Pinecone usage
- `/Users/anitavallabha/goldarch_web_copy/Framework_B_Implementation/config/pinecone.config.ts` — Pinecone config structure and env var patterns.
- `/Users/anitavallabha/goldarch_web_copy/Framework_B_Implementation/services/vector-store/VectorStore.ts` — Pinecone vector store usage.

## Quote/session pipeline touchpoints
- `/Users/anitavallabha/goldarch_web_copy/app/api/plans/[jobId]/result/route.ts` — API response includes quote data for a plan/job.
- `/Users/anitavallabha/goldarch_web_copy/app/app-dashboard/plans/[jobId]/quote/page.tsx` — triggers quote generation API.
- `/Users/anitavallabha/goldarch_web_copy/app/api/quotes/[quoteId]/submit/route.ts` — quote submit pipeline.
- `/Users/anitavallabha/goldarch_web_copy/src/views/Quotes.tsx` — quote list view.
- `/Users/anitavallabha/goldarch_web_copy/src/views/QuoteDetail.tsx` — quote detail view.
