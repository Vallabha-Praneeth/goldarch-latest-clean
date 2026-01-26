-- ============================================================================
-- MODULE-0B: RBAC Schema & Database
-- File: schema/user_roles.sql
--
-- Purpose: User role assignment table
-- Status: SKELETON - Schema definition only
--
-- This table links users to their assigned roles in the system.
-- Each user can have one role (Admin, Manager, Viewer, Procurement).
-- ============================================================================

-- Drop table if exists (for development/testing only)
-- DROP TABLE IF EXISTS user_roles CASCADE;

-- ============================================================================
-- TABLE: user_roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to auth.users (Supabase auth table)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role assignment
  -- One of: 'Admin', 'Manager', 'Viewer', 'Procurement'
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Viewer', 'Procurement')),

  -- Metadata
  assigned_by UUID REFERENCES auth.users(id), -- Who assigned this role
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Optional notes about role assignment

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id) -- One role per user
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fast user role lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON user_roles(user_id);

-- Index for role-based queries (e.g., "get all admins")
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON user_roles(role);

-- Index for audit queries (who assigned roles)
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by
  ON user_roles(assigned_by);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_roles IS
  'User role assignments for RBAC system. Each user has one role.';

COMMENT ON COLUMN user_roles.user_id IS
  'References auth.users - the user being assigned a role';

COMMENT ON COLUMN user_roles.role IS
  'Role type: Admin (full access), Manager (manage projects/deals), Viewer (read-only), Procurement (supplier management)';

COMMENT ON COLUMN user_roles.assigned_by IS
  'User ID of admin who assigned this role (for audit trail)';

-- ============================================================================
-- ROLE DESCRIPTIONS
-- ============================================================================

/*
ROLE DEFINITIONS:

1. Admin
   - Full access to all features
   - Can manage users and assign roles
   - Can view/edit/delete all data
   - No restrictions on suppliers/projects

2. Manager
   - Can manage projects and deals
   - Can approve quotes
   - Can view all suppliers (no filtering)
   - Cannot manage users or system settings

3. Viewer
   - Read-only access
   - Can view projects, deals, suppliers
   - Cannot create, edit, or delete
   - Cannot approve or reject quotes

4. Procurement
   - Can manage suppliers (filtered by assignment)
   - Can request quotes
   - Can view assigned projects only
   - Cannot approve quotes or manage users
*/

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample roles (ONLY for development/testing)
-- DELETE BEFORE PRODUCTION

-- Example: Assign Admin role to first user
-- INSERT INTO user_roles (user_id, role, assigned_by, notes)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
--   'Admin',
--   NULL, -- Self-assigned or system
--   'Initial admin user'
-- );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
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

-- ============================================================================
-- INTEGRATION NOTES
-- ============================================================================

/*
USAGE:

1. Assign role to user:
   INSERT INTO user_roles (user_id, role, assigned_by)
   VALUES ('user-uuid', 'Manager', 'admin-uuid');

2. Get user's role:
   SELECT role FROM user_roles WHERE user_id = 'user-uuid';

3. Update user's role:
   UPDATE user_roles
   SET role = 'Admin', assigned_by = 'admin-uuid'
   WHERE user_id = 'user-uuid';

4. Remove user's role (revoke access):
   DELETE FROM user_roles WHERE user_id = 'user-uuid';

5. Get all users with specific role:
   SELECT u.email, ur.role, ur.assigned_at
   FROM user_roles ur
   JOIN auth.users u ON u.id = ur.user_id
   WHERE ur.role = 'Admin';

DEPENDENCIES:
- Requires auth.users table (Supabase Auth)
- Used by MODULE-0A for role checking
- Used by MODULE-1A for supplier access filtering

TODO (Full Implementation):
- Create default admin role on first signup
- Add role change history table (audit trail)
- Add role-based permissions table (future)
- Add role expiration/temporary roles (optional)
*/
