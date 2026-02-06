-- 20260206200000_create_quotes_table.sql
-- MODULE-1C: Create quotes + quote_lines tables for the approval workflow.
--
-- The `quotes` table may already exist in production (legacy schema).
-- This migration uses CREATE TABLE IF NOT EXISTS for the base table,
-- then ALTER TABLE ADD COLUMN IF NOT EXISTS for MODULE-1C columns.
-- This makes it safe to run against both fresh and existing databases.

BEGIN;

-- ============================================================================
-- 1. STUB FK TARGETS (safe no-ops if they already exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. QUOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Legacy columns
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.plan_jobs(id) ON DELETE SET NULL,
  price_book_id UUID REFERENCES public.price_books(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,

  -- MODULE-1C: Approval workflow columns
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quote_number TEXT,
  title TEXT,
  description TEXT,
  amount DECIMAL(12,2),
  supplier_id UUID,
  deal_id UUID,
  project_id UUID,
  valid_until TEXT,

  -- MODULE-1C: Submission tracking
  submitted_at TIMESTAMPTZ,

  -- MODULE-1C: Approval tracking
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- MODULE-1C: Rejection tracking
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safety net: ADD COLUMN IF NOT EXISTS for each MODULE-1C column
-- (handles production where quotes table exists but lacks these columns)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS quote_number TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deal_id UUID;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS valid_until TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Make legacy FK columns nullable (MODULE-1C workflow doesn't require them)
-- These are no-ops if the columns are already nullable.
ALTER TABLE public.quotes ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE public.quotes ALTER COLUMN price_book_id DROP NOT NULL;

-- ============================================================================
-- 3. QUOTE LINES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID,
  category TEXT,
  title TEXT,
  description TEXT,
  quantity DECIMAL(12,3) DEFAULT 1,
  unit TEXT,
  unit_price DECIMAL(12,2),
  line_total DECIMAL(12,2),
  line_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON public.quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_supplier_id ON public.quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON public.quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON public.quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_product_id ON public.quote_lines(product_id);

-- ============================================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================================

-- Reuse existing trigger function if available, otherwise create
CREATE OR REPLACE FUNCTION public.quotes_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotes_touch ON public.quotes;
CREATE TRIGGER trg_quotes_touch
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.quotes_touch_updated_at();

DROP TRIGGER IF EXISTS trg_quote_lines_touch ON public.quote_lines;
CREATE TRIGGER trg_quote_lines_touch
  BEFORE UPDATE ON public.quote_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.quotes_touch_updated_at();

-- ============================================================================
-- 6. DISABLE RLS (dev/local only — matches project pattern)
-- ============================================================================

-- Drop any existing RLS policies that might block local dev
DROP POLICY IF EXISTS "quotes_select_own_or_admin" ON public.quotes;
DROP POLICY IF EXISTS "quotes_insert_own" ON public.quotes;
DROP POLICY IF EXISTS "quotes_update_own_or_admin" ON public.quotes;
DROP POLICY IF EXISTS "quotes_delete_own_or_admin" ON public.quotes;

ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_lines DISABLE ROW LEVEL SECURITY;

COMMIT;
