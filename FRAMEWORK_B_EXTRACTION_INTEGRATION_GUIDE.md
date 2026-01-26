# Framework B & Construction Plan Intelligence - Integration Guide for Quote Builder

## Executive Summary

This document describes the **existing AI extraction systems** and how the new **Construction Quote Builder** will integrate with them **without modifying any existing code**.

---

## 1. Existing Extraction Systems

### System A: Framework B (General Document AI)
**Location:** `/Framework_B_Implementation/`
**Purpose:** Generic document processing with RAG, chat, and semantic search
**Status:** ✅ Production-ready, fully secured and monitored

**Key Features:**
- Upload PDF/DOCX/TXT documents
- Extract text and chunk for embeddings
- Store vectors in Pinecone for semantic search
- RAG-powered Q&A with citations
- AI chat with conversation memory

**API Endpoints:**
- `POST /api/framework-b/documents/upload` - Upload and index documents
- `POST /api/framework-b/documents/search` - Semantic search
- `POST /api/framework-b/documents/summarize` - AI summarization
- `POST /api/framework-b/chat/send` - Chat with documents
- `GET/POST/DELETE /api/framework-b/chat/conversations` - Manage conversations

**Upload Response Format:**
```json
{
  "success": true,
  "documentId": "doc-1736890123456-abc123",
  "filename": "supplier-catalog.pdf",
  "chunksCreated": 45,
  "vectorsIndexed": 45,
  "namespace": "project-xyz/supplier-123",
  "userId": "user-uuid",
  "metadata": {
    "format": "pdf",
    "size": 1024000,
    "wordCount": 5000,
    "pageCount": 10,
    "tokensUsed": 1200,
    "processingTime": 3500
  }
}
```

**What Framework B Does NOT Do:**
- ❌ Extract structured construction quantities (doors, windows, etc.)
- ❌ Understand construction plans, symbols, or schedules
- ❌ Return structured JSON with construction data

**Use Case for Quote Builder:**
- Upload supplier catalogs for semantic search
- Chat interface to ask questions about products
- Search for products by description

---

### System B: Construction Plan Intelligence (Construction-Specific AI)
**Location:** `/construction_plan_intelligence/`
**Purpose:** AI vision-based extraction of quantities from construction plans
**Status:** ✅ Fully implemented and integrated into CRM

**Key Features:**
- Upload construction plans (PDF with drawings/schedules)
- Render pages to images at 300 DPI
- Select relevant pages (door/window schedules, floor plans, legends)
- 2-pass OpenAI Vision extraction (extract → audit)
- Structured JSON output with confidence scores
- Evidence tracking (which page, which schedule/symbol)

**API Endpoints:**
- `POST /api/plans/upload` - Upload construction plan
- `GET /api/plans/[jobId]/status` - Poll job status (queued/processing/completed/failed)
- `GET /api/plans/[jobId]/result` - Get extraction results
- `POST /api/quotes/generate` - Generate quote from extraction (basic implementation)

**Upload Workflow:**
```
1. User uploads PDF → Stored in Supabase Storage (bucket: 'plans')
2. Job record created in `plan_jobs` table (status: queued)
3. Python worker polls for queued jobs every 5 seconds
4. Worker processes:
   a. Renders PDF to images (300 DPI PNG)
   b. Selects relevant pages
   c. Pass 1: OpenAI extracts quantities
   d. Pass 2: OpenAI audits for consistency
   e. Validates JSON schema
5. Results saved to `plan_analyses` table (status: completed/needs_review/failed)
6. User fetches results via /api/plans/[jobId]/result
```

**Extraction JSON Schema:**
```json
{
  "meta": {
    "floors_detected": 2,
    "plan_type": "residential|commercial|mixed|unknown",
    "units": "imperial|metric|unknown",
    "notes": "Any important observations"
  },
  "doors": {
    "total": 12,
    "by_type": {
      "entry": 2,
      "interior": 8,
      "sliding": 1,
      "bifold": 1,
      "other": 0
    },
    "confidence": "high|medium|low",
    "evidence": [
      {
        "page_no": 3,
        "artifact_id": "uuid-abc-123",
        "source": "schedule|legend|plan_symbols|ocr_text",
        "note": "Door schedule on page 3 shows 12 total doors"
      }
    ]
  },
  "windows": {
    "total": 18,
    "by_type": {
      "fixed": 4,
      "casement": 10,
      "sliding": 4,
      "other": 0
    },
    "confidence": "high|medium|low",
    "evidence": []
  },
  "kitchen": {
    "cabinets_count_est": 24,
    "linear_ft_est": 32,
    "confidence": "medium",
    "evidence": []
  },
  "bathrooms": {
    "bathroom_count": 3,
    "toilets": 3,
    "sinks": 4,
    "showers": 2,
    "bathtubs": 1,
    "confidence": "high",
    "evidence": []
  },
  "other_fixtures": {
    "wardrobes": 4,
    "closets": 6,
    "shelving_units": 2,
    "confidence": "medium",
    "evidence": []
  },
  "review": {
    "needs_review": false,
    "flags": ["Some door types unclear from symbols"],
    "assumptions": ["Assumed all single doors unless marked double"]
  }
}
```

