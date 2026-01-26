# Phase 2 Integration Guide

**Last Updated:** January 18, 2026
**Status:** All Modules Ready for Integration

---

## 📋 Overview

This guide provides step-by-step instructions for integrating Phase 2 modules into your Quote Builder application. Each module is self-contained and can be integrated independently.

## 🎯 Module Status

All Phase 2 modules are complete and ready for integration:

| Module | Priority | Time | Status |
|--------|----------|------|--------|
| PDF Generation | ⭐⭐⭐ Critical | 30 min | ✅ Ready |
| Email Delivery | ⭐⭐⭐ Critical | 45 min | ✅ Ready |
| Product Images | ⭐⭐ High | 2 hours | ✅ Ready |
| Quantity Editing | ⭐⭐ High | 1-2 hours | ✅ Ready |

**Total Estimated Integration Time:** 4-6 hours

---

## 🚀 Quick Start

### Recommended Integration Order

1. **PDF Generation** (Critical - enables downloads)
2. **Email Delivery** (Critical - enables sending quotes)
3. **Product Images** (High - improves catalog UX)
4. **Quantity Editing** (High - allows corrections)

### One-Command Setup (All Modules)

```bash
# Run this script to set up all modules at once
bash quote-builder-phase2-modules/integrate-all.sh
```

Or follow individual module instructions below.

---

## 📦 Module 1: PDF Generation

### Time Required: 30 minutes

### Step 1: Install Dependencies

```bash
npm install puppeteer
```

### Step 2: Copy Files

```bash
# Create directories
mkdir -p lib/pdf

# Copy files
cp quote-builder-phase2-modules/pdf-generation/types/index.ts lib/pdf/types.ts
cp quote-builder-phase2-modules/pdf-generation/lib/pdf-generator.ts lib/pdf/pdf-generator.ts

# Create API route directory
mkdir -p app/api/quote/pdf/[quoteId]
cp quote-builder-phase2-modules/pdf-generation/api/route.ts app/api/quote/pdf/[quoteId]/route.ts
```

### Step 3: Update Imports

In `lib/pdf/pdf-generator.ts`, change line 3:
```typescript
import { QuotePDFData, PDFGenerationOptions, PDFGenerationResult } from './types';
```

### Step 4: Add Download Button

In your review page (`app/quote-builder/review/[quoteId]/page.tsx`):

```typescript
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Add state
const [downloading, setDownloading] = useState(false);

// Add handler
const handleDownloadPDF = async () => {
  try {
    setDownloading(true);
    const response = await fetch(`/api/quote/pdf/${quoteId}`);
    if (!response.ok) throw new Error('Failed to generate PDF');

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
    console.error('PDF download error:', error);
    alert('Failed to download PDF');
  } finally {
    setDownloading(false);
  }
};

// Add button
<Button onClick={handleDownloadPDF} disabled={downloading}>
  {downloading ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating PDF...</>
  ) : (
    <><Download className="mr-2 h-4 w-4" />Download PDF</>
  )}
</Button>
```

### Step 5: Test

```bash
npm run dev
# Navigate to quote review page
# Click "Download PDF"
# Verify PDF downloads correctly
```

### ✅ Success Criteria
- PDF downloads successfully
- All quote data displays correctly
- Formatting looks professional
- No console errors

---

## 📧 Module 2: Email Delivery

### Time Required: 45 minutes

### Step 1: Get API Key

1. Go to https://resend.com
2. Sign up for free account
3. Create API key
4. Copy key

### Step 2: Configure Environment

Add to `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM_ADDRESS=quotes@your-domain.com
EMAIL_FROM_NAME=GoldArch Construction
```

Restart dev server after adding environment variables.

### Step 3: Install Dependencies

```bash
npm install resend
```

### Step 4: Run Database Migration

```bash
# Copy SQL file
cp quote-builder-phase2-modules/email-delivery/sql/email-tracking-table.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_create_email_tracking.sql

# Apply migration
supabase db push

# Or run SQL directly in Supabase SQL Editor
```

### Step 5: Copy Files

```bash
# Create directories
mkdir -p lib/email

# Copy files
cp quote-builder-phase2-modules/email-delivery/types/index.ts lib/email/types.ts
cp quote-builder-phase2-modules/email-delivery/lib/email-service.ts lib/email/email-service.ts

# Create API route
mkdir -p app/api/quote/email/[quoteId]
cp quote-builder-phase2-modules/email-delivery/api/route.ts app/api/quote/email/[quoteId]/route.ts
```

### Step 6: Update Imports

In `lib/email/email-service.ts`, change line 11:
```typescript
import { QuoteEmailData, EmailConfig, EmailSendResult, EmailTemplate } from './types';
```

### Step 7: Add Send Button

In your review page:

