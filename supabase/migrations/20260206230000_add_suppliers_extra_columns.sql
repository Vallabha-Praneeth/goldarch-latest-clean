-- supabase/migrations/20260206230000_add_suppliers_extra_columns.sql
--
-- Purpose: Add missing columns to suppliers table that the API routes expect
-- These columns are used by the MODULE-1B supplier management features

begin;

-- Add status column (default to 'active')
alter table public.suppliers
  add column if not exists status text default 'active';

-- Add rating column (0-5 scale)
alter table public.suppliers
  add column if not exists rating numeric(3,2);

-- Add tax_id column
alter table public.suppliers
  add column if not exists tax_id text;

-- Add payment_terms column (e.g., 'NET30', 'NET60')
alter table public.suppliers
  add column if not exists payment_terms text;

-- Add lead_time_days column
alter table public.suppliers
  add column if not exists lead_time_days integer;

-- Add minimum_order column (monetary value)
alter table public.suppliers
  add column if not exists minimum_order numeric(12,2);

-- Add discount_tier column
alter table public.suppliers
  add column if not exists discount_tier text;

-- Create index on status for filtering
create index if not exists suppliers_status_idx on public.suppliers (status);

commit;
