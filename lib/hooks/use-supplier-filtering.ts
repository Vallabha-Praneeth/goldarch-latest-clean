/**
 * React Query Hooks for Supplier Filtering
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-provider';
import {
  getFilteredSuppliers,
  getUserSupplierAccessSummary,
  canUserViewSupplier,
} from '@/lib/supplier-filtering/supplier-filter-simple';
import type { SupplierFilterParams } from '@/lib/types/supplier-types';

/**
 * Query Keys
 */
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: SupplierFilterParams) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
  accessSummary: (userId: string) => [...supplierKeys.all, 'access-summary', userId] as const,
};

/**
 * Fetch filtered suppliers
 */
export function useFilteredSuppliers(params: SupplierFilterParams = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return getFilteredSuppliers(user.id, params);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get user's access summary
 */
export function useSupplierAccessSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: user ? supplierKeys.accessSummary(user.id) : ['no-user'],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return getUserSupplierAccessSummary(user.id);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Check if user's view is filtered
 */
export function useIsFiltered() {
  const { data: summary } = useSupplierAccessSummary();
  return !summary?.isAdmin && (summary?.accessRules?.length || 0) > 0;
}

/**
 * Get active access rules
 */
export function useActiveAccessRules() {
  const { data: summary } = useSupplierAccessSummary();
  return summary?.accessRules || [];
}

/**
 * Check if user can view a specific supplier
 */
export function useCanViewSupplier(supplierId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-view-supplier', supplierId],
    queryFn: async () => {
      if (!user || !supplierId) return false;
      return canUserViewSupplier(user.id, supplierId);
    },
    enabled: !!user && !!supplierId,
  });
}
