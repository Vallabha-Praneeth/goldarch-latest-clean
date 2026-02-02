-- supabase/migrations/20260202100000_fix_supplier_access_rules_schema.sql
--
-- Purpose: Fix supplier_access_rules table schema to match code expectations
-- Replaces generic rule_key/rule_value with proper rule_data jsonb structure
--
-- This migration supports both new format (rule_data jsonb) and legacy fields (category_id, region)

begin;

-- Drop existing table if it has wrong structure (from previous migration)
drop table if exists public.supplier_access_rules cascade;

-- Create table with correct schema
create table public.supplier_access_rules (
  id uuid primary key default gen_random_uuid(),

  -- User assignment
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Access rule definition (new format - preferred)
  rule_data jsonb null check (
    rule_data is null or (
      jsonb_typeof(rule_data) = 'object' and
      (
        (rule_data->>'categories' is null or jsonb_typeof(rule_data->'categories') = 'array') and
        (rule_data->>'regions' is null or jsonb_typeof(rule_data->'regions') = 'array')
      )
    )
  ),

  -- Legacy fields (for backward compatibility)
  category_id text null,
  region text null,

  -- Metadata
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text null,

  -- At least one filter must be specified (rule_data or legacy fields)
  constraint rule_has_filter check (
    rule_data is not null or
    category_id is not null or
    region is not null
  )
);

-- Indexes for performance
create index supplier_access_rules_user_id_idx on public.supplier_access_rules (user_id);
create index supplier_access_rules_created_by_idx on public.supplier_access_rules (created_by);
create index supplier_access_rules_category_id_idx on public.supplier_access_rules (category_id) where category_id is not null;
create index supplier_access_rules_region_idx on public.supplier_access_rules (region) where region is not null;

-- GIN index for jsonb queries
create index supplier_access_rules_rule_data_idx on public.supplier_access_rules using gin (rule_data);

-- Enable RLS
alter table public.supplier_access_rules enable row level security;

-- RLS Policies

-- Admins can view all access rules
create policy "admin_select_all_access_rules"
  on public.supplier_access_rules
  for select
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );

-- Admins can insert access rules
create policy "admin_insert_access_rules"
  on public.supplier_access_rules
  for insert
  with check (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );

-- Admins can update access rules
create policy "admin_update_access_rules"
  on public.supplier_access_rules
  for update
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );

-- Admins can delete access rules
create policy "admin_delete_access_rules"
  on public.supplier_access_rules
  for delete
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );

-- Users can view their own access rules
create policy "user_select_own_access_rules"
  on public.supplier_access_rules
  for select
  using (user_id = auth.uid());

-- Function to update updated_at timestamp
create or replace function public.update_supplier_access_rules_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_supplier_access_rules_updated_at
  before update on public.supplier_access_rules
  for each row
  execute function public.update_supplier_access_rules_updated_at();

commit;
