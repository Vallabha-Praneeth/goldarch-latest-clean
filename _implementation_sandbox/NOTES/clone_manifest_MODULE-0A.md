# Clone Manifest: MODULE-0A (Auth Enforcement Layer)

**Module Purpose**: Systematically enforce authentication on all routes and APIs
**Implementation Order**: 1st
**Phase**: 0 (Foundation)

---

## Files to Clone

### 1. Authentication Provider
**Source**: `lib/auth-provider.tsx`
**Destination**: `_implementation_sandbox/CLONED/lib/auth-provider.tsx`
**Reason**: Need to understand existing auth context structure to create compatible middleware
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 2. Supabase Client
**Source**: `lib/supabase-client.ts`
**Destination**: `_implementation_sandbox/CLONED/lib/supabase-client.ts`
**Reason**: Need to understand how Supabase client is configured for session checks
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 3. Dashboard Layout (for page guard pattern)
**Source**: `app/app-dashboard/layout.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/layout.tsx`
**Reason**: Study existing auth check pattern in layout (useEffect with router.push)
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 4. Sample API Route (for middleware pattern)
**Source**: `app/api/framework-b/health/route.ts`
**Destination**: `_implementation_sandbox/CLONED/app/api/framework-b/health/route.ts`
**Reason**: Understand existing API route structure to create compatible auth wrapper
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 5. Auth Page (for redirect pattern)
**Source**: `app/auth/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/auth/page.tsx`
**Reason**: Understand auth flow and redirect behavior
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- Any existing middleware (none exists yet)
- Component files (not needed for auth enforcement)
- UI components (not needed)

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-0A/`:

1. **`middleware/api-auth.ts`**
   - New auth wrapper for API routes
   - Will validate Supabase session
   - Will return 401 if unauthorized

2. **`middleware/page-auth.ts`**
   - New page guard wrapper
   - Will redirect to /auth if no session
   - Reusable across protected pages

3. **`utils/session-validator.ts`**
   - Session validation utilities
   - Token verification helpers
   - Session refresh logic (skeleton)

4. **`README.md`**
   - Integration instructions
   - How to apply middleware to routes
   - Testing guidelines

---

## Integration Strategy

**Cloned files are READ-ONLY references**. New middleware will:
- Be compatible with existing auth-provider pattern
- Use existing supabase-client methods
- Not require modifications to cloned files
- Be drop-in wrappers for existing routes

---

## Verification After Clone

- [ ] All 5 files cloned successfully
- [ ] Directory structure preserved
- [ ] Files are read-only (no edits)
- [ ] Can reference auth patterns from cloned files

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~350 lines total