```typescript
import { Mail } from 'lucide-react';

const [sending, setSending] = useState(false);
const [emailSent, setEmailSent] = useState(false);

const handleSendEmail = async () => {
  try {
    setSending(true);
    const response = await fetch(`/api/quote/email/${quoteId}`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to send email');

    const result = await response.json();
    setEmailSent(true);
    alert(`Quote sent to ${result.sentTo}!`);
  } catch (error) {
    console.error('Email send error:', error);
    alert('Failed to send email');
  } finally {
    setSending(false);
  }
};

<Button onClick={handleSendEmail} disabled={sending || emailSent}>
  {sending ? 'Sending...' : emailSent ? 'Email Sent!' : 'Send Email'}
</Button>
```

### Step 8: Test

```bash
npm run dev
# Create a test quote
# Click "Send Email"
# Check recipient email inbox
# Verify PDF is attached
```

### ✅ Success Criteria
- Email sends successfully
- PDF attachment included
- Email looks professional on desktop
- Email looks professional on mobile
- Tracking record created in database

---

## 🖼️ Module 3: Product Images

### Time Required: 2 hours

### Step 1: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `products`
4. Public: ✅ Yes
5. File size limit: 5MB
6. Allowed MIME types: `image/jpeg, image/png, image/webp`

### Step 2: Run Database Migration

```bash
# Copy migration
cp quote-builder-phase2-modules/product-images/sql/product-images-migration.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_add_product_images.sql

# Apply migration
supabase db push

# Run storage policies in Supabase SQL Editor
```

### Step 3: Copy Files

```bash
# Create directories
mkdir -p lib/storage

# Copy files
cp quote-builder-phase2-modules/product-images/types/index.ts lib/storage/types.ts
cp quote-builder-phase2-modules/product-images/lib/image-uploader.ts lib/storage/image-uploader.ts
cp quote-builder-phase2-modules/product-images/lib/ImageUploadComponent.tsx lib/storage/ImageUploadComponent.tsx

# Create API route
mkdir -p app/api/quote/products/images
cp quote-builder-phase2-modules/product-images/api/route.ts app/api/quote/products/images/route.ts
```

### Step 4: Update Imports

In `lib/storage/image-uploader.ts`, change import:
```typescript
import { ImageUploadResult, ImageDeleteResult, ImageUploadOptions, IMAGE_CONFIG } from './types';
```

In `lib/storage/ImageUploadComponent.tsx`, change import:
```typescript
import { ProductImage } from './types';
```

### Step 5: Integrate Upload Component

In your admin product page (e.g., `app/admin/quote/suppliers/page.tsx`):

```typescript
import { ImageUploadComponent } from '@/lib/storage/ImageUploadComponent';
import { ProductImage } from '@/lib/storage/types';

function ProductDialog() {
  const [images, setImages] = useState<ProductImage[]>([]);

  return (
    <Dialog>
      <DialogContent>
        <ImageUploadComponent
          productId={productId}
          category={category}
          images={images}
          onImagesChange={setImages}
          maxImages={5}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### Step 6: Display Images in Catalog

In your product catalog:

```typescript
function ProductCard({ product }) {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div>
      {primaryImage ? (
        <img src={primaryImage.url} alt={primaryImage.alt} />
      ) : (
        <div>No image</div>
      )}
    </div>
  );
}
```

### Step 7: Test

```bash
npm run dev
# Go to admin product management
# Upload 2-3 test images
# Set one as primary
# View in catalog
# Verify images display correctly
```

### ✅ Success Criteria
- Can upload images
- Images save to Supabase Storage
- Primary image designation works
- Images display in catalog
- Can delete images
- Mobile view works

---

## ✏️ Module 4: Manual Quantity Editing

### Time Required: 1-2 hours

### Step 1: Run Database Migration

```bash
# Copy migration
cp quote-builder-phase2-modules/quantity-editing/sql/adjustments-table.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_create_extraction_adjustments.sql

# Apply migration
supabase db push
```

### Step 2: Copy Files

```bash
# Create directories
mkdir -p lib/extraction

# Copy files
cp quote-builder-phase2-modules/quantity-editing/types/index.ts lib/extraction/types.ts
cp quote-builder-phase2-modules/quantity-editing/lib/QuantityEditor.tsx lib/extraction/QuantityEditor.tsx

