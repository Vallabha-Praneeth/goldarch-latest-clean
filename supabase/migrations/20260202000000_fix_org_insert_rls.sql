-- Fix organizations INSERT RLS policy
-- Issue: E2E test failing with "new row violates row-level security policy"
-- Root cause: INSERT policy doesn't enforce created_by = auth.uid()

begin;

-- Drop existing INSERT policy
drop policy if exists "org_insert_authenticated" on public.organizations;

-- Recreate with proper check: created_by must match authenticated user
create policy "org_insert_authenticated"
  on public.organizations
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
  );

commit;
