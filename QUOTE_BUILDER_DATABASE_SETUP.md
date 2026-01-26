# Quote Builder - Database Setup Instructions

## Status: Database Schema Ready to Apply

The Quote Builder database schema has been created and is ready to be applied to your Supabase database.

---

## What Was Created

### 11 New Tables:
1. **quote_regions** - Supported regions (Los Angeles initially)
2. **quote_customer_tiers** - Customer segments (premium/standard)
3. **quote_leads** - Lead capture (name, email, region, project details)
4. **quote_compliance_rules** - Region-specific building code requirements
5. **quote_pricing_rules** - Product pricing with region/tier variations
6. **quotations** - Main quote records (links to extraction via extraction_job_id)
7. **quotation_lines** - Quote line items with extraction evidence
8. **quotation_versions** - Quote revision history
9. **quotation_audit_log** - Detailed audit log of all changes
10. **quote_product_visibility** - Premium product filtering control
11. **quote_email_tracking** - Email delivery tracking (Phase 2)

### Key Features:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Foreign keys to existing tables (READ-ONLY references)
- ✅ Indexes for performance
- ✅ Auto-generated quote numbers (QT-2026-0001, QT-2026-0002, etc.)
- ✅ Seed data for Los Angeles region and customer tiers
- ✅ Audit trail for price changes
- ✅ Zero modifications to existing tables

---

## Apply Migration (Choose ONE Method)

### METHOD 1: Supabase Dashboard (Recommended ⭐)

**Step-by-Step:**

1. Open Supabase Dashboard
   - Go to: https://supabase.com/dashboard
   - Sign in to your account

2. Select Your Project
   - Click on your project: `goldarch_web_copy` or similar
   - Project ID: `oszfxrubmstdavcehhkn`

3. Open SQL Editor
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button

4. Paste Migration SQL
   - Open file: `supabase/migrations/20260116_quote_builder_schema.sql`
   - Copy ALL contents (entire file)
   - Paste into SQL Editor

5. Execute Migration
   - Click **"Run"** button (or press Cmd/Ctrl + Enter)
   - Wait for execution (should take 5-10 seconds)
   - Check for green success message

6. Verify Success
   - Run verification script:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL="https://oszfxrubmstdavcehhkn.supabase.co" \
     SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
     node scripts/verify-quote-builder-schema.mjs
     ```
   - Should show: "✅ All Quote Builder tables exist!"

---

### METHOD 2: Local psql Command

**Prerequisites:**
- PostgreSQL client installed (`brew install postgresql` on Mac)

**Steps:**

```bash
# Set password (from .env file)
export PGPASSWORD='GoldArchSuper2024!'

# Run migration
psql -h aws-0-us-west-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.oszfxrubmstdavcehhkn \
     -d postgres \
     -f supabase/migrations/20260116_quote_builder_schema.sql

# Verify
node scripts/verify-quote-builder-schema.mjs
```

---

### METHOD 3: Supabase CLI

**Prerequisites:**
- Supabase CLI installed (`npm install -g supabase`)
- Project linked (`supabase link --project-ref oszfxrubmstdavcehhkn`)

**Steps:**

```bash
# Apply migration
supabase db push

# Or manually execute
supabase db execute -f supabase/migrations/20260116_quote_builder_schema.sql

# Verify
node scripts/verify-quote-builder-schema.mjs
```

---

## Verification Checklist

After applying the migration, verify everything is correct:

### 1. Check Tables Exist

Run verification script:
```bash
npm run verify:quote-schema
# Or manually:
node scripts/verify-quote-builder-schema.mjs
```

Expected output:
```
✅ quote_regions
✅ quote_customer_tiers
✅ quote_leads
✅ quote_compliance_rules
✅ quote_pricing_rules
✅ quotations
✅ quotation_lines
✅ quotation_versions
✅ quotation_audit_log
✅ quote_product_visibility
✅ quote_email_tracking

✅ Los Angeles region configured
✅ Customer tiers configured: premium, standard

