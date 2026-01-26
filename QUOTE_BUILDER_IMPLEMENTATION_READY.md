# Construction Quote Builder - Implementation Ready

## Status: ✅ READY TO START PHASE 1

Date: January 16, 2026

---

## Investigation Complete

### 1. Existing Systems Analyzed

✅ **Framework B (General Document AI)**
- Location: `/Framework_B_Implementation/`
- APIs: Upload, search, summarize, chat
- Status: Production-ready, fully secured and monitored
- Use case for Quote Builder: Supplier catalog search, product Q&A

✅ **Construction Plan Intelligence (Vision Extraction)**
- Location: `/construction_plan_intelligence/`
- APIs: Upload plan, get extraction results, generate quote
- Extraction format: Structured JSON (doors, windows, kitchen, bathrooms, fixtures)
- Status: Fully implemented, integrated into CRM
- Use case for Quote Builder: Source of construction quantities

### 2. Integration Strategy Confirmed

**Core Principle: NO MODIFICATIONS TO EXISTING CODE**

**Wrapper Pattern:**
```
Quote Builder → Wrapper APIs (read-only) → Existing Systems
```

**Example:**
- Existing: `GET /api/plans/[jobId]/result` (Construction Plan Intelligence)
- New Wrapper: `GET /api/quote/extraction/[jobId]` (Quote Builder)
- Wrapper reads existing tables, enriches data, returns Quote Builder format
- Zero modifications to existing code

### 3. Documentation Created

📄 **FRAMEWORK_B_EXTRACTION_INTEGRATION_GUIDE.md** (9 sections, 400+ lines)
- Complete extraction JSON schema documented
- Data flow diagrams (upload → extract → quote)
- Wrapper API specifications (TypeScript code examples)
- Testing strategy (integration tests, edge cases)
- Migration path (if needed in future)
- Real-world scenario walkthrough

📄 **CONSTRUCTION_QUOTE_BUILDER_MASTER_PLAN.md** (13 sections)
- Product requirements and customer journey
- Database schema (11 new tables)
- API design (40+ endpoints)
- Dynamic pricing engine specification
- Phased rollout (MVP → V1 → V2)

### 4. All Unknowns Resolved

