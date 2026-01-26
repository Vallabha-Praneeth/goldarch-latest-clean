# Phase 2 - System Architecture

**Visual guide to how Phase 2 modules integrate with your Quote Builder**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Quote Builder Phase 2                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     PDF      │    │    Email     │    │   Product    │    │   Quantity   │
│  Generation  │    │   Delivery   │    │    Images    │    │   Editing    │
│              │    │              │    │              │    │              │
│  ⭐⭐⭐     │    │  ⭐⭐⭐     │    │   ⭐⭐      │    │   ⭐⭐      │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                    │                    │                    │
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Phase 1 Quote Builder                           │
│  (Lead Capture → Plan Upload → Extraction → Catalog → Quote Review)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Complete Quote Generation Flow with Phase 2

```
┌─────────────┐
│   Customer  │
│  Provides   │
│  Lead Info  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Upload    │
│Construction │
│    Plan     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  AI Extract │
│ Quantities  │
└──────┬──────┘
       │
       ▼
┌─────────────┐          ┌──────────────────┐
│   Review    │───────▶  │ ✏️ QUANTITY      │  NEW
│ Extracted   │  Edit?   │   EDITING        │  ───
│ Quantities  │          │   MODULE         │
└──────┬──────┘          └──────────────────┘
       │                          │
       ▼                          │
┌─────────────┐                  │
│   Browse    │◀─────────────────┘
│   Product   │          ┌──────────────────┐
│   Catalog   │───────▶  │ 🖼️ PRODUCT       │  NEW
└──────┬──────┘  Images  │   IMAGES         │  ───
       │                 │   MODULE         │
       ▼                 └──────────────────┘
┌─────────────┐
│   Select    │
│  Products & │
│   Generate  │
│    Quote    │
└──────┬──────┘
       │
       ▼
┌─────────────┐          ┌──────────────────┐
│   Review    │          │ 📄 PDF           │  NEW
│    Final    │─────┬───▶│   GENERATION     │  ───
│    Quote    │     │    │   MODULE         │
└─────────────┘     │    └────────┬─────────┘
                    │             │
                    │             ▼
                    │    ┌──────────────────┐
                    └───▶│ 📧 EMAIL         │  NEW
                         │   DELIVERY       │  ───
                         │   MODULE         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Customer       │
                         │   Receives       │
                         │   Quote          │
                         └──────────────────┘
```

---

## 🔄 Module Integration Points

### PDF Generation Module

```
Review Page
    │
    │ User clicks "Download PDF"
    ▼
┌──────────────────────────┐
│ /api/quote/pdf/[quoteId] │
│                          │
│  1. Fetch quote data     │
│  2. Generate HTML        │
│  3. Render to PDF        │
│  4. Return buffer        │
└──────────┬───────────────┘
           │
           ▼
      PDF Download
```

**Integration Point:** Add button to review page
**Dependencies:** Puppeteer
**Database:** None (reads existing quotes)

---

### Email Delivery Module

```
Review Page
    │
    │ User clicks "Send Email"
    ▼
┌────────────────────────────┐
│ /api/quote/email/[quoteId] │
│                            │
│  1. Fetch quote data       │
│  2. Generate PDF           │◀─── Uses PDF Module
│  3. Generate email HTML    │
│  4. Send via Resend        │
│  5. Track in database      │
└──────────┬─────────────────┘
           │
           ▼
   ┌───────────────────┐
   │ quote_email_      │
   │ tracking table    │
   └───────────────────┘
```

**Integration Point:** Add button to review page
**Dependencies:** Resend, PDF Module
**Database:** `quote_email_tracking` table

---

### Product Images Module

```
Admin Panel
    │
    │ Admin uploads images
    ▼
┌──────────────────────────────┐
│ /api/quote/products/images   │
│                              │
│  1. Validate file            │
│  2. Upload to Supabase       │
│  3. Update product record    │
└──────────┬───────────────────┘
           │
           ▼
   ┌───────────────────┐
   │ Supabase Storage  │
   │ (products bucket) │
   └───────────────────┘
           │
           ▼
   ┌───────────────────┐
   │ products.images   │
   │ column (JSONB)    │
   └───────────────────┘
           │
           │ Read by
           ▼
   ┌───────────────────┐
   │ Product Catalog   │
   │ (displays images) │
   └───────────────────┘
```

