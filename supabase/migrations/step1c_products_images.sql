-- Step 1c: Add images column to products table
-- Run AFTER step1b succeeds

ALTER TABLE products
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_products_images
  ON products USING GIN (images);

UPDATE products
SET images = '[]'::jsonb
WHERE images IS NULL;
