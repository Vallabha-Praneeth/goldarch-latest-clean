/**
 * MODULE-0C: Team Management UI
 * File: hooks/use-team-data.js
 *
 * Purpose: React Query hooks for team management data fetching and mutations
 * Status: FULL IMPLEMENTATION with real API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const teamQueryKeys = {
  all: ['team'],
  users: () => [...teamQueryKeys.all, 'users'],
  usersList: (filters) => [...teamQueryKeys.users(), filters],
  userDetail: (userId) => [...teamQueryKeys.users(), userId],
  accessRules: (userId) => [...teamQueryKeys.all, 'access-rules', userId],
  categories: () => [...teamQueryKeys.all, 'categories'],
};

// ============================================================================
// API CLIENT
// ============================================================================

const apiClient = {
  getUsers: async (filters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.roleFilter) params.set('role', filters.roleFilter);

    const response = await fetch(`/api/team/users?${params}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch users');

    const json = await response.json();
    return json.data;
  },

  getUserDetails: async (userId) => {
    const response = await fetch(`/api/team/users/${userId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch user details');

    const json = await response.json();
    return json.data;
  },

  inviteUser: async ({ email, role, notes }) => {
    const response = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite user');
    }

    return response.json();
  },

  updateUserRole: async ({ userId, newRole, notes }) => {
    const response = await fetch(`/api/team/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: newRole, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update role');
    }

    return response.json();
  },

  getAccessRules: async (userId) => {
    const response = await fetch(`/api/team/users/${userId}/access-rules`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch access rules');

    const json = await response.json();
    return json.data;
  },

  createAccessRule: async ({ userId, ruleData, categoryId, region, notes }) => {
    const response = await fetch(`/api/team/users/${userId}/access-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rule_data: ruleData, category_id: categoryId, region, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create access rule');
    }

    return response.json();
  },

  deleteAccessRule: async (ruleId) => {
    const response = await fetch(`/api/team/access-rules/${ruleId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete access rule');
    }

    return response.json();
  },

  getCategories: async () => {
    const response = await fetch('/api/team/categories', {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch categories');

    const json = await response.json();
    return json.data;
  },
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all users with optional filters
 */
export function useTeamData(filters) {
  return useQuery({
    queryKey: teamQueryKeys.usersList(filters),
    queryFn: () => apiClient.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch specific user details
 */
export function useUserDetails(userId) {
  return useQuery({
    queryKey: teamQueryKeys.userDetail(userId),
    queryFn: () => apiClient.getUserDetails(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch user's access rules
 */
export function useUserAccessRules(userId) {
  return useQuery({
    queryKey: teamQueryKeys.accessRules(userId),
    queryFn: () => apiClient.getAccessRules(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch all categories for dropdowns
 */
export function useCategories() {
  return useQuery({
    queryKey: teamQueryKeys.categories(),
    queryFn: apiClient.getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
  });
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
    mutationFn: apiClient.inviteUser,
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
    mutationFn: apiClient.updateUserRole,
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.users() });
    },
  });
}

/**
 * Create access rule for user
 */
export function useCreateAccessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createAccessRule,
    onSuccess: (_, variables) => {
      // Invalidate access rules for this user
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.accessRules(variables.userId)
      });
    },
  });
}

/**
 * Delete access rule
 */
export function useDeleteAccessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.deleteAccessRule,
    onSuccess: () => {
      // Invalidate all access rules queries
      queryClient.invalidateQueries({
        queryKey: [...teamQueryKeys.all, 'access-rules']
      });
    },
  });
}

/**
 * Delete user (Admin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/team/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.users() });
    },
  });
}
