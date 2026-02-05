-- =============================================================================
-- seed.sql — Local dev & CI only (NEVER runs on production)
-- =============================================================================
--
-- This file is executed by `supabase db reset` AFTER all migrations.
-- It is NEVER applied by `supabase db push` or `supabase migration up`.
--
-- Purpose: Disable Row Level Security on tables where RLS policies create
-- chicken-and-egg problems for e2e test setup (e.g., organization_members
-- requires an existing admin/owner to insert, but the first member has no
-- prior admin).
--
-- DO NOT move this content into supabase/migrations/ — migrations are
-- applied to production via `supabase db push`.
-- =============================================================================

begin;

-- =========================================================
-- organization_members: drop policies & disable RLS
-- =========================================================
-- RLS insert policy requires an existing admin/owner in the same org,
-- creating a chicken-and-egg problem for e2e test user setup.
drop policy if exists "org_members_select_same_org" on public.organization_members;
drop policy if exists "org_members_insert_admin_owner" on public.organization_members;
drop policy if exists "org_members_insert_via_invite" on public.organization_members;
drop policy if exists "org_members_update_admin_owner" on public.organization_members;
drop policy if exists "org_members_delete_admin_owner" on public.organization_members;

alter table public.organization_members disable row level security;

-- =========================================================
-- projects: disable RLS
-- =========================================================
drop policy if exists "Allow all access to projects" on public.projects;
drop policy if exists "Public full access to projects" on public.projects;

alter table public.projects disable row level security;

commit;
