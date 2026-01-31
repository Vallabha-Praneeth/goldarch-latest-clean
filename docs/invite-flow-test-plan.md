# Organization Invite Flow - Manual Test Plan

**Date:** 2026-01-31  
**Implementation:** /api/send-invite + /api/accept-invite  
**Schema:** supabase/migrations/20260130000000_org_members_invites.sql

---

## Test Environment Setup

**Prerequisites:**
1. Supabase instance running (local or remote)
2. Migration `20260130000000_org_members_invites.sql` applied
3. At least 2 test users created in Supabase Auth
4. User 1: Member of an organization with role 'owner' or 'admin'
5. User 2: Not a member of that organization

**Database State Check:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_members', 'organization_invites');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('organizations', 'organization_members', 'organization_invites');
```

---

## Test Case 1: Unauthenticated Request (send-invite)

**Goal:** Verify authentication is required

**Steps:**
1. Make POST request to `/api/send-invite` without authentication
2. No session cookies, no Authorization header

**Expected Result:**
- HTTP Status: `401 Unauthorized`
- Response body: `{ "error": "unauthorized" }`

**DB State Change:** None (request rejected before DB access)

---

## Test Case 2: Unauthorized Request (send-invite)

**Goal:** Verify only org admin/owner can send invites

**Setup:**
- Authenticate as User 2 (not a member of test org)
- Or authenticate as User who is a 'viewer' role in org

**Steps:**
1. Authenticate as non-admin user
2. POST `/api/send-invite` with body:
   ```json
   {
     "orgId": "<test-org-id>",
     "to": "invitee@example.com",
     "role": "viewer"
   }
   ```

**Expected Result:**
- HTTP Status: `403 Forbidden`
- Response body: `{ "error": "forbidden" }`

**DB State Change:** None (rejected at authorization check)

---

## Test Case 3: Valid Invite Creation

**Goal:** Verify admin can create invite successfully

**Setup:**
- Authenticate as User 1 (owner/admin of test org)
- Target email: `invitee@example.com`

**Steps:**
1. Authenticate as org owner/admin
2. POST `/api/send-invite` with body:
   ```json
   {
     "orgId": "<test-org-id>",
     "to": "invitee@example.com",
     "role": "manager",
     "inviterName": "Test Admin"
   }
   ```

**Expected Result:**
- HTTP Status: `200 OK`
- Response body includes:
  ```json
  {
    "success": true,
    "inviteId": "<uuid>",
    "acceptUrl": "https://.../api/accept-invite?inviteId=<uuid>&token=<hex-token>",
    "data": { ... } // Resend email response
  }
  ```

**DB State Change:**
```sql
-- New row in organization_invites
SELECT id, org_id, email, role, token_hash, expires_at, used_at, created_by
FROM organization_invites
WHERE email = 'invitee@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Verify:**
- `email` = 'invitee@example.com'
- `role` = 'manager'
- `token_hash` is present (64-char hex string)
- `used_at` IS NULL
- `expires_at` ~= NOW() + 7 days
- `created_by` = User 1's ID

**Email Sent:** Check email to invitee@example.com contains accept link

---

## Test Case 4: Invalid Email Validation

**Goal:** Verify email validation prevents header injection

**Steps:**
1. Authenticate as org admin
2. POST `/api/send-invite` with malicious email:
   ```json
   {
     "orgId": "<test-org-id>",
     "to": "test@example.com\nBcc: hacker@evil.com",
     "role": "viewer"
   }
   ```

**Expected Result:**
- HTTP Status: `400 Bad Request`
- Response body: `{ "error": "Invalid recipient email" }`

**DB State Change:** None

---

## Test Case 5: Unauthenticated Accept

**Goal:** Verify accept requires authentication

**Steps:**
1. Get a valid invite token from Test Case 3
2. POST `/api/accept-invite` without authentication
   ```json
   {
     "token": "<valid-token-from-email>"
   }
   ```

**Expected Result:**
- HTTP Status: `401 Unauthorized`
- Response body: `{ "error": "Unauthorized" }`

**DB State Change:** None

---

## Test Case 6: Accept with Wrong Token

**Goal:** Verify token validation

**Steps:**
1. Authenticate as User 2 (invitee email matches)
2. POST `/api/accept-invite` with invalid token
   ```json
   {
     "token": "0000000000000000000000000000000000000000000000000000000000000000"
   }
   ```

**Expected Result:**
- HTTP Status: `404 Not Found`
- Response body: `{ "error": "Invite not found" }`

**DB State Change:** None

---

## Test Case 7: Accept with Email Mismatch

**Goal:** Verify invite email must match authenticated user

**Setup:**
- Invite sent to: `invitee@example.com`
- Authenticate as: `different-user@example.com`

**Steps:**
1. Authenticate as user with different email
2. POST `/api/accept-invite` with valid token
   ```json
   {
     "token": "<valid-token>"
   }
   ```

**Expected Result:**
- HTTP Status: `403 Forbidden`
- Response body: `{ "error": "Invite email does not match signed-in user" }`

**DB State Change:** None

---

## Test Case 8: Valid Accept (Happy Path)

**Goal:** Verify successful invite acceptance

**Setup:**
- Valid invite exists for `invitee@example.com`
- Authenticate as user with email `invitee@example.com` (User 2)

**Steps:**
1. Authenticate as User 2 (matching email)
2. POST `/api/accept-invite` with valid token
   ```json
   {
     "token": "<valid-token-from-email>"
   }
   ```

