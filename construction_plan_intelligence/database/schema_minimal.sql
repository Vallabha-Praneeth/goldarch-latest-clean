-- Construction Plan Intelligence - Minimal Schema (No RLS)
-- Version: 1.2 - Tables only, RLS disabled for initial setup
-- Run this first to create tables, then add RLS policies separately if needed

-- ============================================================================
-- CLEAN START (Optional - only if re-running)
-- ============================================================================

-- Uncomment these if you need to start fresh:
-- DROP TABLE IF EXISTS product_assets CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS quote_lines CASCADE;
-- DROP TABLE IF EXISTS plan_analyses CASCADE;
-- DROP TABLE IF EXISTS plan_job_artifacts CASCADE;
-- DROP TABLE IF EXISTS price_items CASCADE;
-- DROP TABLE IF EXISTS price_books CASCADE;
-- DROP TABLE IF EXISTS plan_jobs CASCADE;

-- ============================================================================
-- JOB MANAGEMENT
-- ============================================================================

CREATE TABLE plan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_jobs_status ON plan_jobs(status);
CREATE INDEX idx_plan_jobs_user ON plan_jobs(user_id);
CREATE INDEX idx_plan_jobs_created ON plan_jobs(created_at DESC);

-- ============================================================================
-- PROCESSING ARTIFACTS
-- ============================================================================

CREATE TABLE plan_job_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES plan_jobs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  page_no INT,
  artifact_path TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_artifacts_job ON plan_job_artifacts(job_id);
CREATE INDEX idx_job_artifacts_kind ON plan_job_artifacts(kind);
CREATE INDEX idx_job_artifacts_page ON plan_job_artifacts(job_id, page_no);

-- ============================================================================
-- ANALYSIS RESULTS
-- ============================================================================

CREATE TABLE plan_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES plan_jobs(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  quantities JSONB NOT NULL,
  confidence JSONB NOT NULL,
  evidence JSONB NOT NULL,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_plan_analyses_job ON plan_analyses(job_id);
CREATE INDEX idx_plan_analyses_review ON plan_analyses(needs_review);

-- ============================================================================
-- PRICING SYSTEM
-- ============================================================================

CREATE TABLE price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_books_active ON price_books(is_active);

CREATE TABLE price_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID NOT NULL REFERENCES price_books(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  variant TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_items_book ON price_items(price_book_id);
CREATE INDEX idx_price_items_cat_var ON price_items(category, variant);
CREATE INDEX idx_price_items_sku ON price_items(price_book_id, sku);

-- ============================================================================
-- QUOTES
-- ============================================================================

-- Check if quotes table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    -- Create new quotes table
    CREATE TABLE quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      job_id UUID REFERENCES plan_jobs(id),
      price_book_id UUID REFERENCES price_books(id),
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
      tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_quotes_user ON quotes(user_id);
    CREATE INDEX idx_quotes_job ON quotes(job_id);
    CREATE INDEX idx_quotes_status ON quotes(status);

    RAISE NOTICE 'Created new quotes table';
  ELSE
    -- Table exists, add job_id column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'job_id'
    ) THEN
      ALTER TABLE quotes ADD COLUMN job_id UUID REFERENCES plan_jobs(id);
      CREATE INDEX idx_quotes_job ON quotes(job_id);
      RAISE NOTICE 'Added job_id column to existing quotes table';
    ELSE
      RAISE NOTICE 'Quotes table already has job_id column';
    END IF;
  END IF;
END $$;

-- Quote line items
CREATE TABLE IF NOT EXISTS quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  selections JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_lines_quote ON quote_lines(quote_id);

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  material TEXT,
  brand TEXT,
  base_price NUMERIC(10, 2),
  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_cat_mat ON products(category, material);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE TABLE IF NOT EXISTS product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  asset_path TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_product ON product_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_assets_kind ON product_assets(product_id, kind);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_plan_jobs_updated_at ON plan_jobs;
CREATE TRIGGER update_plan_jobs_updated_at
  BEFORE UPDATE ON plan_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_books_updated_at ON price_books;
CREATE TRIGGER update_price_books_updated_at
  BEFORE UPDATE ON price_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_items_updated_at ON price_items;
CREATE TRIGGER update_price_items_updated_at
  BEFORE UPDATE ON price_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO price_books (name, currency, is_active)
SELECT '2024 Standard Pricing', 'INR', TRUE
WHERE NOT EXISTS (SELECT 1 FROM price_books WHERE is_active = TRUE);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  price_book_id UUID;
BEGIN
  -- Get the price book ID
  SELECT id INTO price_book_id FROM price_books WHERE is_active = TRUE LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Construction Plan Intelligence - Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  ✓ plan_jobs';
  RAISE NOTICE '  ✓ plan_job_artifacts';
  RAISE NOTICE '  ✓ plan_analyses';
  RAISE NOTICE '  ✓ price_books';
  RAISE NOTICE '  ✓ price_items';
  RAISE NOTICE '  ✓ quotes';
  RAISE NOTICE '  ✓ quote_lines';
  RAISE NOTICE '  ✓ products';
  RAISE NOTICE '  ✓ product_assets';
  RAISE NOTICE '';
  RAISE NOTICE 'Active Price Book ID: %', price_book_id;
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Add sample price items (see below)';
  RAISE NOTICE '2. Create Supabase Storage bucket: "plans" (private)';
  RAISE NOTICE '3. Set up Python worker';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SAMPLE PRICE ITEMS (Run after getting price book ID)
-- ============================================================================

/*
-- First, get your price book ID:
SELECT id, name FROM price_books WHERE is_active = true;

-- Then insert sample prices (replace <price_book_id> with actual UUID):

INSERT INTO price_items (price_book_id, sku, category, variant, unit, unit_price) VALUES
  ('<price_book_id>', 'DOOR-STD-001', 'door', 'standard', 'each', 5000.00),
  ('<price_book_id>', 'DOOR-WD-001', 'door', 'wood', 'each', 8000.00),
  ('<price_book_id>', 'WIN-STD-001', 'window', 'standard', 'each', 3000.00),
  ('<price_book_id>', 'WIN-AL-001', 'window', 'aluminum', 'each', 4500.00),
  ('<price_book_id>', 'CAB-STD-001', 'cabinet', 'standard', 'linear_ft', 1200.00),
  ('<price_book_id>', 'TOIL-STD-001', 'toilet', 'standard', 'each', 6000.00),
  ('<price_book_id>', 'SINK-STD-001', 'sink', 'standard', 'each', 4000.00),
  ('<price_book_id>', 'SHOW-STD-001', 'shower', 'standard', 'each', 8000.00);

-- Verify:
SELECT pb.name, COUNT(pi.*) as item_count
FROM price_books pb
LEFT JOIN price_items pi ON pb.id = pi.price_book_id
WHERE pb.is_active = true
GROUP BY pb.name;
*/
