/**
 * Supplier Access Filtering - Simplified Working Implementation
 * Integrates with existing MODULE-0B RBAC schema
 */

import { supabase } from '@/lib/supabase-client';
import type {
  UserRole,
  SupplierAccessRule,
  Supplier,
  SupplierFilterParams,
  SupplierQueryResult
} from '@/lib/types/supplier-types';

/**
 * Get user's role from database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as UserRole;
}

/**
 * Check if user is admin (admins bypass all filters)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'Admin';
}

/**
 * Get user's access rules from database
 */
export async function getUserAccessRules(userId: string): Promise<SupplierAccessRule[]> {
  const { data, error } = await supabase
    .from('supplier_access_rules')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching access rules:', error);
    return [];
  }

  return (data || []) as SupplierAccessRule[];
}

/**
 * Get filtered suppliers for a user
 */
export async function getFilteredSuppliers(
  userId: string,
  params: SupplierFilterParams = {}
): Promise<SupplierQueryResult> {
  // Check if user is admin
  const admin = await isUserAdmin(userId);

  // Get access rules
  const accessRules = admin ? [] : await getUserAccessRules(userId);

  // Start building query
  let query = supabase
    .from('suppliers')
    .select('*', { count: 'exact' });

  // If not admin and has access rules, apply filtering
  if (!admin && accessRules.length > 0) {
    // Build OR conditions for access rules
    const conditions: string[] = [];

    for (const rule of accessRules) {
      // Check rule_data (new format) first
      if (rule.rule_data) {
        const { categories, regions } = rule.rule_data;

        if (categories && categories.length > 0 && regions && regions.length > 0) {
          // Both category and region specified - AND condition
          conditions.push(`(category_id.in.(${categories.join(',')}),region.in.(${regions.join(',')}))`);
        } else if (categories && categories.length > 0) {
          // Only categories
          conditions.push(`category_id.in.(${categories.join(',')})`);
        } else if (regions && regions.length > 0) {
          // Only regions
          conditions.push(`region.in.(${regions.join(',')})`);
        }
      }
      // Fall back to legacy fields
      else if (rule.category_id && rule.region) {
        conditions.push(`(category_id.eq.${rule.category_id},region.eq.${rule.region})`);
      } else if (rule.category_id) {
        conditions.push(`category_id.eq.${rule.category_id}`);
      } else if (rule.region) {
        conditions.push(`region.eq.${rule.region}`);
      }
    }

    // Apply OR conditions if we have any
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    }
  }

  // Apply search filter if provided
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,city.ilike.%${params.search}%,products.ilike.%${params.search}%`);
  }

  // Apply category filter if provided
  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  // Apply region filter if provided
  if (params.region) {
    query = query.eq('region', params.region);
  }

  // Apply sorting
  const sortBy = params.sortBy || 'name';
  const sortOrder = params.sortOrder || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (params.limit) {
    query = query.range(
      params.offset || 0,
      (params.offset || 0) + params.limit - 1
    );
  }

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching suppliers:', error);
    return {
      suppliers: [],
      total: 0,
      filtered: !admin,
      accessRules: accessRules,
    };
  }

  return {
    suppliers: (data || []) as Supplier[],
    total: count || 0,
    filtered: !admin && accessRules.length > 0,
    accessRules: accessRules,
  };
}

/**
 * Check if user can view a specific supplier
 */
export async function canUserViewSupplier(
  userId: string,
  supplierId: string
): Promise<boolean> {
  // Admins can view all
  if (await isUserAdmin(userId)) {
    return true;
  }

  // Get the supplier
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, category_id, region')
    .eq('id', supplierId)
    .single();

  if (supplierError || !supplier) {
    return false;
  }

  // Get user's access rules
  const accessRules = await getUserAccessRules(userId);

  if (accessRules.length === 0) {
    return false; // No access rules = no access
  }

  // Check if supplier matches any access rule
  for (const rule of accessRules) {
    // Check rule_data (new format)
    if (rule.rule_data) {
      const { categories, regions } = rule.rule_data;

      let categoryMatch = !categories || categories.length === 0;
      let regionMatch = !regions || regions.length === 0;

      if (categories && categories.length > 0 && supplier.category_id) {
        categoryMatch = categories.includes(supplier.category_id);
      }

      if (regions && regions.length > 0 && supplier.region) {
        regionMatch = regions.includes(supplier.region);
      }

      if (categoryMatch && regionMatch) {
        return true;
      }
    }
    // Check legacy fields
    else {
      const categoryMatch = !rule.category_id || rule.category_id === supplier.category_id;
      const regionMatch = !rule.region || rule.region === supplier.region;

      if (categoryMatch && regionMatch) {
        return true;
      }
    }
  }

  return false; // No matching rules
}

/**
 * Get access summary for user
 */
export async function getUserSupplierAccessSummary(userId: string) {
  const admin = await isUserAdmin(userId);
  const accessRules = await getUserAccessRules(userId);

  // Get total supplier count
  const { count: totalSuppliers } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });

  if (admin) {
    return {
      isAdmin: true,
      totalAccessible: totalSuppliers || 0,
      totalSuppliers: totalSuppliers || 0,
      accessRules: [],
      coverage: 100,
    };
  }

  // For non-admins, get accessible count by querying with their rules
  const result = await getFilteredSuppliers(userId, { limit: 1 });

  return {
    isAdmin: false,
    totalAccessible: result.total,
    totalSuppliers: totalSuppliers || 0,
    accessRules: accessRules,
    coverage: totalSuppliers ? Math.round((result.total / totalSuppliers) * 100) : 0,
  };
}
