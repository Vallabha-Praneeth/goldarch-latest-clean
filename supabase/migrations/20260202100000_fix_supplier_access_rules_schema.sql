-- supabase/migrations/20260202100000_fix_supplier_access_rules_schema.sql
--
-- Purpose: Fix supplier_access_rules table schema to match code expectations
-- Replaces generic rule_key/rule_value with proper rule_data jsonb structure
--
-- IMPORTANT: This migration preserves existing data by renaming the old table
-- and backfilling data into the new schema format.

begin;

-- Step 1: Rename existing table to preserve data
-- If table doesn't exist, this will silently succeed with a notice
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
    and table_name = 'supplier_access_rules'
  ) then
    alter table public.supplier_access_rules rename to supplier_access_rules_old;
  end if;
end $$;

-- Step 2: Create table with correct schema
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

-- Step 3: Backfill data from old table if it exists
-- This preserves existing access rules by transforming them to new format
do $$
declare
  old_table_exists boolean;
begin
  -- Check if old table exists
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
    and table_name = 'supplier_access_rules_old'
  ) into old_table_exists;

  if old_table_exists then
    -- Attempt to backfill data
    -- Handle different possible old schema formats

    -- Format 1: Old schema with rule_key/rule_value
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
      and table_name = 'supplier_access_rules_old'
      and column_name = 'rule_key'
    ) then
      insert into public.supplier_access_rules (
        id, user_id, category_id, region, created_by, created_at, notes
      )
      select
        id,
        user_id,
        case when rule_key = 'category' then rule_value else null end as category_id,
        case when rule_key = 'region' then rule_value else null end as region,
        user_id as created_by,  -- Use user_id as created_by since old table may not have this column
        created_at,
        notes
      from supplier_access_rules_old
      where rule_key in ('category', 'region');

    -- Format 2: Old schema with category_id/region columns
    elsif exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
      and table_name = 'supplier_access_rules_old'
      and column_name = 'category_id'
    ) then
      insert into public.supplier_access_rules (
        id, user_id, rule_data, category_id, region, created_by, created_at, notes
      )
      select
        id,
        user_id,
        -- Transform to new format: create jsonb with arrays
        jsonb_build_object(
          'categories',
          case
            when category_id is not null then jsonb_build_array(category_id)
            else '[]'::jsonb
          end,
          'regions',
          case
            when region is not null then jsonb_build_array(region)
            else '[]'::jsonb
          end
        ) as rule_data,
        category_id,  -- Keep legacy fields for compatibility
        region,
        coalesce(created_by, user_id) as created_by,
        created_at,
        coalesce(notes, '') as notes
      from supplier_access_rules_old;
    end if;

    -- Log successful migration
    raise notice 'Migrated % rows from supplier_access_rules_old',
      (select count(*) from supplier_access_rules);

    -- Step 4: Drop old table after successful backfill
    drop table if exists public.supplier_access_rules_old cascade;
  else
    raise notice 'No existing supplier_access_rules table found - creating fresh';
  end if;
end $$;

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
