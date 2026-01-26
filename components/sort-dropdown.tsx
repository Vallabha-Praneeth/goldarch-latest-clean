/**
 * MODULE-1B: Enhanced Search & Filters
 * File: components/sort-dropdown.tsx
 *
 * Purpose: Sort dropdown with field and direction selection
 * Status: COMPLETE - Production-ready
 */

'use client';

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// ============================================================================
// TYPES
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  /** Unique identifier for the sort field */
  value: string;
  /** Display label */
  label: string;
  /** Default direction for this field (optional) */
  defaultDirection?: SortDirection;
}

export interface SortState {
  /** Field to sort by (null = no sort) */
  field: string | null;
  /** Sort direction */
  direction: SortDirection;
}

export interface SortDropdownProps {
  /** Available sort options */
  options: SortOption[];
  /** Current sort state */
  value: SortState;
  /** Callback when sort changes */
  onChange: (sort: SortState) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show direction toggle button */
  showDirectionToggle?: boolean;
  /** Compact mode (inline layout) */
  compact?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SortDropdown({
  options,
  value,
  onChange,
  placeholder = 'Sort by...',
  showDirectionToggle = true,
  compact = false,
  disabled = false,
  className = '',
}: SortDropdownProps) {
  const handleFieldChange = (field: string) => {
    const option = options.find((o) => o.value === field);
    onChange({
      field,
      direction: option?.defaultDirection || 'asc',
    });
  };

  const handleDirectionToggle = () => {
    if (value.field) {
      onChange({
        field: value.field,
        direction: value.direction === 'asc' ? 'desc' : 'asc',
      });
    }
  };

  const handleClear = () => {
    onChange({
      field: null,
      direction: 'asc',
    });
  };

  // Get current option label
  const currentOption = options.find((o) => o.value === value.field);
  const currentLabel = currentOption
    ? `${currentOption.label} (${value.direction === 'asc' ? 'A→Z' : 'Z→A'})`
    : placeholder;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Select
          value={value.field || ''}
          onValueChange={handleFieldChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showDirectionToggle && value.field && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleDirectionToggle}
            disabled={disabled}
            title={`Sort ${value.direction === 'asc' ? 'descending' : 'ascending'}`}
          >
            {value.direction === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        )}

        {value.field && (
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Sort by</Label>
      <div className="flex items-center gap-2">
        <Select
          value={value.field || ''}
          onValueChange={handleFieldChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showDirectionToggle && value.field && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleDirectionToggle}
            disabled={disabled}
            title={`Sort ${value.direction === 'asc' ? 'descending' : 'ascending'}`}
          >
            {value.direction === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        )}

        {value.field && (
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE VARIANT
// ============================================================================

/**
 * SimpleSortDropdown
 * Single dropdown with field+direction combined
 */
interface SimpleSortDropdownProps {
  options: SortOption[];
  value: SortState;
  onChange: (sort: SortState) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimpleSortDropdown({
  options,
  value,
  onChange,
  placeholder = 'Sort by...',
  disabled = false,
  className = '',
}: SimpleSortDropdownProps) {
  // Generate combined options (field + direction)
  const combinedOptions: Array<{ value: string; label: string }> = [];
  options.forEach((option) => {
    combinedOptions.push({
      value: `${option.value}:asc`,
      label: `${option.label} (A→Z)`,
    });
    combinedOptions.push({
      value: `${option.value}:desc`,
      label: `${option.label} (Z→A)`,
    });
  });

  const currentValue = value.field ? `${value.field}:${value.direction}` : '';

  const handleChange = (combinedValue: string) => {
    if (!combinedValue) {
      onChange({ field: null, direction: 'asc' });
      return;
    }

    const [field, direction] = combinedValue.split(':');
    onChange({
      field,
      direction: direction as SortDirection,
    });
  };

  return (
    <div className={className}>
      <Select value={currentValue} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger>
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {combinedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================================
// TABLE COLUMN SORT HEADER
// ============================================================================

/**
 * SortableColumnHeader
 * Clickable table header for sorting
 */
interface SortableColumnHeaderProps {
  /** Column field identifier */
  field: string;
  /** Display label */
  label: string;
  /** Current sort state */
  currentSort: SortState;
  /** Callback when header clicked */
  onSort: (sort: SortState) => void;
  /** Custom class name */
  className?: string;
}

export function SortableColumnHeader({
  field,
  label,
  currentSort,
  onSort,
  className = '',
}: SortableColumnHeaderProps) {
  const isActive = currentSort.field === field;
  const isAsc = isActive && currentSort.direction === 'asc';
  const isDesc = isActive && currentSort.direction === 'desc';

  const handleClick = () => {
    if (!isActive) {
      // Not currently sorted by this field, sort ascending
      onSort({ field, direction: 'asc' });
    } else if (isAsc) {
      // Currently ascending, switch to descending
      onSort({ field, direction: 'desc' });
    } else {
      // Currently descending, clear sort
      onSort({ field: null, direction: 'asc' });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`-ml-3 h-8 hover:bg-muted ${className}`}
      onClick={handleClick}
    >
      <span className={isActive ? 'font-semibold' : ''}>{label}</span>
      <div className="ml-2 h-4 w-4">
        {isAsc && <ArrowUp className="h-4 w-4" />}
        {isDesc && <ArrowDown className="h-4 w-4" />}
        {!isActive && <ArrowUpDown className="h-4 w-4 opacity-50" />}
      </div>
    </Button>
  );
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Standard Dropdown:
 * ```typescript
 * const sortOptions: SortOption[] = [
 *   { value: 'name', label: 'Name', defaultDirection: 'asc' },
 *   { value: 'created_at', label: 'Date Created', defaultDirection: 'desc' },
 *   { value: 'amount', label: 'Amount', defaultDirection: 'desc' },
 * ];
 *
 * const [sort, setSort] = useState<SortState>({ field: null, direction: 'asc' });
 *
 * <SortDropdown
 *   options={sortOptions}
 *   value={sort}
 *   onChange={setSort}
 * />
 * ```
 *
 * 2. Compact Mode (inline):
 * ```typescript
 * <SortDropdown
 *   options={sortOptions}
 *   value={sort}
 *   onChange={setSort}
 *   compact
 * />
 * ```
 *
 * 3. Simple Variant (single dropdown):
 * ```typescript
 * <SimpleSortDropdown
 *   options={sortOptions}
 *   value={sort}
 *   onChange={setSort}
 * />
 * ```
 *
 * 4. Table Column Headers:
 * ```typescript
 * <TableHead>
 *   <SortableColumnHeader
 *     field="name"
 *     label="Name"
 *     currentSort={sort}
 *     onSort={setSort}
 *   />
 * </TableHead>
 * <TableHead>
 *   <SortableColumnHeader
 *     field="amount"
 *     label="Amount"
 *     currentSort={sort}
 *     onSort={setSort}
 *   />
 * </TableHead>
 * ```
 *
 * INTEGRATION NOTES:
 * - Pair with SearchBar and FilterPanel for complete UI
 * - Use with use-search-filters hook for state management
 * - Combine with search-query-builder to construct API queries
 * - SortableColumnHeader for inline table sorting
 */
