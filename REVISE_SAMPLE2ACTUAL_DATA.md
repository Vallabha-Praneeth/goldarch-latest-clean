# Sample Data Tracking - Replace with Actual Data

**Purpose:** This file tracks all sample/placeholder data used throughout the project. When you have real production data, refer to this guide to replace sample data.

**Last Updated:** January 17, 2026

---

## 📋 Sample Data Inventory

### 1. Quote Builder - Sample Products

**Location:** Database table `products` (via supplier catalogs)

**Sample Data Added:** 20 sample products across 5 categories
- File: `scripts/seed-sample-products.sql`
- Added: January 17, 2026

**What's Sample:**
- Product SKUs (DOOR-001, WIN-001, etc.)
- Product names and descriptions
- Pricing (fictional prices)
- Supplier references (generic supplier IDs)

**How to Replace with Actual Data:**

**Option A: Manual via Admin Panel**
```
1. Go to: http://localhost:3000/admin/quote/suppliers
2. For each sample product:
   - Edit with real SKU, name, pricing
   - Or delete and add real products from your suppliers
```

**Option B: CSV Bulk Import (Phase 2)**
```
1. Export your supplier catalogs to CSV
2. Use bulk import feature (when implemented)
3. Map columns: SKU, Name, Category, Price, etc.
4. Import and replace sample data
```

**Option C: Direct SQL Replacement**
```sql
-- Delete all sample products (SKUs starting with sample prefix)
DELETE FROM products
WHERE sku LIKE 'DOOR-%'
   OR sku LIKE 'WIN-%'
   OR sku LIKE 'KIT-%'
   OR sku LIKE 'BATH-%'
   OR sku LIKE 'FIX-%';

-- Then insert your real product data
INSERT INTO products (supplier_id, sku, name, category, base_price, currency, in_stock)
VALUES
  (your_supplier_id, 'REAL-SKU-001', 'Real Product Name', 'doors', 199.99, 'USD', true),
  -- ... your actual products
```

**Verification Query:**
```sql
-- Check how many sample products remain
SELECT category, COUNT(*) as sample_count
FROM products
WHERE sku ~ '^(DOOR|WIN|KIT|BATH|FIX)-[0-9]+'
GROUP BY category;
```

---

### 2. Quote Builder - Customer Tiers

**Location:** Database table `quote_customer_tiers`

**Sample Data Added:** 2 default tiers
- Premium (0% discount)
- Standard (0% discount)

**What's Sample:**
- Tier names (you may want different names)
- Discount percentages (set to 0% initially)
- No actual tier assignment logic

**How to Update with Actual Business Rules:**

```sql
-- Update tier discounts to match your business model
UPDATE quote_customer_tiers SET discount_pct = 10 WHERE name = 'premium';
UPDATE quote_customer_tiers SET discount_pct = 5 WHERE name = 'standard';

-- Add additional tiers
INSERT INTO quote_customer_tiers (name, description, discount_pct, priority)
VALUES
  ('vip', 'VIP Customers - exclusive access', 15, 150),
  ('contractor', 'Licensed Contractors', 8, 75);
```

**Tier Assignment Logic:**
- Currently: Manual assignment (admin sets tier per lead)
- Production: Implement auto-assignment based on:
  - Purchase history
  - Business type (contractor vs homeowner)
  - Location
  - Referral source

---

### 3. Quote Builder - Regions

**Location:** Database table `quote_regions`

**Sample Data Added:** 1 region
- Los Angeles, CA

**What's Sample:**
- Only LA region populated
- Generic compliance notes

**How to Add Real Regions:**

```sql
-- Add your actual service regions
INSERT INTO quote_regions (code, name, state, compliance_notes, active)
VALUES
  ('san-francisco', 'San Francisco Bay Area', 'California', 'SF Building Code 2023. Seismic requirements.', true),
  ('san-diego', 'San Diego County', 'California', 'SD Building Code. Coastal zone restrictions.', true),
  ('orange-county', 'Orange County', 'California', 'OC Building Code. Fire zone requirements.', true);

-- Update LA compliance notes with actual requirements
UPDATE quote_regions
SET compliance_notes = 'Your actual LA building code requirements here'
WHERE code = 'los-angeles';
```

---

### 4. Admin Supplier Management - Mock Data

**Location:** Frontend component `app/admin/quote/suppliers/page.tsx`

**Sample Data Added:** Hardcoded mock products in component state
- Lines: ~150-200 (mockProducts array)

**What's Sample:**
- 4 hardcoded products for UI demonstration
- Not connected to real database

