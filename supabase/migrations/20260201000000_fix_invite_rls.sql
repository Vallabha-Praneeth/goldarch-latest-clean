begin;

-- ============================================================================
-- Helper functions (SECURITY DEFINER) for RLS
-- ============================================================================

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(u.email)
  from auth.users u
  where u.id = auth.uid();
$$;

revoke all on function public.current_user_email() from public;
grant execute on function public.current_user_email() to authenticated;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

-- ============================================================================
-- Fix #1: organization_members SELECT policy recursion
--   Drop ALL SELECT policies (recursion risk) and recreate a safe one.
-- ============================================================================

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_members'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.organization_members;', p.policyname);
  end loop;
end$$;

-- Recreate safe SELECT policy (no self-referencing subqueries)
create policy org_members_select_same_org
  on public.organization_members
  for select
  to authenticated
  using (
    public.is_org_member(organization_members.org_id)
  );

-- Also harden insert-via-invite to avoid auth.jwt()->>'email' and enforce role match
drop policy if exists org_members_insert_via_invite on public.organization_members;

create policy org_members_insert_via_invite
  on public.organization_members
  for insert
  to authenticated
  with check (
    organization_members.user_id = auth.uid()
    and exists (
      select 1
      from public.organization_invites i
      where i.org_id = organization_members.org_id
        and lower(i.email) = public.current_user_email()
        and i.used_at is null
        and i.expires_at > now()
        and i.role = organization_members.role
    )
  );

-- ============================================================================
-- Fix #2: organization_invites email + RETURNING visibility
--   - Replace auth.jwt()->>'email' with current_user_email()
--   - Ensure invitee can SELECT their invite even after used_at is set
--     (PostgREST UPDATE ... RETURNING needs SELECT visibility)
-- ============================================================================

-- Invitee SELECT: do NOT filter on used_at; restrict only by email match.
drop policy if exists org_invites_select_invitee on public.organization_invites;
drop policy if exists org_invites_select_invitee_email on public.organization_invites;

create policy org_invites_select_invitee
  on public.organization_invites
  for select
  to authenticated
  using (
    lower(organization_invites.email) = public.current_user_email()
  );

-- Invitee UPDATE (mark used): must be unused + unexpired; WITH CHECK ensures used_at becomes non-null.
drop policy if exists org_invites_update_use on public.organization_invites;
drop policy if exists org_invites_update_used_by_invitee on public.organization_invites;

create policy org_invites_update_use
  on public.organization_invites
  for update
  to authenticated
  using (
    lower(organization_invites.email) = public.current_user_email()
    and organization_invites.used_at is null
    and organization_invites.expires_at > now()
  )
  with check (
    lower(organization_invites.email) = public.current_user_email()
    and organization_invites.used_at is not null
  );

commit;
