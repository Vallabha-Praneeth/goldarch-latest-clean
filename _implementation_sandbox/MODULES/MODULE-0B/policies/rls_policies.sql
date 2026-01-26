-- ============================================================================
-- MODULE-0B: RBAC Schema & Database
-- File: policies/rls_policies.sql
--
-- Purpose: Row-Level Security policies for Supabase
-- Status: SKELETON - Policy definitions only
--
-- These policies enforce data access control at the database level.
-- Policies automatically filter queries based on user roles and permissions.
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON TABLES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_access_rules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables (if not already enabled)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR POLICIES
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = 'Admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- POLICIES: user_roles
-- ============================================================================

-- Admins can view all roles
CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can view their own role
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Only admins can insert roles
CREATE POLICY "Admins can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can update roles
CREATE POLICY "Admins can update user roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "Admins can delete user roles"
  ON user_roles FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: supplier_access_rules
-- ============================================================================

-- Admins can view all access rules
CREATE POLICY "Admins can view all supplier access rules"
  ON supplier_access_rules FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can view their own access rules
CREATE POLICY "Users can view own supplier access rules"
  ON supplier_access_rules FOR SELECT
  USING (user_id = auth.uid());

-- Only admins can manage access rules
CREATE POLICY "Admins can insert supplier access rules"
  ON supplier_access_rules FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update supplier access rules"
  ON supplier_access_rules FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete supplier access rules"
  ON supplier_access_rules FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: suppliers (filtered by access rules)
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view suppliers based on access rules" ON suppliers;
DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;

-- Admins can view all suppliers
CREATE POLICY "Admins can view all suppliers"
  ON suppliers FOR SELECT
  USING (is_admin(auth.uid()));

-- Non-admins can only view suppliers they have access to
CREATE POLICY "Users can view suppliers based on access rules"
  ON suppliers FOR SELECT
  USING (
    -- Check if user has access via supplier_access_rules
    EXISTS (
      SELECT 1
      FROM supplier_access_rules sar
      WHERE sar.user_id = auth.uid()
        AND (sar.category_id IS NULL OR sar.category_id = suppliers.category_id)
        AND (sar.region IS NULL OR sar.region = suppliers.region)
    )
  );

-- Only admins can insert suppliers
CREATE POLICY "Admins can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins and managers can update suppliers
CREATE POLICY "Admins and managers can update suppliers"
  ON suppliers FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('Admin', 'Manager')
  );

-- Only admins can delete suppliers
CREATE POLICY "Admins can delete suppliers"
  ON suppliers FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: projects (basic access control)
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "All authenticated users can view projects" ON projects;

-- All authenticated users can view projects
-- (In future, could add project-specific access rules similar to suppliers)
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins and managers can insert projects
CREATE POLICY "Admins and managers can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('Admin', 'Manager')
  );

-- Admins and managers can update projects
CREATE POLICY "Admins and managers can update projects"
  ON projects FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('Admin', 'Manager')
  );

-- Only admins can delete projects
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: quotes (approval permissions)
-- ============================================================================

-- All authenticated users can view quotes
CREATE POLICY "Authenticated users can view quotes"
  ON quotes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Procurement and above can insert quotes
CREATE POLICY "Procurement and above can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('Admin', 'Manager', 'Procurement')
  );

-- Managers and admins can update quotes (approve/reject)
CREATE POLICY "Managers and admins can update quotes"
  ON quotes FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('Admin', 'Manager')
  );

-- Only admins can delete quotes
CREATE POLICY "Admins can delete quotes"
  ON quotes FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: documents (basic access control)
-- ============================================================================

-- All authenticated users can view documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- All authenticated users can insert documents
CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own documents, admins can update all
CREATE POLICY "Users can update own documents, admins all"
  ON documents FOR UPDATE
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

-- Users can delete their own documents, admins can delete all
CREATE POLICY "Users can delete own documents, admins all"
  ON documents FOR DELETE
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

-- ============================================================================
-- POLICIES: deals (basic access control)
-- ============================================================================

-- All authenticated users can view deals
CREATE POLICY "Authenticated users can view deals"
  ON deals FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Procurement and above can insert deals
CREATE POLICY "Procurement and above can insert deals"
  ON deals FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('Admin', 'Manager', 'Procurement')
  );

-- Procurement and above can update deals
CREATE POLICY "Procurement and above can update deals"
  ON deals FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('Admin', 'Manager', 'Procurement')
  );

-- Only admins can delete deals
CREATE POLICY "Admins can delete deals"
  ON deals FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- TESTING POLICIES
-- ============================================================================

/*
To test policies:

1. Create test users with different roles:
   INSERT INTO user_roles (user_id, role) VALUES ('user1', 'Admin');
   INSERT INTO user_roles (user_id, role) VALUES ('user2', 'Viewer');

2. Set Supabase context to test user:
   SET LOCAL request.jwt.claim.sub = 'user1';

3. Query data to verify filtering:
   SELECT * FROM suppliers; -- Should respect RLS policies

4. Try unauthorized actions:
   DELETE FROM suppliers WHERE id = 'xxx'; -- Should fail for Viewer

DEPENDENCIES:
- Requires user_roles table
- Requires supplier_access_rules table
- Requires auth.uid() (Supabase Auth)

TODO (Full Implementation):
- Test all policies with actual users
- Add project-specific access rules (similar to suppliers)
- Add document visibility rules (public vs private)
- Add audit logging for policy violations
- Monitor performance impact of complex policies
*/

-- ============================================================================
-- PERFORMANCE CONSIDERATIONS
-- ============================================================================

/*
INDEXES REQUIRED FOR POLICY PERFORMANCE:

Already created in schema files:
- idx_user_roles_user_id (for is_admin checks)
- idx_supplier_access_rules_user_id (for supplier filtering)
- idx_supplier_access_rules_user_category (for complex filters)

Additional indexes to consider:
- CREATE INDEX idx_suppliers_category_region ON suppliers(category_id, region);
- CREATE INDEX idx_projects_user_id ON projects(user_id);
- CREATE INDEX idx_documents_user_id ON documents(user_id);

CACHING:
- get_user_role() is marked STABLE for query-level caching
- is_admin() is marked STABLE for query-level caching
- Consider application-level caching for role lookups
*/