**Database Tables:**
- `plan_jobs` - Job queue and tracking
- `plan_analyses` - Extraction results (JSON stored in `quantities` column)
- `plan_job_artifacts` - Page images and debug artifacts
- `quotes` - Basic quote records (to be enhanced by Quote Builder)
- `quote_lines` - Quote line items
- `price_books` - Price book management
- `price_items` - Product catalog with pricing
- `products` - Product master data
- `product_assets` - Product images/documents

**Result API Response Format:**
```json
{
  "job": {
    "id": "job-uuid",
    "user_id": "user-uuid",
    "filename": "residential-plan.pdf",
    "file_path": "user-uuid/residential-plan.pdf",
    "status": "completed",
    "created_at": "2026-01-16T10:00:00Z",
    "started_at": "2026-01-16T10:00:05Z",
    "completed_at": "2026-01-16T10:02:30Z",
    "error": null
  },
  "analysis": {
    "id": "analysis-uuid",
    "model": "gpt-4o",
    "quantities": { /* JSON schema above */ },
    "confidence": "high",
    "evidence": {},
    "needs_review": false,
    "created_at": "2026-01-16T10:02:30Z"
  },
  "quote": {
    "id": "quote-uuid",
    "status": "draft",
    "total": 45000.00,
    "currency": "USD"
  },
  "artifacts": [
    {
      "id": "artifact-uuid",
      "job_id": "job-uuid",
      "page_no": 1,
      "artifact_type": "page_image",
      "file_path": "artifacts/job-uuid/page-001.png",
      "created_at": "2026-01-16T10:01:00Z"
    }
  ]
}
```

**What Construction Plan Intelligence Does NOT Do:**
- ❌ Advanced pricing logic (markup, regional variations, customer tiers)
- ❌ Lead capture or customer management
- ❌ Compliance filtering by region/building codes
- ❌ Premium product filtering by customer segment
- ❌ PDF quote generation with branding
- ❌ Email delivery of quotes
- ❌ Supplier catalog management (200-270 suppliers)
- ❌ Price versioning and audit logs

---

## 2. Integration Strategy for Quote Builder

