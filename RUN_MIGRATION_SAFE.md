# Safe Phase 2 Migration - Step by Step

The migration has been split into 2 safe steps to avoid errors.

## Step 1: Create Tables (Run this first)

### Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/editor

### Copy and run this file:
```
supabase/migrations/20260119_phase2_step1_tables.sql
```

**This creates:**
- ✅ `quote_email_tracking` table
- ✅ `quote_extraction_adjustments` table
- ✅ `products.images` column
- ✅ All helper functions

**Click RUN** and wait for success ✅

---

## Step 2: Add Policies (Run this second)

### In the same SQL Editor, copy and run:
```
supabase/migrations/20260119_phase2_step2_policies.sql
```

**This adds:**
- ✅ RLS policies for email tracking
- ✅ RLS policies for adjustments
- ✅ Storage policies for product images

**Click RUN** and wait for success ✅

**Note:** Storage policies will only work AFTER you create the 'products' bucket (see Step 3)

---

## Step 3: Create Storage Bucket

### Go to Storage section:
https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/storage/buckets

### Click "New Bucket"
- Name: `products`
- Public: ✅ **Yes** (check this box)
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Click "Create Bucket" ✅

---

## Step 4: Verify Everything Works

Run the test script:

```bash
source .env && \
NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
node scripts/test-phase2-features.mjs
```

You should see all ✅ green checks!

---

## Step 5: Start Testing

```bash
npm run dev
```

Then open: http://localhost:3000/app-dashboard

---

## Troubleshooting

### If Step 1 fails:
- Check if tables already exist (that's OK, just continue)
- Make sure you're logged into the correct Supabase project

### If Step 2 fails on storage policies:
- This is expected if the 'products' bucket doesn't exist yet
- Create the bucket first (Step 3), then re-run Step 2

### If test script still shows errors:
- Refresh Supabase dashboard
- Wait 10 seconds for policies to propagate
- Run test script again

---

**Quick Links:**
- SQL Editor: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/editor
- Storage: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/storage/buckets
