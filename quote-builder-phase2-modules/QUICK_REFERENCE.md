# Phase 2 - Quick Reference Guide

**Quick lookup for common tasks during integration**

---

## 📦 Installation Commands

### All Dependencies at Once
```bash
npm install puppeteer resend zod
```

### Individual Modules
```bash
# PDF Generation
npm install puppeteer

# Email Delivery
npm install resend

# Product Images
# No extra dependencies (uses Supabase)

# Quantity Editing
npm install zod
```

---

## 🔐 Environment Variables Template

Add to `.env.local`:

```bash
# ============================================
# PHASE 2 - ENVIRONMENT VARIABLES
# ============================================

# ----------------
# Email Delivery
# ----------------
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM_ADDRESS=quotes@your-domain.com
EMAIL_FROM_NAME=GoldArch Construction

# ----------------
# Already Configured (Phase 1)
# ----------------
NEXT_PUBLIC_SUPABASE_URL=https://oszfxrubmstdavcehhkn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📂 File Locations Cheat Sheet

### After Integration, Files Should Be At:

```
your-project/
├── lib/
│   ├── pdf/
│   │   ├── types.ts
│   │   └── pdf-generator.ts
│   ├── email/
│   │   ├── types.ts
│   │   └── email-service.ts
│   ├── storage/
│   │   ├── types.ts
│   │   ├── image-uploader.ts
│   │   └── ImageUploadComponent.tsx
│   └── extraction/
│       ├── types.ts
│       └── QuantityEditor.tsx
│
├── app/api/quote/
│   ├── pdf/[quoteId]/route.ts
│   ├── email/[quoteId]/route.ts
│   ├── products/images/route.ts
│   └── extraction/[jobId]/adjust/route.ts
│
└── supabase/migrations/
    ├── YYYYMMDDHHMMSS_create_email_tracking.sql
    ├── YYYYMMDDHHMMSS_add_product_images.sql
    └── YYYYMMDDHHMMSS_create_extraction_adjustments.sql
```

---

## 🔗 Import Statements Quick Copy

### PDF Generation
```typescript
import { generateQuotePDF } from '@/lib/pdf/pdf-generator';
import { QuotePDFData } from '@/lib/pdf/types';
```

### Email Delivery
```typescript
import { sendQuoteEmail } from '@/lib/email/email-service';
import { QuoteEmailData } from '@/lib/email/types';
```

### Product Images
```typescript
import { ImageUploadComponent } from '@/lib/storage/ImageUploadComponent';
import { ProductImage } from '@/lib/storage/types';
import { uploadProductImage, deleteProductImage } from '@/lib/storage/image-uploader';
```

### Quantity Editing
```typescript
import { QuantityEditor } from '@/lib/extraction/QuantityEditor';
import { ExtractedItem, AdjustmentRequest } from '@/lib/extraction/types';
```

---

## 🎨 UI Integration Snippets

### 1. Add PDF Download Button

In `app/quote-builder/review/[quoteId]/page.tsx`:

```typescript
import { Download, Loader2 } from 'lucide-react';

const [downloading, setDownloading] = useState(false);

