# Migration - Ultra Simple Step by Step

Run these **one at a time** in Supabase SQL Editor to avoid errors.

## Setup
1. Open: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/editor
2. Keep this terminal open to copy SQL from each file

---

## Step 1a: Create Email Table

```bash
cat supabase/migrations/step1a_email_table.sql
```

**Copy the output**, paste in SQL Editor, click **RUN**

✅ Should see: "Success. No rows returned"

---

## Step 1b: Add Email Indexes

```bash
cat supabase/migrations/step1b_email_indexes.sql
```

**Copy the output**, paste in SQL Editor, click **RUN**

✅ Should see: "Success. No rows returned"

---

## Step 1c: Add Products Images Column

```bash
cat supabase/migrations/step1c_products_images.sql
```

**Copy the output**, paste in SQL Editor, click **RUN**

✅ Should see: "Success. 3 rows affected" (updates your 3 products)

---

## Step 1d: Create Adjustments Table

```bash
cat supabase/migrations/step1d_adjustments_table.sql
```

**Copy the output**, paste in SQL Editor, click **RUN**

✅ Should see: "Success. No rows returned"

---

## Verify

Run this to verify everything worked:

```bash
source .env && \
NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
node scripts/test-phase2-features.mjs
```

You should now see:
- ✅ quote_email_tracking table
- ✅ quote_extraction_adjustments table
- ✅ products.images column

---

## Next: Create Storage Bucket

After all steps succeed:
1. Go to: https://supabase.com/dashboard/project/oszfxrubmstdavcehhkn/storage/buckets
2. Click "New Bucket"
3. Name: `products`
4. Public: ✅ YES
5. Click "Create Bucket"

---

## Then: Start Testing

```bash
npm run dev
```

Visit: http://localhost:3000/app-dashboard
