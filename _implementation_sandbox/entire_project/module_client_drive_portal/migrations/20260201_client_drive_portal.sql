-- Client Drive Portal + Section Access Control

-- Enums
create type crm_section as enum (
  'dashboard',
  'suppliers',
  'projects',
  'deals',
  'quotes',
  'documents',
  'plans',
  'tasks',
  'activities',
  'team',
  'client_portal'
);

create type access_level as enum ('none', 'view', 'edit');

-- Client accounts
create table if not exists client_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Client memberships
create table if not exists client_memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'client_user',
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

-- Client drive folder mappings
create table if not exists client_drive_folders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client_accounts(id) on delete cascade,
  drive_folder_id text not null,
  drive_folder_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (client_id, drive_folder_id)
);

create index if not exists idx_client_drive_folders_client_id on client_drive_folders(client_id);
create index if not exists idx_client_memberships_user_id on client_memberships(user_id);

-- Section-level access control
create table if not exists crm_section_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section crm_section not null,
  access_level access_level not null default 'none',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (user_id, section)
);

create index if not exists idx_section_access_user on crm_section_access(user_id);

-- Security audit logs
create table if not exists security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- RLS
alter table client_accounts enable row level security;
alter table client_memberships enable row level security;
alter table client_drive_folders enable row level security;
alter table crm_section_access enable row level security;
alter table security_audit_logs enable row level security;

-- Helpers
create or replace function is_admin_or_manager() returns boolean as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('Admin', 'Manager')
  );
$$ language sql stable;

-- client_accounts policies
create policy "client_accounts_select" on client_accounts
  for select using (
    is_admin_or_manager()
    or exists (
      select 1 from client_memberships
      where client_id = client_accounts.id
        and user_id = auth.uid()
    )
  );

create policy "client_accounts_manage" on client_accounts
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

-- client_memberships policies
create policy "client_memberships_select" on client_memberships
  for select using (
    is_admin_or_manager() or user_id = auth.uid()
  );

create policy "client_memberships_manage" on client_memberships
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

-- client_drive_folders policies
create policy "client_drive_folders_select" on client_drive_folders
  for select using (
    is_admin_or_manager()
    or exists (
      select 1 from client_memberships
      where client_id = client_drive_folders.client_id
        and user_id = auth.uid()
    )
  );

create policy "client_drive_folders_manage" on client_drive_folders
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

-- crm_section_access policies
create policy "crm_section_access_select" on crm_section_access
  for select using (is_admin_or_manager() or user_id = auth.uid());

create policy "crm_section_access_manage" on crm_section_access
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

-- security_audit_logs policies
create policy "security_audit_logs_select" on security_audit_logs
  for select using (is_admin_or_manager());

create policy "security_audit_logs_insert" on security_audit_logs
  for insert with check (auth.role() = 'service_role');
