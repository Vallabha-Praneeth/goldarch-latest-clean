# Construction Plan Intelligence - Quick Start Guide

## 🚀 Get Running in 15 Minutes

### Prerequisites

- ✅ Node.js 18+ installed
- ✅ Python 3.10+ installed
- ✅ Supabase project set up
- ✅ OpenAI API key

---

## Step 1: Database Setup (5 minutes)

### 1.1 Run Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy contents of `construction_plan_intelligence/database/schema_fixed.sql`
4. Execute the SQL (this creates all tables and RLS policies)

### 1.2 Create Storage Bucket

1. In Supabase Dashboard, go to Storage
2. Click "Create Bucket"
3. Name: `plans`
4. Public: **No** (keep private)
5. Click "Create bucket"

### 1.3 Verify Setup

Run this query in SQL Editor:
```sql
SELECT COUNT(*) FROM plan_jobs;
SELECT COUNT(*) FROM price_books WHERE is_active = true;
```

Expected: 0 jobs, 1 active price book

---

## Step 2: Environment Setup (2 minutes)

Your `.env.local` should already have:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

If not, add them now.

---

## Step 3: Python Worker Setup (5 minutes)

```bash
# Navigate to worker directory
cd construction_plan_intelligence/worker

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Mac/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Copy .env file
cp ../../.env.local .env

# Test it works
python -c "import config; print('✅ Config loaded')"
```

---

## Step 4: Start Services (1 minute)

### Terminal 1 - Next.js
```bash
npm run dev
```

### Terminal 2 - Python Worker
```bash
cd construction_plan_intelligence/worker
source venv/bin/activate
python worker.py
```

You should see:
```
INFO - Starting Construction Plan Intelligence Worker
INFO - Polling interval: 5s
```

---

## Step 5: Test It! (2 minutes)

### Option A: Using curl

```bash
# Upload a plan (replace with your PDF path)
curl -X POST http://localhost:3000/api/plans/upload \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/plan.pdf"

# Response:
# {"jobId":"abc-123","status":"queued"}

# Check status
curl http://localhost:3000/api/plans/abc-123/status \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"

# Wait 2-5 minutes, then get results
curl http://localhost:3000/api/plans/abc-123/result \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"

# Generate quote
curl -X POST http://localhost:3000/api/quotes/generate \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"abc-123"}'
```

### Option B: Using React Components

Create a test page: `app/test-plan-intelligence/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { PlanUploadForm } from '@/construction_plan_intelligence/components/PlanUploadForm';
import { JobStatusTracker } from '@/construction_plan_intelligence/components/JobStatusTracker';
import { ExtractionResultsViewer } from '@/construction_plan_intelligence/components/ExtractionResultsViewer';

export default function TestPlanIntelligence() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Construction Plan Intelligence Test</h1>

      {/* Step 1: Upload */}
      <PlanUploadForm onUploadSuccess={(id) => setJobId(id)} />

      {/* Step 2: Track Status */}
      {jobId && (
        <JobStatusTracker
          jobId={jobId}
          onComplete={() => setAnalysisReady(true)}
        />
      )}

      {/* Step 3: View Results */}
      {jobId && analysisReady && (
        <ExtractionResultsViewer jobId={jobId} />
      )}
    </div>
  );
}
```

Visit: http://localhost:3000/test-plan-intelligence

---

## What to Expect

### Upload
- ✅ Instant response with jobId
- ✅ File stored in Supabase Storage

### Processing (2-5 minutes)
Worker console shows:
```
INFO - Found queued job: abc-123
INFO - Rendering PDF pages
INFO - Step 1: Rendering PDF pages
INFO - PDF has 10 pages
INFO - Step 2: Extracting text for page selection
INFO - Step 3: Selecting relevant pages
INFO - Step 4: Running OpenAI extraction (2-pass)
INFO - Pass 1: Extracting quantities from 3 images
INFO - Pass 2: Auditing extraction
INFO - Step 5: Validating extraction
INFO - Step 6: Saving analysis
INFO - Job abc-123 completed successfully
```

### Results
```json
{
  "doors": { "total": 12, "confidence": "high" },
  "windows": { "total": 8, "confidence": "medium" },
  "kitchen": { "cabinets_count_est": 10, "linear_ft_est": 20 },
  "bathrooms": { "toilets": 2, "sinks": 2, "showers": 2 }
}
```

### Quote Generation
```json
{
  "quoteId": "quote-123",
  "subtotal": 45000,
  "tax": 8100,
  "total": 53100,
  "lines": [
    { "description": "Standard Door", "qty": 12, "unit_price": 5000, "line_total": 60000 },
    { "description": "Standard Window", "qty": 8, "unit_price": 3000, "line_total": 24000 }
  ]
}
```

---

## Troubleshooting

### "No active price book found"

Add sample prices:
```sql
-- Get price book ID
SELECT id FROM price_books WHERE is_active = true;

-- Insert sample prices (replace <ID> with actual UUID)
INSERT INTO price_items (price_book_id, sku, category, variant, unit, unit_price) VALUES
  ('<ID>', 'DOOR-STD', 'door', 'standard', 'each', 5000),
  ('<ID>', 'WIN-STD', 'window', 'standard', 'each', 3000),
  ('<ID>', 'CAB-STD', 'cabinet', 'standard', 'linear_ft', 1200),
  ('<ID>', 'TOIL-STD', 'toilet', 'standard', 'each', 6000),
  ('<ID>', 'SINK-STD', 'sink', 'standard', 'each', 4000),
  ('<ID>', 'SHOW-STD', 'shower', 'standard', 'each', 8000);
```

### Worker not picking up jobs

1. Check worker is running: `ps aux | grep worker.py`
2. Check job status in database: `SELECT * FROM plan_jobs;`
3. Restart worker: `Ctrl+C`, then `python worker.py`

### "Failed to download file from storage"

Check file_path in plan_jobs table:
```sql
SELECT id, file_path FROM plan_jobs LIMIT 1;
```

Should be: `plans/user-id/filename.pdf`

### Low extraction quality

- Use plans with door/window schedules (highest accuracy)
- Ensure PDF is at least 200 DPI
- Check worker logs for which pages were selected

---

## Next Steps

Once working:

1. **Seed Product Catalog** - Add products for customer selection
2. **Create UI Pages** - Build full user-facing pages
3. **Integrate with CRM** - Link to existing suppliers/projects
4. **Deploy Worker** - Set up production worker server
5. **Add Monitoring** - Track costs, performance, errors

---

## Cost Monitoring

Track OpenAI usage:
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as plans_processed,
  AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_rate
FROM plan_jobs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

Estimated cost: ~$0.10 per plan

---

**Ready to go!** 🚀

For full documentation, see `construction_plan_intelligence/README.md`
