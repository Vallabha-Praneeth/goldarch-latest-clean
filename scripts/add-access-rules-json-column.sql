-- Add JSON column to supplier_access_rules for comprehensive access control
-- This allows storing multiple categories, regions, and price filters in one rule

ALTER TABLE supplier_access_rules
ADD COLUMN IF NOT EXISTS rule_data JSONB;

-- Add comment explaining the new column
COMMENT ON COLUMN supplier_access_rules.rule_data IS 'Stores comprehensive access rules as JSON: {categories: [], regions: [], priceMin: number, priceMax: number}';

-- Example of what rule_data contains:
-- {
--   "categories": ["Cabinets", "Countertops"],
--   "regions": ["China", "Vietnam"],
--   "priceMin": 1000,
--   "priceMax": 50000
-- }