### Core Principle
**DO NOT MODIFY EXISTING SYSTEMS**
- Framework B and Construction Plan Intelligence are production systems
- Quote Builder will be a new modular system that **consumes** their outputs

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSTRUCTION QUOTE BUILDER                │
│                      (New Modular System)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                 Wrapper APIs (read-only)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌──────────────────────┐
│   Framework B    │                    │ Construction Plan    │
│  (Document AI)   │                    │   Intelligence       │
│  [READ ONLY]     │                    │  (Vision Extraction) │
│                  │                    │  [READ ONLY]         │
└──────────────────┘                    └──────────────────────┘
```

### Wrapper API Design

**New Endpoints (Quote Builder):**

1. **GET /api/quote/extraction/:upload_id**
   - Wrapper around `/api/plans/[jobId]/result`
   - Returns extraction data in Quote Builder format
   - Adds additional context (region, customer tier, etc.)
   - Does NOT modify underlying data

2. **POST /api/quote/lead**
   - Capture lead info BEFORE showing pricing
   - Store in new `quote_leads` table
   - Returns lead ID for session tracking

3. **GET /api/quote/catalog**
   - Query: `?region=los-angeles&categories=doors,windows&tier=premium`
   - Returns filtered catalog based on:
     - Region compliance rules
     - Customer tier (premium/standard)
     - Admin-controlled product visibility
   - Sources data from existing `price_items` table

4. **POST /api/quote/pricing/calculate**
   - Input: `{ leadId, extractionJobId, selectedProducts }`
   - Applies dynamic pricing rules:
     - Region-based pricing
     - Customer tier discounts
     - Volume discounts
     - Markup rules
   - Returns pricing breakdown (no DB write yet)

5. **POST /api/quote/generate**
   - Enhanced version of existing `/api/quotes/generate`
   - Creates formal quote with:
     - Lead info
     - Extraction results
     - Selected products
     - Applied pricing rules
     - Legal disclaimers
   - Stores in new `quotations` table (separate from existing `quotes`)

6. **GET /api/quote/pdf/:quoteId**
   - Generate PDF with branding
   - Include extraction evidence (page images)
   - Add compliance disclaimers

7. **POST /api/quote/email/:quoteId**
   - Send quote via SendGrid
   - Track delivery status

### Database Integration

**New Tables (Quote Builder):**
- `quote_leads` - Lead capture (name, email, phone, address, region)
- `quote_regions` - Region definitions (LA, NYC, etc.)
- `quote_compliance_rules` - Region-based material restrictions
- `quote_pricing_rules` - Dynamic pricing logic
- `quote_customer_tiers` - Premium/standard customer segments
- `quotations` - Enhanced quote records (separate from existing `quotes`)
- `quotation_lines` - Detailed line items with evidence links
- `quotation_versions` - Version history
- `quotation_audit_log` - Price change tracking

**Existing Tables (Read-Only):**
- `plan_jobs` - Read to get upload status
- `plan_analyses` - Read to get extraction results
- `plan_job_artifacts` - Read to display evidence images
- `price_items` - Read for product catalog (may add columns later)
- `products` - Read for product master data

**Bridge Pattern:**
- Quote Builder stores `extraction_job_id` (foreign key to `plan_jobs.id`)
- Quote Builder queries Construction Plan Intelligence tables via read-only views
- No circular dependencies

---

## 3. Detailed Integration Workflows

### Workflow 1: Customer Journey (Using Extraction)

```
1. LEAD CAPTURE
   User lands on /quote-builder
   → Fills out form (name, email, region, project type)
   → POST /api/quote/lead
   → Returns leadId, stores in session

2. PLAN UPLOAD
   User uploads construction plan PDF
   → POST /api/plans/upload (existing endpoint, unchanged)
   → Returns jobId
   → Quote Builder polls GET /api/plans/[jobId]/status

3. EXTRACTION COMPLETE
   Worker completes extraction (existing system, unchanged)
   → Quote Builder fetches GET /api/quote/extraction/:jobId (wrapper)
   → Displays extracted quantities with confidence scores
   → User can manually adjust if needed

4. REGION FILTERING
   Based on lead.region, filter catalog
   → GET /api/quote/catalog?region=los-angeles&categories=doors,windows
   → Returns only compliant products for LA
   → Admin pre-configured which suppliers shown to this customer tier

5. PRODUCT SELECTION
   User sees filtered catalog (auto-matched to extracted quantities)
   → Can swap products (e.g., upgrade from standard to premium door)
   → Quote Builder tracks selections in session

6. PRICING CALCULATION
   → POST /api/quote/pricing/calculate
   → Input: { leadId, extractionJobId, selectedProducts }
   → Returns: Pricing breakdown with regional markup, customer tier discount
   → User sees total but can't edit prices

7. QUOTE GENERATION
   User confirms
   → POST /api/quote/generate
   → Creates formal quote in database
   → Returns quoteId

8. PDF & EMAIL
   → GET /api/quote/pdf/:quoteId (generates PDF)
   → POST /api/quote/email/:quoteId (sends via SendGrid)
   → User gets PDF in email with legal disclaimers
```

### Workflow 2: Admin Catalog Management

```
1. Admin logs in to /admin/suppliers
2. Views 200-270 supplier list (from existing `price_items` table)
3. For each supplier:
   - Set region availability (LA, NYC, etc.)
   - Set customer tier visibility (premium only, standard only, all)
   - Upload catalog CSV (if available) → imports to `price_items`
   - Manually add products if no catalog available
4. Admin sets compliance rules:
   - LA requires fire-rated doors in multi-family → flag certain products
   - NYC bans certain window types → hide from catalog
5. Changes saved to `quote_pricing_rules` and `quote_compliance_rules`
```

### Workflow 3: Price Updates

```
1. Admin navigates to /admin/pricing
2. Searches for product (e.g., "36-inch entry door")
3. Updates price: $500 → $550
4. System:
   - Creates new row in `quote_pricing_rules` with effective_date
   - Stores old price in `quotation_audit_log`
   - Future quotes use new price
   - Historical quotes keep old price (immutable)
