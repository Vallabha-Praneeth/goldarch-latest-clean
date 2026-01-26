-- ============================================================================
-- MODULE-0B: RBAC Foundation Migration (FIXED)
-- File: migrations/001_rbac_foundation_fixed.sql
--
-- Purpose: Complete RBAC system setup in single migration
-- Status: READY - Fixed column ordering issue
--
-- This migration creates all RBAC tables, policies, and helper functions.
-- It is idempotent and can be run multiple times safely.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Add region column to suppliers FIRST (before policies reference it)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'region'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN region TEXT;
    CREATE INDEX idx_suppliers_region ON suppliers(region);
    RAISE NOTICE 'Added region column to suppliers table';
  ELSE
    RAISE NOTICE 'Region column already exists on suppliers table';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create user_roles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Viewer', 'Procurement')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);

COMMENT ON TABLE user_roles IS
  'User role assignments for RBAC system';

-- ============================================================================
-- STEP 3: Create supplier_access_rules table
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_access_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  region TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  CHECK (category_id IS NOT NULL OR region IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_user_id
  ON supplier_access_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_category
  ON supplier_access_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_region
  ON supplier_access_rules(region);
CREATE INDEX IF NOT EXISTS idx_supplier_access_rules_user_category
  ON supplier_access_rules(user_id, category_id);

COMMENT ON TABLE supplier_access_rules IS
  'Per-user supplier visibility control based on category and region';

-- ============================================================================
-- STEP 4: Create update timestamp triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

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
-- STEP 5: Create helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = 'Admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_can_view_supplier(
  p_user_id UUID,
  p_supplier_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_has_access BOOLEAN;
BEGIN
  SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_user_id;

  IF v_user_role = 'Admin' THEN
    RETURN TRUE;
  END IF;

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
-- STEP 6: Enable RLS on tables
-- ============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create RLS policies
-- ============================================================================

-- Policies for user_roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
CREATE POLICY "Admins can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
CREATE POLICY "Admins can update user roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
CREATE POLICY "Admins can delete user roles"
  ON user_roles FOR DELETE
  USING (is_admin(auth.uid()));

-- Policies for supplier_access_rules
DROP POLICY IF EXISTS "Admins can view all supplier access rules" ON supplier_access_rules;
CREATE POLICY "Admins can view all supplier access rules"
  ON supplier_access_rules FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own supplier access rules" ON supplier_access_rules;
CREATE POLICY "Users can view own supplier access rules"
  ON supplier_access_rules FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage supplier access rules" ON supplier_access_rules;
CREATE POLICY "Admins can manage supplier access rules"
  ON supplier_access_rules FOR ALL
  USING (is_admin(auth.uid()));

-- Policies for suppliers (NOW region column exists)
DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;
CREATE POLICY "Admins can view all suppliers"
  ON suppliers FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view suppliers based on access rules" ON suppliers;
CREATE POLICY "Users can view suppliers based on access rules"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_access_rules sar
      WHERE sar.user_id = auth.uid()
        AND (sar.category_id IS NULL OR sar.category_id = suppliers.category_id)
        AND (sar.region IS NULL OR sar.region = suppliers.region)
    )
  );

-- ============================================================================
-- STEP 8: Create initial admin user (OPTIONAL - DEVELOPMENT ONLY)
-- ============================================================================

-- Uncomment and modify for your first admin user
-- INSERT INTO user_roles (user_id, role, notes)
-- VALUES (
--   'YOUR-USER-UUID-HERE',
--   'Admin',
--   'Initial admin user created by migration'
-- )
-- ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_roles') = 1,
    'user_roles table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'supplier_access_rules') = 1,
    'supplier_access_rules table not created';
  RAISE NOTICE '✅ Migration 001_rbac_foundation completed successfully!';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
To rollback this migration:

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all supplier access rules" ON supplier_access_rules;
DROP POLICY IF EXISTS "Users can view own supplier access rules" ON supplier_access_rules;
DROP POLICY IF EXISTS "Admins can manage supplier access rules" ON supplier_access_rules;
DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can view suppliers based on access rules" ON suppliers;

-- Drop functions
DROP FUNCTION IF EXISTS user_can_view_supplier;
DROP FUNCTION IF EXISTS is_admin;
DROP FUNCTION IF EXISTS get_user_role;
DROP FUNCTION IF EXISTS update_supplier_access_rules_updated_at;
DROP FUNCTION IF EXISTS update_user_roles_updated_at;

-- Drop tables
DROP TABLE IF EXISTS supplier_access_rules CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Remove region column from suppliers (if added by this migration)
ALTER TABLE suppliers DROP COLUMN IF EXISTS region;

COMMIT;
*/
