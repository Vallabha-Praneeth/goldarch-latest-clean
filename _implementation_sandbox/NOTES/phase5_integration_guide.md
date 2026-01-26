# PHASE 5: Integration Guide

**Document**: Step-by-Step Integration Instructions
**Date**: 2026-01-09
**Audience**: Development team integrating modules into main codebase

---

## Overview

This guide provides detailed instructions for integrating 6 completed modules from `_implementation_sandbox/MODULES/` into the main goldarch_web_copy application.

**Total Modules**: 6
**Total Files**: 37 implementation files
**Estimated Integration Time**: 8-12 hours (spread over 2-3 days)

---

## Prerequisites

Before starting integration, ensure you have:

- [x] Access to Supabase project
- [x] Database admin permissions
- [x] Local development environment running
- [x] Git branch for integration work
- [x] Backup of current database (recommended)

---

## Integration Order (Critical)

**MUST follow this order due to dependencies**:

1. **MODULE-0B** - Database schema (CRITICAL PATH)
2. **MODULE-0A** - Auth enforcement
3. **MODULE-0C** - Team management
4. **MODULE-1A** - Supplier filtering
5. **MODULE-1C** - Quote approval
6. **MODULE-1B** - Search/filter UI (anytime)

---

## MODULE-0B: RBAC Schema & Database

**Priority**: CRITICAL PATH - All other modules depend on this
**Time Estimate**: 1-2 hours
**Risk Level**: Medium (database changes)

### Step 1: Review SQL Files

Review all SQL files before execution:

```bash
ls _implementation_sandbox/MODULES/MODULE-0B/schema/
ls _implementation_sandbox/MODULES/MODULE-0B/policies/
ls _implementation_sandbox/MODULES/MODULE-0B/functions/
```

Files to review:
- `schema/user_roles.sql` - User roles table
- `schema/access_rules.sql` - Access rules table
- `policies/rls_policies.sql` - Row-Level Security policies
- `functions/rbac_functions.sql` - Helper functions

### Step 2: Backup Database

```bash
# Export current schema
npx supabase db dump --schema public > backup_$(date +%Y%m%d).sql
```

### Step 3: Execute SQL in Supabase

**Option A: Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Execute files in this order:
   - `schema/user_roles.sql`
   - `schema/access_rules.sql`
   - `functions/rbac_functions.sql`
   - `policies/rls_policies.sql`

**Option B: CLI**

```bash
# If using Supabase CLI
npx supabase db execute --file _implementation_sandbox/MODULES/MODULE-0B/schema/user_roles.sql
npx supabase db execute --file _implementation_sandbox/MODULES/MODULE-0B/schema/access_rules.sql
npx supabase db execute --file _implementation_sandbox/MODULES/MODULE-0B/functions/rbac_functions.sql
npx supabase db execute --file _implementation_sandbox/MODULES/MODULE-0B/policies/rls_policies.sql
```

### Step 4: Verify Database Changes

Run verification queries:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_roles', 'access_rules');

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'access_rules');

-- Check functions created
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%_role%' OR routine_name LIKE '%_admin%';
```

### Step 5: Copy TypeScript Files

```bash
# Copy types
cp _implementation_sandbox/MODULES/MODULE-0B/types/rbac.types.ts lib/types/
cp _implementation_sandbox/MODULES/MODULE-0B/constants/role-permissions.ts lib/constants/
```

### Step 6: Seed Initial Admin User

```sql
-- Replace with your user ID
INSERT INTO user_roles (user_id, role, notes)
VALUES
  ('YOUR_USER_ID_HERE', 'Admin', 'Initial admin user')
ON CONFLICT (user_id) DO UPDATE SET role = 'Admin';
```

Find your user ID:
```sql
SELECT id, email FROM auth.users;
```

### Step 7: Test Database

```bash
# Run test queries
node _implementation_sandbox/MODULES/MODULE-0B/test-rbac.js
```

Or manually test:
```sql
-- Test helper functions
SELECT is_admin('YOUR_USER_ID');
SELECT has_role('YOUR_USER_ID', 'Admin');
SELECT user_can_view_supplier('YOUR_USER_ID', 'SUPPLIER_ID');
```

### Rollback Plan

If issues occur:
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

**MODULE-0B Integration Complete** ✅

---

## MODULE-0A: Auth Enforcement Layer

**Priority**: HIGH - Blocks MODULE-0C, MODULE-1A, MODULE-1C
**Time Estimate**: 1-2 hours
**Risk Level**: Low (no database changes)

### Step 1: Copy Files

```bash
# Create directories if needed
mkdir -p lib/middleware
mkdir -p lib/hooks
mkdir -p components/auth

