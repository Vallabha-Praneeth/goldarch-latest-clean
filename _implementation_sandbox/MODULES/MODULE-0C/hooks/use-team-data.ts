/**
 * MODULE-0C: Team Management UI
 * File: hooks/use-team-data.ts
 *
 * Purpose: React Query hooks for team management data fetching and mutations
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * Provides custom hooks for fetching users, roles, access rules, and performing mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types from MODULE-0B
import type {
  UserRole,
  UserWithRole,
  SupplierAccessRule,
} from '../../MODULE-0B/types/rbac.types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const teamQueryKeys = {
  all: ['team'] as const,
  users: () => [...teamQueryKeys.all, 'users'] as const,
  usersList: (filters?: TeamFilters) => [...teamQueryKeys.users(), filters] as const,
  userDetail: (userId: string | null) => [...teamQueryKeys.users(), userId] as const,
  accessRules: (userId: string | null) => [...teamQueryKeys.all, 'access-rules', userId] as const,
  categories: () => [...teamQueryKeys.all, 'categories'] as const,
};

// ============================================================================
// TYPES
// ============================================================================

interface TeamFilters {
  search?: string;
  roleFilter?: UserRole;
}

interface InviteUserData {
  email: string;
  role: UserRole;
  notes?: string;
}

interface UpdateRoleData {
  userId: string;
  newRole: UserRole;
  notes?: string;
}

interface CreateAccessRuleData {
  userId: string;
  categoryId: string | null;
  region: string | null;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
}

// ============================================================================
// API CLIENT (SKELETON)
// ============================================================================

/**
 * SKELETON: Mock API client
 * Replace with real fetch calls to API routes
 */
const mockApiClient = {
  getUsers: async (filters?: TeamFilters): Promise<UserWithRole[]> => {
    // REAL IMPLEMENTATION:
    // const params = new URLSearchParams();
    // if (filters?.search) params.set('search', filters.search);
    // if (filters?.roleFilter) params.set('role', filters.roleFilter);
    // const response = await fetch(`/api/team/users?${params}`);
    // return response.json();

    // Mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'Admin',
        role_assigned_at: '2024-01-01T00:00:00Z',
        role_assigned_by: 'system',
      },
      {
        id: 'user-2',
        email: 'manager@example.com',
        role: 'Manager',
        role_assigned_at: '2024-01-02T00:00:00Z',
        role_assigned_by: 'user-1',
      },
      {
        id: 'user-3',
        email: 'viewer@example.com',
        role: 'Viewer',
        role_assigned_at: '2024-01-03T00:00:00Z',
        role_assigned_by: 'user-1',
      },
      {
        id: 'user-4',
        email: 'procurement@example.com',
        role: 'Procurement',
        role_assigned_at: '2024-01-04T00:00:00Z',
        role_assigned_by: 'user-1',
      },
    ];
  },

  getUserDetails: async (userId: string): Promise<UserWithRole> => {
    // REAL: const response = await fetch(`/api/team/users/${userId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: userId,
      email: 'user@example.com',
      role: 'Manager',
      role_assigned_at: '2024-01-02T00:00:00Z',
      role_assigned_by: 'user-1',
    };
  },

  inviteUser: async (data: InviteUserData): Promise<void> => {
    // REAL: await fetch('/api/team/invite', { method: 'POST', body: JSON.stringify(data) });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[SKELETON] Invite user:', data);
  },

  updateUserRole: async (data: UpdateRoleData): Promise<void> => {
    // REAL: await fetch(`/api/team/users/${data.userId}/role`, { method: 'PATCH', body: ... });
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('[SKELETON] Update role:', data);
  },

  getAccessRules: async (userId: string): Promise<SupplierAccessRule[]> => {
    // REAL: const response = await fetch(`/api/team/users/${userId}/access-rules`);
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'rule-1',
        user_id: userId,
        category_id: 'cat-1',
        region: 'US',
        created_by: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        notes: 'Kitchen suppliers in US only',
      },
    ];
  },

  createAccessRule: async (data: CreateAccessRuleData): Promise<void> => {
    // REAL: await fetch(`/api/team/users/${data.userId}/access-rules`, { method: 'POST', ... });
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log('[SKELETON] Create access rule:', data);
  },

  deleteAccessRule: async (ruleId: string): Promise<void> => {
    // REAL: await fetch(`/api/team/access-rules/${ruleId}`, { method: 'DELETE' });
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log('[SKELETON] Delete access rule:', ruleId);
  },

  getCategories: async (): Promise<Category[]> => {
    // REAL: const response = await fetch('/api/team/categories');
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      { id: 'cat-1', name: 'Kitchen' },
      { id: 'cat-2', name: 'Bathroom' },
      { id: 'cat-3', name: 'Flooring' },
      { id: 'cat-4', name: 'Lighting' },
      { id: 'cat-5', name: 'Hardware' },
    ];
  },
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all users with roles (with optional filters)
 */
