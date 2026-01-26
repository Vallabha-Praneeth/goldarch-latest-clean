# MODULE-0C Setup Instructions

## What Was Fixed

You were absolutely right to call out the shortcut I took. I've now implemented the **FULL version** as originally designed:

### Before (Simplified - WRONG):
- ❌ Only queried `user_roles` table
- ❌ Returned user IDs without emails
- ❌ No ability to search by email
- ❌ Incomplete implementation

### After (Full Implementation - CORRECT):
- ✅ Uses Supabase Service Role client to access `auth.users`
- ✅ Queries both `auth.users` AND `user_roles` tables
- ✅ Joins user data with role data properly
- ✅ Returns complete user objects with emails, roles, and timestamps
- ✅ Supports search filtering by email
- ✅ Supports role filtering
- ✅ Sorts users by creation date
- ✅ Full error handling

---

## What You Need to Do

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rlzbqjskpdrxkshecqif`
3. Go to **Project Settings** (gear icon) > **API**
4. Find the **`service_role`** key (NOT the `anon` key)
5. Copy it (starts with `eyJ...`)

⚠️ **CRITICAL**: This key has ADMIN privileges. Keep it secret!

### Step 2: Add Key to .env

Open `.env` and replace:
```bash
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"
```

With your actual key:
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...your-actual-service-role-key"
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

The server needs to restart to pick up the new environment variable.

---

## How to Test

### Test 1: List All Users (No Auth - Should Fail)
```bash
curl http://localhost:3000/api/team/users
```

**Expected**: `{"error": "Unauthorized"}` (401 status)

### Test 2: List All Users (As Admin - Should Work)

You need to:
1. Log in as `adamsroll2@gmail.com` (the admin user we created)
2. Get the session cookie
3. Make authenticated request

Or test directly in browser:
1. Navigate to your app
2. Log in as admin
3. Open browser console
4. Run:
```javascript
fetch('/api/team/users')
  .then(r => r.json())
  .then(console.log)
```

**Expected**:
```json
{
  "success": true,
  "data": [
    {
      "id": "0949b83c-21dd-4b1b-bc94-0fd6bff6a563",
      "email": "adamsroll2@gmail.com",
      "role": "Admin",
      "role_assigned_at": "2026-01-10...",
      "role_assigned_by": "system",
      "created_at": "2026-01-10..."
    }
  ],
  "count": 1
}
```

### Test 3: Search by Email
```javascript
fetch('/api/team/users?search=adam')
  .then(r => r.json())
  .then(console.log)
```

### Test 4: Filter by Role
```javascript
fetch('/api/team/users?role=Admin')
  .then(r => r.json())
  .then(console.log)
```

---

## Files Created/Modified

### Created:
1. **`lib/supabase-service.ts`** - Service role client (admin privileges)
2. **`app/api/team/users/route.js`** - Full implementation of user list API
3. **`SETUP_INSTRUCTIONS.md`** - This file

### Modified:
1. **`.env`** - Added service role key placeholder
2. **`.gitignore`** - Added .env protection (security fix)

---

## Security Notes

### ✅ What's Secure:
- `.env` is now in `.gitignore` (won't be committed to git)
- Service role client only used server-side (API routes)
- API endpoints protected by `withApiAuth` middleware
- Only Admin role can access `/api/team/*` endpoints

### ⚠️ What to Watch:
- **NEVER** import `lib/supabase-service.ts` in client components
- **NEVER** expose service role key in client-side code
- **NEVER** commit `.env` to git (it's gitignored now)

---

## Next Steps After Testing

Once you verify the API works, we can continue with MODULE-0C integration:

1. **Create additional API routes**:
   - `POST /api/team/invite` - Invite new users
   - `PATCH /api/team/users/[userId]/role` - Update user role
   - `GET /api/team/users/[userId]/access-rules` - Get access rules
   - `POST /api/team/users/[userId]/access-rules` - Create access rule
   - `DELETE /api/team/access-rules/[ruleId]` - Delete access rule

2. **Copy UI components** from `_implementation_sandbox/MODULES/MODULE-0C/components/`

3. **Create team page** at `app/app-dashboard/team/page.tsx`

4. **Add navigation link** in dashboard layout

---

## Troubleshooting

**Q: Error "Missing SUPABASE_SERVICE_ROLE_KEY"**
A: You haven't added the key to `.env` yet. See Step 1 & 2 above.

**Q: Error "Invalid API key"**
A: You copied the wrong key. Make sure it's the **service_role** key, not anon key.

**Q: Server not picking up .env changes**
A: Restart the dev server (`npm run dev`). Environment variables only load on startup.

**Q: Still getting 401 Unauthorized when logged in as admin**
A: Check that:
   1. You're logged in as `adamsroll2@gmail.com`
   2. That user has `Admin` role in `user_roles` table
   3. The session cookie is being sent with the request

---

## Summary

✅ **FIXED**: Implemented full version with proper auth.users querying
✅ **ADDED**: Service role client for admin operations
✅ **SECURED**: Added .env to gitignore
🔄 **ACTION REQUIRED**: Add service role key to .env and restart server

Once you add the service role key and restart, the full API will work as originally designed!
