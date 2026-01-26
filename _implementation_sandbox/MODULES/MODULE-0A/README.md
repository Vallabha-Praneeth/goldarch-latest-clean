# MODULE-0A: Auth Enforcement Layer

**Status**: ⚠️ SKELETON IMPLEMENTATION
**Phase**: 0 (Foundation)
**Priority**: CRITICAL
**Implementation Order**: 1st (must complete before other modules)

---

## Purpose

Systematically enforce authentication on all routes and APIs to prevent unauthorized access. This module provides middleware and utilities to protect API endpoints and pages without modifying existing auth infrastructure.

---

## What This Module Does

1. **API Route Protection**: Wraps API routes to enforce authentication
2. **Page Guards**: Protects pages from unauthenticated access
3. **Session Validation**: Validates Supabase session tokens
4. **Role Checking**: Verifies user roles (integrates with MODULE-0B)

---

## Files in This Module

```
MODULE-0A/
├── middleware/
│   ├── api-auth.ts          # API route authentication wrapper
│   └── page-auth.ts         # Page-level authentication guard
├── utils/
│   └── session-validator.ts # Session validation utilities
└── README.md                # This file
```

---

## Current Status: SKELETON

This module contains **structure and interfaces only**. Key characteristics:

- ✅ Type definitions complete
- ✅ Function signatures defined
- ✅ Integration examples provided
- ⚠️ Logic is placeholder/mock only
- ⚠️ No actual authentication checks
- ⚠️ No database queries
- ❌ Not production-ready

**Next Steps**: Implement actual authentication logic using Supabase client.

---

## Dependencies

### Required (Already Exist):
- ✅ `lib/auth-provider.tsx` - Existing auth context
- ✅ `lib/supabase-client.ts` - Supabase client
- ✅ Supabase Auth service

### Required (To Be Built):
- ⏳ MODULE-0B (RBAC Schema) - For role checking
- ⏳ `user_roles` table - Stores user role assignments

### Optional:
- Environment variables for Supabase (already configured)

---

## Integration Guide

### 1. Protect API Routes

```typescript
// app/api/suppliers/route.ts
import { withApiAuth } from '@/modules/MODULE-0A/middleware/api-auth';

export const GET = withApiAuth(async (req) => {
  // req.user is available here
  const userId = req.user?.id;

  // Your logic
  const { data } = await supabase
    .from('suppliers')
    .select('*');

  return NextResponse.json({ data });
});

// With role requirement
export const DELETE = withApiAuth(async (req) => {
  // Only admins can delete
  // ...
}, { requiredRole: 'Admin' });
```

### 2. Protect Pages

```typescript
// app/app-dashboard/team/page.tsx
import { withPageAuth } from '@/modules/MODULE-0A/middleware/page-auth';

function TeamPage() {
  return <div>Team Management</div>;
}

// Protect entire page
export default withPageAuth(TeamPage, {
  requiredRole: 'Admin'
});

// Or use AuthGuard component
import { AuthGuard } from '@/modules/MODULE-0A/middleware/page-auth';

export default function TeamPage() {
  return (
    <AuthGuard requiredRole="Admin">
      <div>Team Management</div>
    </AuthGuard>
  );
}
```

### 3. Check Roles in Components

```typescript
import { useHasRole } from '@/modules/MODULE-0A/middleware/page-auth';

function MyComponent() {
  const isAdmin = useHasRole('Admin');

  return (
    <div>
      {isAdmin && <button>Admin Only Action</button>}
    </div>
  );
}
```

### 4. Validate Sessions Manually

```typescript
import { validateRequest } from '@/modules/MODULE-0A/utils/session-validator';

export async function POST(req: NextRequest) {
  const result = await validateRequest(req);

  if (!result.isValid) {
    return NextResponse.json(
      { error: result.error },
      { status: 401 }
    );
  }

  const userId = result.user?.id;
  // Your logic
}
```

---

## How to Complete This Module

This module is currently a **skeleton**. To make it production-ready:

### Step 1: Implement Session Validation

**File**: `utils/session-validator.ts`

Replace mock logic with actual Supabase calls:

```typescript
// TODO: Replace in validateSessionToken()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side
);

const { data, error } = await supabase.auth.getUser(token);

if (error || !data.user) {
  return {
    isValid: false,
    user: null,
    session: null,
    error: error?.message || 'Invalid token',
  };
}

return {
  isValid: true,
  user: data.user,
  session: null, // Construct from user data
  error: null,
};
```

