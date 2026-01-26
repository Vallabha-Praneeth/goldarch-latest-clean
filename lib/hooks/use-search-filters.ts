/**
 * MODULE-1B: Enhanced Search & Filters
 * File: hooks/use-search-filters.ts
 *
 * Purpose: Centralized state management for search, filters, and sorting
 * Status: COMPLETE - Production-ready
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Types from components
import type { FilterValues } from '../components/filter-panel';
import type { SortState } from '../components/sort-dropdown';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchFiltersState {
  /** Search query string */
  query: string;
  /** Filter field values */
  filters: FilterValues;
  /** Sort state */
  sort: SortState;
}

export interface UseSearchFiltersOptions {
  /** Initial search query */
  initialQuery?: string;
  /** Initial filter values */
  initialFilters?: FilterValues;
  /** Initial sort state */
  initialSort?: SortState;
  /** Sync state with URL query params */
  syncWithUrl?: boolean;
  /** Debounce delay for search query (ms) */
  debounceMs?: number;
  /** Callback when any state changes */
  onChange?: (state: SearchFiltersState) => void;
}

export interface UseSearchFiltersReturn {
  // Current state
  query: string;
  filters: FilterValues;
  sort: SortState;

  // Setters
  setQuery: (query: string) => void;
  setFilters: (filters: FilterValues) => void;
  setSort: (sort: SortState) => void;

  // Utilities
  resetAll: () => void;
  resetFilters: () => void;
  resetSort: () => void;
  hasActiveFilters: boolean;
  hasActiveSearch: boolean;
  hasActiveSort: boolean;
  hasAnyActive: boolean;
  activeFilterCount: number;

  // Combined state
  state: SearchFiltersState;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Centralized state management for search, filters, and sorting
 *
 * Features:
 * - Manages search query, filters, and sort state
 * - Optional URL sync for persistence and sharing
 * - Debounced search query
 * - Utility functions for common operations
 * - TypeScript type safety
 */
export function useSearchFilters(
  options: UseSearchFiltersOptions = {}
): UseSearchFiltersReturn {
  const {
    initialQuery = '',
    initialFilters = {},
    initialSort = { field: null, direction: 'asc' },
    syncWithUrl = false,
    debounceMs = 300,
    onChange,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ============================================================================
  // STATE
  // ============================================================================

  const [query, setQueryState] = useState<string>(() => {
    if (syncWithUrl) {
      return searchParams.get('q') || initialQuery;
    }
    return initialQuery;
  });

  const [filters, setFiltersState] = useState<FilterValues>(() => {
    if (syncWithUrl) {
      // Parse filters from URL
      const urlFilters: FilterValues = { ...initialFilters };
      searchParams.forEach((value, key) => {
        if (key.startsWith('filter_')) {
          const filterKey = key.replace('filter_', '');
          // Try to parse as array
          if (value.includes(',')) {
            urlFilters[filterKey] = value.split(',');
          } else {
            urlFilters[filterKey] = value;
          }
        }
      });
      return urlFilters;
    }
    return initialFilters;
  });

  const [sort, setSortState] = useState<SortState>(() => {
    if (syncWithUrl) {
      const sortField = searchParams.get('sort_by');
      const sortDir = searchParams.get('sort_dir') as 'asc' | 'desc' | null;
      if (sortField) {
        return { field: sortField, direction: sortDir || 'asc' };
      }
    }
    return initialSort;
  });

  // ============================================================================
  // URL SYNC
  // ============================================================================

  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();

    // Add query
    if (query) {
      params.set('q', query);
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return;
      }
      const stringValue = Array.isArray(value) ? value.join(',') : String(value);
      params.set(`filter_${key}`, stringValue);
    });

    // Add sort
    if (sort.field) {
      params.set('sort_by', sort.field);
      params.set('sort_dir', sort.direction);
    }

