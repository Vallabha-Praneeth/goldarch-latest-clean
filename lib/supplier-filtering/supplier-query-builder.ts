/**
 * MODULE-1A: Supplier Access Filtering
 * File: utils/supplier-query-builder.ts
 *
 * Purpose: Utility functions for building supplier queries with access rules
 * Status: SKELETON - Structure complete, helper functions ready
 *
 * Provides helper functions to construct Supabase queries with access rule filtering.
 */

import type { SupplierAccessRule } from '../../MODULE-0B/types/rbac.types';
import type { SupplierFilterParams } from '../middleware/supplier-filter';

// ============================================================================
// ACCESS RULE QUERY BUILDERS
// ============================================================================

/**
 * Build OR condition from access rules for Supabase query
 *
 * Converts access rules into Supabase OR syntax.
 * Example: "category_id.eq.X,region.eq.Y,and(category_id.eq.Z,region.eq.W)"
 */
export function buildAccessRuleCondition(rules: SupplierAccessRule[]): string {
  if (rules.length === 0) {
    // No rules = no access (return impossible condition)
    return 'id.eq.00000000-0000-0000-0000-000000000000';
  }

  const conditions: string[] = [];

  for (const rule of rules) {
    const ruleParts: string[] = [];

    if (rule.category_id) {
      ruleParts.push(`category_id.eq.${rule.category_id}`);
    }

    if (rule.region) {
      ruleParts.push(`region.eq.${rule.region}`);
    }

    // If both category and region, use AND
    if (ruleParts.length === 2) {
      conditions.push(`and(${ruleParts.join(',')})`);
    } else if (ruleParts.length === 1) {
      conditions.push(ruleParts[0]);
    }
    // If neither (shouldn't happen due to CHECK constraint), skip
  }

  // Join all conditions with OR
  return conditions.join(',');
}

/**
 * Check if access rules grant access to a specific supplier
 *
 * Used for client-side validation before showing supplier details.
 */
export function checkSupplierAccess(
  supplier: { category_id: string | null; region: string | null },
  rules: SupplierAccessRule[]
): boolean {
  if (rules.length === 0) return false;

  // Check if any rule matches
  for (const rule of rules) {
    const categoryMatch = !rule.category_id || rule.category_id === supplier.category_id;
    const regionMatch = !rule.region || rule.region === supplier.region;

    if (categoryMatch && regionMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Get readable description of access rules
 *
 * Converts access rules into human-readable text.
 * Example: "Kitchen suppliers in US or All suppliers in China"
 */
export function describeAccessRules(
  rules: SupplierAccessRule[],
  categoryMap?: Map<string, string>
): string {
  if (rules.length === 0) return 'No access';

  const descriptions = rules.map((rule) => {
    const parts: string[] = [];

    if (rule.category_id) {
      const categoryName = categoryMap?.get(rule.category_id) || 'Category';
      parts.push(categoryName);
    } else {
      parts.push('All categories');
    }

    if (rule.region) {
      parts.push(`in ${rule.region}`);
    } else {
      parts.push('in all regions');
    }

    return parts.join(' ');
  });

  if (descriptions.length === 1) {
    return descriptions[0];
  }

  // Join with "or" for multiple rules
  return descriptions.join(' OR ');
}

// ============================================================================
// QUERY PARAMETER BUILDERS
// ============================================================================

/**
 * Build URL search params from filter params
 *
 * Converts SupplierFilterParams into URLSearchParams for API calls.
 */
export function buildQueryParams(params: SupplierFilterParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.categoryId) {
    searchParams.set('category', params.categoryId);
  }

  if (params.region) {
    searchParams.set('region', params.region);
  }

  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit.toString());
  }

  if (params.offset !== undefined) {
    searchParams.set('offset', params.offset.toString());
  }

  return searchParams;
}

/**
 * Parse URL search params into filter params
 *
 * Converts URLSearchParams back into SupplierFilterParams.
 */
export function parseQueryParams(searchParams: URLSearchParams): SupplierFilterParams {
  const params: SupplierFilterParams = {};

  const search = searchParams.get('search');
  if (search) params.search = search;

  const category = searchParams.get('category');
  if (category) params.categoryId = category;

  const region = searchParams.get('region');
  if (region) params.region = region;

  const sortBy = searchParams.get('sortBy');
  if (sortBy === 'name' || sortBy === 'created_at' || sortBy === 'updated_at') {
    params.sortBy = sortBy;
  }

  const sortOrder = searchParams.get('sortOrder');
  if (sortOrder === 'asc' || sortOrder === 'desc') {
    params.sortOrder = sortOrder;
  }

  const limit = searchParams.get('limit');
  if (limit) {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed)) params.limit = parsed;
  }

  const offset = searchParams.get('offset');
  if (offset) {
    const parsed = parseInt(offset, 10);
    if (!isNaN(parsed)) params.offset = parsed;
  }

  return params;
}

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Calculate access coverage statistics
 *
 * Returns stats about what percentage of suppliers user can access.
 */
