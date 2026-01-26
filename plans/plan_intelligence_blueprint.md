# Construction Plan Intelligence → Quotation + Catalog
*(Architecture plan + concrete schemas/contracts)*

## 1) Goals
- Accept **PDF (mostly)** and images (sometimes).
- Extract approximate quantities (doors, windows, kitchen cabinets/wardrobes, commodes, sinks, showers, fixtures).
- Store structured results with **confidence + evidence**.
- Generate a **deterministic quote** from a price list.
- Recommend **catalog products** and let customers select variants → quote updates.
- Optimize for **lowest cost**, **highest speed**, acceptable accuracy in v1.

---

## 2) What you already have: use vs skip

### Use (high value)
- **OpenAI API (paid):** final multimodal extraction + audit (spend tokens only on best pages/crops).
- **Supabase:** Auth + Storage + DB for files, jobs, results, price books, products, quotes.
- **Python scripts/worker:** PDF rendering, preprocessing, table/legend cropping, validation, orchestration.
- **ColPali (local):** page/region retrieval across multi-page PDFs (find plan page, schedules, legend fast).
- **Ollama (local):** optional helper for query generation and “human summary” text (not source of truth).

### Defer (until needed)
- **Pinecone:** only if you need large-scale semantic retrieval at speed and you’re already paying for it.
  - v1 can store embeddings in **Supabase (pgvector)** or even local SQLite.
  - Add caching/Redis only when usage demands it.

---

## 3) End-to-end pipeline (v1)
### 3.1 Upload & job creation (Next.js + Supabase)
1. User uploads PDF/image.
2. Save to Supabase Storage bucket: `plans/`.
3. Insert `plan_jobs` row with status `queued`.

### 3.2 Background processing (Python worker)
1. Poll `plan_jobs` where `status='queued'`.
2. Download file from Supabase Storage.
3. If PDF → render pages → images.
4. Preprocess images (contrast/deskew optional).
5. Page selection via heuristics + ColPali.
6. Crop likely schedules/legend regions.
7. Call OpenAI for extraction (Pass 1) + audit (Pass 2).
8. Validate JSON (Pydantic) → retry repair once if needed.
9. Save analysis + evidence + confidence to Supabase.
10. Mark job `completed` (or `needs_review`) or `failed`.

---

## 4) PDF handling (must-have)
- Convert PDF → page images (200–300 DPI).
- Run **page relevance selection** to avoid sending all pages to OpenAI:
  - heuristic keyword scan (optional OCR of titles)
  - ColPali queries: “door schedule”, “window schedule”, “legend”, “floor plan”
- Crop schedule/legend regions to reduce tokens and increase accuracy.

---

## 5) Extraction strategy (v1)
### Preferred signals (best → worst)
1. **Schedules/tables** (most accurate)
2. **Legends** (interpretation help)
3. **Symbol counting** from plan page (noisy; acceptable with low/medium confidence)

### Output requirements
- Quantities + confidence per category
- Evidence pointers: page index + crop id
- Review flags: “schedule not found”, “multiple floors”, “low resolution”, etc.

---

## 6) Quotation system (deterministic)
- Store standard price lists in DB (versioned “price books”).
- Convert extracted quantities → quote line items via rule mapping.
- Perform math in code (no AI totals):
  - `line_total = qty * unit_price`
  - add tax/markup config deterministically
- Customer can select product variants; reprice deterministically.

---

## 7) Catalog recommendations
### Retrieval (lowest-cost first)
1. Filtered SQL (category/material/brand/region/price range).
2. Semantic retrieval only if needed:
   - start with local embeddings (Ollama) and store vectors in Supabase
   - move to Pinecone later if required

### Customer flow
- “Shopping list” built from quantities (doors/windows/cabinets…)
- Customer selects products per line → quote updates

---

## 8) Upgrade path
### v1 (ship fast)
- PDF→images + ColPali page selection + OpenAI extraction + confidence flags
- Deterministic quote + basic catalog filters

