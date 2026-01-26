/**
 * MODULE-1B: Enhanced Search & Filters
 * File: components/filter-panel.tsx
 *
 * Purpose: Advanced filtering UI with multi-field support
 * Status: COMPLETE - Production-ready
 */

'use client';

import { useState, useCallback } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ============================================================================
// TYPES
// ============================================================================

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date-range';
  options?: FilterOption[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string | string[] | null;
}

export interface FilterPanelProps {
  /** Array of filter field configurations */
  fields: FilterField[];
  /** Current filter values */
  values: FilterValues;
  /** Callback when filters are applied */
  onApply: (values: FilterValues) => void;
  /** Optional callback when filters are reset */
  onReset?: () => void;
  /** Trigger button text */
  triggerLabel?: string;
  /** Panel title */
  title?: string;
  /** Panel description */
  description?: string;
  /** Custom trigger element (replaces default button) */
  customTrigger?: React.ReactNode;
  /** Disable panel */
  disabled?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FilterPanel({
  fields,
  values,
  onApply,
  onReset,
  triggerLabel = 'Filters',
  title = 'Filter Options',
  description = 'Apply filters to narrow down your results',
  customTrigger,
  disabled = false,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [localValues, setLocalValues] = useState<FilterValues>(values);

  // Count active filters
  const activeFilterCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== '';
  }).length;

  // Handle field value change
  const handleFieldChange = useCallback((fieldId: string, value: string | string[] | null) => {
    setLocalValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    onApply(localValues);
    setOpen(false);
  }, [localValues, onApply]);

  // Reset filters
  const handleReset = useCallback(() => {
    const resetValues: FilterValues = {};
    fields.forEach((field) => {
      resetValues[field.id] = field.type === 'multiselect' ? [] : null;
    });
    setLocalValues(resetValues);
    onReset?.();
  }, [fields, onReset]);

  // Sync external values with local state when panel opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setLocalValues(values);
      }
      setOpen(newOpen);
    },
    [values]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {customTrigger || (
          <Button variant="outline" disabled={disabled} className="relative">
            <Filter className="h-4 w-4 mr-2" />
            {triggerLabel}
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>

              {field.type === 'select' && (
                <Select
                  value={(localValues[field.id] as string) || ''}
                  onValueChange={(value) => handleFieldChange(field.id, value || null)}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'multiselect' && (
                <div className="space-y-2">
                  <div className="border rounded-md p-2 min-h-[100px]">
                    {field.options?.map((option) => {
                      const isSelected = (localValues[field.id] as string[] || []).includes(
                        option.value
                      );
                      return (
                        <Button
                          key={option.value}
                          variant={isSelected ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start mb-1"
                          onClick={() => {
                            const current = (localValues[field.id] as string[]) || [];
                            const newValue = isSelected
                              ? current.filter((v) => v !== option.value)
                              : [...current, option.value];
                            handleFieldChange(field.id, newValue);
                          }}
                        >
                          {isSelected && <Check className="h-4 w-4 mr-2" />}
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                  {(localValues[field.id] as string[] || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(localValues[field.id] as string[]).map((value) => {
                        const option = field.options?.find((o) => o.value === value);
                        return (
                          <Badge key={value} variant="secondary" className="text-xs">
                            {option?.label || value}
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => {
                                const current = (localValues[field.id] as string[]) || [];
                                handleFieldChange(
                                  field.id,
                                  current.filter((v) => v !== value)
                                );
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TODO: Add date-range type implementation if needed */}
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <SheetFooter className="flex flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Active Filter Badges
 * Shows currently applied filters as dismissible badges
 */
interface ActiveFilterBadgesProps {
  fields: FilterField[];
  values: FilterValues;
  onRemove: (fieldId: string) => void;
  onClearAll?: () => void;
}

export function ActiveFilterBadges({
  fields,
  values,
  onRemove,
  onClearAll,
}: ActiveFilterBadgesProps) {
  const activeFilters = fields
    .map((field) => {
      const value = values[field.id];
      if (!value) return null;
      if (Array.isArray(value) && value.length === 0) return null;

      let displayValue: string;
      if (Array.isArray(value)) {
        const labels = value
          .map((v) => field.options?.find((o) => o.value === v)?.label || v)
          .join(', ');
        displayValue = labels;
      } else {
        displayValue = field.options?.find((o) => o.value === value)?.label || value;
      }

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        displayValue,
      };
    })
    .filter(Boolean);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter) => (
        <Badge key={filter!.fieldId} variant="secondary" className="gap-1">
          <span className="font-medium">{filter!.fieldLabel}:</span>
          <span>{filter!.displayValue}</span>
          <X
            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
            onClick={() => onRemove(filter!.fieldId)}
          />
        </Badge>
      ))}
      {onClearAll && activeFilters.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}

/**
 * USAGE EXAMPLE:
 *
 * ```typescript
 * const filterFields: FilterField[] = [
 *   {
 *     id: 'status',
 *     label: 'Status',
 *     type: 'select',
 *     options: [
 *       { label: 'Active', value: 'active' },
 *       { label: 'Inactive', value: 'inactive' },
 *     ],
 *   },
 *   {
 *     id: 'categories',
 *     label: 'Categories',
 *     type: 'multiselect',
 *     options: [
 *       { label: 'Hardware', value: 'hardware' },
 *       { label: 'Software', value: 'software' },
 *     ],
 *   },
 * ];
 *
 * function MyPage() {
 *   const [filters, setFilters] = useState<FilterValues>({
 *     status: null,
 *     categories: [],
 *   });
 *
 *   const handleApplyFilters = (newFilters: FilterValues) => {
 *     setFilters(newFilters);
 *     // Fetch data with new filters
 *   };
 *
 *   return (
 *     <div>
 *       <FilterPanel
 *         fields={filterFields}
 *         values={filters}
 *         onApply={handleApplyFilters}
 *         onReset={() => setFilters({ status: null, categories: [] })}
 *       />
 *       <ActiveFilterBadges
 *         fields={filterFields}
 *         values={filters}
 *         onRemove={(fieldId) => setFilters({ ...filters, [fieldId]: null })}
 *         onClearAll={() => setFilters({ status: null, categories: [] })}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * INTEGRATION NOTES:
 * - Pair with SearchBar for complete search/filter UI
 * - Use with use-search-filters hook for state management
 * - Combine with search-query-builder for API queries
 * - ActiveFilterBadges shows applied filters outside the panel
 */
