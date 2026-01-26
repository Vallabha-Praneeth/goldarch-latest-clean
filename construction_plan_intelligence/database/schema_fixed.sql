-- Construction Plan Intelligence - Database Schema (FIXED)
-- Version: 1.1
-- Purpose: Store plan processing jobs, results, pricing, and products
-- FIXED: Removed auth.users foreign key constraints for compatibility

-- ============================================================================
-- JOB MANAGEMENT
-- ============================================================================

-- Tracks PDF/image upload and processing pipeline
CREATE TABLE IF NOT EXISTS plan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- References auth.users but no FK constraint
  file_path TEXT NOT NULL,          -- Supabase storage path: plans/xxx.pdf
  file_type TEXT NOT NULL,          -- 'pdf' | 'image'
  status TEXT NOT NULL DEFAULT 'queued', -- queued | processing | needs_review | completed | failed
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_jobs_status ON plan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_plan_jobs_user ON plan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_jobs_created ON plan_jobs(created_at DESC);

-- ============================================================================
-- PROCESSING ARTIFACTS
-- ============================================================================

-- Stores derived artifacts: page images, crops, intermediate data
CREATE TABLE IF NOT EXISTS plan_job_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES plan_jobs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,               -- page_image | crop | debug | ocr_text | embedding_ref
  page_no INT,                      -- nullable for non-page artifacts
  artifact_path TEXT NOT NULL,      -- Supabase storage path
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_artifacts_job ON plan_job_artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_artifacts_kind ON plan_job_artifacts(kind);
CREATE INDEX IF NOT EXISTS idx_job_artifacts_page ON plan_job_artifacts(job_id, page_no);

-- ============================================================================
-- ANALYSIS RESULTS
-- ============================================================================

-- Final structured extraction results (versioned)
CREATE TABLE IF NOT EXISTS plan_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES plan_jobs(id) ON DELETE CASCADE,
  model TEXT NOT NULL,              -- OpenAI model name (e.g., gpt-4o)
  quantities JSONB NOT NULL,        -- Validated JSON schema output
  confidence JSONB NOT NULL,        -- Per-section confidence + flags
  evidence JSONB NOT NULL,          -- Page/crop pointers
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_analyses_job ON plan_analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_plan_analyses_review ON plan_analyses(needs_review);

-- ============================================================================
-- PRICING SYSTEM
-- ============================================================================

-- Versioned price books (e.g., "2024 Standard", "Premium Tier")
CREATE TABLE IF NOT EXISTS price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_books_active ON price_books(is_active);

-- Price items within a price book
CREATE TABLE IF NOT EXISTS price_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID NOT NULL REFERENCES price_books(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,           -- door | window | cabinet | toilet | sink | shower | fixture
  variant TEXT NOT NULL,            -- standard | wood | aluminum | premium | basic
  unit TEXT NOT NULL,               -- each | sqft | linear_ft
  unit_price NUMERIC(10, 2) NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_items_book ON price_items(price_book_id);
CREATE INDEX IF NOT EXISTS idx_price_items_cat_var ON price_items(category, variant);
CREATE INDEX IF NOT EXISTS idx_price_items_sku ON price_items(price_book_id, sku);

-- ============================================================================
-- QUOTES EXTENSION
-- ============================================================================

-- Check if quotes table exists, if not create it
-- If it exists, just add the job_id column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
    CREATE TABLE quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,  -- References auth.users but no FK
      job_id UUID REFERENCES plan_jobs(id),  -- NEW: Link to plan analysis
      price_book_id UUID REFERENCES price_books(id),
      status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | accepted | rejected
      subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
      tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    -- Table exists, just add job_id column if not present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'quotes' AND column_name = 'job_id'
    ) THEN
      ALTER TABLE quotes ADD COLUMN job_id UUID REFERENCES plan_jobs(id);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_job ON quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Quote line items (individual items within a quote)
CREATE TABLE IF NOT EXISTS quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  selections JSONB NOT NULL DEFAULT '{}'::JSONB, -- Customer-chosen product/variant
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_lines_quote ON quote_lines(quote_id);

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Product master catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,           -- door | window | cabinet | toilet | sink | shower | fixture
  material TEXT,                    -- wood | aluminum | steel | ceramic | composite
  brand TEXT,
  base_price NUMERIC(10, 2),        -- Optional base price
  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_cat_mat ON products(category, material);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Product assets (images, specs, catalogs)