export function useTeamData(filters?: TeamFilters) {
  return useQuery({
    queryKey: teamQueryKeys.usersList(filters),
    queryFn: () => mockApiClient.getUsers(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch specific user details
 */
export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: teamQueryKeys.userDetail(userId),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return mockApiClient.getUserDetails(userId);
    },
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch user's supplier access rules
 */
export function useUserAccessRules(userId: string | null) {
  return useQuery({
    queryKey: teamQueryKeys.accessRules(userId),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return mockApiClient.getAccessRules(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch all categories (for access rule dropdowns)
 */
export function useCategories() {
  return useQuery({
    queryKey: teamQueryKeys.categories(),
    queryFn: () => mockApiClient.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes (categories rarely change)
  });
}

/**
 * Alias for useTeamData for consistency
 */
export function useUserRoles(filters?: TeamFilters) {
  return useTeamData(filters);
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Invite new user
 */
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteUserData) => mockApiClient.inviteUser(data),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.users() });
    },
  });
}

/**
 * Update user's role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRoleData) => mockApiClient.updateUserRole(data),
    onSuccess: (_, variables) => {
      // Invalidate specific user detail
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.userDetail(variables.userId) });
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.users() });
    },
  });
}

/**
 * Create supplier access rule
 */
export function useCreateAccessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccessRuleData) => mockApiClient.createAccessRule(data),
    onSuccess: (_, variables) => {
      // Invalidate access rules for this user
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.accessRules(variables.userId) });
    },
  });
}

/**
 * Delete supplier access rule
 */
export function useDeleteAccessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => mockApiClient.deleteAccessRule(ruleId),
    onSuccess: () => {
      // Invalidate all access rules (we don't know which user it belonged to)
      queryClient.invalidateQueries({ queryKey: [...teamQueryKeys.all, 'access-rules'] });
    },
  });
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Replace Mock API Client:
 *    - Replace mockApiClient with real fetch calls to API routes
 *    - Use proper error handling and response parsing
 *    - Add authentication headers if needed
 *
 *    Example:
 *    ```typescript
 *    const getUsers = async (filters?: TeamFilters): Promise<UserWithRole[]> => {
 *      const params = new URLSearchParams();
 *      if (filters?.search) params.set('search', filters.search);
 *      if (filters?.roleFilter) params.set('role', filters.roleFilter);
 *
 *      const response = await fetch(`/api/team/users?${params}`, {
 *        headers: {
 *          'Content-Type': 'application/json',
 *        },
 *      });
 *
 *      if (!response.ok) {
 *        throw new Error('Failed to fetch users');
 *      }
 *
 *      return response.json();
 *    };
 *    ```
 *
 * 2. Error Handling:
 *    - Use React Query's error state in components
 *    - Show user-friendly error messages
 *    - Add retry logic for transient failures
 *
 * 3. Optimistic Updates:
 *    - Consider optimistic updates for better UX
 *    - Example: Show role change immediately, rollback on error
 *
 * 4. Cache Management:
 *    - Adjust staleTime based on data freshness requirements
 *    - Use queryClient.setQueryData for optimistic updates
 *    - Invalidate related queries on mutations
 *
 * 5. Loading States:
 *    - All hooks return isLoading, isFetching states
 *    - Show loading skeletons in UI
 *    - Disable actions during mutations (isPending)
 *
 * 6. Query Client Setup:
 *    - Ensure QueryClientProvider wraps the app
 *    - Configure global defaults in _app.tsx or layout.tsx
 *
 *    Example:
 *    ```typescript
 *    const queryClient = new QueryClient({
 *      defaultOptions: {
 *        queries: {
 *          staleTime: 1000 * 60 * 5,
 *          retry: 1,
 *        },
 *      },
 *    });
 *    ```
 *
 * DEPENDENCIES:
 * - @tanstack/react-query (already installed)
 * - MODULE-0B: Type definitions
 * - API routes from api/team-routes.ts
 *
 * TODO (Full Implementation):
 * - Replace mock API client with real fetch calls
 * - Add proper error types and error handling
 * - Add request/response logging (development only)
 * - Add optimistic updates for mutations
 * - Add pagination support for users list
 * - Add search debouncing (avoid too many API calls)
 * - Add request cancellation for stale queries
 * - Add background refetch on window focus
 * - Add offline support with cache persistence
 */