const handleDownloadPDF = async () => {
  try {
    setDownloading(true);
    const response = await fetch(`/api/quote/pdf/${quoteId}`);
    if (!response.ok) throw new Error('Failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote-${quotation?.quoteNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    alert('Failed to download PDF');
  } finally {
    setDownloading(false);
  }
};

<Button onClick={handleDownloadPDF} disabled={downloading}>
  {downloading ? <Loader2 className="animate-spin" /> : <Download />}
  {downloading ? 'Generating...' : 'Download PDF'}
</Button>
```

### 2. Add Email Send Button

```typescript
import { Mail } from 'lucide-react';

const [sending, setSending] = useState(false);

const handleSendEmail = async () => {
  try {
    setSending(true);
    const response = await fetch(`/api/quote/email/${quoteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed');
    alert('Email sent successfully!');
  } catch (error) {
    alert('Failed to send email');
  } finally {
    setSending(false);
  }
};

<Button onClick={handleSendEmail} disabled={sending}>
  <Mail /> {sending ? 'Sending...' : 'Send Email'}
</Button>
```

### 3. Add Image Upload Component

```typescript
import { ImageUploadComponent } from '@/lib/storage/ImageUploadComponent';

const [images, setImages] = useState<ProductImage[]>([]);

<ImageUploadComponent
  productId={product.id}
  category={product.category}
  images={images}
  onImagesChange={setImages}
  maxImages={5}
/>
```

### 4. Add Quantity Editor

```typescript
import { QuantityEditor } from '@/lib/extraction/QuantityEditor';

<QuantityEditor
  jobId={jobId}
  item={item}
  onAdjustmentSaved={(updated) => {
    setItems(prev => prev.map(i =>
      i.itemType === updated.itemType ? updated : i
    ));
  }}
/>
```

---

## 🧪 Testing Commands

### Run All Tests
```bash
bash quote-builder-phase2-modules/testing/test-all-modules.sh
```

### Test Individual Modules
```bash
# PDF Generation
export TEST_QUOTE_ID=your-quote-id
node quote-builder-phase2-modules/testing/test-pdf-generation.mjs

# Email Delivery
export TEST_QUOTE_ID=your-quote-id
export TEST_EMAIL=test@example.com
node quote-builder-phase2-modules/testing/test-email-delivery.mjs
```

### Manual API Tests
```bash
# Test PDF
curl http://localhost:3000/api/quote/pdf/[quote-id] -o test.pdf

# Test Email
curl -X POST http://localhost:3000/api/quote/email/[quote-id] \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test Image Upload
curl -X POST http://localhost:3000/api/quote/products/images \
  -F "file=@image.jpg" \
  -F "category=doors" \
  -F "productId=test-123"

# Test Adjustment
curl -X POST http://localhost:3000/api/quote/extraction/[job-id]/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "category":"doors",
    "itemType":"Interior",
    "originalQuantity":10,
    "adjustedQuantity":12
  }'
```

---

## 🗄️ SQL Quick Reference

### Run Migrations

#### Via Supabase CLI
```bash
supabase db push
```

#### Via Supabase Dashboard
1. Go to SQL Editor
2. Copy contents of migration files
3. Run each one:
   - `email-tracking-table.sql`
   - `product-images-migration.sql`
   - `adjustments-table.sql`

### Verify Tables Exist
```sql
-- Check email tracking
SELECT * FROM quote_email_tracking LIMIT 1;

-- Check product images column
SELECT id, name, images FROM products LIMIT 1;

-- Check adjustments
SELECT * FROM quote_extraction_adjustments LIMIT 1;
```

---

## 🎯 Integration Priority Order

### Option 1: Maximum Impact First
1. **PDF Generation** (30 min) - Customers can download quotes
2. **Email Delivery** (45 min) - Automated quote sending
3. **Product Images** (2 hours) - Visual appeal
4. **Quantity Editing** (1-2 hours) - Error correction

### Option 2: Easiest First
1. **PDF Generation** (30 min) - Simplest to integrate
2. **Quantity Editing** (1-2 hours) - No external dependencies
3. **Product Images** (2 hours) - Uses existing Supabase
4. **Email Delivery** (45 min) - Requires Resend account

### Option 3: Most Requested First
Ask your users what they need most!

---

## 🔧 Common Customizations

### Change Company Name
```typescript
// In pdf-generator.ts and email-service.ts
const companyName = 'Your Company Name';  // Change here
```

### Change Primary Color
```typescript
// In pdf-generator.ts
const primaryColor = '#2563eb';  // Change to your brand color

// In email-service.ts
const primaryColor = '#2563eb';  // Change to your brand color
```

### Add Company Logo to PDF
```typescript
// In pdf-generator.ts, in getQuoteHTML():
<div class="company-logo">
  <img src="https://your-domain.com/logo.png" height="60" />
</div>
```

### Change Max Image Size
```typescript
// In lib/storage/types.ts
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 10,  // Change from 5MB to 10MB
  // ...
}
```

---

## 🐛 Troubleshooting Quick Fixes

### Issue: "Module not found"
```bash
# Make sure imports use correct paths
# Should be: from './types'
# Not: from '../types'
```

### Issue: "RESEND_API_KEY not configured"
```bash
# Add to .env.local and restart server
echo "RESEND_API_KEY=re_xxxx" >> .env.local
npm run dev
```

### Issue: "Puppeteer can't find Chrome"
```bash
npx puppeteer browsers install chrome
```

### Issue: "Storage bucket not found"
```
1. Go to Supabase Dashboard → Storage
2. Create bucket: 'products'
3. Make it public
4. Apply RLS policies from migration
```

### Issue: "Table doesn't exist"
```bash
# Run migrations
supabase db push

# Or run SQL manually in Supabase Dashboard
```

---

## 📞 Getting Help

### Documentation Hierarchy
1. **This file** - Quick reference
2. **Module README** - Detailed module docs
3. **INTEGRATION_GUIDE.md** - Step-by-step instructions
4. **Test scripts** - Diagnostic tools

### Debug Steps
1. Check console for errors
2. Check Network tab in browser
3. Run test scripts
4. Verify environment variables
5. Check database tables exist
6. Review module README troubleshooting section

---

## ✅ Quick Verification Checklist

### After Installing
- [ ] Dependencies installed (`node_modules/puppeteer`, `node_modules/resend`)
- [ ] Files copied to correct locations
- [ ] Imports updated (no `../types` errors)
- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarts without errors

### After Database Setup
- [ ] Migrations run successfully
- [ ] Tables exist in Supabase
- [ ] RLS policies active
- [ ] Storage bucket created (for images)

### After UI Integration
- [ ] Buttons appear on pages
- [ ] Click handlers work
- [ ] No console errors
- [ ] Test with real data

### After Testing
- [ ] PDF downloads successfully
- [ ] Email sends successfully
- [ ] Images upload successfully
- [ ] Adjustments save successfully

---

## 🎉 Success Indicators

You'll know integration is successful when:

- ✅ `npm run dev` starts without errors
- ✅ No TypeScript errors in IDE
- ✅ Test scripts pass
- ✅ PDF downloads in browser
- ✅ Email arrives in inbox with PDF
- ✅ Images display in catalog
- ✅ Quantity edits save and persist

---

## 📚 Related Files

- `PHASE2_MODULES_COMPLETE.md` - Overview of what was built
- `quote-builder-phase2-modules/README.md` - Master guide
- `quote-builder-phase2-modules/INTEGRATION_GUIDE.md` - Detailed steps
- Individual module READMEs - Specific module documentation

---

**Keep this file handy during integration!** 📌