User provided answers to all 10 open questions:
1. ✅ AI extraction accuracy: Test later
2. ✅ Region scope: Los Angeles first, all US states eventually
3. ✅ Supplier relationships: Yes, have existing
4. ✅ Catalog size: **200-270 suppliers**, catalogs not all available
5. ✅ **NEW REQUIREMENT**: Premium product filtering (admin controls visibility)
6. ✅ Email service: Sample SendGrid, replace later
7. ✅ Framework B format: Investigated ✅ (don't modify existing)
8. ✅ Currency/Tax/Pricing: USD only, placeholder tax, 10-15 day pricing updates
9. ✅ CRM integration: Needed (will clarify details during implementation)
10. ✅ Legal disclaimers: Standard construction disclaimers for now

---

## Phase 1 Implementation Plan (4-6 weeks)

### Week 1-2: Database & Core APIs

**Database Schema:**
```sql
-- New tables (Quote Builder specific)
CREATE TABLE quote_leads (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  region TEXT NOT NULL, -- 'los-angeles' initially
  project_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quote_regions (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'los-angeles', 'new-york', etc.
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  compliance_notes TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE quotations (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES quote_leads(id),
  extraction_job_id UUID REFERENCES plan_jobs(id), -- Read-only link
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected
  subtotal DECIMAL(10,2),
  tax_placeholder DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quotation_lines (
  id UUID PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'doors', 'windows', 'kitchen', etc.
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  extraction_evidence JSONB, -- Link to plan_analyses evidence
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quote_customer_tiers (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- 'premium', 'standard'
  description TEXT,
  discount_pct DECIMAL(5,2) DEFAULT 0
);

CREATE TABLE quote_pricing_rules (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  region_id UUID REFERENCES quote_regions(id),
  tier_id UUID REFERENCES quote_customer_tiers(id),
  base_price DECIMAL(10,2) NOT NULL,
  markup_pct DECIMAL(5,2) DEFAULT 0,
  effective_date DATE NOT NULL,
  expires_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- More tables: quote_compliance_rules, quotation_versions, quotation_audit_log
```

**API Routes:**
1. `POST /api/quote/lead` - Lead capture
2. `GET /api/quote/extraction/[jobId]` - Wrapper for extraction results
3. `GET /api/quote/catalog` - Filtered product catalog
4. `POST /api/quote/pricing/calculate` - Dynamic pricing calculation
5. `POST /api/quote/generate` - Create formal quotation

### Week 3-4: Frontend UI (React/Next.js)

**Pages:**
1. `/quote-builder` - Landing page with lead capture form
2. `/quote-builder/upload` - Upload construction plan (uses existing upload API)
3. `/quote-builder/extraction/[jobId]` - Review extracted quantities
4. `/quote-builder/catalog/[jobId]` - Select products (filtered by region)
5. `/quote-builder/review/[quoteId]` - Review quote before sending
6. `/quote-builder/success` - Confirmation page

**Admin Pages:**
1. `/admin/quote/suppliers` - Manage 200-270 suppliers
2. `/admin/quote/catalog` - Import/manage product catalogs
3. `/admin/quote/pricing` - Set pricing rules
4. `/admin/quote/regions` - Configure regions (start with LA)
5. `/admin/quote/tiers` - Manage customer tiers (premium/standard)

### Week 5-6: Testing & Integration

**Testing Checklist:**
- [ ] Upload construction plan → extraction completes
- [ ] Wrapper API returns enriched extraction data
- [ ] Lead capture form validates and stores
- [ ] Catalog filtering works for LA region
- [ ] Premium tier filtering hides standard products
- [ ] Pricing calculation applies regional markup
- [ ] Quotation generation creates DB records
- [ ] On-screen quote display shows all line items
- [ ] Admin can import supplier catalog CSV
- [ ] Admin can set pricing rules
- [ ] Existing systems remain unchanged (verify no DB writes to plan_jobs, plan_analyses)

**Integration Tests:**
```bash
# End-to-end workflow test
npm run test:quote-builder

# Wrapper API test (verify read-only)
npm run test:wrapper-readonly

# Database isolation test
npm run test:db-isolation
```

---

## Phase 2 Roadmap (Post-MVP)

### Features to Add:
1. **PDF Generation** - Branded quote PDFs with extraction evidence
2. **Email Delivery** - SendGrid integration, delivery tracking
3. **Multi-Region** - Expand beyond LA (NYC, Chicago, etc.)
4. **Compliance Filtering** - Fire-rated doors, energy codes, etc.
5. **Price Versioning** - Track price changes, immutable historical quotes
6. **Manual Corrections** - UI to edit extracted quantities before quote
7. **Product Images** - Display supplier product photos in catalog

### Future Enhancements (Phase 3):
1. **External Pricing APIs** - Home Depot integration, live pricing
2. **Chat Integration** - Framework B RAG for product Q&A
3. **Advanced Markup Rules** - Volume discounts, time-based pricing
4. **Supplier API Connectors** - Auto-sync catalogs from supplier APIs
5. **Quote Templates** - Save common configurations
6. **Multi-Currency** - International support (currently USD only)

---

## Key Design Decisions

### 1. Modular Architecture
**Decision:** Separate Quote Builder from existing systems
**Rationale:**
- User explicitly requested no modifications
- Easier to maintain and deploy independently
- Lower risk of breaking existing functionality
- Can be removed/replaced without affecting extraction

### 2. Wrapper Pattern
**Decision:** Read-only wrapper APIs instead of direct DB access
**Rationale:**
- Provides abstraction layer (can change underlying implementation)
- Enriches data with Quote Builder-specific metadata
- Clean separation of concerns
- Easy to test (verify no writes to existing tables)

### 3. Lead-First Flow
**Decision:** Capture lead info BEFORE showing pricing
**Rationale:**
- User requirement from master plan
- Prevents anonymous price browsing
- Enables region-based filtering early
- Allows customer tier assignment

### 4. Premium Filtering
**Decision:** Admin controls which products shown to which customers
**Rationale:**
- User revealed this requirement in unknowns (#4)
- Supports tiered pricing strategy
- Prevents showing competitor products to wrong customers
- Aligns with B2B construction industry norms

### 5. Placeholder Tax
**Decision:** Simple tax field, not calculated automatically
**Rationale:**
- User said "just add placeholder, will update later"
- Tax rules vary by jurisdiction (complex to implement correctly)
- Phase 1 focuses on core quote generation
- Can add tax calculation API in Phase 2

### 6. Manual Catalog Entry (Phase 1)
**Decision:** Admin manually enters products, CSV import optional
**Rationale:**
- User said "catalogs for all suppliers not readily available"
- 200-270 suppliers is too many to onboard at once
- Start with top 20-30 suppliers for LA
- Add CSV import and API connectors in Phase 2

### 7. Pricing Frequency: 10-15 Days
**Decision:** No real-time pricing updates, manual refresh
**Rationale:**
- User said pricing changes "maybe 10 to 15 days or so"
- Don't need hourly/daily updates
- Admin updates prices via UI when needed
- Price versioning ensures historical quotes stay accurate

---

## Technical Stack Confirmation

### Backend:
- **Language:** TypeScript
- **Runtime:** Next.js 15 App Router (serverless API routes)
- **Database:** Supabase PostgreSQL (existing setup)
- **Storage:** Supabase Storage (for plan PDFs, product images)
- **Authentication:** Supabase Auth (existing, reuse)
- **Rate Limiting:** Upstash Redis (existing, reuse)

### Frontend:
- **Framework:** React 18 with Next.js 15
- **UI Library:** Shadcn/ui (existing in CRM)
- **Styling:** Tailwind CSS (existing)
- **Forms:** React Hook Form + Zod validation
- **State:** React Context (simple state needs)

### External Services:
- **Email:** SendGrid (sample config for Phase 1)
- **PDF Generation:** Puppeteer or PDFKit (decide during implementation)
- **AI Extraction:** OpenAI GPT-4o (existing, via Construction Plan Intelligence)
- **Vector Search:** Pinecone (existing, via Framework B)

### Development Tools:
- **Testing:** Jest + React Testing Library
- **API Testing:** Postman collections
- **Database Migrations:** Supabase migrations
- **CI/CD:** Vercel (existing deployment)

---

## Success Criteria (Phase 1)

### Functional Requirements:
- [x] User can upload construction plan
- [x] System extracts quantities using existing Construction Plan Intelligence
- [ ] User provides lead info (name, email, region)
- [ ] System shows filtered catalog based on LA region
- [ ] Admin can hide certain products from certain customers (premium filtering)
- [ ] System calculates pricing with regional markup
- [ ] User can generate quote (on-screen display)
- [ ] Admin can manage suppliers and pricing
- [ ] Historical quotes remain accurate when prices change

### Technical Requirements:
- [ ] Zero modifications to existing code (Framework B, Construction Plan Intelligence)
- [ ] All new code in separate modules/directories
- [ ] Read-only access to existing tables (enforced via database views)
- [ ] Integration tests pass (wrapper readonly, DB isolation)
- [ ] Performance: Quote generation < 2 seconds
- [ ] Security: All APIs require authentication
- [ ] Error handling: Graceful fallback if extraction fails

### Business Requirements:
- [ ] Supports 200-270 suppliers (structure, not all data)
- [ ] Los Angeles region fully configured
- [ ] Premium vs standard tier filtering works
- [ ] Pricing updates don't affect historical quotes
- [ ] Admin can onboard new supplier in < 30 minutes
- [ ] Quote generation workflow takes < 5 minutes end-to-end

---

## Next Immediate Steps

**Option 1: Start Implementation**
If user approves, begin Phase 1 implementation:
1. Create database schema (new tables)
2. Build wrapper API `/api/quote/extraction/[jobId]`
3. Create lead capture API and UI
4. Build catalog filtering API
5. Implement quotation generation logic

**Option 2: Clarifications**
If user has questions about:
- Integration approach (wrapper pattern)
- Database design (new tables)
- Implementation phases (4-6 week timeline)
- Technical stack choices

**Option 3: Prototype First**
Build a minimal proof-of-concept:
- Single wrapper API
- Simple quotation generation
- Verify zero impact on existing systems
- Then proceed with full implementation

---

## Files Created/Ready

✅ **Planning & Documentation:**
- `CONSTRUCTION_QUOTE_BUILDER_MASTER_PLAN.md` - Complete product spec
- `FRAMEWORK_B_EXTRACTION_INTEGRATION_GUIDE.md` - Integration technical guide
- `QUOTE_BUILDER_IMPLEMENTATION_READY.md` - This readiness document (you are here)

📂 **Ready for Implementation:**
- Database schema defined (can be executed immediately)
- API routes designed (TypeScript interfaces ready)
- UI wireframes outlined (in master plan)
- Testing strategy documented

⏳ **Pending User Approval:**
- Review integration approach
- Confirm Phase 1 scope
- Approve starting implementation
- Any final questions/clarifications

---

## Summary

**We are READY to start Phase 1 implementation** of the Construction Quote Builder.

**Key Achievements:**
1. ✅ Investigated both existing systems (Framework B + Construction Plan Intelligence)
2. ✅ Documented extraction JSON schema and API formats
3. ✅ Designed wrapper pattern for read-only integration
4. ✅ Resolved all 10 user questions/unknowns
5. ✅ Created comprehensive integration guide
6. ✅ Defined Phase 1 scope (4-6 weeks)
7. ✅ Confirmed NO modifications to existing code

**Ready to Build:**
- Database schema: Ready
- API design: Ready
- UI flow: Defined
- Testing plan: Documented
- Integration strategy: Validated

**Awaiting:**
- User confirmation to proceed with Phase 1 implementation

---

**End of Readiness Document**

Next: Implement Phase 1 or address any user questions/clarifications.