### v2 (accuracy jump)
- Better table detection/cropping
- Evidence overlay UI (show schedule crop behind counts)
- Caching of processed pages/embeddings

### v3 (scale)
- Queue system + retries + monitoring
- Role-based access + audit logs if multiple internal users needed

---

# Part B — Concrete implementation deliverables

## 9) Supabase schema (tables)
> Use UUIDs everywhere. Add RLS later as needed.

### 9.1 `plan_jobs`
- Tracks pipeline execution + status.

```sql
create table if not exists plan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  file_path text not null,          -- supabase storage path, e.g. plans/xxx.pdf
  file_type text not null,          -- 'pdf'|'image'
  status text not null default 'queued', -- queued|processing|needs_review|completed|failed
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plan_jobs_status on plan_jobs(status);
create index if not exists idx_plan_jobs_user on plan_jobs(user_id);
```

### 9.2 `plan_job_artifacts`
- Stores derived artifacts: page images, crops, intermediate JSON, logs.

```sql
create table if not exists plan_job_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references plan_jobs(id) on delete cascade,
  kind text not null,               -- page_image|crop|debug|ocr_text|embedding_ref
  page_no int,                      -- nullable for non-page artifacts
  artifact_path text not null,       -- storage path
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_artifacts_job on plan_job_artifacts(job_id);
create index if not exists idx_job_artifacts_kind on plan_job_artifacts(kind);
```

### 9.3 `plan_analyses`
- The final structured result (versioned).

```sql
create table if not exists plan_analyses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references plan_jobs(id) on delete cascade,
  model text not null,              -- openai model name
  quantities jsonb not null,        -- validated JSON schema output
  confidence jsonb not null,        -- per-section confidence + flags
  evidence jsonb not null,          -- page/crop pointers
  needs_review boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_plan_analyses_job on plan_analyses(job_id);
```

### 9.4 Pricing & quoting
```sql
create table if not exists price_books (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'INR',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists price_items (
  id uuid primary key default gen_random_uuid(),
  price_book_id uuid not null references price_books(id) on delete cascade,
  sku text not null,
  category text not null,           -- door|window|cabinet|toilet|sink|shower|fixture
  variant text not null,            -- standard|wood|aluminum|...
  unit text not null,               -- each|sqft|linear_ft
  unit_price numeric not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_price_items_book on price_items(price_book_id);
create index if not exists idx_price_items_cat_var on price_items(category, variant);
```

```sql
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  job_id uuid references plan_jobs(id),
  price_book_id uuid references price_books(id),
  status text not null default 'draft', -- draft|sent|accepted|rejected
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  sku text not null,
  description text not null,
  qty numeric not null,
  unit text not null,
  unit_price numeric not null,
  line_total numeric not null,
  selections jsonb not null default '{}'::jsonb, -- customer-chosen product/variant
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_lines_quote on quote_lines(quote_id);
```

### 9.5 Product catalog
```sql
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null,           -- door|window|cabinet|...
  material text,                    -- wood|aluminum|...
  brand text,
  base_price numeric,               -- optional
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  kind text not null,               -- image|pdf|spec|catalog_page
  asset_path text not null,         -- Supabase Storage path
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_cat_mat on products(category, material);
create index if not exists idx_assets_product on product_assets(product_id);
```

---

## 10) Job state machine (worker contract)
### Statuses
- `queued` → picked up by worker
- `processing` → page rendering, selection, crops, OpenAI calls
- `needs_review` → produced output but low confidence / inconsistencies
- `completed` → valid output + normal confidence
- `failed` → unrecoverable error

### Worker guarantees
- Updates `updated_at` regularly (heartbeat).
- Writes artifacts to `plan_job_artifacts` with `kind` and `page_no`.
- Writes exactly one `plan_analyses` per job (upsert if retrying).

---

## 11) API contracts (Next.js App Router)
### 11.1 `POST /api/plans/upload`
- Accepts multipart file.
- Saves to Supabase Storage.
- Creates `plan_jobs` row.
- Returns `{jobId}`.

