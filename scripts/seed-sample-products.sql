-- ============================================================================
-- SAMPLE PRODUCTS FOR QUOTE BUILDER TESTING
-- Created: 2026-01-17
--
-- IMPORTANT: This is SAMPLE DATA for testing only
-- See REVISE_SAMPLE2ACTUAL_DATA.md for instructions to replace with real data
--
-- This script adds 20 sample products across 5 categories:
-- - Doors (6 products)
-- - Windows (5 products)
-- - Kitchen (4 products)
-- - Bathrooms (3 products)
-- - Fixtures (2 products)
-- ============================================================================

-- ============================================================================
-- DOORS (6 products)
-- ============================================================================

INSERT INTO products (sku, name, category, material, brand, base_price, attributes, is_active)
VALUES
  -- Interior Doors
  (
    'DOOR-001',
    'Standard Interior Door - 6 Panel',
    'doors',
    'Hollow Core',
    'Sample Brand',
    89.99,
    '{"size": "36x80", "type": "interior", "finish": "primed", "style": "6-panel"}'::jsonb,
    true
  ),
  (
    'DOOR-002',
    'Premium Solid Wood Interior Door',
    'doors',
    'Solid Oak',
    'Sample Brand',
    299.99,
    '{"size": "36x80", "type": "interior", "finish": "stained", "style": "shaker"}'::jsonb,
    true
  ),

  -- Exterior Doors
  (
    'DOOR-003',
    'Fiberglass Entry Door',
    'doors',
    'Fiberglass',
    'Sample Brand',
    449.99,
    '{"size": "36x80", "type": "exterior", "finish": "primed", "glass": "half-lite"}'::jsonb,
    true
  ),
  (
    'DOOR-004',
    'Steel Security Door',
    'doors',
    'Steel',
    'Sample Brand',
    549.99,
    '{"size": "36x80", "type": "exterior", "finish": "powder-coated", "security": "high"}'::jsonb,
    true
  ),

  -- Specialty Doors
  (
    'DOOR-005',
    'Sliding Closet Door System',
    'doors',
    'Wood',
    'Sample Brand',
    199.99,
    '{"size": "72x80", "type": "closet", "style": "sliding", "panels": 2}'::jsonb,
    true
  ),
  (
    'DOOR-006',
    'French Patio Door Set',
    'doors',
    'Wood',
    'Sample Brand',
    899.99,
    '{"size": "72x80", "type": "patio", "style": "french", "panels": 2, "glass": "full-lite"}'::jsonb,
    true
  );

-- ============================================================================
-- WINDOWS (5 products)
-- ============================================================================

INSERT INTO products (sku, name, category, material, brand, base_price, attributes, is_active)
VALUES
  (
    'WIN-001',
    'Double Hung Window 3x4',
    'windows',
    'Vinyl',
    'Sample Brand',
    249.99,
    '{"size": "36x48", "type": "double-hung", "glass": "double-pane", "energy_star": true}'::jsonb,
    true
  ),
  (
    'WIN-002',
    'Casement Window 2x3',
    'windows',
    'Vinyl',
    'Sample Brand',
    199.99,
    '{"size": "24x36", "type": "casement", "glass": "double-pane", "energy_star": true}'::jsonb,
    true
  ),
  (
    'WIN-003',
    'Picture Window 5x4',
    'windows',
    'Aluminum',
    'Sample Brand',
    349.99,
    '{"size": "60x48", "type": "picture", "glass": "triple-pane", "energy_star": true}'::jsonb,
    true
  ),
  (
    'WIN-004',
    'Sliding Window 4x3',
    'windows',
    'Vinyl',
    'Sample Brand',
    279.99,
    '{"size": "48x36", "type": "sliding", "glass": "double-pane", "energy_star": false}'::jsonb,
    true
  ),
  (
    'WIN-005',
    'Bay Window System',
    'windows',
    'Wood',
    'Sample Brand',
    1299.99,
    '{"size": "96x60", "type": "bay", "glass": "triple-pane", "panels": 3, "energy_star": true}'::jsonb,
    true
  );

-- ============================================================================
-- KITCHEN (4 products)
-- ============================================================================

