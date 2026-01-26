# Apply Phase 2 Migration - Quick Guide

## Option 1: Supabase Dashboard (Recommended - 2 minutes)

### Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Step 2: Copy & Paste Migration
Copy the entire contents of this file:
```
supabase/migrations/20260119_phase2_complete.sql
```

### Step 3: Run Query
1. Paste into SQL Editor
2. Click **Run** (or press Cmd/Ctrl + Enter)
3. Wait for "Success" message

### Step 4: Create Storage Bucket
1. Go to **Storage** in left sidebar
2. Click **New Bucket**
3. Settings:
   - Name: `products`
   - Public: ✅ Yes
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
4. Click **Create Bucket**

## Option 2: Using psql (If you have it installed)

```bash
# Set database password
export PGPASSWORD="your-supabase-db-password"

# Run migration
psql -h db.oszfxrubmstdavcehhkn.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20260119_phase2_complete.sql
```

## Verify Migration

After applying, run the test script:

```bash
source .env && \
NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
node scripts/test-phase2-features.mjs
```

You should see:
- ✅ quote_email_tracking table
- ✅ quote_extraction_adjustments table
- ✅ products.images column
- ✅ Products storage bucket

## Next: Test in Browser

```bash
npm run dev
```

Then visit: http://localhost:3000/app-dashboard/quotes/[quoteId]/review

---

**Quick Link:** https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/editor
