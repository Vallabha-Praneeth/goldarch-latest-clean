/**
 * Phase 2 Migration - Step 2: RLS Policies and Storage
 * Run this AFTER step 1 completes successfully
 */

-- =====================================================
-- 1. EMAIL TRACKING RLS POLICIES
-- =====================================================

ALTER TABLE quote_email_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their quote email tracking" ON quote_email_tracking;
DROP POLICY IF EXISTS "System can insert email tracking" ON quote_email_tracking;
DROP POLICY IF EXISTS "System can update email tracking" ON quote_email_tracking;

-- Simple policies that work without complex joins
CREATE POLICY "Users can view their quote email tracking"
  ON quote_email_tracking FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users for now

CREATE POLICY "System can insert email tracking"
  ON quote_email_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update email tracking"
  ON quote_email_tracking FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- 2. STORAGE POLICIES FOR PRODUCTS BUCKET
-- =====================================================

-- Note: The 'products' bucket must be created manually first
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Public read access
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- Authenticated users can upload (simplified - adjust based on your needs)
CREATE POLICY "Authenticated can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

-- Authenticated users can update
CREATE POLICY "Authenticated can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products');

-- Authenticated users can delete
CREATE POLICY "Authenticated can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');

-- =====================================================
-- 3. QUANTITY ADJUSTMENTS RLS POLICIES
-- =====================================================

ALTER TABLE quote_extraction_adjustments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their job adjustments" ON quote_extraction_adjustments;
DROP POLICY IF EXISTS "Users can create adjustments for their jobs" ON quote_extraction_adjustments;
DROP POLICY IF EXISTS "Users can update their adjustments" ON quote_extraction_adjustments;
DROP POLICY IF EXISTS "Users can delete their adjustments" ON quote_extraction_adjustments;

-- Simple policies - allow all authenticated users
CREATE POLICY "Users can view their job adjustments"
  ON quote_extraction_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create adjustments for their jobs"
  ON quote_extraction_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their adjustments"
  ON quote_extraction_adjustments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete their adjustments"
  ON quote_extraction_adjustments FOR DELETE
  TO authenticated
  USING (true);