5. Quote Builder checks `effective_date` when calculating pricing
```

---

## 4. Data Flow Diagrams

### Upload → Extraction → Quote

```
┌────────┐
│ User   │
└────┬───┘
     │ 1. Upload Plan
     ▼
┌─────────────────────────────────┐
│ POST /api/plans/upload          │ ← Existing API (unchanged)
│ (Construction Plan Intelligence)│
└────────┬────────────────────────┘
         │ 2. Store file, create job
         ▼
┌─────────────────────────────────┐
│ Supabase Storage: plans/        │
│ Database: plan_jobs (queued)    │
└────────┬────────────────────────┘
         │ 3. Worker polls
         ▼
┌─────────────────────────────────┐
│ Python Worker                   │
│ - Render PDF → images           │
│ - Select pages                  │
│ - OpenAI Vision (2-pass)        │
│ - Validate JSON                 │
└────────┬────────────────────────┘
         │ 4. Save results
         ▼
┌─────────────────────────────────┐
│ Database: plan_analyses         │
│ { quantities: { doors: {...} }} │
└────────┬────────────────────────┘
         │
         │ 5. Quote Builder reads (wrapper)
         ▼
┌─────────────────────────────────┐
│ GET /api/quote/extraction/:id   │ ← New wrapper API
│ (Quote Builder)                 │
└────────┬────────────────────────┘
         │ 6. Returns enriched data
         ▼
┌─────────────────────────────────┐
│ Quote Builder UI                │
│ - Display quantities            │
│ - Allow manual edits            │
│ - Show confidence scores        │
│ - Link to evidence images       │
└─────────────────────────────────┘
```

### Catalog Filtering Flow

```
┌────────┐
│ Admin  │
└────┬───┘
     │ 1. Configure rules
     ▼
┌──────────────────────────────┐
│ quote_compliance_rules       │
│ - region: LA                 │
│ - rule: fire_rated_doors_req │
│ - products: [door-123, ...]  │
└──────┬───────────────────────┘
       │
       │ 2. User requests catalog
       ▼
┌──────────────────────────────┐
│ GET /api/quote/catalog       │
│ ?region=LA&tier=premium      │
└──────┬───────────────────────┘
       │ 3. Query
       ▼
┌──────────────────────────────┐
│ SELECT * FROM price_items    │
│ WHERE region LIKE '%LA%'     │
│   AND tier IN ('premium','all')│
│   AND compliant = true       │
└──────┬───────────────────────┘
       │ 4. Filter results
       ▼
