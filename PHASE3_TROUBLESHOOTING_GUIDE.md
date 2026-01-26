# Phase 3 UI Troubleshooting Guide

**Date**: January 19, 2026
**Issue**: API integration errors in Phase 3 components
**Status**: ✅ Fixed (commit `51f686d`)

---

## Issues Fixed

### 1. **ShareQuoteButton - Link Not Generating**
**Problem**: Modal opened but no link appeared

**Root Cause**:
- Missing response validation before JSON parsing
- No error logging for debugging
- Silent failures when API returned errors

**Fix Applied**:
- Added `response.ok` check before parsing
- Added console logging: `console.log('Share link response:', data)`
- Improved error alerts with specific messages
- Validates `data.shareUrl` exists before setting state

**Test Steps**:
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to quote review page
http://localhost:3000/app-dashboard/quotes/[quoteId]/review

# 3. Click "Share Quote" button
# 4. Check browser console for:
#    - "Share link response: { success: true, shareUrl: ... }"
# 5. Verify link appears in modal
# 6. Click "Copy Link" button
# 7. Paste link in new tab to verify it works
```

---

### 2. **StatusTimeline - Stuck on "Loading..."**
**Problem**: Timeline showed "Loading status..." indefinitely

**Root Cause**:
- No error handling for API failures
- No response validation
- Loading state never cleared on error
- No empty state for quotes with no history

**Fix Applied**:
- Added response status validation
- Console logging: `console.log('Status data:', data)`
- Proper loading/error/empty state rendering
- Loading spinner with better UX
- Error boundary for API failures

**Test Steps**:
```bash
# 1. Navigate to quote review page
# 2. Click "Status Timeline" tab
# 3. Check browser console for:
#    - "Status data: { current_status: 'draft', status_history: [...] }"
# 4. Verify timeline renders correctly
# 5. If no history: should show "No status history available"
# 6. If API fails: should show error message
```

---

### 3. **ResponsesList - "Failed to fetch responses"**
**Problem**: Always showed error even when API worked

**Root Cause**:
- Poor error handling
- No response validation
- Generic error messages
- No console logging for debugging

**Fix Applied**:
- Proper try-catch with detailed error messages
- Response status validation
- Console logging: `console.log('Responses data:', data)`
- Safe JSON parsing with fallback
- Better error display to user

**Test Steps**:
```bash
# 1. Navigate to quote review page
# 2. Click "Customer Responses" tab
# 3. Check browser console for:
#    - "Responses data: { responses: [...], count: N }"
# 4. If no responses: should show "No customer responses yet"
# 5. If has responses: should display list with details
```

---

## Common Issues & Solutions

### Issue: "SyntaxError: The string did not match the expected pattern"

**Cause**: Invalid UUID format in URL parameter

**Solution**: Verify the quoteId is a valid UUID
```javascript
// Valid UUID format:
2d0f2c9a-8182-433e-9644-dd6797df8d65

// Invalid:
"test-id"  // ❌ Not a UUID
undefined   // ❌ Missing parameter
```

**Check**: Look at browser URL - should be:
```
/app-dashboard/quotes/2d0f2c9a-8182-433e-9644-dd6797df8d65/review
```

---

### Issue: 404 Errors on API Calls

**Symptoms**:
- ShareQuoteButton: "Failed to generate link"
- StatusTimeline: API error 404
- ResponsesList: API error 404

**Possible Causes**:

1. **Quote doesn't exist in database**
   ```bash
   # Check if quote exists:
   node -e "
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
   const { data } = await supabase.from('quotations').select('id, quote_number').eq('id', 'YOUR_QUOTE_ID').single();
   console.log(data);
   "
   ```

2. **Phase 3 tables not created**
   ```bash
   # Verify tables exist:
   node scripts/verify-phase3-schema.mjs
   ```

3. **API routes not deployed**
   ```bash
   # Check routes exist:
   ls -la app/api/quote/[quoteId]/
   ls -la app/api/quote/public/
   ```

---

### Issue: Empty Responses Despite Customer Submissions

**Check Database**:
```sql
-- Check if responses exist in database:
SELECT * FROM quote_customer_responses
WHERE quotation_id = 'YOUR_QUOTE_ID';

-- Check if table exists:
SELECT table_name FROM information_schema.tables
WHERE table_name = 'quote_customer_responses';
```

**Verify API**:
```bash
# Test API directly:
curl http://localhost:3000/api/quote/YOUR_QUOTE_ID/responses
```

---

### Issue: Status Timeline Empty Despite Status Changes

**Check Database**:
```sql
-- Check status history:
SELECT * FROM quote_status_history
WHERE quotation_id = 'YOUR_QUOTE_ID'
ORDER BY changed_at DESC;

