# MODULE-1A: Supplier Access Filtering

**Status**: ⚠️ SKELETON IMPLEMENTATION (Ready for Integration)
**Phase**: 1 (Supplier Management)
**Priority**: HIGH
**Implementation Order**: 4th (after MODULE-0A, 0B, 0C)

---

## Purpose

Applies role-based supplier access filtering throughout the application. Integrates with MODULE-0B (RBAC) to automatically filter supplier lists based on user permissions, ensuring users only see suppliers they're authorized to access.

---

## What This Module Does

1. **Server-side Filtering**: Applies access rules to supplier queries at the API level
2. **Client-side Hooks**: React Query hooks for fetching filtered suppliers
3. **Visual Indicators**: Shows users when their view is filtered
4. **Query Builders**: Utilities for constructing filtered queries

---

## Files in This Module

```
MODULE-1A/
├── middleware/
│   └── supplier-filter.ts               # Server-side filtering logic
├── hooks/
│   └── use-filtered-suppliers.ts        # React Query hooks
├── components/
│   └── supplier-filter-indicator.tsx    # Visual filter indicator
├── utils/
│   └── supplier-query-builder.ts        # Query construction utilities
└── README.md                            # This file
```

---

## Current Status: SKELETON IMPLEMENTATION

- ✅ Server-side filtering logic complete
- ✅ React Query hooks implemented
- ✅ Filter indicator component ready
- ✅ Query builder utilities complete
- ⚠️ Uses mock data (needs Supabase integration)
- ⚠️ Needs integration with existing suppliers page
- ⚠️ Requires MODULE-0B tables to be created

---

## How It Works

### Access Rule Logic

**From MODULE-0B**: Each user has `supplier_access_rules` that define which suppliers they can view.

**Rule Structure**:
- `category_id`: Filter by supplier category (NULL = all categories)
- `region`: Filter by supplier region (NULL = all regions)
- At least one filter must be specified

**Multiple Rules**: OR condition
- User can see suppliers matching **ANY** access rule
- Example: Rule 1 (Kitchen + US) OR Rule 2 (Bathroom + China)
- Result: Kitchen in US + Bathroom in China

**Within a Rule**: AND condition
- Both category and region must match (if specified)
- Example: Rule (Kitchen + US) = ONLY kitchen suppliers in US

**Admins**: Bypass all filtering (see all suppliers)

### Flow Diagram

```
User requests suppliers
        ↓
Check if user is Admin
        ↓
    [Yes] → Return all suppliers
        ↓
    [No] → Fetch user's access rules
        ↓
Build filtered query with OR conditions
        ↓
Execute query (RLS provides backup filtering)
        ↓
Return filtered suppliers + metadata
        ↓
Show filter indicator in UI
```

---

## File Details

### 1. middleware/supplier-filter.ts (350 lines)

**Purpose**: Server-side filtering logic

**Key Functions**:

- `buildFilteredSupplierQuery(userId, params)` - Builds Supabase query with access rules
- `getFilteredSuppliers(userId, params)` - High-level function to fetch filtered suppliers
- `canUserViewSupplier(userId, supplierId)` - Check if user can access specific supplier
- `getUserSupplierAccessSummary(userId)` - Get stats about user's access
- `getUserAccessRules(userId)` - Fetch user's access rules from DB
- `isUserAdmin(userId)` - Check if user is admin (bypass filters)

**Returns**: `SupplierQueryResult`
```typescript
{
  suppliers: Supplier[];     // Filtered supplier list
  total: number;             // Total count
  filtered: boolean;         // True if filters were applied
  accessRules: SupplierAccessRule[];  // Active rules
}
```

**Integration**:
```typescript
// In API route: app/api/suppliers/route.ts
import { getFilteredSuppliers } from '@/MODULE-1A/middleware/supplier-filter';

export async function GET(req: AuthenticatedRequest) {
  const suppliers = await getFilteredSuppliers(req.user.id, {
    search: req.searchParams.get('search'),
    categoryId: req.searchParams.get('category'),
    region: req.searchParams.get('region'),
  });

  return NextResponse.json(suppliers);
}
```

### 2. hooks/use-filtered-suppliers.ts (290 lines)

**Purpose**: React Query hooks for client-side data fetching

**Hooks Provided**:

**Query Hooks**:
- `useFilteredSuppliers(params)` - Fetch filtered suppliers list
- `useSupplierDetails(supplierId)` - Fetch specific supplier
- `useSupplierAccessSummary()` - Get user's access summary
- `usePrefetchSuppliers()` - Prefetch for better UX

**Utility Hooks**:
- `useIsFiltered()` - Returns true if user's view is filtered
- `useActiveAccessRules()` - Returns active access rules
- `useAccessibleSupplierCount()` - Returns estimated accessible count
- `useInvalidateSuppliers()` - Invalidate cache after mutations