**Expected Result:**
- HTTP Status: `200 OK`
- Response body:
  ```json
  {
    "ok": true,
    "orgId": "<org-uuid>",
    "role": "manager"
  }
  ```

**DB State Changes:**

1. **organization_members:**
   ```sql
   SELECT org_id, user_id, role
   FROM organization_members
   WHERE user_id = '<user-2-id>' AND org_id = '<test-org-id>';
   ```
   - New row created with role 'manager'

2. **organization_invites:**
   ```sql
   SELECT used_at
   FROM organization_invites
   WHERE email = 'invitee@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - `used_at` now set to current timestamp (not NULL)

---

## Test Case 9: Duplicate Accept (Idempotency)

**Goal:** Verify re-accepting same invite is handled gracefully

**Steps:**
1. Use same token from Test Case 8
2. POST `/api/accept-invite` again
   ```json
   {
     "token": "<same-token>"
   }
   ```

**Expected Result:**
- HTTP Status: `409 Conflict`
- Response body: `{ "error": "Invite already used" }`

**DB State Change:** None (invite already marked used)

---

## Test Case 10: Expired Invite

**Goal:** Verify expired invites are rejected

**Setup:**
1. Create invite
2. Manually update DB to set `expires_at` to past date:
   ```sql
   UPDATE organization_invites
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE email = 'expired-test@example.com';
   ```

**Steps:**
1. Authenticate as user matching invite email
2. POST `/api/accept-invite` with token

**Expected Result:**
- HTTP Status: `410 Gone`
- Response body: `{ "error": "Invite expired" }`

**DB State Change:** None

---

## RLS Policy Verification

**Test:** Ensure RLS policies enforce at DB level (defense-in-depth)

**Using psql or Supabase SQL Editor:**

1. **Test: Non-admin cannot insert invite**
   ```sql
   SET request.jwt.claims = '{"sub": "<user-2-id>", "role": "authenticated"}';
   
   INSERT INTO organization_invites (org_id, email, role, token_hash)
   VALUES ('<org-id>', 'test@example.com', 'viewer', 'fake-hash');
   ```
   **Expected:** Error (policy `org_invites_insert_admin_owner` blocks)

2. **Test: Invitee can insert membership via valid invite**
   ```sql
   SET request.jwt.claims = '{"sub": "<user-2-id>", "email": "invitee@example.com", "role": "authenticated"}';
   
   INSERT INTO organization_members (org_id, user_id, role)
   VALUES ('<org-id>', '<user-2-id>', 'manager');
   ```
   **Expected:** Success if valid unused invite exists for invitee@example.com

3. **Test: Invitee can mark invite as used**
   ```sql
   SET request.jwt.claims = '{"sub": "<user-2-id>", "email": "invitee@example.com", "role": "authenticated"}';
   
   UPDATE organization_invites
   SET used_at = NOW()
   WHERE email = 'invitee@example.com' AND used_at IS NULL;
   ```
   **Expected:** Success (policy `org_invites_update_used_by_invitee` allows)

---

## Security Validation Checklist

- [ ] Unauthenticated requests to send-invite return 401
- [ ] Unauthenticated requests to accept-invite return 401
- [ ] Non-admin users cannot send invites (403)
- [ ] Token is never stored in plaintext (only sha256 hash in DB)
- [ ] Token is never returned in API responses (only in email)
- [ ] Email header injection is prevented (\n, \r blocked)
- [ ] Email mismatch is rejected (403)
- [ ] Expired invites are rejected (410)
- [ ] Used invites are rejected (409)
- [ ] Wrong tokens are rejected (404)
- [ ] RLS policies enforce rules at DB level
- [ ] Invite acceptance is idempotent (duplicate key ignored)

---

## Expected DB State Transitions

### Initial State (Before Test)
```
organizations: 1 row (test org)
organization_members: 1 row (User 1 = owner/admin)
organization_invites: 0 rows
```

### After Valid Invite (Test Case 3)
```
organizations: 1 row (unchanged)
organization_members: 1 row (unchanged)
organization_invites: 1 row (used_at = NULL, expires_at = NOW + 7d)
```

### After Valid Accept (Test Case 8)
```
organizations: 1 row (unchanged)
organization_members: 2 rows (User 1 + User 2)
organization_invites: 1 row (used_at = NOW)
```

---

## Manual Test Execution

**Using curl:**

```bash
# Get session token (authenticate via Supabase)
export SESSION_TOKEN="<your-supabase-session-token>"
export BASE_URL="http://localhost:3000"  # or your deployed URL

# Test 1: Send invite (as admin)
curl -X POST "$BASE_URL/api/send-invite" \
  -H "Cookie: sb-<project>-auth-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "<org-uuid>",
    "to": "test-invitee@example.com",
    "role": "manager",
    "inviterName": "Test Admin"
  }'

# Test 2: Accept invite (as invitee)
curl -X POST "$BASE_URL/api/accept-invite" \
  -H "Cookie: sb-<project>-auth-token=$INVITEE_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token-from-email>"
  }'
```

---

## Success Criteria

All test cases pass with expected HTTP status codes and DB state transitions.

**Critical Paths:**
1. ✅ Admin can send invite → DB record created → email sent
2. ✅ Invitee can accept → membership created → invite marked used
3. ✅ Unauthorized attempts are blocked at multiple layers
4. ✅ RLS policies provide defense-in-depth

