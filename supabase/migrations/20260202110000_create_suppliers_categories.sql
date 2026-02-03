-- supabase/migrations/20260202110000_create_suppliers_categories.sql
--
-- Purpose: Create suppliers and categories tables for supplier management feature
-- Dependencies: auth.users (for user_id foreign key)

begin;

-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create suppliers table
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),

  -- Basic info
  name text not null,
  category_id uuid references public.categories(id) on delete set null,

  -- Location
  region text,
  city text,
  address text,

  -- Contact info
  contact_person text,
  email text,
  phone text,
  website text,

  -- Additional info
  products text,
  notes text,

  -- Catalog files
  catalog_url text,
  catalog_title text,

  -- Ownership
  user_id uuid references auth.users(id) on delete set null,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists categories_name_idx on public.categories (name);

create index if not exists suppliers_name_idx on public.suppliers (name);
create index if not exists suppliers_category_id_idx on public.suppliers (category_id);
create index if not exists suppliers_region_idx on public.suppliers (region);
create index if not exists suppliers_city_idx on public.suppliers (city);
create index if not exists suppliers_user_id_idx on public.suppliers (user_id);
create index if not exists suppliers_created_at_idx on public.suppliers (created_at desc);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;

-- RLS Policies for categories
-- Anyone authenticated can read categories
create policy "categories_select_authenticated"
  on public.categories
  for select
  to authenticated
  using (true);

-- Only admins can modify categories (using organization membership check)
create policy "categories_insert_admin"
  on public.categories
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create policy "categories_update_admin"
  on public.categories
  for update
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create policy "categories_delete_admin"
  on public.categories
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- RLS Policies for suppliers
-- Anyone authenticated can read suppliers (filtering will be handled by application logic)
create policy "suppliers_select_authenticated"
  on public.suppliers
  for select
  to authenticated
  using (true);

-- Authenticated users can insert suppliers
create policy "suppliers_insert_authenticated"
  on public.suppliers
  for insert
  to authenticated
  with check (auth.uid() is not null);

-- Users can update their own suppliers, admins can update any
create policy "suppliers_update_own_or_admin"
  on public.suppliers
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Users can delete their own suppliers, admins can delete any
create policy "suppliers_delete_own_or_admin"
  on public.suppliers
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Trigger to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger categories_updated_at
  before update on public.categories
  for each row
  execute function public.handle_updated_at();

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row
  execute function public.handle_updated_at();

-- Seed some default categories for testing
-- COMMENTED OUT: Production has different schema with slug NOT NULL constraint
-- Categories already exist in production, no need to seed
-- insert into public.categories (name, description) values
--   ('Kitchen', 'Kitchen fixtures and appliances'),
--   ('Bathroom', 'Bathroom fixtures and fittings'),
--   ('Electrical', 'Electrical supplies and contractors'),
--   ('Plumbing', 'Plumbing supplies and contractors'),
--   ('Flooring', 'Flooring materials and installation'),
--   ('Painting', 'Paint and painting contractors'),
--   ('HVAC', 'Heating, ventilation, and air conditioning'),
--   ('Roofing', 'Roofing materials and contractors'),
--   ('Windows', 'Windows and door suppliers'),
--   ('General', 'General construction supplies')
-- on conflict (name) do nothing;

commit;
