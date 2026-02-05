-- Add columns that exist in production but are missing from local migrations.
-- These columns are used by the API routes and cause e2e test failures.

begin;

-- =========================================================
-- suppliers: add missing columns used by POST /api/suppliers
-- =========================================================
alter table public.suppliers add column if not exists status text default 'active';
alter table public.suppliers add column if not exists rating numeric(3,2);
alter table public.suppliers add column if not exists tax_id text;
alter table public.suppliers add column if not exists payment_terms text;
alter table public.suppliers add column if not exists lead_time_days integer;
alter table public.suppliers add column if not exists minimum_order numeric(15,2);
alter table public.suppliers add column if not exists discount_tier text;

-- =========================================================
-- quotations: add missing columns used by POST /api/quote
-- =========================================================
alter table public.quotations add column if not exists tax_placeholder numeric(15,2) default 0;
alter table public.quotations add column if not exists discount_amount numeric(15,2) default 0;
alter table public.quotations add column if not exists currency text default 'USD';
alter table public.quotations add column if not exists internal_notes text;
alter table public.quotations add column if not exists customer_notes text;
alter table public.quotations add column if not exists terms_and_conditions text;
alter table public.quotations add column if not exists created_by uuid references auth.users(id) on delete set null;

commit;