# Create API route
mkdir -p app/api/quote/extraction/[jobId]/adjust
cp quote-builder-phase2-modules/quantity-editing/api/route.ts app/api/quote/extraction/[jobId]/adjust/route.ts
```

### Step 3: Update Imports

In `lib/extraction/QuantityEditor.tsx`:
```typescript
import { ExtractedItem, AdjustmentRequest, ADJUSTMENT_REASONS } from './types';
```

### Step 4: Integrate into Extraction Review Page

See detailed example in `quote-builder-phase2-modules/quantity-editing/README.md`

Key steps:
1. Load extracted data
2. Load existing adjustments
3. Merge adjustments with extracted data
4. Render QuantityEditor for each item
5. Handle adjustment saves
6. Pass adjusted quantities to catalog

### Step 5: Test

```bash
npm run dev
# Go to extraction review page
# Click edit on any quantity
# Change value and save
# Verify "Adjusted" badge appears
# Refresh page - adjustment persists
# Continue to catalog - adjusted quantity used
```

### ✅ Success Criteria
- Can edit quantities inline
- Adjustments save to database
- Badge shows on adjusted items
- Can revert to original
- Adjustments persist
- Adjusted quantities used in catalog

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: PDF Generation Fails

**Error:** "Could not find Chrome"

**Solution:**
```bash
npx puppeteer browsers install chrome
```

#### Issue: Email Not Sending

**Error:** "RESEND_API_KEY not configured"

**Solution:**
1. Check `.env.local` has `RESEND_API_KEY`
2. Restart dev server
3. Verify key is correct (starts with `re_`)

#### Issue: Images Not Uploading

**Error:** 401/403 on upload

**Solution:**
1. Verify Supabase Storage bucket is created
2. Check RLS policies are applied
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set

#### Issue: Adjustments Not Saving

**Error:** Table doesn't exist

**Solution:**
```bash
# Run migration
supabase db push

# Or create table manually in Supabase SQL Editor
```

---

## 📊 Integration Verification Checklist

### PDF Generation
- [ ] Puppeteer installed
- [ ] Files copied to correct locations
- [ ] Imports updated
- [ ] Download button added to review page
- [ ] Test PDF downloads successfully
- [ ] PDF formatting looks correct

### Email Delivery
- [ ] Resend API key obtained
- [ ] Environment variables configured
- [ ] Resend package installed
- [ ] Database migration run
- [ ] Files copied to correct locations
- [ ] Imports updated
- [ ] Send button added to review page
- [ ] Test email sends successfully
- [ ] Email received with PDF attachment

### Product Images
- [ ] Supabase Storage bucket created
- [ ] Bucket set to public
- [ ] Database migration run
- [ ] Storage policies applied
- [ ] Files copied to correct locations
- [ ] Imports updated
- [ ] Upload component added to admin
- [ ] Display logic added to catalog
- [ ] Test image upload works
- [ ] Test image display works
- [ ] Test image deletion works

### Quantity Editing
- [ ] Database migration run
- [ ] Files copied to correct locations
- [ ] Imports updated
- [ ] Component integrated into review page
- [ ] Load adjustments logic added
- [ ] Save handler implemented
- [ ] Adjusted quantities passed to catalog
- [ ] Test edit/save/revert works
- [ ] Test adjustments persist

---

## 🎉 Final Testing

### End-to-End Test

1. **Create Quote:**
   - Start at lead capture
   - Upload construction plan
   - Review extracted quantities
   - **Edit a quantity** (Quantity Editing)
   - Continue to catalog

2. **Build Quote:**
   - Browse catalog with **product images** (Product Images)
   - Select products
   - Review quote

3. **Deliver Quote:**
   - **Download PDF** (PDF Generation)
   - **Send email** (Email Delivery)
   - Verify PDF attached to email

4. **Verify:**
   - All features work together
   - No console errors
   - Database records created
   - Tracking working

---

## 📝 Post-Integration Tasks

### 1. Customize Branding

- Add company logo to PDFs
- Customize email template colors
- Update terms & conditions

### 2. Configure Production Settings

- Set up domain verification for email
- Configure CDN for images (optional)
- Set up error monitoring
- Configure backups

### 3. Documentation

- Document any custom modifications
- Update team on new features
- Create user guides if needed

### 4. Monitoring

- Monitor email deliverability
- Track PDF generation errors
- Monitor storage usage
- Review adjustment patterns

---

## 🆘 Support

### Documentation

Each module has a detailed README:
- `quote-builder-phase2-modules/pdf-generation/README.md`
- `quote-builder-phase2-modules/email-delivery/README.md`
- `quote-builder-phase2-modules/product-images/README.md`
- `quote-builder-phase2-modules/quantity-editing/README.md`

### Testing Scripts

See `quote-builder-phase2-modules/testing/` for test scripts

---

## ✅ Integration Complete!

Once all modules are integrated and tested, you'll have:

- ✅ Professional PDF quote generation
- ✅ Automated email delivery with tracking
- ✅ Visual product catalog with images
- ✅ Manual quantity editing and adjustments
- ✅ Complete audit trail
- ✅ Production-ready Quote Builder

**Congratulations! Your Phase 2 implementation is complete.**

---

**Last Updated:** January 18, 2026
**Version:** 1.0.0
**Status:** Ready for Production