CREATE TABLE IF NOT EXISTS product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,               -- image | pdf | spec | catalog_page
  asset_path TEXT NOT NULL,         -- Supabase Storage path
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_product ON product_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_assets_kind ON product_assets(product_id, kind);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE plan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_job_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS plan_jobs_select_own ON plan_jobs;
DROP POLICY IF EXISTS plan_jobs_insert_own ON plan_jobs;
DROP POLICY IF EXISTS plan_jobs_update_own ON plan_jobs;
DROP POLICY IF EXISTS artifacts_select_via_job ON plan_job_artifacts;
DROP POLICY IF EXISTS analyses_select_via_job ON plan_analyses;
DROP POLICY IF EXISTS price_books_select_all ON price_books;
DROP POLICY IF EXISTS price_items_select_all ON price_items;
DROP POLICY IF EXISTS quotes_select_own ON quotes;
DROP POLICY IF EXISTS quotes_insert_own ON quotes;
DROP POLICY IF EXISTS quotes_update_own ON quotes;
DROP POLICY IF EXISTS quote_lines_select_via_quote ON quote_lines;
DROP POLICY IF EXISTS products_select_all ON products;
DROP POLICY IF EXISTS assets_select_via_product ON product_assets;

-- Plan Jobs: Users can see only their own jobs
CREATE POLICY plan_jobs_select_own ON plan_jobs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY plan_jobs_insert_own ON plan_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY plan_jobs_update_own ON plan_jobs
  FOR UPDATE USING (user_id = auth.uid());

-- Artifacts: Viewable if user owns the parent job
CREATE POLICY artifacts_select_via_job ON plan_job_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plan_jobs
      WHERE plan_jobs.id = plan_job_artifacts.job_id
      AND plan_jobs.user_id = auth.uid()
    )
  );

-- Analyses: Viewable if user owns the parent job
CREATE POLICY analyses_select_via_job ON plan_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plan_jobs
      WHERE plan_jobs.id = plan_analyses.job_id
      AND plan_jobs.user_id = auth.uid()
    )
  );

-- Price Books: All authenticated users can read active price books
CREATE POLICY price_books_select_all ON price_books
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Price Items: All authenticated users can read
CREATE POLICY price_items_select_all ON price_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Quotes: Users can see only their own quotes
CREATE POLICY quotes_select_own ON quotes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY quotes_insert_own ON quotes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY quotes_update_own ON quotes
  FOR UPDATE USING (user_id = auth.uid());

-- Quote Lines: Viewable if user owns the parent quote
CREATE POLICY quote_lines_select_via_quote ON quote_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_lines.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- Products: All authenticated users can read active products
CREATE POLICY products_select_all ON products
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Product Assets: Viewable if product is active
CREATE POLICY assets_select_via_product ON product_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.is_active = TRUE
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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
-- SEED DATA (Sample Price Book)
-- ============================================================================

-- Insert a default price book (only if none exists)
INSERT INTO price_books (name, currency, is_active)
SELECT '2024 Standard Pricing', 'INR', TRUE
WHERE NOT EXISTS (SELECT 1 FROM price_books WHERE is_active = TRUE);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show created tables
DO $$
BEGIN
  RAISE NOTICE 'Tables created successfully:';
  RAISE NOTICE '  - plan_jobs';
  RAISE NOTICE '  - plan_job_artifacts';
  RAISE NOTICE '  - plan_analyses';
  RAISE NOTICE '  - price_books';
  RAISE NOTICE '  - price_items';
  RAISE NOTICE '  - quotes (extended)';
  RAISE NOTICE '  - quote_lines';
  RAISE NOTICE '  - products';
  RAISE NOTICE '  - product_assets';
END $$;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
1. Create Supabase Storage bucket named 'plans' (private)

2. Add sample price items (get price book ID first):

   SELECT id, name FROM price_books WHERE is_active = true;

   Then insert sample prices (replace <price_book_id> with actual UUID):

   INSERT INTO price_items (price_book_id, sku, category, variant, unit, unit_price) VALUES
     ('<price_book_id>', 'DOOR-STD-001', 'door', 'standard', 'each', 5000.00),
     ('<price_book_id>', 'DOOR-WD-001', 'door', 'wood', 'each', 8000.00),
     ('<price_book_id>', 'WIN-STD-001', 'window', 'standard', 'each', 3000.00),
     ('<price_book_id>', 'WIN-AL-001', 'window', 'aluminum', 'each', 4500.00),
     ('<price_book_id>', 'CAB-STD-001', 'cabinet', 'standard', 'linear_ft', 1200.00),
     ('<price_book_id>', 'TOIL-STD-001', 'toilet', 'standard', 'each', 6000.00),
     ('<price_book_id>', 'SINK-STD-001', 'sink', 'standard', 'each', 4000.00),
     ('<price_book_id>', 'SHOW-STD-001', 'shower', 'standard', 'each', 8000.00);

3. Set up Python worker environment (see QUICK_START.md)

4. Start processing plans!
*/
