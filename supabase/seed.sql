-- Seed file for local development
-- Disables RLS on tables that need it for E2E testing

-- Disable RLS on user_roles (allows E2E tests to set user roles)
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on quotes for E2E tests
ALTER TABLE IF EXISTS public.quotes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on quote_lines for E2E tests
ALTER TABLE IF EXISTS public.quote_lines DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organization_members for E2E tests
ALTER TABLE IF EXISTS public.organization_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organizations for E2E tests
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on templates for E2E tests
ALTER TABLE IF EXISTS public.templates DISABLE ROW LEVEL SECURITY;

-- Disable RLS on projects for E2E tests
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on suppliers for E2E tests
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on categories for E2E tests
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS on supplier_access_rules for E2E tests
ALTER TABLE IF EXISTS public.supplier_access_rules DISABLE ROW LEVEL SECURITY;