**Usage Example**:
```typescript
function SuppliersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFilteredSuppliers({ search });
  const isFiltered = useIsFiltered();
  const accessRules = useActiveAccessRules();

  return (
    <div>
      {isFiltered && (
        <SupplierFilterIndicator
          accessRules={accessRules}
          totalCount={data?.total}
        />
      )}

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search suppliers..."
      />

      {isLoading ? (
        <SkeletonList />
      ) : (
        <SupplierList suppliers={data?.suppliers || []} />
      )}
    </div>
  );
}
```

### 3. components/supplier-filter-indicator.tsx (170 lines)

**Purpose**: Visual indicator showing active filters

**Components**:

1. **SupplierFilterIndicator** - Full banner with details
   - Shows number of suppliers visible
   - Shows number of access rules
   - Collapsible details section
   - Dismissible option

2. **SupplierFilterBadge** - Compact badge
   - Shows just rule count
   - Clickable to expand details

3. **NoAccessIndicator** - No access warning
   - Shown when user has zero access rules
   - Prompts user to contact admin

**Usage**:
```typescript
import {
  SupplierFilterIndicator,
  SupplierFilterBadge,
  NoAccessIndicator
} from '@/MODULE-1A/components/supplier-filter-indicator';

// Full indicator
<SupplierFilterIndicator
  accessRules={accessRules}
  totalCount={25}
  showDetails={false}
  dismissible={true}
/>

// Compact badge
<SupplierFilterBadge
  accessRules={accessRules}
  onClick={() => setShowModal(true)}
/>

// No access state
{accessRules.length === 0 && <NoAccessIndicator />}
```

### 4. utils/supplier-query-builder.ts (320 lines)

**Purpose**: Utility functions for query construction

**Key Functions**:

**Query Builders**:
- `buildAccessRuleCondition(rules)` - Convert rules to Supabase OR syntax
- `buildQueryParams(params)` - Convert filter params to URLSearchParams
- `parseQueryParams(searchParams)` - Parse URL params back to filter object

**Validation**:
- `checkSupplierAccess(supplier, rules)` - Check if supplier matches rules
- `validateFilterParams(params)` - Validate filter parameters
- `validateAccessRule(rule)` - Validate access rule structure

**Utilities**:
- `describeAccessRules(rules, categoryMap)` - Human-readable description
- `calculateAccessCoverage(rules, total, accessible)` - Coverage statistics
- `groupSuppliersByRule(suppliers, rules)` - Group suppliers by matching rule
- `generateCacheKey(params)` - Generate React Query cache key

**Usage Examples**:
```typescript
// Build Supabase query condition
const condition = buildAccessRuleCondition(accessRules);
query.or(condition);

// Check access client-side
const canView = checkSupplierAccess(supplier, accessRules);
if (!canView) return <AccessDenied />;

// Get readable description
const description = describeAccessRules(accessRules, categoryMap);
// "Kitchen in US OR All suppliers in China"

// Calculate coverage
const stats = calculateAccessCoverage(accessRules, 100, 25);
// { coveragePercent: 25, isFullAccess: false, isLimitedAccess: true }
```

---

## Integration Steps

### Step 1: Create API Routes

**app/api/suppliers/route.ts**:
```typescript
import { withApiAuth } from '@/MODULE-0A/middleware/api-auth';
import { getFilteredSuppliers } from '@/MODULE-1A/middleware/supplier-filter';
import { NextRequest, NextResponse } from 'next/server';

async function getSuppliersHandler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  const result = await getFilteredSuppliers(req.user.id, {
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('category') || undefined,
    region: searchParams.get('region') || undefined,
    sortBy: searchParams.get('sortBy') as any || 'name',
    sortOrder: searchParams.get('sortOrder') as any || 'asc',
    limit: parseInt(searchParams.get('limit') || '100'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  return NextResponse.json(result);
}

export const GET = withApiAuth(getSuppliersHandler);
```

**app/api/suppliers/[supplierId]/route.ts**:
```typescript
import { withApiAuth } from '@/MODULE-0A/middleware/api-auth';
import { canUserViewSupplier } from '@/MODULE-1A/middleware/supplier-filter';

async function getSupplierHandler(req: AuthenticatedRequest, supplierId: string) {
  // Check permission
  const canView = await canUserViewSupplier(req.user.id, supplierId);
  if (!canView) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Fetch supplier (RLS will also enforce)
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export const GET = (req, { params }) =>
  withApiAuth((req) => getSupplierHandler(req, params.supplierId))(req);
```

**app/api/suppliers/access-summary/route.ts**:
```typescript
import { withApiAuth } from '@/MODULE-0A/middleware/api-auth';
import { getUserSupplierAccessSummary } from '@/MODULE-1A/middleware/supplier-filter';

async function getAccessSummaryHandler(req: AuthenticatedRequest) {
  const summary = await getUserSupplierAccessSummary(req.user.id);
  return NextResponse.json(summary);
}

export const GET = withApiAuth(getAccessSummaryHandler);
```

