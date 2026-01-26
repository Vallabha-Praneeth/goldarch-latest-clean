# Construction Quote Builder - Quick Start Guide

**Status:** ✅ Phase 1 Complete - Production Ready
**Version:** 1.0.0

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Apply Database Migration

**Via Supabase Dashboard (Recommended):**
```
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" → "New Query"
4. Copy/paste file: supabase/migrations/20260116_quote_builder_schema.sql
5. Click "Run"
```

**Verify Migration:**
```bash
node scripts/verify-quote-builder-schema.mjs
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Access Quote Builder

**Customer Interface:**
- http://localhost:3000/quote-builder

**Admin Interface:**
- http://localhost:3000/admin/quote/suppliers

---

## 📋 Complete User Flow

### Customer Journey (5 Steps)

**1. Lead Capture** → `/quote-builder`
- Enter contact info (name, email, phone, company)
- Select region (Los Angeles)
- Choose project type
- Click "Continue to Upload"

**2. Plan Upload** → `/quote-builder/upload`
- Upload construction plan (PDF, PNG, JPG)
- Wait for AI extraction (2-5 minutes)
- Auto-redirects when complete

**3. Review Extraction** → `/quote-builder/extraction/[jobId]`
- View extracted quantities by category
- Check confidence scores (High/Medium/Low)
- Review evidence and flags
- Click "Proceed to Product Catalog"

**4. Select Products** → `/quote-builder/catalog/[jobId]`
- Browse filtered products
- Add items to cart
- Adjust quantities
- Click "Generate Quote"

**5. Review Quote** → `/quote-builder/review/[quoteId]`
- See final pricing with discounts
- Print or download PDF (Phase 2)
- Email to customer (Phase 2)

### Admin Tasks

**Manage Products** → `/admin/quote/suppliers`
- Add new products (SKU, name, price, category)
- Set premium tier visibility
- Configure pricing rules (Phase 2)
- Bulk import CSV (Phase 2)

---

## 🎯 Key Features

### Premium Product Filtering
- Admin controls which products shown to which customers
- Three tiers: Premium, Standard, Bronze
- Set per product: All Customers | Premium Only | Standard Only

### Dynamic Pricing
- Region-based pricing
- Tier discounts (Premium 10%, Standard 5%, Bronze 0%)
- Price versioning with effective dates
- Historical quote accuracy

### AI Extraction Integration
- Reads from existing Construction Plan Intelligence
- Zero modifications to existing system
- Confidence scoring display
- Evidence and source tracking

### Professional Quotes
- Auto-generated quote numbers (QT-2026-0001)
- 30-day validity period
- Category-based line items
- Complete audit trail

---

## 📁 File Locations

### APIs (Backend)
```
app/api/quote/
├── extraction/[jobId]/route.ts    # Extraction wrapper
├── lead/route.ts                  # Lead management
├── catalog/route.ts               # Product catalog
├── pricing/calculate/route.ts     # Price calculation
└── generate/route.ts              # Quote generation
```

### Pages (Frontend)
```
app/quote-builder/
├── page.tsx                       # Lead capture
├── upload/page.tsx                # Plan upload
├── extraction/[jobId]/page.tsx    # Extraction review
├── catalog/[jobId]/page.tsx       # Product catalog
└── review/[quoteId]/page.tsx      # Quote review

app/admin/quote/
└── suppliers/page.tsx             # Admin management
```

### Database
```
supabase/migrations/
└── 20260116_quote_builder_schema.sql   # 11 tables
```

---

## 🗄️ Database Schema

**Core Tables:**
- `quote_regions` - Geographic areas (Los Angeles, etc.)
- `quote_customer_tiers` - Premium/Standard/Bronze
- `quote_leads` - Lead capture with tier assignment
- `quotations` - Main quote records
- `quotation_lines` - Quote line items
- `quote_product_visibility` - Premium filtering rules
- `quote_pricing_rules` - Dynamic pricing (Phase 2)
- `quotation_audit_log` - Complete audit trail

**Integration Tables:**
- Links to existing `plan_jobs` (READ ONLY)
- Links to existing `plan_analyses` (READ ONLY)
- Links to existing `users` (READ ONLY)

---

## 🔧 Configuration

### Add Sample Products

**Via Admin Panel:**
1. Go to `/admin/quote/suppliers`
2. Click "Add Product"
3. Fill in: SKU, Name, Category, Price
4. Select tier visibility
5. Click "Add Product"

**Via SQL:**
```sql
INSERT INTO quote_products (supplier_id, sku, name, description, category, base_price, currency, in_stock)
VALUES
  (1, 'DOOR-001', 'Standard Interior Door', '6-panel hollow core', 'doors', 89.99, 'USD', true),
  (1, 'WIN-001', 'Double Hung Window', 'Vinyl 3x4 window', 'windows', 249.99, 'USD', true);
```

### Change Quote Validity Period

Edit `/app/api/quote/generate/route.ts`:
```typescript
// Line 45-46
const validUntil = new Date();
validUntil.setDate(validUntil.getDate() + 30); // Change to desired days
```

### Modify Tier Discounts

Update database:
```sql
UPDATE quote_customer_tiers
SET discount_pct = 15  -- Change from 10% to 15%
WHERE name = 'premium';
```

---

## 🐛 Troubleshooting

### "Table does not exist" Error
**Solution:** Apply database migration (see Step 1)

### Catalog Shows No Products
**Solution:** Add products via admin panel or SQL

### Extraction Review Fails
**Check:**
1. Job exists in `plan_jobs` table
2. Analysis exists in `plan_analyses` table
3. Worker logs: `construction_plan_intelligence/worker/worker.log`

### Quote Generation Fails
**Check:**
1. Lead ID in session storage (DevTools → Application)
2. Products have valid pricing
3. Browser console for API errors

---

## 📚 Documentation

**Comprehensive Guides:**
- `QUOTE_BUILDER_PHASE1_COMPLETE.md` - Complete implementation summary
- `QUOTE_BUILDER_DATABASE_SETUP.md` - Database migration guide
- `FRAMEWORK_B_EXTRACTION_INTEGRATION_GUIDE.md` - Integration specs
- `QUOTE_BUILDER_SESSION_SUMMARY.md` - Development session log

**Inline Documentation:**
- All API routes have JSDoc comments
- Component files have usage notes
- Database schema has table descriptions

---

## ✅ Testing Checklist

**Before Launch:**
- [ ] Database migration applied
- [ ] Verification script passes
- [ ] At least 20 products added
- [ ] Test lead capture form
- [ ] Upload sample construction plan
- [ ] Review extraction results
- [ ] Add products to cart
- [ ] Generate test quote
- [ ] Verify pricing calculations
- [ ] Test print functionality
- [ ] Check admin panel access

---

## 🚀 Phase 2 Features (Coming Soon)

**High Priority:**
- PDF generation (download quotes)
- Email delivery (send quotes to customers)
- Manual quantity editing
- Product images

**Medium Priority:**
- Multi-region support
- CSV bulk import
- Volume discounts
- Tax calculation

**See:** `QUOTE_BUILDER_PHASE1_COMPLETE.md` for full roadmap

---

## 📞 Support

**Documentation:** See files listed above
**Verification:** `node scripts/verify-quote-builder-schema.mjs`
**Logs:** Check browser console and network tab

---

## 🎉 You're All Set!

Your Quote Builder is ready to use. Follow the Quick Start steps above and you'll be generating quotes in minutes.

**Questions?** Check the comprehensive documentation in `QUOTE_BUILDER_PHASE1_COMPLETE.md`

---

*Last Updated: January 17, 2026*
*Version: 1.0.0*
