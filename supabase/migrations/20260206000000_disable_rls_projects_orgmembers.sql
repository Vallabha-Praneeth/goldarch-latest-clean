-- Create projects table and project_status enum for local/CI environments.
--
-- The projects table exists in production (remote schema) but not in local
-- migrations. This migration bridges that gap so e2e tests can run locally.
--
-- All statements use IF NOT EXISTS — safe no-op if already present.

begin;

-- Enum used by the projects table
do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum (
      'planning', 'design', 'procurement', 'construction',
      'completed', 'on_hold', 'in_progress', 'archived'
    );
  end if;
end
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status public.project_status default 'planning',
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  location text,
  budget numeric(15,2),
  start_date date,
  end_date date,
  client_name text,
  client_email text,
  client_phone text,
  priority text default 'medium',
  completion_percentage integer default 0,
  tags text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

commit;
