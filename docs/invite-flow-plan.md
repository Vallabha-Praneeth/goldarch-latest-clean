# Organization Invite Flow Implementation Plan

**Date:** 2026-01-30
**Goal:** Implement secure invite flow using existing schema (NO new tables)
**Constraints:** Minimal changes, use existing migrations, maintain CANONICAL security posture

---

## Discovery Summary

### Existing Schema (from `20260130000000_org_members_invites.sql`)

**Tables:**
1. `public.organizations`
   - `id` (UUID, PK)
   - `name` (text)
   - `created_by` (UUID)
   - `created_at`, `updated_at` (timestamptz)

2. `public.organization_members`
   - `org_id` (UUID, FK → organizations.id)
   - `user_id` (UUID)
   - `role` (text: owner|admin|manager|procurement|viewer)
   - `created_at` (timestamptz)
   - Primary key: (org_id, user_id)

3. `public.organization_invites`
   - `id` (UUID, PK)
   - `org_id` (UUID, FK → organizations.id)
   - `email` (text)
   - `role` (text: owner|admin|manager|procurement|viewer)
   - `token_hash` (text) - secure hash for invite link
   - `expires_at` (timestamptz, default: now + 7 days)
   - `used_at` (timestamptz, nullable)
   - `created_by` (UUID)
   - `created_at` (timestamptz)

**RLS Policies:**
- ✅ Admin/owner can INSERT invites (policy: `org_invites_insert_admin_owner`)
- ✅ Admin/owner can SELECT invites (policy: `org_invites_select_admin_owner`)
- ✅ Invitee can UPDATE invite.used_at (policy: `org_invites_update_used_by_invitee`)
- ✅ Invitee can INSERT themselves into members (policy: `org_members_insert_via_invite`)
- ✅ Members can SELECT members in same org (policy: `org_members_select_same_org`)

### Existing API Routes

**Current State:**
- `/api/send-invite/route.js` - Has auth, but:
  - ❌ Does NOT check org membership (admin/owner)
  - ❌ Does NOT create DB invite record
  - ❌ Does NOT generate secure token
  - ❌ Uses broken import: `createServerSupabaseClient`
  - ⚠️ Accepts `inviteLink` from client (insecure)

- **Missing:** `/api/accept-invite` endpoint

**Auth Helper:**
- `lib/server/require-user.ts` - Returns `{ok, user, supabase}`

---

## Security Issues Identified

1. **No org membership authorization** - Any authenticated user can send invites
2. **No DB record** - Invites not tracked, can't be validated or revoked
3. **Client-provided link** - Invitee link comes from request body (spoofable)
4. **No token generation** - No secure token to prevent unauthorized access
5. **Broken imports** - Routes use non-existent `createServerSupabaseClient`

---

## Implementation Plan

### 1. Fix Auth Pattern (All Routes)

**Problem:** Routes use `createServerSupabaseClient()` which doesn't exist
**Solution:** Use existing `requireUser()` helper correctly

**Pattern:**
```typescript
import { requireUser } from '@/lib/server/require-user';

export async function POST(request) {
  const result = await requireUser();
  if (!result.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = result;
  // ... rest of logic
}
```

### 2. Secure `/api/send-invite` Endpoint

**Authorization Flow:**
1. ✅ Require authentication (`requireUser`)
2. ✅ Require org_id in request body
3. ✅ Check user is admin/owner of that org via DB query:
   ```sql
   SELECT role FROM organization_members
   WHERE org_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
   ```
4. ✅ Generate secure random token (32 bytes, crypto.randomBytes)
5. ✅ Hash token using crypto.createHash('sha256')
6. ✅ Insert invite record into `organization_invites` table:
   ```sql
   INSERT INTO organization_invites (org_id, email, role, token_hash, created_by)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id
   ```
7. ✅ Build invite link: `${BASE_URL}/accept-invite?token=${rawToken}&invite_id=${id}`
8. ✅ Send email with invite link
9. ✅ Return success (do NOT return token to client again)

**RLS Enforcement:** Policy `org_invites_insert_admin_owner` will enforce admin/owner check at DB level (defense in depth)

### 3. Create `/api/accept-invite` Endpoint

**File:** `app/api/accept-invite/route.ts`