# Copy middleware
cp _implementation_sandbox/MODULES/MODULE-0A/middleware/api-auth.ts lib/middleware/
cp _implementation_sandbox/MODULES/MODULE-0A/middleware/page-auth.ts lib/middleware/

# Copy hooks
cp _implementation_sandbox/MODULES/MODULE-0A/hooks/use-auth-user.ts lib/hooks/
cp _implementation_sandbox/MODULES/MODULE-0A/hooks/use-has-role.ts lib/hooks/

# Copy components
cp _implementation_sandbox/MODULES/MODULE-0A/components/auth-guard.tsx components/auth/
```

### Step 2: Update Imports

Update import paths in copied files to match your project structure:

```typescript
// Example: api-auth.ts
import { createClient } from '@/lib/supabase-client';
import type { UserRole } from '@/lib/types/rbac.types';
```

### Step 3: Replace Mock Authentication

**In `lib/middleware/api-auth.ts`**:

Find the mock authentication block:
```typescript
// SKELETON: Mock user
const mockUser = {
  id: 'user-id-placeholder',
  email: 'user@example.com',
  role: 'Admin',
};
```

Replace with real Supabase auth:
```typescript
// Get Supabase session
const supabase = createClient();
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError || !session) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

// Get user role from database
const { data: userRole, error: roleError } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', session.user.id)
  .single();

if (roleError || !userRole) {
  return NextResponse.json(
    { success: false, error: 'User role not found' },
    { status: 403 }
  );
}

// Attach user to request
req.user = {
  id: session.user.id,
  email: session.user.email || '',
  role: userRole.role,
};
```

**In `lib/middleware/page-auth.ts`**:

Replace mock user hook with real Supabase query.

### Step 4: Protect Existing API Routes

Update existing API routes to use auth middleware:

**Example: app/api/suppliers/route.ts**:
```typescript
import { withApiAuth } from '@/lib/middleware/api-auth';

async function getSuppliersHandler(req: AuthenticatedRequest) {
  // Your existing logic
  // Now has access to req.user
}

export const GET = withApiAuth(getSuppliersHandler);
```

### Step 5: Protect Existing Pages

Update page components:

**Example: app/app-dashboard/suppliers/page.tsx**:
```typescript
import { withPageAuth } from '@/lib/middleware/page-auth';

function SuppliersPage() {
  // Your existing component
}

export default withPageAuth(SuppliersPage);
```

### Step 6: Test Authentication

1. Log out and try accessing protected page → should redirect to login
2. Log in and access protected page → should work
3. Try API route without auth → should return 401
4. Try API route with auth → should work

**MODULE-0A Integration Complete** ✅

---

## MODULE-0C: Team Management UI

**Priority**: HIGH - User management essential
**Time Estimate**: 2-3 hours
**Risk Level**: Low

### Step 1: Copy Files

```bash
# Copy pages
mkdir -p app/app-dashboard/team
cp _implementation_sandbox/MODULES/MODULE-0C/pages/team-page.tsx app/app-dashboard/team/page.tsx

# Copy components
mkdir -p components/team
cp _implementation_sandbox/MODULES/MODULE-0C/components/*.tsx components/team/

# Copy hooks
cp _implementation_sandbox/MODULES/MODULE-0C/hooks/use-team-management.ts lib/hooks/

# Copy utilities
cp _implementation_sandbox/MODULES/MODULE-0C/utils/team-utils.ts lib/utils/
```

### Step 2: Create API Routes

**app/api/team/route.ts**:
```typescript
import { withApiAuth } from '@/lib/middleware/api-auth';
import { getTeamMembersHandler } from '@/lib/api/team-routes';

export const GET = withApiAuth(getTeamMembersHandler);
```

Create similar routes for:
- `app/api/team/invite/route.ts`
- `app/api/team/[userId]/role/route.ts`
- `app/api/team/[userId]/access/route.ts`

Copy handlers from `MODULE-0C/api/team-routes.ts`.

### Step 3: Replace Mock Data

In `lib/hooks/use-team-management.ts`, replace mock API calls with real fetch:

```typescript
// Before (mock):
const mockTeamMembers = [/* mock data */];
return mockTeamMembers;

