-- Fix RLS: avoid recursion on organization_members SELECT;
-- stabilise invite email checks and UPDATE RETURNING visibility.
--
-- Problems solved:
--   1) org_members_select_same_org referenced organization_members inside its
--      own USING clause, causing infinite recursion under PostgREST.
--   2) Several policies used  auth.jwt() ->> 'email'  which is not populated
--      by the local PostgREST / Kong stack (request.jwt is never set).
--   3) org_invites_select_invitee_email filtered  used_at IS NULL, making the
--      row invisible after the UPDATE — PostgREST RETURNING then failed the
--      implicit SELECT RLS check and returned "new row violates …".

-- =========================================================
-- 1) Helper functions (SECURITY DEFINER to bypass caller RLS)
-- =========================================================

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.organization_members m
    where m.org_id   = p_org_id
      and m.user_id  = auth.uid()
  );
$$;

revoke execute on function public.is_org_member(uuid) from public;
grant  execute on function public.is_org_member(uuid) to   authenticated;

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

revoke execute on function public.current_user_email() from public;
grant  execute on function public.current_user_email() to   authenticated;

-- =========================================================
-- 2) Fix organization_members SELECT (recursion)
-- =========================================================

drop policy if exists "org_members_select_same_org" on public.organization_members;

create policy "org_members_select_same_org"
  on public.organization_members
  for select
  to authenticated
  using (
    public.is_org_member(organization_members.org_id)
  );

-- =========================================================
-- 3) Fix org_members_insert_via_invite  (auth.jwt email)
-- =========================================================

drop policy if exists "org_members_insert_via_invite" on public.organization_members;

create policy "org_members_insert_via_invite"
  on public.organization_members
  for insert
  to authenticated
  with check (
    organization_members.user_id = auth.uid()
    and exists (
      select 1
      from public.organization_invites i
      where i.org_id            = organization_members.org_id
        and lower(i.email)      = coalesce(public.current_user_email(), '')
        and i.used_at           is null
        and i.expires_at        > now()
        and i.role              = organization_members.role
    )
  );

-- =========================================================
-- 4) Fix organization_invites SELECT for invitee
--    - Replace auth.jwt() email with current_user_email()
--    - Remove used_at IS NULL / expires_at filters so the row
--      stays visible after the UPDATE (required for PostgREST
--      RETURNING to pass the implicit SELECT RLS check).
-- =========================================================

drop policy if exists "org_invites_select_invitee_email" on public.organization_invites;

create policy "org_invites_select_invitee_email"
  on public.organization_invites
  for select
  to authenticated
  using (
    lower(organization_invites.email) = coalesce(public.current_user_email(), '')
  );

-- =========================================================
-- 5) Fix organization_invites UPDATE for invitee
--    - Replace auth.jwt() email with current_user_email()
--    - WITH CHECK: only verify email still matches (do NOT
--      assert used_at IS NOT NULL — that combined with the old
--      SELECT filter caused the RETURNING failure).
-- =========================================================

drop policy if exists "org_invites_update_used_by_invitee" on public.organization_invites;

create policy "org_invites_update_used_by_invitee"
  on public.organization_invites
  for update
  to authenticated
  using (
    lower(organization_invites.email) = coalesce(public.current_user_email(), '')
    and organization_invites.used_at   is null
    and organization_invites.expires_at > now()
  )
  with check (
    lower(organization_invites.email) = coalesce(public.current_user_email(), '')
  );
