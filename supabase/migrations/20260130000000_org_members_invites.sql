-- Organizations + Memberships + Invites (minimal backbone)
-- Goals:
-- - Org admins/owners can invite others
-- - Invitees can accept (no service_role required)
-- - RLS enforces org membership visibility and invite acceptance rules

-- =========================================================
-- 1) Tables
-- =========================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id),
  constraint organization_members_role_check
    check (role in ('owner','admin','manager','procurement','viewer'))
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null,
  token_hash text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint organization_invites_role_check
    check (role in ('owner','admin','manager','procurement','viewer'))
);

-- =========================================================
-- 2) Indexes
-- =========================================================

create index if not exists organizations_created_by_idx
  on public.organizations (created_by);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

create index if not exists organization_invites_org_id_idx
  on public.organization_invites (org_id);

create index if not exists organization_invites_email_idx
  on public.organization_invites (lower(email));

create index if not exists organization_invites_token_hash_idx
  on public.organization_invites (token_hash);

-- =========================================================
-- 3) RLS
-- =========================================================

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

-- Organizations: members can read; authenticated can create; admins/owners can update/delete.
create policy "org_select_members"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
    )
  );

create policy "org_insert_authenticated"
  on public.organizations for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "org_update_admin_owner"
  on public.organizations for update
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

create policy "org_delete_owner"
  on public.organizations for delete
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- Memberships: members can read members in same org.
create policy "org_members_select_same_org"
  on public.organization_members for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_members.org_id
        and me.user_id = auth.uid()
    )
  );

-- Membership insert:
-- (A) Admin/owner can add members
create policy "org_members_insert_admin_owner"
  on public.organization_members for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_members.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  );

-- (B) Invitee can add themselves if there is a valid, un-used invite for their email
-- Uses auth.jwt() email claim; if your project disables email in JWT, we’ll adjust later.
create policy "org_members_insert_via_invite"
  on public.organization_members for insert
  to authenticated
  with check (
    organization_members.user_id = auth.uid()
    and exists (
      select 1
      from public.organization_invites i
      where i.org_id = organization_members.org_id
        and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and i.used_at is null
        and i.expires_at > now()
        and i.role = organization_members.role
    )
  );

-- Membership update/delete: admin/owner only (keeps it simple for now).
create policy "org_members_update_admin_owner"
  on public.organization_members for update
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_members.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_members.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  );

create policy "org_members_delete_admin_owner"
  on public.organization_members for delete
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_members.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  );

-- Invites:
-- - Admin/owner can read/create invites for their org
-- - Invitee can read their own invite only if they have the token (API will filter by token_hash)
--   but we keep DB rule simple: invitee may select by email match.
create policy "org_invites_select_admin_owner"
  on public.organization_invites for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_invites.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  );

-- ✅ Added: invitee can SELECT their own active invites by email.
-- API still filters by token_hash; this policy just allows visibility for the invitee’s email.
create policy "org_invites_select_invitee_email"
  on public.organization_invites for select
  to authenticated
  using (
    lower(organization_invites.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and organization_invites.used_at is null
    and organization_invites.expires_at > now()
  );

create policy "org_invites_insert_admin_owner"
  on public.organization_invites for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_invites.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  );

-- Invitee can mark their invite as used (used_at) if email matches and invite still valid.
create policy "org_invites_update_used_by_invitee"
  on public.organization_invites for update
  to authenticated
  using (
    lower(organization_invites.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and organization_invites.used_at is null
    and organization_invites.expires_at > now()
  )
  with check (
    lower(organization_invites.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and organization_invites.used_at is not null
  );

create policy "org_invites_delete_admin_owner"
  on public.organization_invites for delete
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members me
      where me.org_id = organization_invites.org_id
        and me.user_id = auth.uid()
        and me.role in ('owner','admin')
    )
  );
