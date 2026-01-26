-- ============================================================================
-- MODULE-0B: RBAC Schema & Database
-- File: schema/supplier_access_rules.sql
--
-- Purpose: Per-user supplier visibility control
-- Status: SKELETON - Schema definition only
--
-- This table controls which suppliers a user can see based on category/region.
-- Used for filtered supplier access (e.g., "Joy can only see US kitchen suppliers").
-- ============================================================================

-- Drop table if exists (for development/testing only)
-- DROP TABLE IF EXISTS supplier_access_rules CASCADE;

-- ============================================================================
-- TABLE: supplier_access_rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_access_rules (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to user
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Access filters (at least one must be specified)
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- Can be NULL for "all categories"
  region TEXT, -- Can be NULL for "all regions"

  -- Metadata
  created_by UUID REFERENCES auth.users(id), -- Admin who created this rule
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Optional notes about this access rule

  -- Constraints
  CHECK (category_id IS NOT NULL OR region IS NOT NULL) -- At least one filter required
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fast user access rule lookup
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_user_id
  ON supplier_access_rules(user_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_category
  ON supplier_access_rules(category_id);

-- Index for region filtering
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_region
  ON supplier_access_rules(region);

-- Composite index for user + category queries
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_user_category
  ON supplier_access_rules(user_id, category_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE supplier_access_rules IS
  'Defines which suppliers each user can view based on category and/or region filters';

COMMENT ON COLUMN supplier_access_rules.user_id IS
  'User this rule applies to';

COMMENT ON COLUMN supplier_access_rules.category_id IS
  'Supplier category filter (NULL = all categories)';

COMMENT ON COLUMN supplier_access_rules.region IS
  'Region filter (e.g., "US", "China", "India"). NULL = all regions';

COMMENT ON COLUMN supplier_access_rules.created_by IS
  'Admin who created this access rule';

-- ============================================================================
-- REGION VALUES
-- ============================================================================

/*
COMMON REGION VALUES:
- 'US' - United States
- 'China' - China
- 'India' - India
- 'UK' - United Kingdom
- 'EU' - European Union
- 'Global' - Global suppliers (no specific region)

NOTE: Regions are free-text to allow flexibility.
Consider creating a regions lookup table if strict validation needed.
*/

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Example: Joy can see Kitchen suppliers in US only
-- INSERT INTO supplier_access_rules (user_id, category_id, region, created_by, notes)
-- VALUES (
--   'joy-user-uuid',
--   'kitchen-category-uuid',
--   'US',
--   'admin-uuid',
--   'Joy handles US kitchen suppliers only'
-- );

-- Example: User can see all bathroom suppliers (any region)
-- INSERT INTO supplier_access_rules (user_id, category_id, region, created_by)
-- VALUES (
--   'user-uuid',
--   'bathroom-category-uuid',
--   NULL, -- All regions
--   'admin-uuid'
-- );

-- Example: User can see all US suppliers (any category)
-- INSERT INTO supplier_access_rules (user_id, category_id, region, created_by)
-- VALUES (
--   'user-uuid',
--   NULL, -- All categories
--   'US',
--   'admin-uuid'
-- );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_supplier_access_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplier_access_rules_updated_at
  BEFORE UPDATE ON supplier_access_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_access_rules_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can view a specific supplier
CREATE OR REPLACE FUNCTION user_can_view_supplier(
  p_user_id UUID,
  p_supplier_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_has_access BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id;

  -- Admins can see everything
  IF v_user_role = 'Admin' THEN
    RETURN TRUE;
  END IF;

  -- Check if user has access rules for this supplier
  SELECT EXISTS (
    SELECT 1
    FROM supplier_access_rules sar
    JOIN suppliers s ON s.id = p_supplier_id
    WHERE sar.user_id = p_user_id
      AND (sar.category_id IS NULL OR sar.category_id = s.category_id)
      AND (sar.region IS NULL OR sar.region = s.region)
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
1. Create access rule for user:
   INSERT INTO supplier_access_rules (user_id, category_id, region, created_by)
   VALUES ('user-uuid', 'category-uuid', 'US', 'admin-uuid');

2. Get user's access rules:
   SELECT
     sar.id,
     c.name as category_name,
     sar.region,
     sar.notes
   FROM supplier_access_rules sar
   LEFT JOIN categories c ON c.id = sar.category_id
   WHERE sar.user_id = 'user-uuid';

3. Check if user can view supplier:
   SELECT user_can_view_supplier('user-uuid', 'supplier-uuid');

4. Get all suppliers user can view:
   SELECT s.*
   FROM suppliers s
   WHERE EXISTS (
     SELECT 1
     FROM supplier_access_rules sar
     WHERE sar.user_id = 'user-uuid'
       AND (sar.category_id IS NULL OR sar.category_id = s.category_id)
       AND (sar.region IS NULL OR sar.region = s.region)
   );

5. Remove all access for user:
   DELETE FROM supplier_access_rules WHERE user_id = 'user-uuid';

DEPENDENCIES:
- Requires suppliers table (existing)
- Requires categories table (existing)
- Requires user_roles table (from this module)
- Used by MODULE-1A for supplier filtering

TODO (Full Implementation):
- Add supplier.region column if not exists
- Consider adding rule priority (if multiple rules conflict)
- Add audit logging for rule changes
- Add rule validation (prevent invalid combinations)
*/