┌──────────────────────────────┐
│ Return filtered catalog:     │
│ - 120 suppliers (of 270)     │
│ - Only LA-compliant products │
│ - Only premium tier visible  │
└──────────────────────────────┘
```

---

## 5. Implementation Phases

### Phase 1: MVP Integration (No Modification to Existing)

**Objectives:**
- Consume Construction Plan Intelligence extraction
- Basic lead capture
- Simple catalog filtering
- Quotation generation (on-screen only)

**New Components:**
1. Wrapper API: `GET /api/quote/extraction/:jobId`
   - Reads `plan_analyses` table
   - Returns extraction in Quote Builder format
   - No writes to existing tables

2. Lead Capture: `POST /api/quote/lead`
   - New `quote_leads` table
   - Simple form (name, email, region)

3. Catalog API: `GET /api/quote/catalog`
   - Reads `price_items` (existing table)
   - Simple region filtering (hardcoded LA first)

4. Quote Generation: `POST /api/quote/generate`
   - New `quotations` table (separate from existing `quotes`)
   - Links to extraction via `extraction_job_id`
   - On-screen display only (no PDF yet)

**Testing:**
- Upload construction plan via existing UI
- Wait for extraction to complete
- Generate quote using wrapper API
- Verify no existing tables modified

### Phase 2: Enhanced Features

**Objectives:**
- PDF generation
- Email delivery
- Multi-region support
- Premium product filtering

**New Components:**
1. PDF Generation: `GET /api/quote/pdf/:quoteId`
   - Uses puppeteer or pdfkit
   - Branded template
   - Include extraction evidence images

2. Email Service: `POST /api/quote/email/:quoteId`
   - SendGrid integration (sample credentials)
   - Track delivery status

3. Multi-Region: `quote_regions` table
   - LA, NYC, etc.
   - Region-specific compliance rules

4. Tier Filtering: `quote_customer_tiers`
   - Admin assigns customers to tiers
   - Filter products by tier

### Phase 3: Advanced Features

**Objectives:**
- Price versioning
- External pricing APIs
- Advanced markup rules
- Chat integration

**New Components:**
1. Price Versioning: `quotation_audit_log`
   - Track all price changes
   - Historical quotes immutable

2. External APIs: Home Depot pricing integration
   - Pluggable architecture
   - Fallback to manual pricing

3. Markup Engine: Complex rules
   - Volume discounts
   - Time-based pricing (10-15 day refresh)
   - Material cost fluctuations

4. Chat: Framework B integration
   - User can ask "Why is this door $500?"
   - RAG answers from supplier catalogs

---

## 6. Technical Specifications

### Wrapper API Implementation

**File:** `/app/api/quote/extraction/[jobId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  // 1. Authenticate (reuse existing auth)
  const cookieStore = await cookies();
  const supabase = createServerClient(/* ... */);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get jobId
  const params = await context.params;
  const { jobId } = params;

  // 3. Fetch from existing tables (READ ONLY)
  const { data: job } = await supabase
    .from('plan_jobs')
    .select('*, plan_analyses(*)')
    .eq('id', jobId)
    .single();

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 4. Verify ownership
  if (job.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 5. Check if complete
  if (job.status !== 'completed') {
    return NextResponse.json({
      status: job.status,
      message: 'Extraction not yet complete'
    });
  }

  // 6. Transform to Quote Builder format (enrichment layer)
  const extraction = job.plan_analyses[0];
  const quoteBuilderFormat = {
    jobId: job.id,
    uploadedAt: job.created_at,
    filename: job.filename,
    status: job.status,
    extraction: {
      model: extraction.model,
      confidence: extraction.confidence,
      needsReview: extraction.needs_review,
      quantities: extraction.quantities, // Pass through unchanged
      evidence: extraction.evidence,
    },
    // Add Quote Builder-specific metadata
    metadata: {
      estimatedLineItems: countLineItems(extraction.quantities),
      highConfidenceItems: getHighConfidenceItems(extraction.quantities),
      flagsForReview: extraction.quantities.review?.flags || [],
    }
  };

  return NextResponse.json(quoteBuilderFormat);
}

// Helper functions (no DB writes)
function countLineItems(quantities: any): number {
  return (
    (quantities.doors?.total || 0) +
    (quantities.windows?.total || 0) +
    (quantities.kitchen?.cabinets_count_est || 0) +
    (quantities.bathrooms?.bathroom_count || 0)
  );
}

function getHighConfidenceItems(quantities: any): string[] {
  const items = [];
  if (quantities.doors?.confidence === 'high') items.push('doors');
  if (quantities.windows?.confidence === 'high') items.push('windows');
  if (quantities.kitchen?.confidence === 'high') items.push('kitchen');
  if (quantities.bathrooms?.confidence === 'high') items.push('bathrooms');
  return items;
}
```

### Key Integration Points

1. **No Modifications:**
   - `plan_jobs` table - read only
   - `plan_analyses` table - read only
   - `/api/plans/*` endpoints - unchanged
   - Python worker - unchanged

2. **Wrapper Pattern:**
   - New API reads existing tables
   - Adds enrichment layer (metadata, formatting)
   - No writes to existing schema
   - Clean separation of concerns

3. **Database Isolation:**
   - New tables prefixed with `quote_*` or `quotation_*`
   - Foreign keys to existing tables (read-only relationships)
   - No cascading deletes affecting existing data

4. **Error Handling:**
   - If extraction fails, Quote Builder shows error
   - If wrapper fails, fallback to manual entry
   - Existing system continues working regardless

---

## 7. Testing Strategy

### Integration Tests

**Test 1: Extraction Wrapper**
```bash
# Upload plan via existing API
curl -X POST http://localhost:3000/api/plans/upload \
  -F "file=@test-plan.pdf"

# Wait for extraction (poll status)
# Then fetch via wrapper
curl http://localhost:3000/api/quote/extraction/JOB_ID

# Verify:
# - Returns 200 OK
# - Contains quantities object
# - Metadata enriched
# - No errors in logs
```

**Test 2: Read-Only Guarantee**
```sql
-- Before test: Count rows
SELECT COUNT(*) FROM plan_jobs;
SELECT COUNT(*) FROM plan_analyses;

-- Run wrapper API 100 times
-- After test: Count rows (should be unchanged)
SELECT COUNT(*) FROM plan_jobs;
SELECT COUNT(*) FROM plan_analyses;

-- Verify no UPDATE/DELETE statements in logs
```

**Test 3: Isolation**
```bash
# Create quote with wrapper
curl -X POST http://localhost:3000/api/quote/generate \
  -H "Content-Type: application/json" \
  -d '{"extractionJobId":"JOB_ID","leadId":"LEAD_ID"}'

# Verify:
# - New row in quotations table (Quote Builder)
# - No new row in quotes table (existing system)
# - plan_jobs.status unchanged
# - plan_analyses unchanged
```

### Edge Cases

1. **Extraction fails but quote builder works:**
   - User can manually enter quantities
   - Quote Builder doesn't depend on extraction success

2. **Extraction succeeds but wrapper fails:**
   - User can access results via existing UI
   - `/app-dashboard/plans/[jobId]/results` still works

3. **Quote Builder deleted but extraction preserved:**
   - Existing system unaffected
   - No orphaned data in existing tables

---

## 8. Migration Path (Future)

If in the future we decide to merge systems:

### Option A: Keep Separate (Recommended)
- Quote Builder remains modular
- Existing system handles generic documents
- Construction Plan Intelligence handles plan extraction
- Clean separation of concerns

### Option B: Gradual Migration
1. Add new columns to existing tables (e.g., `price_items.tier`)
2. Migrate data from Quote Builder tables
3. Update Quote Builder to write to existing tables
4. Deprecate Quote Builder-specific tables
5. Update wrapper APIs to direct access

### Option C: Full Rewrite (Not Recommended)
- High risk of breaking existing features
- Long development time
- User-facing downtime
- Not aligned with current requirements

**Current Decision: Option A (Keep Separate)**
- Aligns with user's explicit request: "Do NOT modify existing"
- Modular architecture easier to maintain
- Can be deployed/updated independently
- Lower risk

---

## 9. Summary Checklist

### Integration Requirements ✅

- [x] Understand Framework B upload format
- [x] Understand Construction Plan Intelligence extraction format
- [x] Document JSON schema for extraction results
- [x] Design wrapper API pattern (read-only)
- [x] Identify existing tables to read (no writes)
- [x] Define new tables for Quote Builder
- [x] Plan data flow (upload → extract → quote)
- [x] Ensure no modifications to existing code
- [x] Document testing strategy
- [x] Create integration guide

### Next Steps (Implementation)

1. **Investigate Complete** ✅
   - Extraction format documented
   - Integration strategy defined
   - No existing code will be modified

2. **Ready for Phase 1 Implementation:**
   - Create wrapper API `/api/quote/extraction/[jobId]`
   - Create new database tables (quote_leads, quotations, etc.)
   - Build lead capture form
   - Build quotation generation logic
   - Test end-to-end without modifying existing systems

3. **User Confirmation Needed:**
   - Review this integration guide
   - Approve wrapper approach
   - Confirm Phase 1 scope
   - Proceed with implementation

---

## Appendix A: Example Data Flow

### Real-World Scenario: Residential Home Quote

**Step 1: Upload**
```json
POST /api/plans/upload
Response: { "jobId": "abc-123", "status": "queued" }
```

**Step 2: Extraction (Existing System)**
```json
// Worker processes, saves to plan_analyses
{
  "quantities": {
    "doors": { "total": 12, "by_type": { "entry": 2, "interior": 10 }, "confidence": "high" },
    "windows": { "total": 18, "confidence": "high" },
    "kitchen": { "cabinets_count_est": 24, "linear_ft_est": 32, "confidence": "medium" },
    "bathrooms": { "bathroom_count": 3, "toilets": 3, "sinks": 4, "confidence": "high" }
  }
}
```

**Step 3: Wrapper Read**
```json
GET /api/quote/extraction/abc-123
Response: {
  "extraction": { /* same as above */ },
  "metadata": {
    "estimatedLineItems": 57,
    "highConfidenceItems": ["doors", "windows", "bathrooms"]
  }
}
```

**Step 4: Quote Generation**
```json
POST /api/quote/generate
Body: {
  "leadId": "lead-456",
  "extractionJobId": "abc-123",
  "selections": {
    "doors": { "entry": { "productId": "door-premium-001", "qty": 2 } }
  }
}

Response: {
  "quoteId": "quote-789",
  "total": 45000.00,
  "lineItems": [
    { "category": "doors", "product": "Premium Entry Door", "qty": 2, "unitPrice": 750, "total": 1500 },
    // ... 56 more items
  ]
}
```

**Result:**
- Existing tables: Unchanged
- New tables: quotations, quotation_lines populated
- Link: quotations.extraction_job_id = "abc-123"

---

**End of Integration Guide**