INSERT INTO products (sku, name, category, material, brand, base_price, attributes, is_active)
VALUES
  (
    'KIT-001',
    'Base Cabinet 24 inch',
    'kitchen',
    'Plywood',
    'Sample Brand',
    199.99,
    '{"width": 24, "height": 34.5, "depth": 24, "style": "shaker", "finish": "white"}'::jsonb,
    true
  ),
  (
    'KIT-002',
    'Wall Cabinet 30 inch',
    'kitchen',
    'Plywood',
    'Sample Brand',
    149.99,
    '{"width": 30, "height": 30, "depth": 12, "style": "shaker", "finish": "white"}'::jsonb,
    true
  ),
  (
    'KIT-003',
    'Kitchen Island Base',
    'kitchen',
    'Hardwood',
    'Sample Brand',
    599.99,
    '{"width": 48, "height": 34.5, "depth": 24, "style": "custom", "finish": "stained"}'::jsonb,
    true
  ),
  (
    'KIT-004',
    'Countertop - Quartz',
    'kitchen',
    'Quartz',
    'Sample Brand',
    89.99,
    '{"unit": "per_sqft", "thickness": 3, "finish": "polished", "color": "white"}'::jsonb,
    true
  );

-- ============================================================================
-- BATHROOMS (3 products)
-- ============================================================================

INSERT INTO products (sku, name, category, material, brand, base_price, attributes, is_active)
VALUES
  (
    'BATH-001',
    'Bathroom Vanity 36 inch',
    'bathrooms',
    'Wood',
    'Sample Brand',
    399.99,
    '{"width": 36, "depth": 21, "style": "modern", "finish": "white", "includes_top": true}'::jsonb,
    true
  ),
  (
    'BATH-002',
    'Walk-In Shower Kit',
    'bathrooms',
    'Acrylic',
    'Sample Brand',
    899.99,
    '{"size": "48x36", "type": "walk-in", "door": "frameless", "walls": "included"}'::jsonb,
    true
  ),
  (
    'BATH-003',
    'Bathtub - Alcove 60 inch',
    'bathrooms',
    'Acrylic',
    'Sample Brand',
    449.99,
    '{"length": 60, "width": 30, "type": "alcove", "drain": "right"}'::jsonb,
    true
  );

-- ============================================================================
-- FIXTURES (2 products)
-- ============================================================================

INSERT INTO products (sku, name, category, material, brand, base_price, attributes, is_active)
VALUES
  (
    'FIX-001',
    'Recessed LED Light Fixture',
    'fixtures',
    'Aluminum',
    'Sample Brand',
    29.99,
    '{"type": "recessed", "size": "6-inch", "lumens": 1000, "color_temp": 3000, "dimmable": true}'::jsonb,
    true
  ),
  (
    'FIX-002',
    'Ceiling Fan with Light',
    'fixtures',
    'Metal',
    'Sample Brand',
    149.99,
    '{"blade_span": 52, "motor": "AC", "light": "LED", "remote": true, "energy_star": true}'::jsonb,
    true
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count products by category
SELECT
  category,
  COUNT(*) as product_count,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price,
  ROUND(AVG(base_price)::numeric, 2) as avg_price
FROM products
WHERE sku ~ '^(DOOR|WIN|KIT|BATH|FIX)-[0-9]+'
GROUP BY category
ORDER BY category;

-- Show sample of products
SELECT
  sku,
  name,
  category,
  base_price,
  is_active
FROM products
WHERE sku ~ '^(DOOR|WIN|KIT|BATH|FIX)-[0-9]+'
ORDER BY category, sku;

-- ============================================================================
-- NOTES FOR PRODUCTION
-- ============================================================================

/*
IMPORTANT: These are SAMPLE products for testing only!

Before going to production:
1. Review REVISE_SAMPLE2ACTUAL_DATA.md
2. Replace with your actual 200-270 supplier products
3. Update pricing to real market rates
4. Add actual supplier IDs
5. Configure premium filtering per product

To delete all sample products:

  DELETE FROM products
  WHERE sku ~ '^(DOOR|WIN|KIT|BATH|FIX)-[0-9]+';

See REVISE_SAMPLE2ACTUAL_DATA.md for complete migration guide.
*/
