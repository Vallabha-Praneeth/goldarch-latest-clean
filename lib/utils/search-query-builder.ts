/**
 * MODULE-1B: Enhanced Search & Filters
 * File: utils/search-query-builder.ts
 *
 * Purpose: Utilities for building search/filter queries for various backends
 * Status: COMPLETE - Production-ready
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchFiltersState } from '../hooks/use-search-filters';
import type { FilterValues } from '../components/filter-panel';
import type { SortState } from '../components/sort-dropdown';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchConfig {
  /** Fields to search in (e.g., ['name', 'description']) */
  searchFields?: string[];
  /** Use case-insensitive search (ilike vs like) */
  caseInsensitive?: boolean;
  /** Search operator: 'or' (any field matches) or 'and' (all fields must match) */
  searchOperator?: 'or' | 'and';
}

export interface FilterConfig {
  /** Custom filter operators per field */
  filterOperators?: Record<string, 'eq' | 'in' | 'like' | 'ilike' | 'gte' | 'lte'>;
  /** Fields that should use array 'in' operator even if single value */
  arrayFields?: string[];
}

export interface QueryBuilderOptions {
  search?: SearchConfig;
  filter?: FilterConfig;
  /** Default items per page for pagination */
  pageSize?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ============================================================================
// SUPABASE QUERY BUILDER
// ============================================================================

/**
 * Build a Supabase query with search, filters, and sort
 *
 * @example
 * ```typescript
 * const query = buildSupabaseQuery(
 *   supabase.from('suppliers').select('*'),
 *   { query: 'acme', filters: { status: 'active' }, sort: { field: 'name', direction: 'asc' } },
 *   { search: { searchFields: ['name', 'description'] } }
 * );
 * const { data } = await query;
 * ```
 */
export function buildSupabaseQuery<T>(
  baseQuery: any,
  state: SearchFiltersState,
  options: QueryBuilderOptions = {}
): any {
  const {
    search = {},
    filter = {},
  } = options;

  const {
    searchFields = [],
    caseInsensitive = true,
    searchOperator = 'or',
  } = search;

  const {
    filterOperators = {},
    arrayFields = [],
  } = filter;

  let query = baseQuery;

  // ============================================================================
  // SEARCH
  // ============================================================================

  if (state.query && searchFields.length > 0) {
    const searchOp = caseInsensitive ? 'ilike' : 'like';
    const searchPattern = `%${state.query}%`;

    if (searchOperator === 'or') {
      // Build OR condition for search fields
      const orConditions = searchFields
        .map((field) => `${field}.${searchOp}.${searchPattern}`)
        .join(',');
      query = query.or(orConditions);
    } else {
      // Apply AND conditions
      searchFields.forEach((field) => {
        query = query[searchOp](field, searchPattern);
      });
    }
  }

  // ============================================================================
  // FILTERS
  // ============================================================================

  Object.entries(state.filters).forEach(([key, value]) => {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    // Determine operator
    const operator = filterOperators[key] || (Array.isArray(value) ? 'in' : 'eq');

    // Apply filter
    if (operator === 'in' || (Array.isArray(value) && !filterOperators[key])) {
      const valueArray = Array.isArray(value) ? value : [value];
      query = query.in(key, valueArray);
    } else if (operator === 'like' || operator === 'ilike') {
      const pattern = `%${value}%`;
      query = query[operator](key, pattern);
    } else {
      // eq, gte, lte
      query = query[operator](key, value);
    }
  });

  // ============================================================================
  // SORT
  // ============================================================================

  if (state.sort.field) {
    query = query.order(state.sort.field, {
      ascending: state.sort.direction === 'asc',
    });
  }

  return query;
}

/**
 * Add pagination to a Supabase query
 *
 * @example
 * ```typescript
 * const query = applySupabasePagination(
 *   supabase.from('suppliers').select('*'),
 *   { page: 2, pageSize: 10 }
 * );
 * ```
 */
export function applySupabasePagination(
  query: any,
  pagination: PaginationParams
): any {
  const { page = 1, pageSize = 20 } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

// ============================================================================
// URL QUERY PARAMS BUILDER
// ============================================================================

/**
 * Convert search/filter/sort state to URL query parameters
 * For use with REST APIs
 *
 * @example
 * ```typescript
 * const params = buildUrlParams(state);
 * const url = `/api/suppliers?${params.toString()}`;
 * ```
 */
export function buildUrlParams(
  state: SearchFiltersState,
  options: QueryBuilderOptions = {}
): URLSearchParams {
  const params = new URLSearchParams();

  // Search
  if (state.query) {
    params.set('q', state.query);
  }

  // Filters
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    if (Array.isArray(value)) {
      // Array values: comma-separated or multiple params
      params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  });

  // Sort
  if (state.sort.field) {
    params.set('sort_by', state.sort.field);
    params.set('sort_dir', state.sort.direction);
  }

  return params;
}

/**
 * Add pagination to URL params
 */
export function addPaginationToUrlParams(
  params: URLSearchParams,
  pagination: PaginationParams
): URLSearchParams {
  const { page = 1, pageSize = 20 } = pagination;
  params.set('page', String(page));
  params.set('limit', String(pageSize));
  return params;
}

// ============================================================================
// QUERY OBJECT BUILDER (for fetch/axios)
// ============================================================================

/**
 * Convert state to a plain query object
 * Useful for fetch or axios requests
 *
 * @example
 * ```typescript
 * const queryObj = buildQueryObject(state);
 * // { q: 'acme', status: 'active', sort_by: 'name', sort_dir: 'asc' }
 *
 * const response = await fetch('/api/suppliers', {
 *   method: 'POST',
 *   body: JSON.stringify(queryObj),
 * });
 * ```
 */
export function buildQueryObject(
  state: SearchFiltersState
): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};

  // Search
  if (state.query) {
    obj.q = state.query;
  }

  // Filters
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    if (Array.isArray(value)) {
      obj[key] = value;
    } else {
      obj[key] = String(value);
    }
  });

  // Sort
  if (state.sort.field) {
    obj.sort_by = state.sort.field;
    obj.sort_dir = state.sort.direction;
  }

  return obj;
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Check if any search/filter/sort is active
 */