✅ Schema verification PASSED!
```

### 2. Check RLS Policies

In Supabase Dashboard:
- Go to **Table Editor**
- Select any `quote_*` table
- Click **"Policies"** tab
- Should see policies like "Users can view their own leads", etc.

### 3. Check Seed Data

```sql
-- Run in SQL Editor
SELECT * FROM quote_regions; -- Should show Los Angeles
SELECT * FROM quote_customer_tiers; -- Should show premium, standard
```

### 4. Check Foreign Keys

```sql
-- Verify read-only links to existing tables
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'quot%'
ORDER BY tc.table_name;
```

Should show links to:
- `plan_jobs` (extraction_job_id)
- `products` (product_id)
- `auth.users` (user_id, created_by)

---

## What's Next?

After successful database setup, proceed with Phase 1 implementation:

### ✅ Step 1: Database Schema (COMPLETED)
- [x] Create 11 new tables
- [x] Set up RLS policies
- [x] Seed Los Angeles region
- [x] Configure customer tiers

### ⏭️ Step 2: Build APIs (NEXT)
- [ ] GET /api/quote/extraction/[jobId] - Wrapper for extraction results
- [ ] POST /api/quote/lead - Lead capture
- [ ] GET /api/quote/catalog - Filtered product catalog
- [ ] POST /api/quote/pricing/calculate - Dynamic pricing
- [ ] POST /api/quote/generate - Create quotation

### ⏭️ Step 3: Build UI
- [ ] Lead capture form
- [ ] Extraction review page
- [ ] Product catalog page
- [ ] Quote review page
- [ ] Admin supplier management

---

## Troubleshooting

### Error: "permission denied for table"

**Solution:** Make sure you're using the **service role key**, not the anon key:
```javascript
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // ← Must be service role
);
```

### Error: "relation already exists"

**Solution:** Tables already created. Skip migration and proceed to verification:
```bash
node scripts/verify-quote-builder-schema.mjs
```

### Error: "foreign key constraint fails"

**Solution:** Make sure existing tables exist:
- `plan_jobs` (from Construction Plan Intelligence)
- `products` (should exist, if not, create it)
- `auth.users` (Supabase built-in)

### Tables not showing in Supabase Dashboard

**Solution:** Refresh schema cache:
1. Go to **Table Editor**
2. Click refresh icon (top right)
3. Or reconnect to Supabase

---

## Database Design Notes

### Why Separate Tables?

**User Requirement:**
> "Do NOT edit, refactor, rename, reformat, or delete any existing files, pages, components, or design tokens"

**Our Approach:**
- All Quote Builder tables prefixed with `quote_` or `quotation_`
- Foreign keys to existing tables are **read-only references**
- No modifications to existing schema
- Clean separation allows independent deployment/rollback

### Read-Only References

Quote Builder reads from:
- ✅ `plan_jobs` - Get extraction status
- ✅ `plan_analyses` - Get extraction results
- ✅ `products` - Get product catalog
- ✅ `auth.users` - Get user info

Quote Builder **never writes** to these tables.

### Price Versioning

How it works:
1. Admin sets price: `base_price = $500`, `effective_date = 2026-01-16`
2. Quote generated today uses $500
3. Admin updates price: `base_price = $550`, `effective_date = 2026-01-20`
4. New quotes from Jan 20 use $550
5. Old quotes still show $500 (immutable)
6. All changes tracked in `quotation_audit_log`

### Premium Filtering

How it works:
1. Admin uploads 200 products from 50 suppliers
2. Admin tags 100 products as "premium only"
3. Standard customer visits quote builder
4. System filters catalog:
   - Region: Los Angeles ✅
   - Tier: Standard ✅
   - Result: Only 100 products shown (premium hidden)
5. Premium customer sees all 200 products

Controlled via `quote_product_visibility` table.

---

## Security Considerations

### RLS Policies

All tables have Row Level Security enabled:

**Users:**
- Can only see their own leads and quotes
- Cannot see other users' data

**Admins:**
- See all leads and quotes
- Can edit pricing rules
- Can manage compliance rules

**Sales Team:**
- See all leads (for assignment)
- See all quotes (for pipeline management)
- Cannot edit pricing rules

### API Security

All APIs require authentication:
```typescript
const auth = await requireAuth(request);
if (auth.response) return auth.response; // 401 if not authenticated
```

Rate limiting via Upstash Redis:
- 60 requests/minute for quote generation
- 100 requests/minute for catalog browsing

### Data Privacy

**Sensitive Data:**
- Service role key in `.env` (not committed to git)
- Email addresses in `quote_leads` (RLS protected)
- Pricing rules (only visible to admins)

**Audit Trail:**
- All price changes logged with user ID and timestamp
- All quote modifications tracked in `quotation_versions`
- IP addresses captured for audit purposes

---

## Migration File Location

**File:** `supabase/migrations/20260116_quote_builder_schema.sql`

**Size:** ~25 KB

**Lines:** ~700 lines of SQL

**Contents:**
- Table definitions
- Indexes
- RLS policies
- Seed data
- Comments and documentation

---

## Support

**Questions?**
- Check verification script output
- Review schema comments in SQL file
- See `FRAMEWORK_B_EXTRACTION_INTEGRATION_GUIDE.md` for integration details

**Issues?**
- Check Supabase Dashboard for error messages
- Run verification script for diagnostics
- Review audit log for unexpected changes

---

**Ready to proceed?**

1. ✅ Apply migration (choose method above)
2. ✅ Run verification script
3. ✅ Confirm all tables exist
4. ➡️ Continue to API implementation

---

**End of Database Setup Instructions**