**Integration Point:** Add to admin product management
**Dependencies:** Supabase Storage
**Database:** `products.images` column

---

### Quantity Editing Module

```
Extraction Review Page
    │
    │ User edits quantity
    ▼
┌──────────────────────────────────┐
│ /api/quote/extraction/[jobId]/   │
│ adjust                           │
│                                  │
│  1. Validate adjustment          │
│  2. Save to database             │
│  3. Return updated data          │
└──────────┬───────────────────────┘
           │
           ▼
   ┌───────────────────────┐
   │ quote_extraction_     │
   │ adjustments table     │
   └───────────┬───────────┘
               │
               │ Merged with
               ▼
   ┌───────────────────────┐
   │ Original extraction   │
   │ results               │
   └───────────┬───────────┘
               │
               │ Used in
               ▼
   ┌───────────────────────┐
   │ Catalog page          │
   │ (adjusted quantities) │
   └───────────────────────┘
```

**Integration Point:** Add to extraction review page
**Dependencies:** Zod (validation)
**Database:** `quote_extraction_adjustments` table

---

## 🗄️ Database Schema Changes

### New Tables

```sql
-- Email Tracking
quote_email_tracking
├── id (UUID)
├── quotation_id (FK → quotations)
├── recipient_email
├── sent_at
├── provider_message_id
└── status

-- Extraction Adjustments
quote_extraction_adjustments
├── id (UUID)
├── job_id (FK → plan_jobs)
├── category
├── item_type
├── original_quantity
├── adjusted_quantity
├── reason
└── adjusted_at
```

### Modified Tables

```sql
-- Products (add images column)
products
├── id
├── name
├── category
├── price
└── images (JSONB) ← NEW
    └── [
        {
          "url": "...",
          "alt": "...",
          "isPrimary": true,
          "order": 0
        }
      ]
```

---

## 📂 File Structure After Integration

```
your-project/
│
├── app/
│   ├── api/
│   │   └── quote/
│   │       ├── pdf/
│   │       │   └── [quoteId]/
│   │       │       └── route.ts          ← PDF API
│   │       ├── email/
│   │       │   └── [quoteId]/
│   │       │       └── route.ts          ← Email API
│   │       ├── products/
│   │       │   └── images/
│   │       │       └── route.ts          ← Images API
│   │       └── extraction/
│   │           └── [jobId]/
│   │               └── adjust/
│   │                   └── route.ts      ← Adjustments API
│   │
│   ├── quote-builder/
│   │   └── review/
│   │       └── [quoteId]/
│   │           └── page.tsx              ← Add PDF + Email buttons
│   │
│   └── admin/
│       └── quote/
│           └── suppliers/
│               └── page.tsx              ← Add Image upload
│
├── lib/
│   ├── pdf/
│   │   ├── types.ts                      ← PDF types
│   │   └── pdf-generator.ts              ← PDF logic
│   │
│   ├── email/
│   │   ├── types.ts                      ← Email types
│   │   └── email-service.ts              ← Email logic
│   │
│   ├── storage/
│   │   ├── types.ts                      ← Image types
│   │   ├── image-uploader.ts             ← Upload logic
│   │   └── ImageUploadComponent.tsx      ← React component
│   │
│   └── extraction/
│       ├── types.ts                      ← Adjustment types
│       └── QuantityEditor.tsx            ← React component
│
├── supabase/
│   └── migrations/
│       ├── YYYYMMDDHHMMSS_create_email_tracking.sql
│       ├── YYYYMMDDHHMMSS_add_product_images.sql
│       └── YYYYMMDDHHMMSS_create_extraction_adjustments.sql
│
└── .env.local
    ├── RESEND_API_KEY=...
    ├── EMAIL_FROM_ADDRESS=...
    └── EMAIL_FROM_NAME=...
```

---

## 🔐 Security Architecture

### Authentication & Authorization

```
User Request
    │
    ▼
┌─────────────────┐
│ Next.js API     │
│ Route Handler   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Client │
│ (Service Role)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RLS Policies    │
│ Enforce Access  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database Query  │
│ Executes        │
└─────────────────┘
```

**Security Features:**
- ✅ Service role key for API routes
- ✅ RLS policies on all tables
- ✅ Input validation (Zod schemas)
- ✅ File type/size validation
- ✅ Secure storage (Supabase)

---

## 🚀 Deployment Architecture

