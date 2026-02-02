-- supabase/migrations/20260129000000_create_supplier_access_rules.sql
--
-- Purpose:
-- Creates/normalizes supplier_access_rules table required by alignment checks.
-- Remote-safe: if the table already exists (with older columns), this migration
-- adds any missing columns before creating indexes.

-- 1) Create table if missing (new installs)
create table if not exists public.supplier_access_rules (
  id uuid primary key default gen_random_uuid(),

  -- Who/what the rule applies to
  supplier_id uuid null,
  user_id uuid null,
  role text null,

  -- Rule definition
  rule_key text not null,
  rule_value text null,

  -- Common metadata
  is_active boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Reconcile existing remote table shape (older installs)
-- Add missing columns (no-ops if already present)
alter table public.supplier_access_rules
  add column if not exists supplier_id uuid;

alter table public.supplier_access_rules
  add column if not exists user_id uuid;

alter table public.supplier_access_rules
  add column if not exists role text;

alter table public.supplier_access_rules
  add column if not exists rule_key text;

alter table public.supplier_access_rules
  add column if not exists rule_value text;

alter table public.supplier_access_rules
  add column if not exists is_active boolean not null default true;

alter table public.supplier_access_rules
  add column if not exists notes text;

alter table public.supplier_access_rules
  add column if not exists created_at timestamptz not null default now();

alter table public.supplier_access_rules
  add column if not exists updated_at timestamptz not null default now();

-- 3) Helpful indexes (now safe because columns exist)
create index if not exists supplier_access_rules_supplier_id_idx
  on public.supplier_access_rules (supplier_id);

create index if not exists supplier_access_rules_user_id_idx
  on public.supplier_access_rules (user_id);

create index if not exists supplier_access_rules_rule_key_idx
  on public.supplier_access_rules (rule_key);

-- Note:
-- No foreign keys here on purpose (shadow/remote safety).
