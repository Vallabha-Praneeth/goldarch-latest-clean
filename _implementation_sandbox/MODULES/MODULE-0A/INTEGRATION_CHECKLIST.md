# MODULE-0A Integration Checklist

Use this checklist when integrating MODULE-0A into the main application.

## Pre-Integration

- [ ] MODULE-0B (RBAC Schema) is complete
- [ ] user_roles table exists in database
- [ ] Supabase environment variables configured
- [ ] Service role key available (for server-side validation)

## Implementation Steps

### 1. Complete Session Validation Logic
- [ ] Implement validateSessionToken() in session-validator.ts
- [ ] Test with valid Supabase tokens
- [ ] Test with invalid/expired tokens
- [ ] Add error logging

### 2. Complete API Auth Middleware
- [ ] Implement token extraction from headers
- [ ] Implement role fetching from user_roles table
- [ ] Test with protected API route
- [ ] Verify 401/403 responses

### 3. Complete Page Auth Guards
- [ ] Connect to actual useAuth() hook
- [ ] Implement role fetching in useUserRole()
- [ ] Test page redirects
- [ ] Test role-based page access

### 4. Apply to Existing Routes
- [ ] Wrap all /api/suppliers/* routes
- [ ] Wrap all /api/projects/* routes
- [ ] Wrap all /api/quotes/* routes
- [ ] Wrap all /api/documents/* routes
- [ ] Wrap new /api/team/* routes

### 5. Apply to Pages
- [ ] Protect /app-dashboard/team page
- [ ] Add role checks to admin actions
- [ ] Test with different user roles

## Testing

### API Routes
- [ ] Unauthenticated request returns 401
- [ ] Authenticated request succeeds
- [ ] Wrong role returns 403
- [ ] Valid admin access succeeds

### Pages
- [ ] Logged out user redirects to /auth
- [ ] Logged in user sees content
- [ ] Wrong role shows error or redirects
- [ ] Admin sees all content

### Edge Cases
- [ ] Expired token triggers refresh
- [ ] Invalid token returns error
- [ ] Missing role returns error
- [ ] Network failure handles gracefully

## Performance Checks

- [ ] Session validation cached appropriately
- [ ] Role queries not excessive
- [ ] No N+1 query issues
- [ ] API response times acceptable

## Security Audit

- [ ] Service role key not exposed to client
- [ ] Tokens validated server-side
- [ ] No auth bypass possible
- [ ] Error messages don't leak info

## Rollback Plan

If issues occur:
1. Remove withApiAuth() wrappers (routes become open again)
2. Remove withPageAuth() wrappers (pages become open again)
3. Original auth flow remains intact
4. No data loss or corruption

## Sign-off

- [ ] Developer tested locally
- [ ] Code reviewed
- [ ] Security reviewed
- [ ] Integration tested
- [ ] Ready for deployment

---

**Module**: MODULE-0A
**Status**: Skeleton - needs implementation
**Estimated Implementation Time**: 2-3 days