### Step 2: Implement Role Checking

**File**: `middleware/api-auth.ts`

Add role fetching logic:

```typescript
// TODO: Add after user validation
if (requiredRole) {
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', req.user.id)
    .single();

  if (!userRole || userRole.role !== requiredRole) {
    return forbidden('Insufficient permissions');
  }
}
```

### Step 3: Implement Page Guards

**File**: `middleware/page-auth.ts`

Connect to actual auth context:

```typescript
// TODO: Import and use actual useAuth
import { useAuth } from '@/lib/auth-provider';

export function AuthGuard({ children, ... }) {
  const { user, loading } = useAuth(); // Use real hook
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return <LoadingComponent />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

### Step 4: Add Role Fetching Hook

**File**: `middleware/page-auth.ts`

Create hook to fetch user role:

```typescript
// TODO: Add this hook
export function useUserRole() {
  const { user } = useAuth();
  const { data: roleData } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return data?.role || null;
    },
    enabled: !!user?.id,
  });

  return roleData;
}
```

---

## Testing Checklist

After implementing full logic, verify:

- [ ] API routes return 401 for unauthenticated requests
- [ ] API routes return 403 for insufficient permissions
- [ ] Pages redirect to /auth when not logged in
- [ ] Pages check role requirements correctly
- [ ] Session validation works with valid tokens
- [ ] Session validation rejects invalid tokens
- [ ] Session refresh works when expired
- [ ] Role checking integrates with user_roles table
- [ ] useHasRole hook returns correct values
- [ ] No performance issues (consider caching)

---

## Integration Points

### Where to Apply This Module

1. **All API Routes in** `app/api/*`:
   - `/api/suppliers/*` - Protect supplier endpoints
   - `/api/projects/*` - Protect project endpoints
   - `/api/quotes/*` - Protect quote endpoints
   - `/api/documents/*` - Protect document endpoints
   - `/api/team/*` - Protect team management endpoints

2. **Protected Pages**:
   - `/app-dashboard/team` - Admin only
   - `/app-dashboard/suppliers` - All authenticated users
   - `/app-dashboard/projects` - All authenticated users
   - Any new admin pages

3. **Role-Specific Actions**:
   - Delete buttons - Admin only
   - Approve quotes - Manager or Admin
   - View all suppliers - Admin (others see filtered)

---

## Constraints & Non-Negotiables

- ⚠️ **DO NOT** modify existing `lib/auth-provider.tsx`
- ⚠️ **DO NOT** change existing auth flow in `app/auth/page.tsx`
- ⚠️ **DO NOT** break existing routes (wrap, don't replace)
- ✅ **DO** reuse existing Supabase client
- ✅ **DO** integrate with existing AuthProvider
- ✅ **DO** maintain backward compatibility

---

## Performance Considerations

1. **Cache user roles**: Don't fetch role on every request
2. **Use service role**: For server-side token validation
3. **Minimize DB queries**: Batch role checks where possible
4. **Session caching**: Cache validated sessions (short TTL)

---

## Security Notes

- Always validate tokens server-side for API routes
- Never trust client-side auth state for sensitive operations
- Use service role key only on server (never expose to client)
- Implement rate limiting on auth endpoints (future enhancement)
- Log failed auth attempts for audit trail

---

## Known Limitations (Skeleton)

- Session validation is mocked (always returns valid)
- Role checking is mocked (always returns Admin)
- No actual database queries
- No error handling
- No logging
- No caching
- No rate limiting

---

## Next Module

After completing MODULE-0A, proceed to:
**MODULE-0B: RBAC Schema & Database**

MODULE-0B provides the `user_roles` table and permissions schema that MODULE-0A depends on for role checking.

---

## Questions & Issues

If you encounter issues or need clarification:

1. Check `CLONED/lib/auth-provider.tsx` for existing patterns
2. Review Supabase docs for auth.getUser() usage
3. Consult MODULE-0B README for role schema
4. Test with existing auth flow in `/auth` page

---

**Last Updated**: PHASE 4 (MODULE-0A skeleton creation)
**Next Steps**: Implement actual authentication logic
**Estimated Effort**: 2-3 days for full implementation
**Resumable**: Yes - Each file can be completed independently
