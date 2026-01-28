/**
 * Phase 2 Complete Migration
 * Date: 2026-01-19
 *
 * This migration includes all Phase 2 database changes:
 * 1. Email tracking table
 * 2. Product images column and storage policies
 * 3. Quantity adjustment tracking table
 */

-- =====================================================
-- 1. EMAIL TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS quote_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_email_tracking_quotation_id
  ON quote_email_tracking(quotation_id);

CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at
  ON quote_email_tracking(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient
  ON quote_email_tracking(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_tracking_status
  ON quote_email_tracking(status);

CREATE OR REPLACE FUNCTION update_email_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_tracking_updated_at
  BEFORE UPDATE ON quote_email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_updated_at();

ALTER TABLE quote_email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quote email tracking"
  ON quote_email_tracking FOR SELECT
  TO authenticated
  USING (
    quotation_id IN (
      SELECT q.id FROM quotations q
      JOIN quote_leads ql ON q.lead_id = ql.id
      WHERE ql.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert email tracking"
  ON quote_email_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update email tracking"
  ON quote_email_tracking FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE quote_email_tracking IS 'Tracks all quote emails sent to customers with delivery status';

-- =====================================================
-- 2. PRODUCT IMAGES
-- =====================================================

-- Guard product table mutations so local/shadow resets don't fail
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_products_images
      ON public.products USING GIN (images);

    COMMENT ON COLUMN public.products.images IS
      'Array of product images: [{"url": "...", "alt": "...", "isPrimary": true, "order": 0, "uploadedAt": "..."}]';

    UPDATE public.products
    SET images = '[]'::jsonb
    WHERE images IS NULL;
  END IF;
END $$;

-- Ensure user_roles exists before any policies reference it
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Storage policies for 'products' bucket
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

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
-- 3. QUANTITY ADJUSTMENT TRACKING
-- =====================================================

-- Dependency stub: plan_jobs (referenced by FK and policies below)
CREATE TABLE IF NOT EXISTS public.plan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_job_id
  ON quote_extraction_adjustments(job_id);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_category_item
  ON quote_extraction_adjustments(category, item_type);

CREATE INDEX IF NOT EXISTS idx_extraction_adjustments_adjusted_at
  ON quote_extraction_adjustments(adjusted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_extraction_adjustments_unique_item
  ON quote_extraction_adjustments(job_id, category, item_type);

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

ALTER TABLE quote_extraction_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their job adjustments"
  ON quote_extraction_adjustments FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create adjustments for their jobs"
  ON quote_extraction_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their adjustments"
  ON quote_extraction_adjustments FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their adjustments"
  ON quote_extraction_adjustments FOR DELETE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE quote_extraction_adjustments IS 'Tracks manual adjustments to AI-extracted quantities from construction plans';
COMMENT ON COLUMN quote_extraction_adjustments.job_id IS 'Reference to the plan extraction job';
COMMENT ON COLUMN quote_extraction_adjustments.category IS 'Product category (doors, windows, etc.)';
COMMENT ON COLUMN quote_extraction_adjustments.item_type IS 'Specific item type within category';
COMMENT ON COLUMN quote_extraction_adjustments.original_quantity IS 'Quantity originally extracted by AI';
COMMENT ON COLUMN quote_extraction_adjustments.adjusted_quantity IS 'Manually adjusted quantity';
COMMENT ON COLUMN quote_extraction_adjustments.reason IS 'Reason for the adjustment';

-- Helper functions
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