### 11.2 `GET /api/plans/:jobId/status`
- Returns job status + progress + any error + `analysisId` if ready.

### 11.3 `GET /api/plans/:jobId/result`
- Returns final `quantities/confidence/evidence` + quote id if generated.

### 11.4 `POST /api/quotes/:jobId/generate`
- Deterministic mapping from quantities → quote lines using active price book.
- Returns `{quoteId}`.

### 11.5 `POST /api/quotes/:quoteId/select-products`
- User picks product SKUs per line (door material etc.)
- Recalculate totals deterministically.

---

## 12) OpenAI extraction: strict JSON schema
Use a single schema for v1 to keep downstream deterministic.

### 12.1 JSON schema (shape)
```json
{
  "meta": {
    "floors_detected": 1,
    "plan_type": "residential",
    "units": "imperial_or_metric_unknown",
    "notes": ""
  },
  "doors": {
    "total": 0,
    "by_type": {
      "entry": 0,
      "interior": 0,
      "sliding": 0,
      "other": 0
    },
    "confidence": "low",
    "evidence": []
  },
  "windows": {
    "total": 0,
    "confidence": "low",
    "evidence": []
  },
  "kitchen": {
    "cabinets_count_est": 0,
    "linear_ft_est": 0,
    "confidence": "low",
    "evidence": []
  },
  "bathrooms": {
    "bathroom_count": 0,
    "toilets": 0,
    "sinks": 0,
    "showers": 0,
    "confidence": "low",
    "evidence": []
  },
  "other_fixtures": {
    "wardrobes": 0,
    "closets": 0,
    "shelving_units": 0,
    "confidence": "low",
    "evidence": []
  },
  "review": {
    "needs_review": false,
    "flags": [],
    "assumptions": []
  }
}
```

### 12.2 Evidence format
Each evidence entry should be:
```json
{
  "page_no": 0,
  "artifact_id": "uuid-or-stable-id",
  "source": "schedule|legend|plan_symbols",
  "note": "short"
}
```

### 12.3 Prompting strategy (2-pass)
- **Pass 1 (extract):** “Return ONLY JSON matching schema. Use schedules/legends if present; otherwise estimate and mark low confidence.”
- **Pass 2 (audit):** “Check internal consistency; if mismatch, correct JSON and add flag.”

---

## 13) Python worker skeleton (module split)
- `worker.py` orchestrator
- `pdf_to_images.py` render pages @ 250–300 DPI
- `preprocess.py` contrast/deskew
- `select_pages.py` heuristic + ColPali queries
- `crop_regions.py` find schedules/legend blocks
- `openai_extract.py` pass1+pass2 calls
- `validate.py` pydantic + normalize
- `supabase_io.py` storage + db

Minimal runtime: Python 3.10+, poppler or pymupdf, pillow/opencv, pydantic.

---

## 14) Deterministic quote mapping rules (v1)
Example mapping table (code-level config):
- doors.total → price_items(category='door', variant='standard', unit='each')
- windows.total → price_items(category='window', variant='standard', unit='each')
- kitchen.linear_ft_est (if >0) else cabinets_count_est → price_items(category='cabinet', variant='standard', unit='linear_ft' or 'each')
- bathrooms.toilets → price_items(category='toilet', variant='standard', unit='each')
- bathrooms.sinks → price_items(category='sink', variant='standard', unit='each')
- bathrooms.showers → price_items(category='shower', variant='standard', unit='each')

If confidence is low, still generate a quote but:
- add `quote.note = "Estimate — requires review"`
- show review flags in UI

---

## 15) 
1. Supabase tables + Storage buckets
2. Upload endpoint + job status endpoint
3. Python PDF→images + artifact saving
4. ColPali page selection + crop saving
5. OpenAI extraction + validation + save results
6. Quote generation endpoint + UI render
7. Catalog tables + filtered retrieval + selection → reprice