**Accept Flow:**
1. ✅ Require authentication (`requireUser`)
2. ✅ Get `token` and `invite_id` from query params
3. ✅ Hash provided token using same algorithm
4. ✅ Query invite by id and token_hash:
   ```sql
   SELECT org_id, email, role, used_at, expires_at
   FROM organization_invites
   WHERE id = $1 AND token_hash = $2
   ```
5. ✅ Validate:
   - Invite exists
   - Not already used (used_at IS NULL)
   - Not expired (expires_at > now())
   - Email matches authenticated user's email (auth.jwt()->>'email')
6. ✅ Insert membership (RLS allows via `org_members_insert_via_invite`):
   ```sql
   INSERT INTO organization_members (org_id, user_id, role)
   VALUES ($1, $2, $3)
   ON CONFLICT (org_id, user_id) DO NOTHING
   ```
7. ✅ Mark invite as used (RLS allows via `org_invites_update_used_by_invitee`):
   ```sql
   UPDATE organization_invites
   SET used_at = now()
   WHERE id = $1
   ```
8. ✅ Return success with org_id (client can redirect to org page)

**RLS Enforcement:**
- Policy `org_members_insert_via_invite` validates invite exists and is valid
- Policy `org_invites_update_used_by_invitee` validates email match + invite not used

---

## Implementation Checklist

### Phase 1: Fix `/api/send-invite`
- [ ] Create backup: `app/api/send-invite/route.js.bak`
- [ ] Replace with TypeScript version: `route.ts`
- [ ] Fix auth pattern (use requireUser correctly)
- [ ] Add org_id to request body schema
- [ ] Query organization_members to verify admin/owner role
- [ ] Generate secure random token (crypto.randomBytes)
- [ ] Hash token (crypto.createHash('sha256'))
- [ ] Insert invite into organization_invites table
- [ ] Build invite link with raw token + invite_id
- [ ] Send email with invite link
- [ ] Remove client-provided inviteLink from request body

### Phase 2: Create `/api/accept-invite`
- [ ] Create `app/api/accept-invite/route.ts`
- [ ] Implement authentication (requireUser)
- [ ] Get token + invite_id from URL params
- [ ] Hash token and query invite
- [ ] Validate invite (exists, not used, not expired, email match)
- [ ] Begin transaction or use sequential queries:
  - [ ] INSERT into organization_members
  - [ ] UPDATE organization_invites.used_at
- [ ] Return success response with org_id

### Phase 3: Verification
- [ ] Run `python3 scripts/verify_alignment.py` from repo root
- [ ] Run `npm run lint` in CANONICAL
- [ ] Run `npm run build` in CANONICAL (check TypeScript errors)
- [ ] Manual test: Try to call send-invite without auth → expect 401
- [ ] Manual test: Try to call send-invite as non-admin → expect 403
- [ ] Manual test: Try to accept-invite with wrong token → expect 400/403
- [ ] Manual test: Try to accept-invite twice → expect 400 (already used)

---

## File Changes Summary

**Modified:**
- `app/api/send-invite/route.js` (full rewrite)

**Created:**
- `app/api/accept-invite/route.ts` (new endpoint)
- Backups:
  - `app/api/send-invite/route.js.bak`

**Schema Used (NO CHANGES):**
- Existing tables from `20260130000000_org_members_invites.sql`:
  - `public.organizations`
  - `public.organization_members`
  - `public.organization_invites`

**Dependencies:**
- `lib/server/require-user.ts` (existing)
- Node.js `crypto` module (built-in)
- `@supabase/ssr` (existing)
- `resend` (existing)

---

## Security Guarantees

1. **Authentication:** All endpoints require authenticated user
2. **Authorization:** Only org admin/owner can create invites (DB + RLS enforce)
3. **Token Security:**
   - 32-byte random tokens (cryptographically secure)
   - SHA-256 hashed in DB (raw token never stored)
   - Single-use (used_at prevents reuse)
   - Time-limited (7-day expiration)
4. **Email Validation:** Accept endpoint validates email matches invite
5. **RLS Defense-in-Depth:** All DB operations protected by RLS policies
6. **No Client Trust:** Server generates tokens, client cannot forge invites

---

## Remaining Work (Out of Scope)

- Frontend UI for sending invites (can use existing email routes as pattern)
- Frontend accept-invite page (would call `/api/accept-invite`)
- Email verification if user doesn't have email in JWT
- Multi-org invite handling (if user already in another org)
- Invite revocation UI (admin can DELETE invite via RLS)

---

**Status:** ✅ Plan approved, ready for implementation