// After (real):
const response = await fetch('/api/team');
if (!response.ok) throw new Error('Failed to fetch team');
return response.json();
```

### Step 4: Configure Supabase Service Role

For invite functionality, add service role key:

**.env.local**:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get this from Supabase Dashboard → Settings → API.

### Step 5: Add Navigation Link

Add team link to dashboard sidebar:

**app/app-dashboard/layout.tsx**:
```typescript
<NavLink href="/app-dashboard/team" icon={Users}>
  Team
</NavLink>
```

### Step 6: Test Team Management

1. Navigate to /app-dashboard/team
2. Test invite user
3. Test change role
4. Test manage access rules
5. Verify email invitation sent

**MODULE-0C Integration Complete** ✅

---

## MODULE-1A: Supplier Access Filtering

**Priority**: HIGH - Core supplier visibility feature
**Time Estimate**: 2-3 hours
**Risk Level**: Medium (changes supplier queries)

### Step 1: Copy Files

```bash
# Copy middleware
cp _implementation_sandbox/MODULES/MODULE-1A/middleware/supplier-filter.ts lib/middleware/

# Copy hooks
cp _implementation_sandbox/MODULES/MODULE-1A/hooks/use-filtered-suppliers.ts lib/hooks/

# Copy components
mkdir -p components/suppliers
cp _implementation_sandbox/MODULES/MODULE-1A/components/supplier-filter-indicator.tsx components/suppliers/

# Copy utilities
cp _implementation_sandbox/MODULES/MODULE-1A/utils/filter-utils.ts lib/utils/
```

### Step 2: Replace Mock Functions

In `lib/middleware/supplier-filter.ts`, replace mock functions:

```typescript
// Replace getUserAccessRules
async function getUserAccessRules(userId: string) {
  const { data, error } = await supabase
    .from('access_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) throw error;
  return data || [];
}

// Replace isUserAdmin
async function isUserAdmin(userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return data?.role === 'Admin';
}
```

### Step 3: Update Suppliers API

**app/api/suppliers/route.ts**:
```typescript
import { withApiAuth } from '@/lib/middleware/api-auth';
import { buildFilteredSupplierQuery } from '@/lib/middleware/supplier-filter';

async function getSuppliersHandler(req: AuthenticatedRequest) {
  const { query, isFiltered, accessRules } = await buildFilteredSupplierQuery(
    req.user.id,
    {
      category: req.nextUrl.searchParams.get('category') || undefined,
      region: req.nextUrl.searchParams.get('region') || undefined,
    }
  );

  const { data, error, count } = await query;
  if (error) throw error;

  return NextResponse.json({
    data,
    count,
    isFiltered,
    accessRules,
  });
}

export const GET = withApiAuth(getSuppliersHandler);
```

### Step 4: Update Suppliers Page

**app/app-dashboard/suppliers/page.tsx**:
```typescript
import { useFilteredSuppliers } from '@/lib/hooks/use-filtered-suppliers';
import { SupplierFilterIndicator } from '@/components/suppliers/supplier-filter-indicator';

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useFilteredSuppliers();
  const { isFiltered, activeAccessRules } = useIsFiltered();

  return (
    <div>
      {isFiltered && (
        <SupplierFilterIndicator
          accessRules={activeAccessRules}
          totalCount={suppliers?.length || 0}
        />
      )}

      {/* Your existing supplier table */}
    </div>
  );
}
```

### Step 5: Test Filtering

1. Log in as Admin → should see all suppliers
2. Log in as Procurement with access rules → should see filtered suppliers
3. Log in as user with no access rules → should see no suppliers
4. Filter indicator should show for non-admins

**MODULE-1A Integration Complete** ✅

---

## MODULE-1C: Quote Approval Workflow

**Priority**: HIGH - Core quote management feature
**Time Estimate**: 2-3 hours
**Risk Level**: Medium (database changes)

### Step 1: Update Database Schema

Run SQL to add approval columns to quotes table:

```sql
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'accepted', 'declined'));

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
```

### Step 2: Copy Files

```bash
# Copy types
cp _implementation_sandbox/MODULES/MODULE-1C/types/quote-approval.types.ts lib/types/

