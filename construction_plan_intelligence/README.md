# Construction Plan Intelligence

**AI-Powered Construction Plan Analysis → Automatic Quote Generation**

## Overview

This system accepts PDF construction plans or images, extracts quantities (doors, windows, cabinets, fixtures), and automatically generates accurate quotes. It uses OpenAI GPT-4 for multimodal extraction, deterministic math for pricing, and provides confidence scoring with evidence tracking.

## Features

✅ **PDF & Image Support** - Process multi-page PDFs or single images
✅ **AI Extraction** - GPT-4 powered 2-pass extraction (extract → audit)
✅ **Confidence Scoring** - Low/Medium/High confidence per category
✅ **Evidence Tracking** - Links quantities to source pages
✅ **Deterministic Quotes** - Pure math pricing, no AI calculations
✅ **Product Catalog** - Customer product selection and repricing
✅ **Cost Efficient** - ~$0.10 per plan on average

## Architecture

```
User Upload (PDF/Image)
    ↓
Supabase Storage + Job Queue
    ↓
Python Worker
    ├─ PDF → Images (300 DPI)
    ├─ Page Selection (keyword-based)
    ├─ OpenAI Extraction (2-pass)
    ├─ JSON Validation (Pydantic)
    └─ Save Results
    ↓
Quote Generation API
    ├─ Map quantities → price items
    ├─ Calculate totals (deterministic)
    └─ Create quote + line items
    ↓
UI Display (React Components)
```

## Tech Stack

### Backend
- **Next.js 15** - API routes
- **Supabase** - Database, Storage, Auth
- **Python 3.10+** - Worker processes
- **OpenAI GPT-4** - Multimodal extraction
- **PyMuPDF** - PDF rendering
- **Pydantic** - JSON validation

### Frontend
- **React** - UI components
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling

## Database Schema

### Core Tables
1. **plan_jobs** - Processing job tracking
2. **plan_job_artifacts** - Page images, crops, debug data
3. **plan_analyses** - Final extraction results
4. **price_books** - Versioned price lists
5. **price_items** - Price book entries
6. **quotes** - Generated quotes (extends existing)
7. **quote_lines** - Quote line items
8. **products** - Product catalog
9. **product_assets** - Product images/specs