### Step 2: Update Suppliers Page

**app/app-dashboard/suppliers/page.tsx**:
```typescript
'use client';

import { useState } from 'react';
import { withPageAuth } from '@/MODULE-0A/middleware/page-auth';
import {
  useFilteredSuppliers,
  useIsFiltered,
  useActiveAccessRules
} from '@/MODULE-1A/hooks/use-filtered-suppliers';
import {
  SupplierFilterIndicator,
  NoAccessIndicator
} from '@/MODULE-1A/components/supplier-filter-indicator';

function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>();
  const [regionFilter, setRegionFilter] = useState<string>();

  const { data, isLoading, error } = useFilteredSuppliers({
    search,
    categoryId: categoryFilter,
    region: regionFilter,
  });

  const isFiltered = useIsFiltered();
  const accessRules = useActiveAccessRules();

  // No access case
  if (!isLoading && accessRules.length === 0 && isFiltered) {
    return <NoAccessIndicator />;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Suppliers</h1>

      {/* Filter Indicator */}
      {isFiltered && data && (
        <SupplierFilterIndicator
          accessRules={accessRules}
          totalCount={data.total}
        />
      )}

      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* Category and region filters */}
      </div>

      {/* Supplier List */}
      {isLoading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : (
        <SupplierTable suppliers={data?.suppliers || []} />
      )}
    </div>
  );
}

export default withPageAuth(SuppliersPage);
```

### Step 3: Replace Mock Data

In `middleware/supplier-filter.ts` and `hooks/use-filtered-suppliers.ts`, replace SKELETON mock data with real Supabase queries (see comments in files).

### Step 4: Test Access Rules

1. Create test users with different roles
2. Assign access rules via MODULE-0C team management
3. Log in as different users
4. Verify suppliers are filtered correctly
5. Check filter indicator shows correct information

---

## Dependencies

### Required (Must Exist):
- ✅ MODULE-0A: Auth enforcement (withApiAuth, withPageAuth)
- ✅ MODULE-0B: RBAC database (user_roles, supplier_access_rules tables)
- ✅ Supabase: suppliers table with category_id and region columns
- ✅ React Query (@tanstack/react-query)
- ✅ shadcn/ui components (Alert, Badge, Collapsible)

### Used By:
- Suppliers page (app/app-dashboard/suppliers)
- Quote request flows
- Any feature showing supplier lists

---

## Testing Checklist

### Database Tests
- [ ] user_roles table has data
- [ ] supplier_access_rules table has test data
- [ ] suppliers table has category_id and region columns
- [ ] RLS policies from MODULE-0B are active

### API Tests
- [ ] GET /api/suppliers returns filtered results
- [ ] Admin user sees all suppliers
- [ ] Non-admin sees only filtered suppliers
- [ ] Access summary endpoint works
- [ ] Supplier detail endpoint checks permissions

### UI Tests
- [ ] Filter indicator shows when appropriate
- [ ] Filter indicator hides for admins
- [ ] No access indicator shows for users with no rules
- [ ] Search respects access rules
- [ ] Category/region filters work
- [ ] Suppliers load correctly

### Access Rule Tests
- [ ] Category-only rule filters correctly
- [ ] Region-only rule filters correctly
- [ ] Combined rule (category + region) filters correctly
- [ ] Multiple rules work (OR logic)
- [ ] Empty rules = no access

---

## Known Limitations

1. **No Pagination UI**: Pagination params supported but UI not built
2. **No Saved Filters**: Users can't save common filter combinations
3. **No Filter History**: Recent filters not remembered
4. **No Export**: Can't export filtered supplier list
5. **No Bulk Actions**: Can't perform actions on filtered results

---

## Performance Considerations

- **RLS + Application Filtering**: Double filtering for security + UX
- **Query Indexes**: Ensure suppliers.category_id and suppliers.region indexed
- **React Query Cache**: 5 min stale time reduces API calls
- **Pagination**: Limit 100 suppliers per request by default

---

## Security Considerations

### Strengths
✅ **Double Filtering**: RLS policies + application logic
✅ **Server-side Enforcement**: Filtering happens on server
✅ **Permission Checks**: canUserViewSupplier before showing details
✅ **Admin Bypass**: Admins properly bypass filters

### Recommendations
1. Always check permissions server-side (never trust client)
2. Log access attempts for audit trail
3. Rate limit supplier API endpoints
4. Monitor for suspicious access patterns

---

## Summary

**MODULE-1A Status**: ✅ **SKELETON COMPLETE**

- **Middleware**: Complete, needs Supabase queries
- **Hooks**: Complete, needs API integration
- **Components**: Complete, production-ready
- **Utils**: Complete, ready to use

**Files**: 5 files, ~1,130 lines total
**Estimated Integration Time**: 3-4 hours
**Complexity**: Medium
**Resumable**: Yes

**Ready for**: Integration with existing suppliers page and API routes
