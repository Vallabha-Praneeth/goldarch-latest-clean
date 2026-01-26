-- Step 1d: Adjustments Table
-- Run AFTER step1c succeeds

CREATE TABLE IF NOT EXISTS quote_extraction_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  category TEXT NOT NULL,
  item_type TEXT NOT NULL,
  original_quantity INTEGER NOT NULL,
  adjusted_quantity INTEGER NOT NULL,
  reason TEXT,
  adjusted_by UUID,
  adjusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_job_id
  ON quote_extraction_adjustments(job_id);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_category_item
  ON quote_extraction_adjustments(category, item_type);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_adjusted_at
  ON quote_extraction_adjustments(adjusted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_extraction_adjustments_unique_item
  ON quote_extraction_adjustments(job_id, category, item_type);
