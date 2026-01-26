# Clone Manifest: MODULE-1A (Supplier Access Filtering)

**Module Purpose**: Implement per-user supplier visibility based on category/region
**Implementation Order**: 4th
**Phase**: 1 (Supplier Management)

---

## Files to Clone

### 1. Suppliers Page (main component to extend)
**Source**: `app/app-dashboard/suppliers/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/suppliers/page.tsx`
**Reason**: Need to understand existing query and filter logic to add user-based filtering
**Will Change**: YES - Will be modified to apply supplier access rules
**Will NOT Change**: UI structure, layout pattern, existing functionality

### 2. Supabase Client
**Source**: `lib/supabase-client.ts`
**Destination**: `_implementation_sandbox/CLONED/lib/supabase-client.ts`
**Reason**: Understand query patterns to add filtering
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 3. Auth Provider (for user context)
**Source**: `lib/auth-provider.tsx`
**Destination**: `_implementation_sandbox/CLONED/lib/auth-provider.tsx`
**Reason**: Get current user ID for filtering queries
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 4. Supabase Types (for type safety)
**Source**: `lib/supabase-types.ts`
**Destination**: `_implementation_sandbox/CLONED/lib/supabase-types.ts`
**Reason**: Understand supplier schema to add filtering logic
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- Other page files (not needed)
- UI components (already have from MODULE-0C)
- Unrelated API routes

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-1A/`:

1. **`utils/supplier-filter.ts`**
   - Function: `getSupplierAccessRules(userId: string)`
   - Function: `applySupplierFilter(query, userId: string)`
   - Fetches user's access rules from supplier_access_rules table
   - Modifies Supabase query to filter by category/region
   - Returns filtered query

2. **`utils/check-supplier-access.ts`**
   - Function: `canUserViewSupplier(userId, supplierId)`
   - Validates if user can access specific supplier
   - Used for detail page access control

3. **`components/supplier-access-dialog.tsx`**
   - Admin UI to assign supplier access to user
   - Multi-select for categories
   - Multi-select for regions (or text input)
   - Save button to create access rules

4. **`api/supplier-access-routes.ts`**
   - GET /api/admin/supplier-access?userId=xxx (get user's rules)
   - POST /api/admin/supplier-access (create rule)
   - DELETE /api/admin/supplier-access/:id (remove rule)
   - Skeleton only (structure, not full implementation)

5. **`hooks/use-supplier-access.ts`**
   - Custom hook: `useSupplierAccess(userId)`
   - Fetches and caches user's access rules
   - Returns: { categories, regions, isAdmin }

6. **`README.md`**
   - Integration instructions
   - How to modify suppliers page query
   - How to apply filtering
   - RLS policy requirements
   - Testing scenarios

---

## Integration Strategy

**Key Modification Points** in cloned suppliers/page.tsx:

### Current Query (lines 50-62):
```tsx
const { data: suppliers, isLoading } = useQuery({
  queryKey: ['suppliers'],
  queryFn: async () => {
    const { data } = await supabase
      .from('suppliers')
      .select(`
        *,
        category:categories(name)
      `)
      .order('name');
    return data || [];
  },
});
```

### Modified Query (with filtering):
```tsx
const { user } = useAuth();
const { data: suppliers, isLoading } = useQuery({
  queryKey: ['suppliers', user?.id],
  queryFn: async () => {
    let query = supabase
      .from('suppliers')
      .select(`
        *,
        category:categories(name)
      `);

    // Apply user-based filtering (NEW)
    query = await applySupplierFilter(query, user?.id);

    const { data } = await query.order('name');
    return data || [];
  },
});
```

**No other changes** to UI or layout required.

---

## Filtering Logic (Skeleton)

```typescript
// utils/supplier-filter.ts

export async function applySupplierFilter(
  query: any,
  userId: string | undefined
) {
  if (!userId) return query;

  // Check if user is admin (skip filtering)
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (userRole?.role === 'Admin') {
    return query; // No filtering for admin
  }

  // Get user's access rules
  const { data: rules } = await supabase
    .from('supplier_access_rules')
    .select('category_id, region')
    .eq('user_id', userId);

  if (!rules || rules.length === 0) {
    // No access rules = no suppliers visible
    return query.eq('id', '00000000-0000-0000-0000-000000000000'); // No results
  }

  // Apply category filter
  const categoryIds = rules
    .filter(r => r.category_id)
    .map(r => r.category_id);

  if (categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }

  // Apply region filter
  const regions = rules
    .filter(r => r.region)
    .map(r => r.region);

  if (regions.length > 0) {
    query = query.in('region', regions);
  }

  return query;
}
```

---

## Database Dependencies

Requires from MODULE-0B:
- `user_roles` table (for admin check)
- `supplier_access_rules` table (for filtering)

Assumes suppliers table has:
- `category_id` column (exists)
- `region` column (may need to add)

---

## Verification After Clone

- [ ] suppliers/page.tsx cloned successfully
- [ ] Existing query logic understood
- [ ] Can identify modification points
- [ ] No UI changes required (filtering is transparent)

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~450 lines total