**How to Replace:**
- This will be automatically replaced when you:
  1. Add real products to database
  2. Component fetches from `/api/quote/catalog` API
  3. Mock data is only shown when API returns empty

**Current Code (for reference):**
```typescript
// Line ~150 in app/admin/quote/suppliers/page.tsx
const mockProducts = [
  { id: '1', sku: 'DOOR-001', name: 'Interior Door', ... },
  // ... mock data
];
```

**Action Required:**
- Add real products via SQL script or admin form
- Mock data will stop displaying once real data exists

---

### 5. Construction Plan Intelligence - Worker Sample Data

**Location:** N/A - Not modified by Quote Builder

**Status:** Existing system - unchanged ✅

**Note:** Quote Builder reads from existing `plan_jobs` and `plan_analyses` tables but does NOT modify them. Any sample data in those tables is from the original Construction Plan Intelligence system.

---

## 🔄 Data Migration Checklist

When ready to go to production:

### Phase 1: Pre-Launch
- [ ] Replace sample products with real supplier catalogs (200-270 suppliers)
- [ ] Update customer tier discount percentages
- [ ] Add all service regions
- [ ] Update region compliance notes with actual building codes
- [ ] Test quote generation with real products

### Phase 2: Supplier Onboarding
- [ ] Import supplier catalogs (CSV or API)
- [ ] Set up premium product filtering rules
- [ ] Configure region-specific pricing
- [ ] Add product images
- [ ] Set accurate stock levels

### Phase 3: Pricing Configuration
- [ ] Review and adjust tier discounts
- [ ] Set up volume discount rules (when Phase 2 implemented)
- [ ] Configure tax calculation (when Phase 2 implemented)
- [ ] Set up pricing update schedule (10-15 day frequency per user requirement)

### Phase 4: Verification
- [ ] Run verification query to check for remaining sample data
- [ ] Test complete quote flow with real data
- [ ] Verify pricing calculations are accurate
- [ ] Check premium filtering works correctly
- [ ] Confirm region-based filtering

---

## 🔍 Sample Data Detection Queries

**Check for sample products:**
```sql
SELECT 'Sample Products' as type, COUNT(*) as count
FROM products
WHERE sku ~ '^(DOOR|WIN|KIT|BATH|FIX)-[0-9]+';
```

**Check for default tiers with 0% discount:**
```sql
SELECT 'Tiers with 0% discount' as type, COUNT(*) as count
FROM quote_customer_tiers
WHERE discount_pct = 0;
```

**Check region coverage:**
```sql
SELECT 'Active Regions' as type, COUNT(*) as count
FROM quote_regions
WHERE active = true;
```

**Full sample data report:**
```sql
SELECT
  'Sample Products' as item,
  (SELECT COUNT(*) FROM products WHERE sku ~ '^(DOOR|WIN|KIT|BATH|FIX)-[0-9]+') as count
UNION ALL
SELECT
  'Customer Tiers',
  (SELECT COUNT(*) FROM quote_customer_tiers)
UNION ALL
SELECT
  'Active Regions',
  (SELECT COUNT(*) FROM quote_regions WHERE active = true)
UNION ALL
SELECT
  'Leads Captured',
  (SELECT COUNT(*) FROM quote_leads)
UNION ALL
SELECT
  'Quotes Generated',
  (SELECT COUNT(*) FROM quotations);
```

---

## 📝 Notes for Future Sample Data

**When adding sample data in the future, update this file with:**

1. **Section header** - Clear name of what sample data is
2. **Location** - File path or table name
3. **What's Sample** - Description of placeholder data
4. **How to Replace** - Step-by-step instructions
5. **Verification** - SQL query or test to confirm replacement

**Template:**
```markdown
### X. [Feature Name] - [Data Type]

**Location:** [File path or table name]

**Sample Data Added:** [What and when]

**What's Sample:**
- Item 1
- Item 2

**How to Replace with Actual Data:**
[Step-by-step instructions]

**Verification Query:**
```sql
-- Query to check
```
```

---

## 🚨 Critical Sample Data to Replace Before Production

**High Priority:**
1. ✅ Products (200-270 supplier catalogs needed)
2. ✅ Customer tier discount percentages
3. ✅ Service regions

**Medium Priority:**
4. Product images
5. Detailed compliance rules
6. Pricing rules for region/tier combinations

**Low Priority:**
7. Email templates (Phase 2)
8. PDF branding (Phase 2)

---

**End of Sample Data Tracking**

*This file will be updated throughout the project as new sample data is added.*
