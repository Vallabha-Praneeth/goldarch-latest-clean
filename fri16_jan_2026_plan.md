⏺ 1) Executive Summary

  • Extend, don't replace: Build new customer-facing quote builder as a separate module that consumes existing AI extraction outputs
  without modifying Framework B internals.

  • Modular architecture: Six core modules (Lead Capture, Region/Compliance, Catalog Selection, Dynamic Pricing, Quotation Engine, Admin
  Management) with clear API contracts and data boundaries.

  • Lead-first flow: Capture customer contact + location before showing results → enables compliance filtering + sales pipeline + regional
  pricing variations.

  • Dynamic pricing foundation: Admin-controlled pricing with versioning, audit logs, manual overrides, and pluggable external reference
  pricing (Home Depot API as optional Phase 2+ feature).

  • Catalog-driven selection: Transform AI-extracted quantities into configurable line items where customers choose
  materials/finishes/models from real supplier catalogs with images and specs.

  • Compliance gating: Location-based standards module (Phase 1: simple allow/deny lists; Phase 2: external standards API integration if
  sources identified) filters catalog to show only region-compliant items.

  • Three-phase rollout: MVP (lead capture + basic catalog + manual pricing) → V1 (full configuration flow + compliance + ingestion
  pipeline) → V2 (external pricing references + chat configuration + advanced rules).

  • Figma strategy: Preserve existing root framework and /Modular_B2B_Construction_CRM; add new component library for quote builder,
  catalog cards, pricing tables; create integration guide document.

  • No breaking changes: All new routes (/quote-builder, /admin/pricing, /admin/catalog), new database tables, new API endpoints; existing
  Framework B document processing remains untouched.

  • Risk mitigation: Start with manual catalog entry and simple pricing rules in Phase 1; add automation/external integrations only after
  core flow proven with real users.

  ---
  2) Customer Journey + Screens

  2.1 Customer-Facing Flow (New Module: /quote-builder)

  1. Landing Page (/quote-builder)
    - Hero: "Get Your Construction Quote in Minutes"
    - Value props: AI-powered, transparent pricing, region-compliant
    - CTA: "Start Your Quote"
  2. Lead Capture (/quote-builder/contact)
    - Form fields: Name (required), Phone (required), Email (required), Project Address/Zip (required), Company Name (optional)
    - Privacy disclaimer + consent checkbox
    - "Continue to Upload" button
    - NEW TABLE: leads (stores contact info before showing pricing)
  3. Plan Upload (/quote-builder/upload)
    - Drag-and-drop area for architectural plans (PDF/DWG/images)
    - File size/format validation
    - Progress indicator
    - INTEGRATION POINT: Calls existing Framework B document upload API
  4. AI Extraction Review (/quote-builder/review)
    - Table showing extracted quantities: Item Type | Quantity | Unit
    - Example: "Doors: 12 units", "Windows: 8 units", "Kitchen Cabinets: 1 set"
    - Edit quantities (manual adjustments)
    - Disclaimer: "AI-extracted quantities are estimates. Verify before finalizing."
    - "Configure Materials" button
    - INTEGRATION POINT: Consumes Framework B extraction results via API
  5. Region Verification (/quote-builder/region)
    - Display detected region from zip code
    - Show applicable standards (e.g., "California Title 24 Energy Code")
    - Option to manually select region if detection fails
    - "Standards verified" checkmark
    - NEW MODULE: Standards/Compliance lookup
  6. Catalog Selection - Per Item (/quote-builder/configure)
    - Left sidebar: List of items from extraction (Doors, Windows, etc.)
    - Main area: Catalog cards for selected item category
    - Each card: Product image, name, SKU, material, finish, compliance badge, price
    - Filters: Material type, price range, brand, compliance status
    - "Add to Quote" button per card
    - Real-time quote total updates in sticky footer
    - NEW MODULE: Catalog browsing + selection
  7. Configuration Summary (/quote-builder/summary)
    - Line-item table: Item | Quantity | Material/Model | Unit Price | Total
    - Subtotal, estimated tax (if applicable), total
    - Disclaimer box: "This quote is an estimate based on your selections and current pricing. Final costs may vary based on actual
  measurements, material availability, and local regulations."
    - "Download PDF" and "Email Quote" buttons
    - NEW MODULE: Quotation generation
  8. Quote Delivered (/quote-builder/complete)
    - Success message: "Your quote is ready!"
    - PDF preview
    - Email confirmation sent
    - "Start New Quote" or "Contact Sales" CTAs

  2.2 Admin-Facing Screens (New Module: /admin/...)

  9. Pricing Management (/admin/pricing)
    - Table: Product Category | Base Price | Last Updated | Status
    - Bulk edit mode
    - Version history per item
    - "Import Prices from CSV" button
    - "Sync External Reference" button (Phase 2+)
    - Audit log view: Who changed what, when
  10. Catalog Management (/admin/catalog)
    - Supplier list view
    - Product grid with search/filter
    - "Add Product" form: Name, SKU, Category, Material, Specs, Images, Base Price, Compliance Tags
    - Bulk import via CSV/API
    - Image upload (drag-and-drop, multiple files)
  11. Compliance Rules (/admin/compliance)
    - Region list (State/Country)
    - Allowed/disallowed materials per region
    - Standards reference links (manual entry in Phase 1)
    - "Add Restriction" form
  12. Leads Dashboard (/admin/leads)
    - Table: Name | Contact | Location | Quote Status | Date
    - Filters: Date range, region, status
    - Export to CRM (CSV or API)

  ---
  3) Information Architecture + Navigation Updates

  3.1 New Top-Level Routes (Add to existing navigation)

  /quote-builder (customer entry point)
    ├── /contact (lead capture)
    ├── /upload (plan upload)
    ├── /review (quantity review)
    ├── /region (standards verification)
    ├── /configure (catalog selection)
    ├── /summary (quote summary)
    └── /complete (confirmation)

  /admin (existing - extend with new tabs)
    ├── /pricing (NEW)
    ├── /catalog (NEW)
    ├── /compliance (NEW)
    ├── /leads (NEW)
    └── [existing admin pages - unchanged]

  3.2 Integration Points with Existing App

  - Framework B Document Processing: /quote-builder/upload calls existing /api/framework-b/documents/upload endpoint
  - Extraction Results: New endpoint /api/quote/extraction-results/:uploadId wraps Framework B output
  - Existing Dashboard: Add "Quote Builder" link in main navigation
  - Existing Suppliers Page: Add "Manage Catalog" quick action

  3.3 Data Flow Diagram (Conceptual)

  Customer → Lead Capture → Upload Plan → [Framework B Extraction] → Quantities
    → Region Lookup → [Compliance Filter] → Catalog (filtered by region)
    → Customer Selections → [Pricing Engine] → Quote Generation → PDF

  ---
  4) Modules (Responsibilities, Inputs, Outputs, Dependencies)

  | Module                          | Responsibility                                                              | Inputs
                   | Outputs                                           | Owner                  | Dependencies
       |
  |---------------------------------|-----------------------------------------------------------------------------|------------------------
  -----------------|---------------------------------------------------|------------------------|------------------------------------------
  -----|
  | Lead Capture                    | Collect customer contact info; validate; store                              | Form data (name, email,
   phone, address) | Lead record ID, region detection                  | Front-end + Backend    | Location service (zip→region)
       |
  | Region/Compliance               | Detect region from address; lookup applicable standards; filter materials   | Zip code or address
                   | Region ID, standards list, allowed materials list | Backend                | locations table, compliance_standards
  table   |
  | Catalog Selection               | Display products; filter by region/compliance; handle customer selections   | Region ID, item
  category, filters       | Selected products with quantities                 | Front-end + Backend    | catalog_items table, suppliers
  table          |
  | Dynamic Pricing                 | Calculate current price for each product; apply overrides; version tracking | Product ID, quantity,
  region            | Unit price, total price, pricing source           | Backend                | pricing_rules table, price_history table
        |
  | Quotation Engine                | Combine selections + prices; generate line items; create PDF                | Lead ID, selections,
  prices             | Quotation record, PDF file                        | Backend                | All above modules; PDF library
         |
  | Admin Pricing Mgmt              | CRUD for pricing; import CSV; view audit log                                | Admin input, CSV files
                   | Updated pricing_rules                             | Front-end + Backend    | pricing_rules, price_history
       |
  | Admin Catalog Mgmt              | CRUD for products; supplier management; image upload                        | Admin input, CSV,
  images                | Updated catalog_items, suppliers                  | Front-end + Backend    | Image storage (S3/CDN)
            |
  | Plan Upload/Extraction          | (Extends existing Framework B) Wrapper around existing extraction           | Plan file
                   | Extracted quantities (doors, windows, etc.)       | Backend (wrapper only) | Framework B
  /api/framework-b/documents/upload |
  | External Pricing Ref (Phase 2+) | Fetch reference prices from Home Depot/etc. APIs; compare with internal     | Product SKU or
  description              | External price data                               | Backend                | External API (Home Depot,
  supplier APIs)      |

  ---
  5) Data Model + API Contracts

  5.1 New Database Tables

  Table: leads
  id: UUID (PK)
  name: VARCHAR(255) NOT NULL
  email: VARCHAR(255) NOT NULL
  phone: VARCHAR(50) NOT NULL
  company: VARCHAR(255) NULL
  address: TEXT NOT NULL
  zip_code: VARCHAR(20) NOT NULL
  region_id: UUID (FK → locations.id)
  consent_given: BOOLEAN DEFAULT false
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: locations
  id: UUID (PK)
  name: VARCHAR(255) NOT NULL  -- e.g., "California", "Texas"
  country: VARCHAR(100) NOT NULL
  state_province: VARCHAR(100) NULL
  zip_code_pattern: VARCHAR(50) NULL  -- regex for zip matching
  standards_references: JSONB  -- {title_24: "link", building_code: "link"}
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: suppliers
  id: UUID (PK)
  name: VARCHAR(255) NOT NULL
  contact_email: VARCHAR(255) NULL
  website: VARCHAR(500) NULL
  logo_url: VARCHAR(500) NULL
  status: ENUM('active', 'inactive') DEFAULT 'active'
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: catalog_items
  id: UUID (PK)
  supplier_id: UUID (FK → suppliers.id)
  sku: VARCHAR(100) UNIQUE NOT NULL
  name: VARCHAR(500) NOT NULL
  category: VARCHAR(100) NOT NULL  -- 'doors', 'windows', 'cabinets', etc.
  material: VARCHAR(100) NULL  -- 'wood', 'metal', 'vinyl', etc.
  finish: VARCHAR(100) NULL
  description: TEXT NULL
  specifications: JSONB  -- {dimensions: "...", weight: "...", etc.}
  images: JSONB  -- [{url: "...", alt: "..."}, ...]
  base_price: DECIMAL(10,2) NULL  -- reference price
  compliance_tags: JSONB  -- ["california_title_24", "energy_star", etc.]
  status: ENUM('active', 'discontinued') DEFAULT 'active'
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: pricing_rules
  id: UUID (PK)
  catalog_item_id: UUID (FK → catalog_items.id)
  region_id: UUID NULL (FK → locations.id)  -- NULL = default/global
  unit_price: DECIMAL(10,2) NOT NULL
  pricing_tier: VARCHAR(50) NULL  -- 'standard', 'premium', 'bulk_discount'
  effective_from: TIMESTAMP NOT NULL
  effective_until: TIMESTAMP NULL
  created_by: UUID (FK → users.id)
  notes: TEXT NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: price_history (Audit Log)
  id: UUID (PK)
  pricing_rule_id: UUID (FK → pricing_rules.id)
  old_price: DECIMAL(10,2) NULL
  new_price: DECIMAL(10,2) NOT NULL
  changed_by: UUID (FK → users.id)
  change_reason: TEXT NULL
  changed_at: TIMESTAMP

  Table: external_price_references (Phase 2+)
  id: UUID (PK)
  catalog_item_id: UUID (FK → catalog_items.id)
  source: VARCHAR(100) NOT NULL  -- 'home_depot', 'lowes', etc.
  external_sku: VARCHAR(100) NULL
  price: DECIMAL(10,2) NOT NULL
  url: VARCHAR(500) NULL
  last_synced: TIMESTAMP
  created_at: TIMESTAMP

  Table: compliance_standards
  id: UUID (PK)
  region_id: UUID (FK → locations.id)
  standard_name: VARCHAR(255) NOT NULL  -- "Title 24", "ICC Building Code", etc.
  standard_code: VARCHAR(100) NULL
  description: TEXT NULL
  effective_date: DATE NULL
  reference_url: VARCHAR(500) NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: material_compliance (Junction table)
  id: UUID (PK)
  compliance_standard_id: UUID (FK → compliance_standards.id)
  material_type: VARCHAR(100) NOT NULL  -- 'wood', 'metal', etc.
  allowed: BOOLEAN DEFAULT true  -- true = allowed, false = restricted
  restriction_notes: TEXT NULL
  created_at: TIMESTAMP

  Table: quotations
  id: UUID (PK)
  lead_id: UUID (FK → leads.id)
  extraction_id: VARCHAR(255) NULL  -- Reference to Framework B document upload
  region_id: UUID (FK → locations.id)
  status: ENUM('draft', 'sent', 'accepted', 'expired') DEFAULT 'draft'
  subtotal: DECIMAL(10,2) NOT NULL
  tax_amount: DECIMAL(10,2) NULL
  total: DECIMAL(10,2) NOT NULL
  pdf_url: VARCHAR(500) NULL
  valid_until: TIMESTAMP NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  Table: quotation_line_items
  id: UUID (PK)
  quotation_id: UUID (FK → quotations.id)
  catalog_item_id: UUID (FK → catalog_items.id)
  item_category: VARCHAR(100) NOT NULL  -- from extraction (doors, windows, etc.)
  quantity: DECIMAL(10,2) NOT NULL
  unit: VARCHAR(50) NOT NULL  -- 'units', 'sqft', etc.
  unit_price: DECIMAL(10,2) NOT NULL
  line_total: DECIMAL(10,2) NOT NULL
  notes: TEXT NULL
  created_at: TIMESTAMP

  5.2 New API Endpoints

  Lead Capture
  - POST /api/quote/leads → Create lead, return {lead_id, region_id}
  - GET /api/quote/leads/:id → Get lead details

  Plan Upload (Wrapper)
  - POST /api/quote/upload → Accepts file, calls Framework B, returns {upload_id, extraction_results}
  - GET /api/quote/extraction/:upload_id → Get extraction results

  Region/Compliance
  - GET /api/quote/regions?zip={zip} → Return region match
  - GET /api/quote/compliance/:region_id → Return standards + allowed materials

  Catalog
  - GET /api/quote/catalog?category={cat}&region={rid}&filters={...} → Return filtered products
  - GET /api/quote/catalog/:item_id → Product details

  Pricing
  - GET /api/quote/pricing/:item_id?region={rid}&quantity={qty} → Return current price

  Quotation
  - POST /api/quote/generate → Body: {lead_id, line_items: [{item_id, quantity}, ...]} → Return {quotation_id, pdf_url}
  - GET /api/quote/:quotation_id → Get quotation details
  - POST /api/quote/:quotation_id/email → Email quote to lead

  Admin - Pricing
  - GET /api/admin/pricing → List pricing rules
  - POST /api/admin/pricing → Create/update pricing rule
  - GET /api/admin/pricing/history/:item_id → Price history
  - POST /api/admin/pricing/import → Import from CSV

  Admin - Catalog
  - GET /api/admin/catalog → List products
  - POST /api/admin/catalog → Create product
  - PATCH /api/admin/catalog/:id → Update product
  - POST /api/admin/catalog/import → Bulk import from CSV
  - POST /api/admin/catalog/images → Upload images

  Admin - Compliance
  - GET /api/admin/compliance/regions → List regions
  - POST /api/admin/compliance/standards → Add standard
  - POST /api/admin/compliance/materials → Add material restriction

  Admin - Leads
  - GET /api/admin/leads?filters={...} → List leads
  - GET /api/admin/leads/:id → Lead details + associated quotations

  ---
  6) Dynamic Pricing Engine

  6.1 Pricing Rules Architecture

  - Base Price: Stored in catalog_items.base_price (reference only, can be null)
  - Active Price: Stored in pricing_rules with effective_from and effective_until dates
  - Regional Overrides: pricing_rules.region_id allows different prices per region
  - Priority: Most specific rule wins (region-specific > global; latest effective_from if multiple active)

  6.2 Admin UX for Pricing Management

  Screen: /admin/pricing

  - List View:
    - Table columns: Product Name | SKU | Category | Current Price | Region | Last Updated | Actions
    - Filters: Category, Region, Status (Active/Expired)
    - Search by SKU or name
  - Edit Price:
    - Modal or side panel
    - Fields: Unit Price, Effective From (date-time), Effective Until (optional), Region (dropdown or "All Regions"), Notes
    - "Save as New Version" button (creates new pricing_rule record, old one marked expired)
    - Show price history below (table: Old Price → New Price | Changed By | Date | Reason)
  - Bulk Edit:
    - Select multiple items
    - Apply % increase/decrease or set new base price
    - Preview changes before committing
    - Audit log entry for bulk change
  - CSV Import:
    - Upload CSV with columns: SKU | Unit Price | Effective From | Region (optional) | Notes
    - Validation: Check SKUs exist, prices are valid numbers
    - Preview table before final import
    - Log who imported and when

  6.3 Price Versioning

  - Never delete or overwrite pricing_rules records
  - When admin updates price, create new record with new effective_from
  - Old record's effective_until set to new record's effective_from - 1 second
  - Quotations reference pricing_rule_id so historical quotes show original pricing

  6.4 Audit Log

  - Every price change logged in price_history table
  - Include: old price, new price, who changed it, reason/notes, timestamp
  - Admin UI shows audit log per item (filterable by date range, user)
  - Export audit log for compliance

  6.5 External Reference Pricing (Phase 2+ - Optional)

  Approach:
  - API Integration Option: If Home Depot/Lowes/supplier has public API, fetch prices periodically (daily cron job)
  - Web Scraping Option: If no API, use headless browser scraping (legal/ethical review required; risk of breakage)
  - Manual Reference Option: Admin manually enters competitor prices for comparison

  Recommended: Manual Reference in Phase 1, API Integration in Phase 2

  Design:
  1. Admin adds external SKU mapping in catalog item: {"home_depot_sku": "12345"}
  2. Cron job (daily) calls Home Depot API: GET /api/products/{sku}/price
  3. Store result in external_price_references table
  4. Admin pricing UI shows: "Internal: $50 | Home Depot: $45 (last updated: 2026-01-15)"
  5. Admin can choose to match, override, or ignore external price
  6. Log decision in price_history

  Risks + Alternatives:
  - Risk: External API rate limits, downtime, pricing inaccuracies
  - Alternative: Use external prices as informational only (comparison), never auto-apply
  - Risk: Legal issues with scraping (Terms of Service violations)
  - Alternative: Partner directly with suppliers for price feeds (wholesale pricing)

  ---
  7) Supplier & Catalog System

  7.1 Ingestion Pipeline

  Phase 1: Manual Entry + CSV Import

  1. Manual Entry:
    - Admin UI form: /admin/catalog/add
    - Fields: Supplier (dropdown), SKU, Name, Category, Material, Finish, Description, Specs (JSON editor or form), Images (drag-and-drop),
   Base Price, Compliance Tags (multi-select)
    - Validation: Required fields, unique SKU, valid URLs for images
  2. CSV Bulk Import:
    - Template CSV: sku, name, category, material, finish, description, base_price, compliance_tags, image_urls
    - Upload CSV via /admin/catalog/import
    - Validation: Check duplicates, validate categories against predefined list
    - Preview screen: Show parsed rows, errors highlighted
    - "Confirm Import" button
    - Background job processes large CSVs (queue system)

  Phase 2: Automated Supplier API Integration

  - Supplier provides API endpoint: GET /supplier/catalog
  - Build connector module per supplier (adapter pattern)
  - Scheduled sync (daily or weekly)
  - Conflict resolution: If SKU exists, update price/stock only; or create new version
  - Notify admin of changes via dashboard alert

  7.2 Metadata Schema

  Catalog Item Fields (as defined in catalog_items table):
  - Core: SKU, Name, Category, Material, Finish
  - Rich Content: Description (Markdown), Specifications (JSONB)
  - Pricing: Base Price (reference)
  - Compliance: Compliance Tags (array: ["california_title_24", "energy_star"])
  - Images: Array of image objects [{url, alt, is_primary}]
  - Status: Active/Discontinued

  Specifications JSONB Example:
  {
    "dimensions": {"width": "36in", "height": "80in", "depth": "1.75in"},
    "weight": "45 lbs",
    "material_grade": "Premium Oak",
    "fire_rating": "20-minute",
    "warranty": "10 years"
  }

  7.3 Image Handling Strategy

  - Storage: AWS S3 or Cloudflare Images (CDN-backed)
  - Upload Flow:
    a. Admin uploads images via /api/admin/catalog/images (multipart form data)
    b. Backend validates (file type, size < 5MB)
    c. Resize to multiple sizes: thumbnail (200x200), medium (600x600), large (1200x1200)
    d. Store in S3 with unique key: catalog/{item_id}/{size}_{filename}
    e. Return URLs: {thumbnail_url, medium_url, large_url}
    f. Save URLs in catalog_items.images JSONB
  - Display: Use responsive images (<picture> or srcset) to serve appropriate size
  - Fallback: Default placeholder image if no images provided

  7.4 Search & Filter UX

  Customer-Facing Catalog UI (/quote-builder/configure):

  - Layout: Grid of product cards (3-4 per row on desktop, 1-2 on mobile)
  - Card Content: Primary image, product name, material/finish, price, compliance badge, "Add" button
  - Filters Panel (left sidebar or top bar):
    - Category (pre-selected from extraction)
    - Material Type (checkboxes: Wood, Metal, Vinyl, Composite, etc.)
    - Price Range (slider or input min/max)
    - Compliance (auto-filtered by region; show badge if item meets standards)
    - Brand/Supplier (dropdown)
  - Search Bar: Fuzzy search by name, SKU, or description
  - Sort Options: Price (low to high / high to low), Name (A-Z), Newest First

  Backend Query:
  SELECT * FROM catalog_items
  WHERE category = 'doors'
    AND status = 'active'
    AND (compliance_tags @> '["california_title_24"]' OR region_agnostic = true)
    AND material IN ('wood', 'metal')
    AND base_price BETWEEN 100 AND 500
  ORDER BY base_price ASC
  LIMIT 20 OFFSET 0;

  Performance: Index on category, material, status, compliance_tags (GIN index for JSONB)

  7.5 Tagging System

  - Compliance Tags: Hardcoded list (managed in admin) or dynamic (free-text with autocomplete)
  - Material Tags: Predefined categories (Wood, Metal, Vinyl, Composite, Glass, etc.)
  - Feature Tags: Optional (e.g., "Energy Efficient", "Soundproof", "Fire Rated")
  - Admin UI: Multi-select dropdown or tag input field
  - Customer UI: Show as badges on product cards

  ---
  8) Standards/Compliance System

  8.1 Module Boundaries

  Input: Customer's address/zip code
  Processing:
  1. Geocode zip → Region (State, Country)
  2. Lookup applicable standards for region
  3. Filter catalog to show only compliant items

  Output: Filtered product list + standards reference links

  8.2 Assumptions + Verification Steps

  ASSUMPTION 1: No unified API for construction standards (ASTM, ICC, state codes) exists as of 2026.
  - Verification Step: Research APIs from ASTM, ICC, NEC, state building departments. If found, integrate in Phase 2.
  - Fallback: Manual data entry by admins in Phase 1.

  ASSUMPTION 2: Compliance is primarily material-based (e.g., "California bans certain wood treatments").
  - Verification Step: Consult with construction compliance expert to validate scope.
  - Fallback: Start simple (allowed/disallowed materials per region); expand to product-level rules later.

  ASSUMPTION 3: Customers trust system to filter correctly (no legal liability on platform).
  - Verification Step: Legal review of disclaimer language.
  - Mitigation: Disclaimer must state "Consult local building inspector before finalizing."

  8.3 Phase 1 Design (Manual Data Entry)

  Admin UI (/admin/compliance):

  - Regions List: Table of states/countries
  - Add Standard: Form with fields: Region, Standard Name (e.g., "Title 24"), Code (e.g., "2022 Edition"), Reference URL, Effective Date
  - Material Restrictions: Per standard, list materials as Allowed or Restricted
    - Example: California Title 24 → "Vinyl Windows: Allowed (if U-factor < 0.30)"
    - Stored in material_compliance table

  Data Entry Workflow:
  1. Admin selects region (e.g., "California")
  2. Adds standards (e.g., "Title 24 Energy Code", "CALGreen Building Code")
  3. For each standard, marks materials as allowed/restricted
  4. When customer's region is detected, system queries material_compliance to filter catalog

  8.4 Compliance Filtering Logic

  Algorithm:
  1. Customer provides zip code
  2. Lookup region: zip_code → locations.id
  3. Get standards for region: compliance_standards WHERE region_id = locations.id
  4. Get allowed materials: material_compliance WHERE compliance_standard_id IN (standards) AND allowed = true
  5. Filter catalog: catalog_items WHERE material IN (allowed_materials) OR compliance_tags && (standards)
  6. Return filtered catalog + standards list

  Edge Cases:
  - No region match: Default to least restrictive (show all products with warning)
  - Multiple standards apply: Union of allowed materials (if allowed in any standard, show it)
  - Product has no compliance tags: Show with warning badge: "Compliance unknown - verify locally"

  8.5 UI/UX for Restrictions

  Region Verification Screen (/quote-builder/region):
  - Display: "Based on your location (ZIP: 90210), the following standards apply:"
  - List: "• California Title 24 Energy Code (2022 Edition) [Learn More ↗]"
  - Badge: Green checkmark "Standards Verified"
  - Option: "My location is different" → Manual region selector

  Catalog Screen:
  - Compliant items: Green badge "✓ Meets CA Title 24"
  - Non-compliant items: Either hidden OR shown with red badge "⚠ Not compliant in your region"
  - Toggle: "Show all products (including non-compliant)" → For customers who want to see everything

  Quote Summary:
  - Warning if any selected items are non-compliant: "⚠ Some items may not meet local standards. Consult your building inspector."

  8.6 Future Integration (Phase 2+)

  If standards API found:
  - API endpoint: GET /api/standards?region={state}&category={doors}
  - Response: JSON with compliance requirements (e.g., U-factor limits, fire ratings)
  - Auto-tag products: Run batch job to check product specs against requirements

  Example API Integration:
  // Hypothetical API call
  const standards = await fetch(`https://standards-api.gov/lookup?state=CA&category=windows`);
  const requirements = standards.data; // {u_factor_max: 0.30, fire_rating_min: "20-minute"}

  // Filter catalog
  const compliantProducts = catalogItems.filter(item => {
    return item.specifications.u_factor <= requirements.u_factor_max &&
           item.specifications.fire_rating >= requirements.fire_rating_min;
  });

  ---
  9) Quotation Generation Logic

  9.1 Composition Flow

  Inputs:
  - Lead ID (customer info)
  - Extraction Results (quantities from AI)
  - Customer Selections (catalog item IDs per category)
  - Region ID (for regional pricing)

  Processing Steps:
  1. For each line item (from extraction):
    - Get selected catalog item
    - Lookup current price: pricing_rules WHERE catalog_item_id = item.id AND region_id = customer_region AND effective_from <= NOW() AND
  effective_until IS NULL ORDER BY effective_from DESC LIMIT 1
    - Calculate line total: quantity × unit_price
  2. Sum all line totals → Subtotal
  3. Calculate tax (if applicable): subtotal × tax_rate (tax rate from locations table or external API)
  4. Calculate total: subtotal + tax
  5. Create quotations record
  6. Create quotation_line_items records
  7. Generate PDF (see below)
  8. Send email to lead

  9.2 Pricing Calculation

  function calculateLineItemPrice(catalogItemId, quantity, regionId) {
    // Get active pricing rule
    const pricingRule = await db.query(`
      SELECT unit_price FROM pricing_rules
      WHERE catalog_item_id = $1
        AND (region_id = $2 OR region_id IS NULL)
        AND effective_from <= NOW()
        AND (effective_until IS NULL OR effective_until >= NOW())
      ORDER BY 
        CASE WHEN region_id = $2 THEN 1 ELSE 2 END,  -- prioritize region-specific
        effective_from DESC
      LIMIT 1
    `, [catalogItemId, regionId]);

    if (!pricingRule) {
      // Fallback to base_price from catalog_items
      const item = await db.query(`SELECT base_price FROM catalog_items WHERE id = $1`, [catalogItemId]);
      return item.base_price * quantity;
    }

    return pricingRule.unit_price * quantity;
  }

  9.3 Caching & Performance Considerations

  Cache Strategy:
  - Catalog Items: Cache in Redis (TTL: 1 hour) with key: catalog:item:{id}
  - Pricing Rules: Cache active prices (TTL: 15 minutes) with key: price:{item_id}:{region_id}
  - Region Data: Cache region lookups (TTL: 24 hours) with key: region:zip:{zip_code}
  - Invalidation: On admin price update, invalidate specific price cache

  Performance Targets:
  - Quote generation: < 3 seconds (including PDF generation)
  - Catalog page load: < 1 second (with pagination)
  - Price lookup: < 100ms (with caching)

  Optimization:
  - Pagination: Limit catalog to 20-50 items per page
  - Lazy Load Images: Load images as user scrolls
  - Pre-compute: Generate PDF asynchronously (show "Generating..." spinner, then email when ready)

  9.4 PDF Generation

  Library: Use puppeteer (headless Chrome) or pdfkit (Node.js)

  Template:
  - HTML template with Handlebars or React component
  - Sections: Header (logo, company info), Lead Info, Line Items Table, Subtotal/Tax/Total, Disclaimer, Footer (contact info)
  - Styling: Inline CSS for PDF compatibility

  Process:
  1. Render HTML with quote data
  2. Convert to PDF via library
  3. Upload PDF to S3: quotes/{quotation_id}.pdf
  4. Save pdf_url in quotations table
  5. Return URL to frontend

  Async Generation (Recommended):
  - Enqueue PDF generation job (Bull queue or similar)
  - Show user: "Your quote is being generated. We'll email it to you shortly."
  - Worker generates PDF, saves to S3, sends email
  - User can also download from /quote-builder/complete page

  ---
  10) UX Copy & Disclaimer Placement

  10.1 Disclaimer Text

  Primary Disclaimer (for quote summary + PDF):
  "This quotation is an estimate based on AI-extracted quantities, your material selections, and current pricing as of [DATE]. Final costs 
  may vary due to actual on-site measurements, material availability, regional compliance requirements, and market fluctuations. Please 
  consult a licensed contractor and local building inspector before proceeding with construction. [COMPANY NAME] is not liable for price 
  changes or compliance issues."

  Short Disclaimer (for extraction review):
  "AI-extracted quantities are estimates. Please verify measurements before finalizing your quote."

  Compliance Disclaimer (on catalog selection page):
  "Products shown meet the standards for [REGION] based on available data. Final compliance verification must be performed by a licensed 
  professional."

  10.2 Placement Strategy

  | Screen              | Placement                     | Copy
                   |
  |---------------------|-------------------------------|----------------------------------------------------------------------------------
  -----------------|
  | Lead Capture        | Below form                    | "Your contact information is used solely for providing your quote. See our
  [Privacy Policy]."     |
  | Extraction Review   | Above quantity table          | "AI-extracted quantities are estimates. Please verify measurements before
  finalizing your quote." |
  | Region Verification | Below standards list          | "Compliance data is for reference only. Consult your local building department."
                   |
  | Catalog Selection   | Sticky footer (next to total) | Small icon (?) with tooltip: "Prices shown are current as of today. Final costs
  may vary."        |
  | Quote Summary       | Above total                   | Primary disclaimer (full text) in bordered box
                   |
  | PDF Document        | Footer (every page)           | "Estimate only. Final pricing subject to change. Verify compliance locally."
                   |
  | Email               | After PDF attachment          | "Please review the disclaimer in the attached quote. Contact us with questions."
                   |

  10.3 Tone & Language

  - Professional but approachable: Avoid overly legal jargon; explain what can vary and why
  - Transparent: Clearly state AI is used for extraction (builds trust)
  - Empowering: Encourage customers to verify and consult professionals (shows care)

  ---
  11) Figma Implementation Brief

  11.1 Audit Existing Frameworks

  Existing Root Framework (Assumed from repo):
  - Location: Repo root (likely components/, styles/, public/assets/)
  - Assets: Existing design tokens (colors, typography, spacing), UI components (buttons, forms, cards)

  Existing Figma Work (/Modular_B2B_Construction_CRM):
  - Newer designs for B2B CRM screens
  - May include: Dashboard layouts, data tables, navigation patterns

  Action: Export/document both frameworks:
  1. Create spreadsheet: Component Name | Location (Root/Figma) | Status (Reuse/New/Deprecated)
  2. Identify overlaps (e.g., both have button styles → pick one as source of truth)
  3. Document gaps (e.g., no existing product card component → need to design)

  11.2 New Figma Page Structure

  Recommended Figma Organization:

  Figma File: "Construction Quote Builder"
  ├── 📄 Cover Page (Project overview, links to root framework + CRM Figma)
  ├── 📄 Design System (Merged)
  │   ├── Colors (inherit from root + CRM; add new if needed)
  │   ├── Typography (same)
  │   ├── Spacing & Grid
  │   ├── Icons (construction-specific icons if needed)
  │   └── Components Library
  │       ├── Buttons (reuse root)
  │       ├── Forms (reuse root)
  │       ├── Cards (NEW: Product Card, Quote Line Item Card)
  │       ├── Tables (reuse CRM; adapt for quote)
  │       ├── Badges (NEW: Compliance Badge, Price Badge)
  │       └── Modals (reuse + adapt)
  ├── 📄 Customer Flow Screens
  │   ├── 01 - Landing Page
  │   ├── 02 - Lead Capture Form
  │   ├── 03 - Plan Upload
  │   ├── 04 - Extraction Review
  │   ├── 05 - Region Verification
  │   ├── 06 - Catalog Selection (Grid + Detail Modal)
  │   ├── 07 - Quote Summary
  │   └── 08 - Confirmation
  ├── 📄 Admin Screens
  │   ├── Pricing Management (List + Edit Modal)
  │   ├── Catalog Management (Grid + Add/Edit Forms)
  │   ├── Compliance Rules
  │   └── Leads Dashboard
  ├── 📄 Components (Detailed)
  │   ├── Product Card (Image, Name, Price, Badge, Add Button)
  │   ├── Quote Line Item (Row with Qty, Item, Price, Total)
  │   ├── Price History Table
  │   ├── Filter Panel (Sidebar with checkboxes, sliders)
  │   └── Disclaimer Box (Styled alert/notice component)
  └── 📄 Prototypes (Interactive flows)
      ├── Customer Journey (linked screens)
      └── Admin Journey (linked screens)

  11.3 Component Inventory (New Components Needed)

  | Component           | Purpose                                     | Design Notes
                                                                    | Variants                                                     |
  |---------------------|---------------------------------------------|--------------------------------------------------------------------
  ------------------------------------------------------------------|--------------------------------------------------------------|
  | Product Card        | Display catalog item in grid                | Image (16:9 ratio), Name (2 lines max), Material/Finish (1 line),
  Price (large), Compliance Badge (top-right), "Add to Quote" button | Default, Hover, Selected, Disabled (non-compliant)           |
  | Compliance Badge    | Show compliance status                      | Small pill shape, icon + text
                                                                    | ✓ Compliant (green), ⚠ Non-compliant (red), ? Unknown (gray) |
  | Quote Line Item Row | Display item in summary table               | Columns: Item Name, Quantity, Material, Unit Price, Total
                                                                    | Default, Editable (qty input)                                |
  | Price Tag           | Show price with strikethrough if discounted | Main price (large), Compare-at price (small, strikethrough if
  applicable)                                                            | Default, Discounted                                          |
  | Filter Panel        | Sidebar with filters                        | Sections: Category, Material (checkboxes), Price Range (slider),
  Compliance                                                          | Collapsed, Expanded                                          |
  | Disclaimer Box      | Highlight disclaimer text                   | Bordered box, icon (ℹ️), heading, body text
                                                                    | Info (blue), Warning (yellow)                                |
  | Region Badge        | Show detected region                        | Small tag with location icon + region name
                                                                    | Default                                                      |
  | Price History Row   | Admin view of price changes                 | Columns: Old Price → New Price, Changed By, Date, Reason
                                                                    | Default                                                      |

  11.4 Merging Strategy

  Step 1: Inventory both frameworks (root + CRM)
  - List all reusable components, tokens, patterns

  Step 2: Create "Quote Builder Design System" page in Figma
  - Import root framework tokens (colors, fonts, spacing) as base
  - Import CRM components where relevant (tables, admin layouts)
  - Add new components (product card, badges, etc.) using same tokens

  Step 3: Build customer flow screens
  - Start with wireframes (low-fidelity)
  - Apply components from merged design system
  - Ensure consistency (same button styles, form inputs, etc.)

  Step 4: Build admin screens
  - Reuse CRM table/list patterns heavily
  - Adapt for pricing and catalog management

  Step 5: Create integration guide document
  - Document: "When to use root components vs. CRM components vs. new components"
  - Handoff notes for developers: Component mapping (Figma layer name → React component name)

  11.5 Responsive Design

  - Breakpoints: Mobile (< 768px), Tablet (768-1024px), Desktop (> 1024px)
  - Key Adaptations:
    - Catalog grid: 1 column (mobile) → 2 columns (tablet) → 3-4 columns (desktop)
    - Filter panel: Bottom sheet (mobile) → Sidebar (desktop)
    - Quote summary table: Scroll horizontally (mobile) → Full table (desktop)
    - Product cards: Stack image above text (mobile) → Image left, text right (tablet+)

  11.6 Accessibility (WCAG 2.1 AA)

  - Color contrast: Ensure 4.5:1 for text, 3:1 for UI elements
  - Keyboard navigation: Tab through filters, product cards, buttons
  - Screen reader: Alt text for images, ARIA labels for icons
  - Focus states: Visible focus rings on all interactive elements

  ---
  12) Phased Rollout Plan + Acceptance Criteria

  12.1 Phase 1: MVP (Core Infrastructure) — 4-6 Weeks

  Scope:
  - Lead capture form + database
  - Plan upload wrapper (calls existing Framework B)
  - Basic catalog system (manual entry, 50-100 products)
  - Simple pricing (single global price per product, no regional variations)
  - Quotation generation (no PDF, just on-screen summary)
  - Admin: Manual product entry, manual pricing

  Acceptance Criteria:
  - Customer can submit contact form and upload plan
  - AI extraction results displayed (consuming Framework B API)
  - Customer can browse 50+ catalog products with images
  - Customer can select products and see quote total update
  - Quote summary displays all line items with prices
  - Lead data saved in database
  - Admin can add/edit products via UI
  - Admin can set prices via UI

  Deliverables:
  - Working /quote-builder customer flow (no region/compliance yet)
  - Working /admin/catalog and /admin/pricing screens
  - Database schema deployed (all tables except external pricing)
  - API endpoints: lead capture, upload, catalog, pricing, quotation

  Success Metrics:
  - 10 test quotes generated successfully
  - 0 critical bugs in core flow
  - Average quote generation time < 5 seconds

  ---
  12.2 Phase 2: V1 (Full Configuration + Compliance) — 6-8 Weeks

  Scope:
  - Region detection from zip code
  - Compliance standards database (manual entry for 10+ key regions)
  - Catalog filtering by region/compliance
  - Regional pricing variations
  - PDF generation
  - Email delivery
  - Catalog CSV import (bulk upload)
  - Admin compliance management UI

  Acceptance Criteria:
  - Customer's region auto-detected from zip code
  - Standards displayed for customer's region
  - Catalog filtered to show only compliant products
  - Regional pricing applied (e.g., CA prices differ from TX)
  - PDF quote generated and downloadable
  - Email sent to customer with PDF attachment
  - Admin can import 500+ products via CSV
  - Admin can configure compliance rules for 10 regions
  - Disclaimer text displayed on all relevant screens

  Deliverables:
  - Region/compliance module fully functional
  - PDF generation working (async queue)
  - Email service integrated (SendGrid/Postmark)
  - Catalog import pipeline (CSV validation + processing)
  - Figma designs finalized and handed off

  Success Metrics:
  - 100 real quotes generated in beta
  - 95%+ PDF generation success rate
  - Email delivery rate > 98%
  - Region detection accuracy > 90% (for US zip codes)
  - Compliance filtering working for 10 regions

  ---
  12.3 Phase 3: V2 (Advanced Features + Optimization) — 8-10 Weeks

  Scope:
  - External pricing reference integration (Home Depot API or equivalent)
  - Chat-based configuration (conversational UI for product selection)
  - Advanced pricing rules (volume discounts, seasonal pricing)
  - Supplier API connectors (automated catalog sync)
  - Analytics dashboard (quote volume, conversion rates, popular products)
  - Performance optimizations (caching, CDN, lazy loading)

  Acceptance Criteria:
  - External pricing data synced daily from 1+ source
  - Admin can see internal vs. external price comparison
  - Chat interface allows natural language product selection (e.g., "Show me oak doors under $500")
  - Volume discounts auto-apply (e.g., 10+ units = 10% off)
  - Supplier API connector pulls updates weekly
  - Analytics dashboard shows quote trends
  - Catalog page load time < 1 second (with 1000+ products)
  - PDF generation time < 2 seconds

  Deliverables:
  - External pricing module with 1-2 API integrations
  - Conversational UI (using existing Framework B chat or new interface)
  - Advanced pricing engine (rules-based discounts)
  - Supplier connector framework (adapter pattern for scalability)
  - Performance monitoring dashboard

  Success Metrics:
  - 1000+ quotes generated
  - Conversion rate (quote → contact sales) > 20%
  - External pricing data accuracy > 95%
  - Chat configuration usage > 30% of quotes
  - Zero performance regressions (maintain < 3s quote generation)

  ---
  12.4 Rollout Strategy

  Beta Testing (Pre-Phase 2):
  - Invite 10-20 friendly customers to test MVP
  - Collect feedback on UX, accuracy, and missing features
  - Iterate based on feedback before full launch

  Soft Launch (Phase 2):
  - Enable quote builder for subset of traffic (20-30%)
  - Monitor errors, performance, and user drop-off
  - A/B test against existing quote process (if applicable)

  Full Launch (Post-Phase 2):
  - Roll out to 100% of traffic
  - Marketing push (email campaigns, website banners)
  - Train sales team on new lead pipeline

  Post-Launch (Phase 3):
  - Continuous improvement based on analytics
  - Add new regions, products, suppliers
  - Explore AI enhancements (better extraction, auto-recommendations)

  ---
  13) Open Questions + Risks

  13.1 Open Questions

  Q1: What is the existing AI extraction accuracy for quantities?
  - Why It Matters: If accuracy < 80%, customer may lose trust; need robust review/edit UX
  - Action: Audit extraction results from last 100 uploads; calculate precision/recall

  Q2: Which regions/countries are in scope for Phase 1?
  - Why It Matters: Determines compliance data entry effort
  - Action: Stakeholder to prioritize regions (recommend: Start with 5-10 US states where most customers are)

  Q3: Are there existing supplier relationships for catalog data?
  - Why It Matters: If yes, can streamline ingestion; if no, need manual sourcing
  - Action: Sales/procurement to list current suppliers and data availability

  Q4: What is the expected catalog size (# of products)?
  - Why It Matters: Affects database design, search performance, UI pagination
  - Action: Estimate based on: (# of categories) × (avg products per category)

  Q5: Is tax calculation required, or just subtotal?
  - Why It Matters: Tax varies by region/product type; adds complexity
  - Action: Finance team to confirm; if yes, integrate tax API (Avalara, TaxJar) in Phase 2

  Q6: How often do prices change (daily, weekly, monthly)?
  - Why It Matters: Determines caching strategy and admin update frequency
  - Action: Interview procurement team; set expectation for admin update cadence

  Q7: Do we need multi-currency support?
  - Why It Matters: If international, need currency conversion + regional pricing
  - Action: Define geographic scope; if multi-country, add currency field to pricing rules

  Q8: What email service is currently used?
  - Why It Matters: Reuse existing (SendGrid, Mailgun) vs. set up new
  - Action: DevOps to confirm; ensure API keys/templates ready

  Q9: Is there a CRM system for leads?
  - Why It Matters: May need to integrate (e.g., push leads to Salesforce)
  - Action: Sales team to confirm; plan API integration or CSV export

  Q10: What is the legal review status for disclaimers?
  - Why It Matters: Liability protection; must be approved before launch
  - Action: Legal team to review and approve all disclaimer text

  ---
  13.2 Risks + Mitigation

  | Risk                                                    | Impact                                       | Likelihood | Mitigation
                                                                                |
  |---------------------------------------------------------|----------------------------------------------|------------|------------------
  ------------------------------------------------------------------------------|
  | AI extraction inaccuracies lead to wrong quotes         | High (customer dissatisfaction, refunds)     | Medium     | Add prominent
  "Review & Edit Quantities" step with tooltips; train AI model with more data     |
  | External pricing APIs unavailable or unreliable         | Medium (no reference pricing)                | Medium     | Make external
  pricing optional (Phase 2+); allow manual reference entry as fallback            |
  | Compliance data is incorrect or outdated                | High (legal liability, failed inspections)   | Medium     | Add strong
  disclaimers; require professional verification; update data quarterly; legal review |
  | Catalog images missing or poor quality                  | Medium (low conversion, unprofessional look) | High       | Require images
  during product creation; provide placeholder templates; source from suppliers   |
  | Performance issues with large catalogs (1000+ products) | Medium (slow page load, poor UX)             | Medium     | Implement
  pagination (20-50/page), lazy loading, CDN caching, database indexing                |
  | Regional pricing too complex to manage                  | Medium (admin burden, errors)                | Low        | Start with global
   pricing in Phase 1; add regional overrides only where necessary              |
  | PDF generation is slow or fails                         | Medium (customer doesn't get quote)          | Low        | Use async
  generation (queue); send email when ready; cache common quote templates              |
  | Lead data not captured (form errors, validation issues) | High (lost sales opportunities)              | Low        | Robust form
  validation; auto-save drafts; test across browsers/devices                         |
  | Supplier API changes break ingestion pipeline           | Medium (outdated catalog)                    | Medium     | Build adapter
  pattern (versioned connectors); monitor API health; fallback to CSV import       |
  | Tax calculation errors                                  | High (incorrect totals, customer complaints) | Medium     | Use established
  tax API (Avalara); clearly label "estimated tax"; allow manual override        |
  | Scope creep (feature requests during build)             | Medium (delays, budget overruns)             | High       | Strict phase
  gates; defer non-critical features to Phase 2/3; stakeholder sign-off on scope    |
  | Figma designs not developer-ready                       | Medium (delays, rework)                      | Medium     | Include
  developers in design reviews; use Figma Dev Mode; provide component specs/tokens       |
  | Framework B API changes break integration               | High (quote builder stops working)           | Low        | Version API
  endpoints; monitor Framework B changes; maintain wrapper layer with fallbacks      |
  | Customer abandons flow (high drop-off rate)             | High (low conversion)                        | Medium     | A/B test flow;
  add progress indicators; minimize required fields; send "resume quote" emails   |

  ---
  13.3 Unknowns to Investigate

  1. Standards Data Sources: Research APIs/databases for building codes (ASTM, ICC, state codes). If none found, plan manual entry process
  with quarterly updates.
  2. Home Depot API Access: Confirm if Home Depot (or similar) offers public/partner API for pricing. If not, evaluate web scraping
  legality or use manual reference pricing.
  3. Existing Framework B Extraction Format: Audit exact JSON structure of extraction results to design wrapper API contract.
  4. Current User Roles/Permissions: Understand existing admin roles to ensure new admin screens respect permissions (e.g., "Pricing
  Manager" vs. "Catalog Manager").
  5. Mobile Usage Patterns: Analyze if customers primarily upload plans from mobile or desktop. If mobile-heavy, prioritize mobile-first
  design.
  6. Server Capacity: Estimate PDF generation load (e.g., 100 quotes/day × 2s/PDF = need worker queue). Provision accordingly.
  7. Image Storage Costs: Calculate estimated storage needs (1000 products × 5 images × 2MB = 10GB) and CDN bandwidth. Budget for AWS
  S3/CloudFront or Cloudflare.
  8. Sales Team Workflow: Understand how sales currently follows up on leads. Design admin lead dashboard to match their process (e.g.,
  status updates, notes, CRM export).

  ---
  End of Plan
