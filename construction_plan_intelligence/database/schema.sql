-- Construction Plan Intelligence - Database Schema
-- Version: 1.0
-- Purpose: Store plan processing jobs, results, pricing, and products

-- ============================================================================
-- JOB MANAGEMENT
-- ============================================================================

-- Tracks PDF/image upload and processing pipeline
CREATE TABLE IF NOT EXISTS plan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- QUOTES (Extend existing table)
-- ============================================================================

-- Add job_id to existing quotes table to link with plan analysis
-- NOTE: Run this as ALTER TABLE if quotes table already exists
-- ALTER TABLE quotes ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES plan_jobs(id);

-- For fresh installations, the full quotes table:
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
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

-- Plan Jobs: Users can see only their own jobs
CREATE POLICY plan_jobs_select_own ON plan_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY plan_jobs_insert_own ON plan_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY plan_jobs_update_own ON plan_jobs
  FOR UPDATE USING (auth.uid() = user_id);

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
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quotes_insert_own ON quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY quotes_update_own ON quotes
  FOR UPDATE USING (auth.uid() = user_id);

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
CREATE TRIGGER update_plan_jobs_updated_at
  BEFORE UPDATE ON plan_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_books_updated_at
  BEFORE UPDATE ON price_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_items_updated_at
  BEFORE UPDATE ON price_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Sample Price Book)
-- ============================================================================

-- Insert a default price book
INSERT INTO price_books (name, currency, is_active)
VALUES ('2024 Standard Pricing', 'INR', TRUE)
ON CONFLICT DO NOTHING;

-- Get the price book ID for seed data
-- Note: In actual deployment, replace this with the actual UUID from the insert above
-- This is just example seed data structure

/*
Example price items (uncomment and replace UUID after creating price book):

INSERT INTO price_items (price_book_id, sku, category, variant, unit, unit_price) VALUES
  ('<price_book_uuid>', 'DOOR-STD-001', 'door', 'standard', 'each', 5000.00),
  ('<price_book_uuid>', 'DOOR-WD-001', 'door', 'wood', 'each', 8000.00),
  ('<price_book_uuid>', 'WIN-STD-001', 'window', 'standard', 'each', 3000.00),
  ('<price_book_uuid>', 'WIN-AL-001', 'window', 'aluminum', 'each', 4500.00),
  ('<price_book_uuid>', 'CAB-STD-001', 'cabinet', 'standard', 'linear_ft', 1200.00),
  ('<price_book_uuid>', 'TOIL-STD-001', 'toilet', 'standard', 'each', 6000.00),
  ('<price_book_uuid>', 'SINK-STD-001', 'sink', 'standard', 'each', 4000.00),
  ('<price_book_uuid>', 'SHOW-STD-001', 'shower', 'standard', 'each', 8000.00);
*/

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
If quotes table already exists in your database, run this instead of CREATE TABLE:

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES plan_jobs(id);
CREATE INDEX IF NOT EXISTS idx_quotes_job ON quotes(job_id);
*/