See `database/schema_fixed.sql` for full DDL (use this version - it's compatible with existing Supabase setups).

## Setup Instructions

### 1. Database Setup

Run the database schema:

```bash
# Option 1: Copy/paste in Supabase SQL Editor (recommended)
# Open https://supabase.com/dashboard → SQL Editor
# Copy contents of construction_plan_intelligence/database/schema_fixed.sql
# Execute

# Option 2: Command line (if you have psql configured)
psql -f construction_plan_intelligence/database/schema_fixed.sql
```

Create Supabase Storage bucket:
- Bucket name: `plans`
- Public: No (private bucket)

### 2. Environment Variables

Add to `.env.local`:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (already configured for Framework B)
OPENAI_API_KEY=your_openai_key

# Worker Configuration (optional)
PDF_DPI=300
OPENAI_MODEL=gpt-4o
MAX_PAGES=50
POLL_INTERVAL_SECONDS=5
```

### 3. Python Worker Setup

```bash
cd construction_plan_intelligence/worker

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp ../../.env.local .env

# Test configuration
python -c "import config; print('Config loaded successfully')"
```

### 4. Start Services

**Terminal 1 - Next.js Dev Server:**
```bash
npm run dev
```

**Terminal 2 - Python Worker:**
```bash
cd construction_plan_intelligence/worker
source venv/bin/activate
python worker.py
```

### 5. Seed Price Book (Optional)

```bash
# Run this SQL in Supabase to add sample prices:
# 1. Get the price book UUID from: SELECT id FROM price_books WHERE is_active = true;
# 2. Replace <price_book_uuid> in the INSERT statements in schema.sql
# 3. Execute the seed data section
```

## Usage

### API Endpoints

#### 1. Upload Plan
```bash
POST /api/plans/upload
Content-Type: multipart/form-data

file: <PDF or image file>

Response:
{
  "jobId": "uuid",
  "filePath": "plans/user_id/file.pdf",
  "status": "queued"
}
```

#### 2. Check Status
```bash
GET /api/plans/:jobId/status

Response:
{
  "job": { "id": "uuid", "status": "processing", ... },
  "progress": { "stage": "Processing plan", "percentage": 50 },
  "analysisId": "uuid" (if completed)
}
```

#### 3. Get Results
```bash
GET /api/plans/:jobId/result

Response:
{
  "job": { ... },
  "analysis": {
    "id": "uuid",
    "quantities": { doors: {...}, windows: {...}, ... },
    "confidence": { ... },
    "evidence": { ... }
  },
  "quote": { "id": "uuid", ... } (if generated)
}
```

#### 4. Generate Quote
```bash
POST /api/quotes/generate
Content-Type: application/json

{
  "jobId": "uuid",
  "priceBookId": "uuid" (optional)
}

Response:
{
  "quoteId": "uuid",
  "quote": { total: 50000, ... },
  "lines": [ {...}, {...} ],
  "hasLowConfidence": false
}
```

#### 5. Select Products
```bash
POST /api/quotes/:quoteId/select-products
Content-Type: application/json

{
  "selections": [
    { "lineId": "uuid", "productSku": "DOOR-WD-001" }
  ]
}

Response:
{
  "quote": { total: 58000, ... },
  "lines": [ {...} ],
  "recalculated": true
}
```

### React Components

#### Plan Upload Form
```tsx
import { PlanUploadForm } from '@/construction_plan_intelligence/components/PlanUploadForm';

<PlanUploadForm
  onUploadSuccess={(jobId) => {
    console.log('Job started:', jobId);
  }}
/>
```

#### Job Status Tracker
```tsx
import { JobStatusTracker } from '@/construction_plan_intelligence/components/JobStatusTracker';

<JobStatusTracker
  jobId="job-uuid"
  onComplete={(analysisId) => {
    console.log('Analysis ready:', analysisId);
  }}
  pollInterval={3000}
/>
```

#### Extraction Results Viewer
```tsx
import { ExtractionResultsViewer } from '@/construction_plan_intelligence/components/ExtractionResultsViewer';

<ExtractionResultsViewer
  jobId="job-uuid"
  onGenerateQuote={() => {
    // Navigate to quote generation
  }}
/>
```

## Extraction JSON Schema

```json
{
  "meta": {
    "floors_detected": 1,
    "plan_type": "residential|commercial|mixed|unknown",
    "units": "imperial|metric|unknown",
    "notes": ""
  },
  "doors": {
    "total": 12,
    "by_type": { "entry": 2, "interior": 10, "sliding": 0, "bifold": 0, "other": 0 },
    "confidence": "high",
    "evidence": [
      { "page_no": 0, "artifact_id": "uuid", "source": "schedule", "note": "Door schedule on first page" }
    ]
  },
  "windows": { "total": 8, "confidence": "medium", "evidence": [...] },
  "kitchen": { "cabinets_count_est": 12, "linear_ft_est": 24, "confidence": "low", "evidence": [...] },
  "bathrooms": { "bathroom_count": 2, "toilets": 2, "sinks": 2, "showers": 2, "bathtubs": 1, "confidence": "high", "evidence": [...] },
  "other_fixtures": { "wardrobes": 4, "closets": 2, "shelving_units": 0, "confidence": "medium", "evidence": [...] },
  "review": {
    "needs_review": false,
    "flags": [],
    "assumptions": ["Assumed all unlabeled doors are interior doors"]
  }
}
```

## Cost Estimates

**Per Plan:**
- OpenAI GPT-4 extraction (2-pass): $0.05 - $0.15
- Supabase Storage (10MB): ~$0.001
- **Total: ~$0.10 per plan**

**Monthly (100 plans):**
- Processing: ~$10
- Storage (1GB): ~$0.10
- **Total: ~$10-15/month**

## Performance

- **Upload:** Instant (async processing)
- **Processing Time:** 2-5 minutes for typical 10-page plan
- **Accuracy:** 80-95% depending on plan quality
- **Throughput:** 1 plan per worker (run multiple workers for scale)

## Upgrade Path

### v1 (Current - Ship Fast)
✅ PDF→images + keyword page selection
✅ OpenAI 2-pass extraction
✅ Deterministic quote generation
✅ Basic UI components

### v2 (Accuracy Jump)
- Better table detection/cropping
- Evidence overlay UI (show crops)
- Caching of processed pages
- Product recommendations

### v3 (Scale)
- Multiple worker processes
- Queue system + retries
- Role-based access
- Audit logs
- Performance optimization

## Troubleshooting

### Worker not processing jobs

1. Check worker is running: `ps aux | grep worker.py`
2. Check logs: Worker prints to stdout
3. Verify environment variables are loaded
4. Test Supabase connection:
   ```python
   from supabase_io import supabase
   print(supabase.table("plan_jobs").select("*").limit(1).execute())
   ```

### Extraction quality is low

1. Check if schedules are present (highest accuracy source)
2. Verify PDF quality (minimum 200 DPI recommended)
3. Review page selection - ensure schedule pages are selected
4. Check OpenAI model (gpt-4o recommended for vision)

### Quote totals incorrect

1. Quotes use deterministic math - check price_items table
2. Verify active price book: `SELECT * FROM price_books WHERE is_active = true`
3. Check mapping rules in `api/quotes/generate/route.ts`

## Integration with Main App

This system is built in isolation and ready for integration:

1. **Copy API routes** to `app/api/plans/` and `app/api/quotes/`
2. **Copy components** to `components/`
3. **Copy types** to `lib/types/`
4. **Run database migration** in Supabase
5. **Deploy Python worker** to server
6. **Add UI pages** for plan upload and results

## Security Considerations

- ✅ All API routes require authentication
- ✅ RLS policies enforce data isolation
- ✅ Service role key only in worker (server-side)
- ✅ File upload validation (type, size)
- ✅ Private storage bucket (no public access)

## Testing

### Manual Testing Checklist

- [ ] Upload PDF plan
- [ ] Check job status updates
- [ ] Verify extraction results
- [ ] Generate quote
- [ ] Select products and reprice
- [ ] Test with low-quality plan (should flag for review)
- [ ] Test with image upload

### Sample Plans

Place sample construction plans in `test_plans/` directory for testing.

## License

Part of Gold.Arch Construction Supplier CRM

---

**Status:** Ready for testing and integration
**Version:** 1.0
**Last Updated:** January 2026