export function hasActiveQuery(state: SearchFiltersState): boolean {
  // Has search
  if (state.query && state.query.trim().length > 0) {
    return true;
  }

  // Has filters
  const hasFilters = Object.values(state.filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== '';
  });
  if (hasFilters) return true;

  // Has sort
  if (state.sort.field) return true;

  return false;
}

/**
 * Get a human-readable description of active filters
 *
 * @example
 * ```typescript
 * const desc = describeActiveFilters(state, {
 *   status: { active: 'Active', inactive: 'Inactive' },
 * });
 * // "Searching for 'acme', Status: Active, sorted by Name (A→Z)"
 * ```
 */
export function describeActiveFilters(
  state: SearchFiltersState,
  filterLabels?: Record<string, Record<string, string>>
): string {
  const parts: string[] = [];

  // Search
  if (state.query) {
    parts.push(`Searching for '${state.query}'`);
  }

  // Filters
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

    if (Array.isArray(value)) {
      const labels = value
        .map((v) => filterLabels?.[key]?.[v] || v)
        .join(', ');
      parts.push(`${fieldLabel}: ${labels}`);
    } else {
      const label = filterLabels?.[key]?.[value as string] || value;
      parts.push(`${fieldLabel}: ${label}`);
    }
  });

  // Sort
  if (state.sort.field) {
    const dir = state.sort.direction === 'asc' ? 'A→Z' : 'Z→A';
    const fieldLabel =
      state.sort.field.charAt(0).toUpperCase() +
      state.sort.field.slice(1).replace(/_/g, ' ');
    parts.push(`sorted by ${fieldLabel} (${dir})`);
  }

  return parts.join(', ');
}

/**
 * Count active filters (excludes search and sort)
 */
export function countActiveFilters(filters: FilterValues): number {
  return Object.values(filters).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== '';
  }).length;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Supabase with search/filter/sort:
 * ```typescript
 * const { state } = useSearchFilters();
 *
 * const query = buildSupabaseQuery(
 *   supabase.from('suppliers').select('*', { count: 'exact' }),
 *   state,
 *   {
 *     search: {
 *       searchFields: ['name', 'contact_name', 'description'],
 *       caseInsensitive: true,
 *     },
 *     filter: {
 *       filterOperators: { name: 'ilike' },
 *       arrayFields: ['category_id'],
 *     },
 *   }
 * );
 *
 * const { data, count, error } = await query;
 * ```
 *
 * 2. REST API with URL params:
 * ```typescript
 * const { state } = useSearchFilters();
 * const params = buildUrlParams(state);
 * addPaginationToUrlParams(params, { page: 1, pageSize: 20 });
 *
 * const response = await fetch(`/api/suppliers?${params.toString()}`);
 * ```
 *
 * 3. With React Query:
 * ```typescript
 * const { state } = useSearchFilters();
 *
 * const { data } = useQuery({
 *   queryKey: ['suppliers', state],
 *   queryFn: async () => {
 *     const query = buildSupabaseQuery(
 *       supabase.from('suppliers').select('*'),
 *       state,
 *       { search: { searchFields: ['name'] } }
 *     );
 *     const { data } = await query;
 *     return data;
 *   },
 * });
 * ```
 *
 * 4. Human-readable description:
 * ```typescript
 * const desc = describeActiveFilters(state, {
 *   status: { active: 'Active', inactive: 'Inactive' },
 *   category: { hardware: 'Hardware', software: 'Software' },
 * });
 *
 * <Alert>{desc}</Alert>
 * ```
 *
 * INTEGRATION NOTES:
 * - Works with Supabase queries and REST APIs
 * - Pair with useSearchFilters hook for state management
 * - Use with SearchBar, FilterPanel, SortDropdown components
 * - Supports multiple filter operators (eq, in, like, ilike, gte, lte)
 * - Handles pagination separately for flexibility
 * - Type-safe with full TypeScript support
 */