### Development
```
Local Machine
├── Next.js Dev Server (npm run dev)
├── Supabase (Cloud)
└── Resend (Cloud)
```

### Production (Vercel)
```
Vercel Edge Network
├── Next.js Serverless Functions
│   ├── PDF Generation (with Puppeteer)
│   ├── Email Delivery (via Resend API)
│   ├── Image Upload (to Supabase Storage)
│   └── Adjustment Tracking (to Supabase DB)
│
├── Supabase Cloud
│   ├── PostgreSQL Database
│   └── Storage (S3-compatible)
│
└── Resend Cloud
    └── Email Delivery Service
```

**Production Considerations:**
- ⚠️ Puppeteer requires serverless optimization
- ⚠️ Consider using `@sparticuz/chromium` for Vercel
- ⚠️ Monitor Supabase storage usage
- ⚠️ Track Resend email quota

---

## 🔄 Data Flow Examples

### Example 1: Customer Receives Quote via Email

```
1. Customer fills lead form
2. Admin generates quote
3. Admin clicks "Send Email" button
   │
   ├─▶ POST /api/quote/email/[quoteId]
   │
   ├─▶ Fetch quote from database
   │
   ├─▶ Call PDF module → Generate PDF
   │
   ├─▶ Call Email service → Send via Resend
   │
   ├─▶ Save to quote_email_tracking
   │
   └─▶ Customer receives email with PDF
```

### Example 2: Product with Images in Catalog

```
1. Admin uploads product image
   │
   ├─▶ POST /api/quote/products/images
   │
   ├─▶ Validate file (size, type)
   │
   ├─▶ Upload to Supabase Storage
   │
   ├─▶ Update products.images column
   │
   └─▶ Image URL stored in database

2. Customer browses catalog
   │
   ├─▶ Query products with images
   │
   ├─▶ Find primary image or first image
   │
   └─▶ Display image in product card
```

### Example 3: Adjust Extracted Quantity

```
1. AI extracts 15 doors from plan
2. User reviews and notices error
3. User clicks edit, changes to 18
   │
   ├─▶ POST /api/quote/extraction/[jobId]/adjust
   │
   ├─▶ Validate new quantity
   │
   ├─▶ Save to quote_extraction_adjustments
   │
   └─▶ Return success

4. User proceeds to catalog
   │
   ├─▶ Load extraction results
   │
   ├─▶ Load adjustments
   │
   ├─▶ Merge: Use 18 instead of 15
   │
   └─▶ Display products for 18 doors
```

---

## 📊 Performance Characteristics

| Module | Response Time | Resource Usage | Scalability |
|--------|--------------|----------------|-------------|
| PDF Generation | 1-3 seconds | High CPU | Moderate |
| Email Delivery | 0.5-2 seconds | Low | High |
| Product Images | 0.2-1 second | Moderate | High |
| Quantity Editing | 0.1-0.5 seconds | Low | High |

**Notes:**
- PDF generation is most resource-intensive
- Consider caching PDFs if regenerating frequently
- Image uploads limited by network speed
- Email delivery depends on Resend API

---

## 🧩 Module Dependencies

```
┌─────────────────┐
│ PDF Generation  │
└────────┬────────┘
         │
         │ Uses
         ▼
┌─────────────────┐
│ Email Delivery  │
└─────────────────┘

(Other modules are independent)
```

**Dependency Graph:**
- Email → PDF (uses PDF generation for attachments)
- All modules → Supabase (for data)
- Images → Supabase Storage
- Adjustments → Independent

---

## 🔌 External Service Integration

```
Your Application
    │
    ├─▶ Supabase
    │   ├── PostgreSQL (data)
    │   └── Storage (images)
    │
    ├─▶ Resend
    │   └── Email delivery
    │
    └─▶ Puppeteer
        └── PDF rendering
```

**API Limits:**
- Supabase Free: 500MB DB, 1GB storage
- Resend Free: 3,000 emails/month
- Puppeteer: No limits (self-hosted)

---

## 📈 Scalability Considerations

### Current Architecture
- ✅ Handles 100s of quotes/day
- ✅ Serverless scales automatically
- ✅ Database supports 1000s of products

### Future Scaling Options
- 🔄 PDF caching for repeat downloads
- 🔄 Image CDN (Cloudinary, ImageKit)
- 🔄 Queue system for email delivery
- 🔄 Database read replicas

---

**This architecture supports your Quote Builder from MVP to production scale.** 🚀
