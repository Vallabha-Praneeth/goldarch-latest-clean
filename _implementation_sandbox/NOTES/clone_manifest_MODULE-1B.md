# Clone Manifest: MODULE-1B (Enhanced Search & Filters)

**Module Purpose**: Add keyword search and advanced filtering to supplier list
**Implementation Order**: 5th
**Phase**: 1 (Supplier Management)

---

## Files to Clone

### 1. Suppliers Page (current search implementation)
**Source**: `app/app-dashboard/suppliers/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/suppliers/page.tsx`
**Reason**: Already has basic search (lines 75-78), need to enhance it
**Will Change**: YES - Will add filter UI components
**Will NOT Change**: Existing search bar pattern, layout

**Note**: If already cloned for MODULE-1A, reuse that clone.

### 2. UI Components (Select, Badge, etc.)
**Source**: `components/ui/select.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/select.tsx`
**Reason**: Use for filter dropdowns
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/badge.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/badge.tsx`
**Reason**: Display active filters as badges
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- API routes (filtering is client-side)
- Other page files
- Non-filter UI components

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-1B/`:

1. **`components/supplier-search-bar.tsx`**
   - Enhanced version of existing search
   - Same styling as current (matches line 339-347)
   - Adds debouncing for better performance
   - No visual changes, just better logic

2. **`components/supplier-filters.tsx`**
   - Filter UI panel
   - Dropdowns for: Category, Region, Rating
   - "Clear Filters" button
   - Active filter badges
   - Matches existing card/button styling

3. **`components/active-filters-bar.tsx`**
   - Shows active filters as removable badges
   - "Kitchen × US × 4★+" style
   - Click badge to remove filter

4. **`utils/search-filter-logic.ts`**
   - Function: `filterSuppliers(suppliers, searchQuery, filters)`
   - Combines search and filter logic
   - Handles multiple filter criteria
   - Pure function (no side effects)

5. **`hooks/use-supplier-filters.ts`**
   - Custom hook for filter state management
   - Returns: { filters, setFilter, clearFilters, activeCount }
   - Persists to localStorage (optional)

6. **`README.md`**
   - Integration instructions
   - How to add filter UI to page
   - Filter logic explanation
   - UI pattern requirements

---

## Integration Strategy

### Current Search Implementation (lines 75-78):
```tsx
const filteredSuppliers = suppliers?.filter((supplier) =>
  supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  supplier.city?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Enhanced Search + Filters:
```tsx
// Add filter state
const { filters, setFilter, clearFilters } = useSupplierFilters();

// Enhanced filtering
const filteredSuppliers = useMemo(() => {
  return filterSuppliers(suppliers, searchQuery, filters);
}, [suppliers, searchQuery, filters]);
```

### UI Addition (after search bar, before grid):
```tsx
{/* Search */}
<div className="relative">
  <Search className="..." />
  <Input ... />
</div>

{/* NEW: Filter Panel */}
<SupplierFilters
  categories={categories}
  filters={filters}
  onFilterChange={setFilter}
  onClearFilters={clearFilters}
/>

{/* NEW: Active Filters */}
{hasActiveFilters && (
  <ActiveFiltersBar
    filters={filters}
    onRemoveFilter={removeFilter}
  />
)}

{/* Suppliers Grid */}
<div className="grid gap-4 ...">
```

---

## Filter UI Design (matches existing patterns)

```tsx
// components/supplier-filters.tsx
export function SupplierFilters({ categories, filters, onFilterChange, onClearFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
      {/* Category Filter */}
      <Select
        value={filters.category}
        onValueChange={(v) => onFilterChange('category', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Region Filter */}
      <Select
        value={filters.region}
        onValueChange={(v) => onFilterChange('region', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          <SelectItem value="US">United States</SelectItem>
          <SelectItem value="China">China</SelectItem>
          <SelectItem value="India">India</SelectItem>
        </SelectContent>
      </Select>

      {/* Rating Filter */}
      <Select
        value={filters.minRating}
        onValueChange={(v) => onFilterChange('minRating', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Any Rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Rating</SelectItem>
          <SelectItem value="4">4★ and above</SelectItem>
          <SelectItem value="3">3★ and above</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
```

---

## Filter Logic (Skeleton)

```typescript
// utils/search-filter-logic.ts

export interface SupplierFilters {
  category?: string;
  region?: string;
  minRating?: string;
}

export function filterSuppliers(
  suppliers: any[] | undefined,
  searchQuery: string,
  filters: SupplierFilters
) {
  if (!suppliers) return [];

  return suppliers.filter((supplier) => {
    // Search filter (existing logic)
    if (searchQuery) {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
    }

    // Category filter (NEW)
    if (filters.category && filters.category !== 'all') {
      if (supplier.category_id !== filters.category) return false;
    }

    // Region filter (NEW)
    if (filters.region && filters.region !== 'all') {
      if (supplier.region !== filters.region) return false;
    }

    // Rating filter (NEW)
    if (filters.minRating && filters.minRating !== 'all') {
      const minRating = parseFloat(filters.minRating);
      if (!supplier.owner_rating || supplier.owner_rating < minRating) {
        return false;
      }
    }

    return true;
  });
}
```

---

## UI Pattern Requirements

**Must Match**:
- Card styling: `bg-card border border-border rounded-lg`
- Select width: `w-[180px]` (consistent)
- Gap spacing: `gap-3` (existing pattern)
- Button styling: `variant="outline" size="sm"`

**Must NOT**:
- Change existing search bar appearance
- Modify supplier card grid layout
- Add new navigation items
- Change color scheme

---

## Verification After Clone

- [ ] suppliers/page.tsx cloned (or reuse from MODULE-1A)
- [ ] UI components available for reference
- [ ] Can identify insertion point for filters
- [ ] Existing search logic understood

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~100 lines (minimal, reuses MODULE-1A clone)