-- Check current status:
SELECT id, quote_number, status FROM quotations
WHERE id = 'YOUR_QUOTE_ID';
```

**Verify Trigger**:
```sql
-- Check if trigger exists:
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'quote_status_change_trigger';
```

If trigger doesn't exist, run:
```sql
-- Run safe migration:
-- File: supabase/migrations/20260119_phase3_modules_safe.sql
```

---

## Debug Checklist

When components don't work, check in this order:

### 1. ✅ Browser Console Logs
```javascript
// Should see these logs:
"Share link response: ..."  // ShareQuoteButton
"Status data: ..."          // StatusTimeline
"Responses data: ..."       // ResponsesList
```

### 2. ✅ Network Tab (DevTools)
Check API calls:
- `POST /api/quote/[quoteId]/share` → 200 OK
- `GET /api/quote/[quoteId]/status` → 200 OK
- `GET /api/quote/[quoteId]/responses` → 200 OK

### 3. ✅ Database Tables
```bash
node scripts/verify-phase3-schema.mjs
```
Should show:
```
✓ public_quote_links: Table exists
✓ quote_status_history: Table exists
✓ quote_versions: Table exists
✓ quote_customer_responses: Table exists
```

### 4. ✅ Environment Variables
```bash
# Check .env file has:
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### 5. ✅ API Routes Exist
```bash
find app/api/quote -name "route.ts"
```
Should list:
- `app/api/quote/[quoteId]/share/route.ts`
- `app/api/quote/[quoteId]/status/route.ts`
- `app/api/quote/[quoteId]/responses/route.ts`
- `app/api/quote/public/[token]/route.ts`
- `app/api/quote/public/[token]/respond/route.ts`
- `app/api/quote/[quoteId]/versions/route.ts`

---

## Test Script

Run this to test all Phase 3 features:

```bash
# 1. Verify schema
node scripts/verify-phase3-schema.mjs

# 2. Test APIs (requires quote ID)
QUOTE_ID="2d0f2c9a-8182-433e-9644-dd6797df8d65"

# Test share link generation
curl -X POST http://localhost:3000/api/quote/$QUOTE_ID/share \
  -H "Content-Type: application/json" \
  -d '{"expiresInDays": 30}'

# Test status API
curl http://localhost:3000/api/quote/$QUOTE_ID/status

# Test responses API
curl http://localhost:3000/api/quote/$QUOTE_ID/responses

# 3. Full integration test
node scripts/test-phase3-features.mjs
```

---

## Expected Behavior

### ShareQuoteButton
1. Click button → Modal opens
2. Modal shows spinner while loading
3. Link appears within 1-2 seconds
4. Can copy link to clipboard
5. Link works when pasted in browser

### StatusTimeline
1. Tab loads → Shows spinner
2. Timeline appears within 1 second
3. Shows current status badge
4. Shows status change history (if any)
5. Can click status buttons to change (with confirmation)

### ResponsesList
1. Tab loads → Shows spinner
2. Responses list appears within 1 second
3. Shows all customer responses
4. Displays badges for response types
5. Shows customer details, signatures, notes

---

## If Issues Persist

### Get Debug Information:

```bash
# 1. Check build output
npm run build

# 2. Check browser console (F12)
# Look for errors in Console tab

# 3. Check Network tab
# Filter by "quote" to see API calls
# Check status codes (should be 200)
# Check response bodies

# 4. Check server logs
# Look at terminal where `npm run dev` is running

# 5. Test API directly
curl -v http://localhost:3000/api/quote/YOUR_QUOTE_ID/status
```

### Create Test Quote:

```javascript
// If you need a test quote with valid UUID:
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get existing quote
const { data: quote } = await supabase
  .from('quotations')
  .select('id, quote_number, status')
  .limit(1)
  .single();

console.log('Test with this quote:');
console.log('ID:', quote.id);
console.log('Number:', quote.quote_number);
console.log('URL:', \`/app-dashboard/quotes/\${quote.id}/review\`);
"
```

---

## Summary of Fixes

✅ **ShareQuoteButton**:
- Added error handling
- Console logging
- Better UX

✅ **StatusTimeline**:
- Fixed infinite loading
- Added empty states
- Error boundaries

✅ **ResponsesList**:
- Fixed error messages
- Console logging
- Proper validation

✅ **All Components**:
- Response validation
- Status code checks
- Debug logging
- User-friendly errors

---

**Fixed in commit**: `51f686d`
**Deployed**: Pending Vercel build
**Status**: ✅ Ready for testing
