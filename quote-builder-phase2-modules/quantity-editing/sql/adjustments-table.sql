/**
 * Manual Quantity Editing Module - SQL Migration
 * Phase 2 - Quantity Adjustment Tracking
 *
 * This table tracks manual adjustments made to AI-extracted quantities
 */

-- Create adjustments tracking table
CREATE TABLE IF NOT EXISTS quote_extraction_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES plan_jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_type TEXT NOT NULL,
  original_quantity INTEGER NOT NULL,
  adjusted_quantity INTEGER NOT NULL,
  reason TEXT,
  adjusted_by UUID REFERENCES auth.users(id),
  adjusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_job_id
  ON quote_extraction_adjustments(job_id);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_category_item
  ON quote_extraction_adjustments(category, item_type);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_adjusted_at
  ON quote_extraction_adjustments(adjusted_at DESC);

-- Unique constraint to prevent duplicate adjustments for same item
CREATE UNIQUE INDEX IF NOT EXISTS idx_extraction_adjustments_unique_item
  ON quote_extraction_adjustments(job_id, category, item_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_extraction_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extraction_adjustments_updated_at
  BEFORE UPDATE ON quote_extraction_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_adjustments_updated_at();

-- RLS Policies
ALTER TABLE quote_extraction_adjustments ENABLE ROW LEVEL SECURITY;

-- Users can view adjustments for their jobs
CREATE POLICY "Users can view their job adjustments"
  ON quote_extraction_adjustments FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

-- Users can create adjustments for their jobs
CREATE POLICY "Users can create adjustments for their jobs"
  ON quote_extraction_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

-- Users can update their own adjustments
CREATE POLICY "Users can update their adjustments"
  ON quote_extraction_adjustments FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own adjustments
CREATE POLICY "Users can delete their adjustments"
  ON quote_extraction_adjustments FOR DELETE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE quote_extraction_adjustments IS 'Tracks manual adjustments to AI-extracted quantities from construction plans';
COMMENT ON COLUMN quote_extraction_adjustments.job_id IS 'Reference to the plan extraction job';
COMMENT ON COLUMN quote_extraction_adjustments.category IS 'Product category (doors, windows, etc.)';
COMMENT ON COLUMN quote_extraction_adjustments.item_type IS 'Specific item type within category';
COMMENT ON COLUMN quote_extraction_adjustments.original_quantity IS 'Quantity originally extracted by AI';
COMMENT ON COLUMN quote_extraction_adjustments.adjusted_quantity IS 'Manually adjusted quantity';
COMMENT ON COLUMN quote_extraction_adjustments.reason IS 'Reason for the adjustment';

---
--- HELPER FUNCTIONS
---

-- Function to get adjustment for a specific item
CREATE OR REPLACE FUNCTION get_adjustment_for_item(
  p_job_id UUID,
  p_category TEXT,
  p_item_type TEXT
)
RETURNS TABLE (
  adjusted_quantity INTEGER,
  reason TEXT,
  adjusted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qea.adjusted_quantity,
    qea.reason,
    qea.adjusted_at
  FROM quote_extraction_adjustments qea
  WHERE qea.job_id = p_job_id
    AND qea.category = p_category
    AND qea.item_type = p_item_type;
END;
$$ LANGUAGE plpgsql;

-- Function to count total adjustments for a job
CREATE OR REPLACE FUNCTION count_job_adjustments(p_job_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM quote_extraction_adjustments
  WHERE job_id = p_job_id;
$$ LANGUAGE SQL;

-- Function to get adjustment summary for a job
CREATE OR REPLACE FUNCTION get_job_adjustment_summary(p_job_id UUID)
RETURNS TABLE (
  total_adjustments INTEGER,
  categories_adjusted INTEGER,
  total_quantity_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_adjustments,
    COUNT(DISTINCT category)::INTEGER as categories_adjusted,
    SUM(adjusted_quantity - original_quantity)::INTEGER as total_quantity_change
  FROM quote_extraction_adjustments
  WHERE job_id = p_job_id;
END;
$$ LANGUAGE plpgsql;

---
--- SAMPLE QUERIES
---

-- Get all adjustments for a job with details
-- SELECT
--   category,
--   item_type,
--   original_quantity,
--   adjusted_quantity,
--   (adjusted_quantity - original_quantity) as quantity_change,
--   reason,
--   adjusted_at
-- FROM quote_extraction_adjustments
-- WHERE job_id = 'your-job-id'
-- ORDER BY adjusted_at DESC;

-- Get jobs with the most adjustments
-- SELECT
--   job_id,
--   COUNT(*) as adjustment_count,
--   SUM(adjusted_quantity - original_quantity) as total_change
-- FROM quote_extraction_adjustments
-- GROUP BY job_id
-- ORDER BY adjustment_count DESC
-- LIMIT 10;

---
--- VERIFICATION QUERIES
---

-- Verify table was created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'quote_extraction_adjustments';

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'quote_extraction_adjustments';

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'quote_extraction_adjustments';

-- Verify policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'quote_extraction_adjustments';

-- Sample test data (optional)
-- INSERT INTO quote_extraction_adjustments (
--   job_id,
--   category,
--   item_type,
--   original_quantity,
--   adjusted_quantity,
--   reason
-- ) VALUES (
--   'test-job-id',
--   'doors',
--   'Interior 6-Panel',
--   15,
--   18,
--   'Customer requested 3 additional doors for new closets'
-- );
