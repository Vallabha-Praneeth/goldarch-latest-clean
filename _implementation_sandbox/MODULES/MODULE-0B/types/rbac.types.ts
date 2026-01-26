/**
 * MODULE-0B: RBAC Schema & Database
 * File: types/rbac.types.ts
 *
 * Purpose: TypeScript type definitions for RBAC system
 * Status: SKELETON - Type definitions only
 *
 * These types extend the existing Supabase types with RBAC-specific structures.
 */

// ============================================================================
// ROLE TYPES
// ============================================================================

/**
 * User roles in the system
 */
export type UserRole = 'Admin' | 'Manager' | 'Viewer' | 'Procurement';

/**
 * Role permissions mapping
 * Defines what each role can do
 */
export interface RolePermissions {
  canViewAllSuppliers: boolean;
  canEditSuppliers: boolean;
  canDeleteSuppliers: boolean;
  canViewAllProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canApproveQuotes: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageTemplates: boolean;
  canViewReports: boolean;
}

/**
 * Permission definitions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    canViewAllSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: true,
    canViewAllProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canApproveQuotes: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageTemplates: true,
    canViewReports: true,
  },
  Manager: {
    canViewAllSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: false,
    canViewAllProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canApproveQuotes: true,
    canManageUsers: false,
    canManageRoles: false,
    canManageTemplates: false,
    canViewReports: true,
  },
  Viewer: {
    canViewAllSuppliers: true,
    canEditSuppliers: false,
    canDeleteSuppliers: false,
    canViewAllProjects: true,
    canEditProjects: false,
    canDeleteProjects: false,
    canApproveQuotes: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageTemplates: false,
    canViewReports: true,
  },
  Procurement: {
    canViewAllSuppliers: false, // Filtered by access rules
    canEditSuppliers: false,
    canDeleteSuppliers: false,
    canViewAllProjects: false, // Only assigned projects
    canEditProjects: false,
    canDeleteProjects: false,
    canApproveQuotes: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageTemplates: false,
    canViewReports: false,
  },
};

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * user_roles table row
 */
export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string | null;
  assigned_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * supplier_access_rules table row
 */
export interface SupplierAccessRule {
  id: string;
  user_id: string;
  category_id: string | null;
  region: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

/**
 * Extended user type with role information
 */
export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
  role_assigned_at: string | null;
  role_assigned_by: string | null;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request to assign role to user
 */
export interface AssignRoleRequest {
  user_id: string;
  role: UserRole;
  notes?: string;
}

/**
 * Response when assigning role
 */
export interface AssignRoleResponse {
  success: boolean;
  user_role: UserRoleRecord;
  error?: string;
}

/**
 * Request to create supplier access rule
 */
export interface CreateAccessRuleRequest {
  user_id: string;
  category_id?: string | null;
  region?: string | null;
  notes?: string;
}

/**
 * Response when creating access rule
 */
export interface CreateAccessRuleResponse {
  success: boolean;
  access_rule: SupplierAccessRule;
  error?: string;
}

/**
 * User's complete access profile
 */
export interface UserAccessProfile {
  user_id: string;
  role: UserRole | null;
  permissions: RolePermissions;
  supplier_access: SupplierAccessRule[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Region options for supplier access
 */
export type SupplierRegion = 'US' | 'China' | 'India' | 'UK' | 'EU' | 'Global';

/**
 * Common region values
 */
export const SUPPLIER_REGIONS: readonly SupplierRegion[] = [
  'US',
  'China',
  'India',
  'UK',
  'EU',
  'Global',
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: UserRole | null): RolePermissions {
  if (!role) {
    // No role = no permissions
    return {
      canViewAllSuppliers: false,
      canEditSuppliers: false,
      canDeleteSuppliers: false,
      canViewAllProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
      canApproveQuotes: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageTemplates: false,
      canViewReports: false,
    };
  }
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: UserRole | null,
  permission: keyof RolePermissions
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions[permission];
}

/**
 * Check if role is admin
 */
export function isAdmin(role: UserRole | null): boolean {
  return role === 'Admin';
}

/**
 * Check if role can manage users
 */
export function canManageUsers(role: UserRole | null): boolean {
  return hasPermission(role, 'canManageUsers');
}

/**
 * Check if role can approve quotes
 */
export function canApproveQuotes(role: UserRole | null): boolean {
  return hasPermission(role, 'canApproveQuotes');
}

/**
 * Validate role string
 */
export function isValidRole(role: string): role is UserRole {
  return ['Admin', 'Manager', 'Viewer', 'Procurement'].includes(role);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    Admin: 'Administrator',
    Manager: 'Project Manager',
    Viewer: 'Read-Only Viewer',
    Procurement: 'Procurement Specialist',
  };
  return displayNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    Admin: 'Full access to all features and settings',
    Manager: 'Can manage projects, deals, and approve quotes',
    Viewer: 'Read-only access to view data',
    Procurement: 'Can manage assigned suppliers and request quotes',
  };
  return descriptions[role];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate access rule has at least one filter
 */
export function isValidAccessRule(rule: {
  category_id?: string | null;
  region?: string | null;
}): boolean {
  return !!(rule.category_id || rule.region);
}

/**
 * Check if user can be assigned a role
 * (e.g., prevent self-demotion for last admin)
 */
export function canAssignRole(
  assignerRole: UserRole | null,
  targetRole: UserRole
): PermissionCheckResult {
  if (!assignerRole || !canManageUsers(assignerRole)) {
    return {
      allowed: false,
      reason: 'Insufficient permissions to assign roles',
    };
  }

  // Only admins can assign admin role
  if (targetRole === 'Admin' && !isAdmin(assignerRole)) {
    return {
      allowed: false,
      reason: 'Only admins can assign admin role',
    };
  }

  return { allowed: true };
}

// ============================================================================
// INTEGRATION NOTES
// ============================================================================

/**
 * USAGE EXAMPLES:
 *
 * 1. Check if user has permission:
 *    const canEdit = hasPermission(user.role, 'canEditSuppliers');
 *
 * 2. Get all permissions for role:
 *    const permissions = getPermissionsForRole('Manager');
 *
 * 3. Validate role before assignment:
 *    if (isValidRole(roleString)) {
 *      assignRole(userId, roleString);
 *    }
 *
 * 4. Check if can assign role:
 *    const result = canAssignRole(currentUserRole, targetRole);
 *    if (!result.allowed) {
 *      alert(result.reason);
 *    }
 *
 * 5. Display role info:
 *    const displayName = getRoleDisplayName(user.role);
 *    const description = getRoleDescription(user.role);
 *
 * DEPENDENCIES:
 * - Extends existing Database types from lib/supabase-types.ts
 * - Used by MODULE-0A for permission checking
 * - Used by MODULE-0C for user management UI
 * - Used by MODULE-1A for supplier filtering
 *
 * TODO (Full Implementation):
 * - Add permission history tracking
 * - Add role expiration/temporary roles
 * - Add more granular permissions
 * - Add custom roles (future enhancement)
 */