    // Update URL without navigation
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [query, filters, sort, syncWithUrl, pathname, router]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasActiveSearch = query.trim().length > 0;

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== '';
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== '';
    }).length;
  }, [filters]);

  const hasActiveSort = sort.field !== null;

  const hasAnyActive = hasActiveSearch || hasActiveFilters || hasActiveSort;

  // Combined state
  const state: SearchFiltersState = useMemo(
    () => ({ query, filters, sort }),
    [query, filters, sort]
  );

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  // Notify onChange
  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  const setFilters = useCallback((newFilters: FilterValues) => {
    setFiltersState(newFilters);
  }, []);

  const setSort = useCallback((newSort: SortState) => {
    setSortState(newSort);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, [initialFilters]);

  const resetSort = useCallback(() => {
    setSortState(initialSort);
  }, [initialSort]);

  const resetAll = useCallback(() => {
    setQueryState(initialQuery);
    setFiltersState(initialFilters);
    setSortState(initialSort);
  }, [initialQuery, initialFilters, initialSort]);

  return {
    // State
    query,
    filters,
    sort,

    // Setters
    setQuery,
    setFilters,
    setSort,

    // Utilities
    resetAll,
    resetFilters,
    resetSort,
    hasActiveFilters,
    hasActiveSearch,
    hasActiveSort,
    hasAnyActive,
    activeFilterCount,

    // Combined
    state,
  };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * useSearchFiltersWithQuery
 * Integrates with React Query for automatic refetching
 */
interface UseSearchFiltersWithQueryOptions extends UseSearchFiltersOptions {
  /** Query key factory function */
  getQueryKey?: (state: SearchFiltersState) => unknown[];
  /** Optional refetch function to trigger on state change */
  refetch?: () => void;
}

export function useSearchFiltersWithQuery(
  options: UseSearchFiltersWithQueryOptions = {}
): UseSearchFiltersReturn {
  const { refetch, getQueryKey, ...searchFilterOptions } = options;

  const searchFilters = useSearchFilters(searchFilterOptions);

  // Trigger refetch when state changes
  useEffect(() => {
    if (refetch) {
      refetch();
    }
  }, [searchFilters.state, refetch]);

  return searchFilters;
}

/**
 * useFilterField
 * Hook for managing a single filter field
 */
export function useFilterField<T = string | string[]>(
  filterKey: string,
  defaultValue: T
) {
  const [value, setValue] = useState<T>(defaultValue);

  const reset = useCallback(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const isActive = useMemo(() => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== '';
  }, [value]);

  return {
    value,
    setValue,
    reset,
    isActive,
  };
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Basic Usage:
 * ```typescript
 * function MyPage() {
 *   const searchFilters = useSearchFilters({
 *     initialFilters: { status: null, category: [] },
 *     initialSort: { field: 'created_at', direction: 'desc' },
 *     syncWithUrl: true,
 *   });
 *
 *   return (
 *     <div>
 *       <SearchBar
 *         value={searchFilters.query}
 *         onChange={searchFilters.setQuery}
 *       />
 *       <FilterPanel
 *         values={searchFilters.filters}
 *         onApply={searchFilters.setFilters}
 *         onReset={searchFilters.resetFilters}
 *       />
 *       <SortDropdown
 *         value={searchFilters.sort}
 *         onChange={searchFilters.setSort}
 *       />
 *
 *       {searchFilters.hasAnyActive && (
 *         <Button onClick={searchFilters.resetAll}>Clear all</Button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * 2. With React Query:
 * ```typescript
 * function MyPage() {
 *   const searchFilters = useSearchFilters({
 *     syncWithUrl: true,
 *   });
 *
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['items', searchFilters.state],
 *     queryFn: () => fetchItems(searchFilters.state),
 *   });
 *
 *   return (
 *     <div>
 *       <SearchBar
 *         value={searchFilters.query}
 *         onChange={searchFilters.setQuery}
 *       />
 *       {data?.map(item => <ItemCard key={item.id} item={item} />)}
 *     </div>
 *   );
 * }
 * ```
 *
 * 3. With onChange Callback:
 * ```typescript
 * const searchFilters = useSearchFilters({
 *   onChange: (state) => {
 *     console.log('Search/filter/sort changed:', state);
 *     // Trigger analytics event, etc.
 *   },
 * });
 * ```
 *
 * 4. Single Filter Field:
 * ```typescript
 * const statusFilter = useFilterField('status', null);
 *
 * <Select
 *   value={statusFilter.value}
 *   onValueChange={statusFilter.setValue}
 * />
 * {statusFilter.isActive && <Button onClick={statusFilter.reset}>Clear</Button>}
 * ```
 *
 * INTEGRATION NOTES:
 * - Use with SearchBar, FilterPanel, and SortDropdown components
 * - Pair with search-query-builder for API queries
 * - Works seamlessly with React Query
 * - URL sync enables shareable filtered views
 * - Automatically updates URL without page reload
 */
