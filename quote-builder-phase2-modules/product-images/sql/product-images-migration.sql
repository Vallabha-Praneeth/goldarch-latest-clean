/**
 * Product Images Module - SQL Migration
 * Phase 2 - Product Images Feature
 *
 * This migration adds image support to products table
 * and sets up Supabase Storage configuration
 */

-- Add images column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add index for querying products with images
CREATE INDEX IF NOT EXISTS idx_products_images
  ON products USING GIN (images);

-- Example images structure:
COMMENT ON COLUMN products.images IS 'Array of product images: [{"url": "...", "alt": "...", "isPrimary": true, "order": 0, "uploadedAt": "..."}]';

-- Update existing products to have empty images array
UPDATE products
SET images = '[]'::jsonb
WHERE images IS NULL;

---
--- STORAGE BUCKET SETUP
--- Run these commands in Supabase Dashboard > Storage
---

-- Create 'products' bucket (run in Supabase Dashboard)
-- 1. Go to Storage section
-- 2. Click "New Bucket"
-- 3. Name: "products"
-- 4. Public: Yes
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp

---
--- STORAGE POLICIES
--- Run these in Supabase Dashboard > Storage > products bucket > Policies
---

-- Policy 1: Allow public to read product images
-- Name: Public can view product images
-- Operation: SELECT
-- Policy Definition:
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- Policy 2: Allow authenticated users with admin role to upload
-- Name: Admins can upload product images
-- Operation: INSERT
-- Policy Definition:
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

-- Policy 3: Allow admins to update images
-- Name: Admins can update product images
-- Operation: UPDATE
-- Policy Definition:
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

-- Policy 4: Allow admins to delete images
-- Name: Admins can delete product images
-- Operation: DELETE
-- Policy Definition:
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

---
--- HELPER FUNCTIONS
---

-- Function to get product's primary image
CREATE OR REPLACE FUNCTION get_product_primary_image(product_images JSONB)
RETURNS TEXT AS $$
  SELECT (
    SELECT url
    FROM jsonb_to_recordset(product_images) AS x(url TEXT, "isPrimary" BOOLEAN)
    WHERE "isPrimary" = true
    LIMIT 1
  );
$$ LANGUAGE SQL IMMUTABLE;

-- Function to count product images
CREATE OR REPLACE FUNCTION count_product_images(product_images JSONB)
RETURNS INTEGER AS $$
  SELECT jsonb_array_length(COALESCE(product_images, '[]'::jsonb));
$$ LANGUAGE SQL IMMUTABLE;

-- Add helpful comments
COMMENT ON FUNCTION get_product_primary_image IS 'Returns the URL of the primary product image';
COMMENT ON FUNCTION count_product_images IS 'Returns the number of images for a product';

---
--- SAMPLE USAGE EXAMPLES
---

-- Query products with their primary image
-- SELECT
--   id,
--   name,
--   get_product_primary_image(images) as primary_image,
--   count_product_images(images) as image_count
-- FROM products;

-- Query products with at least one image
-- SELECT * FROM products
-- WHERE count_product_images(images) > 0;

-- Query products where specific image is primary
-- SELECT * FROM products
-- WHERE images @> '[{"isPrimary": true}]'::jsonb;

---
--- VERIFICATION QUERIES
---

-- Check if column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'images';

-- Check products with images
SELECT
  id,
  name,
  jsonb_array_length(images) as image_count
FROM products
WHERE jsonb_array_length(images) > 0;

-- Sample insert for testing
-- INSERT INTO products (name, category, images)
-- VALUES (
--   'Test Product',
--   'doors',
--   '[
--     {
--       "url": "https://example.com/image.jpg",
--       "alt": "Test product image",
--       "isPrimary": true,
--       "order": 0,
--       "uploadedAt": "2026-01-18T00:00:00Z"
--     }
--   ]'::jsonb
-- );
