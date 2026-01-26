/**
 * Phase 2 Migration - Step 1: Create Tables Only
 * Run this first, then run step 2 for policies
 */

-- =====================================================
-- 1. EMAIL TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS quote_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_tracking_quotation_id
  ON quote_email_tracking(quotation_id);

CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at
  ON quote_email_tracking(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient
  ON quote_email_tracking(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_tracking_status
  ON quote_email_tracking(status);

-- Add trigger function
CREATE OR REPLACE FUNCTION update_email_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS email_tracking_updated_at ON quote_email_tracking;
CREATE TRIGGER email_tracking_updated_at
  BEFORE UPDATE ON quote_email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_updated_at();

-- Add comment
COMMENT ON TABLE quote_email_tracking IS 'Tracks all quote emails sent to customers with delivery status';

-- =====================================================
-- 2. PRODUCT IMAGES COLUMN
-- =====================================================

-- Add images column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add index
CREATE INDEX IF NOT EXISTS idx_products_images
  ON products USING GIN (images);

-- Add comment
COMMENT ON COLUMN products.images IS 'Array of product images: [{"url": "...", "alt": "...", "isPrimary": true, "order": 0, "uploadedAt": "..."}]';

-- Update existing products
UPDATE products
SET images = '[]'::jsonb
WHERE images IS NULL;

-- Helper functions
CREATE OR REPLACE FUNCTION get_product_primary_image(product_images JSONB)
RETURNS TEXT AS $$
  SELECT (
    SELECT url
    FROM jsonb_to_recordset(product_images) AS x(url TEXT, "isPrimary" BOOLEAN)
    WHERE "isPrimary" = true
    LIMIT 1
  );
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION count_product_images(product_images JSONB)
RETURNS INTEGER AS $$
  SELECT jsonb_array_length(COALESCE(product_images, '[]'::jsonb));
$$ LANGUAGE SQL IMMUTABLE;

COMMENT ON FUNCTION get_product_primary_image IS 'Returns the URL of the primary product image';
COMMENT ON FUNCTION count_product_images IS 'Returns the number of images for a product';

-- =====================================================
-- 3. QUANTITY ADJUSTMENT TRACKING TABLE
-- =====================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_job_id
  ON quote_extraction_adjustments(job_id);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_category_item
  ON quote_extraction_adjustments(category, item_type);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_adjusted_at
  ON quote_extraction_adjustments(adjusted_at DESC);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_extraction_adjustments_unique_item
  ON quote_extraction_adjustments(job_id, category, item_type);

-- Add trigger function
CREATE OR REPLACE FUNCTION update_extraction_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS extraction_adjustments_updated_at ON quote_extraction_adjustments;
CREATE TRIGGER extraction_adjustments_updated_at
  BEFORE UPDATE ON quote_extraction_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_adjustments_updated_at();

-- Add comments
COMMENT ON TABLE quote_extraction_adjustments IS 'Tracks manual adjustments to AI-extracted quantities from construction plans';
COMMENT ON COLUMN quote_extraction_adjustments.job_id IS 'Reference to the plan extraction job';
COMMENT ON COLUMN quote_extraction_adjustments.category IS 'Product category (doors, windows, etc.)';
COMMENT ON COLUMN quote_extraction_adjustments.item_type IS 'Specific item type within category';
COMMENT ON COLUMN quote_extraction_adjustments.original_quantity IS 'Quantity originally extracted by AI';
COMMENT ON COLUMN quote_extraction_adjustments.adjusted_quantity IS 'Manually adjusted quantity';
COMMENT ON COLUMN quote_extraction_adjustments.reason IS 'Reason for the adjustment';

-- Helper functions for adjustments
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

CREATE OR REPLACE FUNCTION count_job_adjustments(p_job_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM quote_extraction_adjustments
  WHERE job_id = p_job_id;
$$ LANGUAGE SQL;

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