# Copy components
mkdir -p components/quotes
cp _implementation_sandbox/MODULES/MODULE-1C/components/*.tsx components/quotes/

# Copy hooks
cp _implementation_sandbox/MODULES/MODULE-1C/hooks/use-quote-approval.ts lib/hooks/
```

### Step 3: Create API Routes

Create these API routes:
- `app/api/quotes/route.ts` - List quotes
- `app/api/quotes/[quoteId]/route.ts` - Get quote details
- `app/api/quotes/[quoteId]/submit/route.ts` - Submit for approval
- `app/api/quotes/[quoteId]/approve/route.ts` - Approve quote
- `app/api/quotes/[quoteId]/reject/route.ts` - Reject quote

Example **app/api/quotes/[quoteId]/approve/route.ts**:
```typescript
import { withApiAuth } from '@/lib/middleware/api-auth';
import { approveQuoteHandler } from '@/lib/api/quote-approval-routes';

export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  return withApiAuth((req) => approveQuoteHandler(req, params.quoteId))(req);
}
```

### Step 4: Replace Mock Data

In `lib/hooks/use-quote-approval.ts`, replace mockApiClient with real fetch calls.

### Step 5: Update Quotes Page

**app/app-dashboard/quotes/page.tsx**:
```typescript
import { useQuotes, usePendingQuotes } from '@/lib/hooks/use-quote-approval';
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge';
import { QuoteApprovalDialog } from '@/components/quotes/quote-approval-dialog';
import { canPerformAction } from '@/lib/types/quote-approval.types';

export default function QuotesPage() {
  const { data: quotes } = useQuotes();
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    quote: null,
    action: null,
  });

  return (
    <div>
      <Table>
        {quotes?.map(quote => (
          <TableRow key={quote.id}>
            <TableCell>{quote.title}</TableCell>
            <TableCell>
              <QuoteStatusBadge status={quote.status} />
            </TableCell>
            <TableCell>
              {canPerformAction(userRole, 'approve', quote.status) && (
                <Button onClick={() => setApprovalDialog({
                  open: true,
                  quote,
                  action: 'approve'
                })}>
                  Approve
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <QuoteApprovalDialog
        {...approvalDialog}
        onOpenChange={(open) => setApprovalDialog(prev => ({ ...prev, open }))}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
```

### Step 6: Add Manager Dashboard Widget

**app/app-dashboard/page.tsx**:
```typescript
import { usePendingQuotes } from '@/lib/hooks/use-quote-approval';

const { data: pendingQuotes } = usePendingQuotes();

<Card>
  <CardHeader>
    <CardTitle>Pending Approvals</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {pendingQuotes?.length || 0}
    </div>
  </CardContent>
</Card>
```

### Step 7: Test Workflow

1. Create quote as Procurement → status = draft
2. Submit quote → status = pending
3. Approve as Manager → status = approved
4. Accept as Procurement → status = accepted
5. Test rejection flow
6. Verify status badges display correctly

**MODULE-1C Integration Complete** ✅

---

## MODULE-1B: Enhanced Search & Filters

**Priority**: MEDIUM - UI enhancement
**Time Estimate**: 1-2 hours per page
**Risk Level**: Low (no database changes, UI only)

### Step 1: Copy Files

```bash
# Copy components
cp _implementation_sandbox/MODULES/MODULE-1B/components/*.tsx components/

# Copy hooks
cp _implementation_sandbox/MODULES/MODULE-1B/hooks/use-search-filters.ts lib/hooks/

# Copy utilities
cp _implementation_sandbox/MODULES/MODULE-1B/utils/search-query-builder.ts lib/utils/
```

### Step 2: Add to Suppliers Page (Example)

**app/app-dashboard/suppliers/page.tsx**:
```typescript
import { useSearchFilters } from '@/lib/hooks/use-search-filters';
import { SearchBar } from '@/components/search-bar';
import { FilterPanel } from '@/components/filter-panel';
import { SortDropdown } from '@/components/sort-dropdown';
import { buildSupabaseQuery } from '@/lib/utils/search-query-builder';

export default function SuppliersPage() {
  const searchFilters = useSearchFilters({
    initialFilters: { status: null, category: [] },
    initialSort: { field: 'name', direction: 'asc' },
    syncWithUrl: true,
  });

  const filterFields = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name', defaultDirection: 'asc' as const },
    { value: 'created_at', label: 'Date Added', defaultDirection: 'desc' as const },
  ];

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchFilters.state],
    queryFn: async () => {
      const supabase = createClient();
      const query = buildSupabaseQuery(
        supabase.from('suppliers').select('*'),
        searchFilters.state,
        {
          search: {
            searchFields: ['name', 'contact_name', 'contact_email'],
          },
        }
      );
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SearchBar
          value={searchFilters.query}
          onChange={searchFilters.setQuery}
          placeholder="Search suppliers..."
          className="flex-1"
        />
        <FilterPanel
          fields={filterFields}
          values={searchFilters.filters}
          onApply={searchFilters.setFilters}
          onReset={searchFilters.resetFilters}
        />
        <SortDropdown
          options={sortOptions}
          value={searchFilters.sort}
          onChange={searchFilters.setSort}
          compact
        />
      </div>

      {searchFilters.hasAnyActive && (
        <Button variant="ghost" onClick={searchFilters.resetAll}>
          Clear all filters
        </Button>
      )}

      {/* Your existing supplier table */}
    </div>
  );
}
```

### Step 3: Repeat for Other Pages

Apply the same pattern to:
- Quotes page
- Projects page
- Tasks page
- Deals page
- Activities page

### Step 4: Test Search/Filter/Sort

1. Search suppliers by name → should filter results
2. Apply status filter → should filter results
3. Sort by name → should sort results
4. Combine search + filter + sort → should work together
5. Clear all → should reset to original state
6. URL should update as you change filters
7. Refresh page → filters should persist from URL

**MODULE-1B Integration Complete** ✅

---

## Post-Integration Checklist

After integrating all modules:

- [ ] All database migrations run successfully
- [ ] All API routes working
- [ ] All pages rendering correctly
- [ ] Authentication working on all routes
- [ ] Role-based access control enforced
- [ ] Team management functional
- [ ] Supplier filtering working
- [ ] Quote approval workflow functional
- [ ] Search/filter/sort working on all pages
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds (`npm run build`)
- [ ] All tests passing (if tests exist)

---

## Troubleshooting

### Database Issues

**Error: "relation does not exist"**
- Check if SQL files were executed in correct order
- Verify tables created: `\dt` in psql

**Error: "RLS policy violation"**
- Check if RLS policies were created
- Verify user has role in user_roles table
- Check if helper functions exist

### Authentication Issues

**Error: "Unauthorized" on API calls**
- Check if Supabase session is valid
- Verify API route wrapped with withApiAuth
- Check if user_roles table has entry for user

### Import Errors

**Error: "Module not found"**
- Update import paths to match your project structure
- Check tsconfig.json paths configuration
- Verify files copied to correct locations

### Type Errors

**Error: "Property does not exist on type"**
- Check if type files copied
- Verify imports in components
- Run `npm run type-check`

---

## Rollback Procedures

If integration fails, rollback by:

1. **Database**: Restore from backup
```bash
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

2. **Code**: Revert Git commits
```bash
git reset --hard HEAD~1
# Or revert specific files
git checkout HEAD~1 -- path/to/file
```

3. **Modules**: Delete copied files
```bash
# Remove specific module files
rm -rf components/team
rm -rf lib/middleware/supplier-filter.ts
# etc.
```

---

## Support & Next Steps

After successful integration:

1. **Test thoroughly** in staging environment
2. **Document any customizations** made during integration
3. **Train team** on new features (team management, quote approval)
4. **Monitor** for errors in production
5. **Gather feedback** from users
6. **Plan** for future enhancements (see module READMEs for ideas)

---

**Integration Guide Complete**

Follow this guide step-by-step for smooth integration. Test each module thoroughly before moving to the next. Good luck!