export function calculateAccessCoverage(
  rules: SupplierAccessRule[],
  totalSuppliers: number,
  accessibleSuppliers: number
): {
  coveragePercent: number;
  isFullAccess: boolean;
  isLimitedAccess: boolean;
  ruleCount: number;
} {
  const coveragePercent = totalSuppliers > 0
    ? Math.round((accessibleSuppliers / totalSuppliers) * 100)
    : 0;

  return {
    coveragePercent,
    isFullAccess: coveragePercent === 100,
    isLimitedAccess: coveragePercent > 0 && coveragePercent < 100,
    ruleCount: rules.length,
  };
}

/**
 * Group suppliers by access rule
 *
 * Returns which suppliers match which access rules.
 * Useful for debugging and analytics.
 */
export function groupSuppliersByRule<T extends { category_id: string | null; region: string | null }>(
  suppliers: T[],
  rules: SupplierAccessRule[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const rule of rules) {
    const matching = suppliers.filter(s => {
      const categoryMatch = !rule.category_id || rule.category_id === s.category_id;
      const regionMatch = !rule.region || rule.region === s.region;
      return categoryMatch && regionMatch;
    });

    grouped.set(rule.id, matching);
  }

  return grouped;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate filter parameters
 *
 * Returns validation errors if any parameters are invalid.
 */
export function validateFilterParams(params: SupplierFilterParams): string[] {
  const errors: string[] = [];

  if (params.limit !== undefined) {
    if (params.limit < 1) {
      errors.push('Limit must be at least 1');
    }
    if (params.limit > 1000) {
      errors.push('Limit cannot exceed 1000');
    }
  }

  if (params.offset !== undefined && params.offset < 0) {
    errors.push('Offset cannot be negative');
  }

  if (params.sortBy && !['name', 'created_at', 'updated_at'].includes(params.sortBy)) {
    errors.push('Invalid sortBy value');
  }

  if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
    errors.push('Invalid sortOrder value');
  }

  return errors;
}

/**
 * Validate access rule
 *
 * Checks if access rule is valid (at least one filter specified).
 */
export function validateAccessRule(rule: Partial<SupplierAccessRule>): boolean {
  return !!(rule.category_id || rule.region);
}

// ============================================================================
// CACHE KEY HELPERS
// ============================================================================

/**
 * Generate cache key from filter params
 *
 * Creates a consistent cache key for React Query.
 */
export function generateCacheKey(params: SupplierFilterParams): string {
  const parts: string[] = [];

  if (params.search) parts.push(`search:${params.search}`);
  if (params.categoryId) parts.push(`cat:${params.categoryId}`);
  if (params.region) parts.push(`reg:${params.region}`);
  if (params.sortBy) parts.push(`sort:${params.sortBy}:${params.sortOrder || 'asc'}`);
  if (params.limit) parts.push(`limit:${params.limit}`);
  if (params.offset) parts.push(`offset:${params.offset}`);

  return parts.join('|');
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Building Access Rule Queries:
 *    ```typescript
 *    import { buildAccessRuleCondition } from '@/MODULE-1A/utils/supplier-query-builder';
 *
 *    const accessRules = await getUserAccessRules(userId);
 *    const condition = buildAccessRuleCondition(accessRules);
 *
 *    const query = supabase
 *      .from('suppliers')
 *      .select('*')
 *      .or(condition); // Apply access rules
 *    ```
 *
 * 2. Client-side Access Check:
 *    ```typescript
 *    import { checkSupplierAccess } from '@/MODULE-1A/utils/supplier-query-builder';
 *
 *    const canView = checkSupplierAccess(supplier, accessRules);
 *    if (!canView) {
 *      return <AccessDenied />;
 *    }
 *    ```
 *
 * 3. Human-readable Descriptions:
 *    ```typescript
 *    import { describeAccessRules } from '@/MODULE-1A/utils/supplier-query-builder';
 *
 *    const categoryMap = new Map([
 *      ['kitchen-id', 'Kitchen'],
 *      ['bathroom-id', 'Bathroom'],
 *    ]);
 *
 *    const description = describeAccessRules(accessRules, categoryMap);
 *    // "Kitchen in US OR Bathroom in all regions"
 *    ```
 *
 * 4. URL Parameter Handling:
 *    ```typescript
 *    import { buildQueryParams, parseQueryParams } from '@/MODULE-1A/utils/supplier-query-builder';
 *
 *    // Build URL
 *    const params = buildQueryParams({ search: 'kitchen', region: 'US' });
 *    router.push(`/suppliers?${params}`);
 *
 *    // Parse URL
 *    const filters = parseQueryParams(searchParams);
 *    const { data } = useFilteredSuppliers(filters);
 *    ```
 *
 * 5. Coverage Statistics:
 *    ```typescript
 *    import { calculateAccessCoverage } from '@/MODULE-1A/utils/supplier-query-builder';
 *
 *    const stats = calculateAccessCoverage(accessRules, 100, 25);
 *    // { coveragePercent: 25, isFullAccess: false, isLimitedAccess: true, ruleCount: 2 }
 *    ```
 *
 * DEPENDENCIES:
 * - MODULE-0B: SupplierAccessRule type
 * - MODULE-1A: SupplierFilterParams type
 *
 * TODO (Full Implementation):
 * - Add support for complex filters (multiple categories/regions)
 * - Add filter presets (save common filter combinations)
 * - Add filter history (remember recent filters)
 * - Add filter validation for XSS prevention
 * - Add filter optimization (combine redundant rules)
 */
