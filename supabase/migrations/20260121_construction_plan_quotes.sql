-- ============================================================================
-- Construction Plan Intelligence - Quote Tables
-- Created: 2026-01-21
-- Purpose: Separate quote system for construction plan-based quotes
-- ============================================================================

-- Drop tables if they exist (for clean re-run)
DROP TABLE IF EXISTS quote_lines CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;

-- ============================================================================
-- Quotes Table (Construction Plan System)
-- ============================================================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES plan_jobs(id) ON DELETE CASCADE,
  price_book_id UUID NOT NULL REFERENCES price_books(id) ON DELETE RESTRICT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  -- Status flow: 'draft' -> 'finalized' -> 'sent' -> 'accepted' | 'rejected' | 'expired'

  -- Pricing
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Quote Lines Table (Construction Plan System)
-- ============================================================================
CREATE TABLE quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

  -- Line Item Details
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL, -- 'each', 'linear_ft', 'sq_ft', etc.
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,

  -- Product Selections (e.g., finish, color, style)
  selections JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_job_id ON quotes(job_id);
CREATE INDEX idx_quotes_price_book_id ON quotes(price_book_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);

CREATE INDEX idx_quote_lines_quote_id ON quote_lines(quote_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quotes
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes"
  ON quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Quote lines inherit access from parent quote
CREATE POLICY "Users can view quote lines for own quotes"
  ON quote_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_lines.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create quote lines for own quotes"
  ON quote_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_lines.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quote lines for own quotes"
  ON quote_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_lines.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quote lines for own quotes"
  ON quote_lines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_lines.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE quotes IS 'Quotes generated from construction plan analysis';
COMMENT ON TABLE quote_lines IS 'Line items for construction plan quotes';

COMMENT ON COLUMN quotes.job_id IS 'Reference to the plan_jobs table';
COMMENT ON COLUMN quotes.price_book_id IS 'Price book used for this quote';
COMMENT ON COLUMN quotes.status IS 'Quote status: draft, finalized, sent, accepted, rejected, expired';
COMMENT ON COLUMN quote_lines.selections IS 'Product variant selections (finish, color, etc.)';
