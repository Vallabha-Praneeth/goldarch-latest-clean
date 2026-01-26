-- ============================================================================
-- CONSTRUCTION QUOTE BUILDER - DATABASE SCHEMA
-- Phase 1: MVP Implementation
-- Created: 2026-01-16
--
-- IMPORTANT: This schema does NOT modify any existing tables.
-- All tables are new and prefixed with 'quote_' or 'quotation_'
-- Foreign keys to existing tables (plan_jobs, products) are READ-ONLY references
-- ============================================================================

-- ============================================================================
-- 1. QUOTE REGIONS
-- Defines supported regions (Los Angeles initially, expandable)
-- ============================================================================
CREATE TABLE quote_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'los-angeles', 'new-york', etc.
  name TEXT NOT NULL, -- 'Los Angeles, CA'
  state TEXT NOT NULL, -- 'California'
  country TEXT DEFAULT 'USA',
  compliance_notes TEXT, -- Special building code requirements
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast region lookups
CREATE INDEX idx_quote_regions_code ON quote_regions(code);
CREATE INDEX idx_quote_regions_active ON quote_regions(active);

-- ============================================================================
-- 2. QUOTE CUSTOMER TIERS
-- Defines customer segments (premium, standard)
-- Used for filtering products and applying discounts
-- ============================================================================
CREATE TABLE quote_customer_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'premium', 'standard', 'vip'
  description TEXT,
  discount_pct DECIMAL(5,2) DEFAULT 0, -- Global discount percentage
  priority INTEGER DEFAULT 0, -- Display order (higher = higher priority)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default tiers
INSERT INTO quote_customer_tiers (name, description, discount_pct, priority) VALUES
  ('premium', 'Premium customers - full product access', 0, 100),
  ('standard', 'Standard customers - basic product access', 0, 50);

-- ============================================================================
-- 3. QUOTE LEADS
-- Captures lead information BEFORE showing pricing
-- Required for region-based filtering and customer tier assignment
-- ============================================================================
CREATE TABLE quote_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: link to registered user

  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,

  -- Location & Project
  region_id UUID REFERENCES quote_regions(id) ON DELETE RESTRICT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  project_type TEXT, -- 'residential', 'commercial', 'mixed'
  project_notes TEXT,

  -- Customer Tier (assigned by admin or auto)
  tier_id UUID REFERENCES quote_customer_tiers(id) ON DELETE SET NULL,

  -- Lead Status
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'quoted', 'won', 'lost'
  source TEXT, -- 'website', 'referral', 'direct'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lead management
CREATE INDEX idx_quote_leads_user_id ON quote_leads(user_id);
CREATE INDEX idx_quote_leads_email ON quote_leads(email);
CREATE INDEX idx_quote_leads_region_id ON quote_leads(region_id);
CREATE INDEX idx_quote_leads_tier_id ON quote_leads(tier_id);
CREATE INDEX idx_quote_leads_status ON quote_leads(status);
CREATE INDEX idx_quote_leads_created_at ON quote_leads(created_at DESC);

-- ============================================================================
-- 4. QUOTE COMPLIANCE RULES
-- Defines region-specific material restrictions and requirements
-- E.g., "LA requires fire-rated doors in multi-family buildings"
-- ============================================================================
CREATE TABLE quote_compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES quote_regions(id) ON DELETE CASCADE,

  -- Rule Definition
  rule_type TEXT NOT NULL, -- 'required', 'prohibited', 'recommended'
  category TEXT NOT NULL, -- 'doors', 'windows', 'materials', 'energy'
  rule_name TEXT NOT NULL, -- 'fire_rated_doors', 'energy_star_windows'
  description TEXT NOT NULL,

  -- Affected Products (JSONB array of product IDs or tags)
  applies_to_products JSONB, -- {"product_ids": ["uuid1", "uuid2"], "tags": ["fire-rated"]}

  -- Status
  active BOOLEAN DEFAULT TRUE,
  effective_date DATE DEFAULT CURRENT_DATE,
  expires_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_region ON quote_compliance_rules(region_id);
CREATE INDEX idx_compliance_category ON quote_compliance_rules(category);
CREATE INDEX idx_compliance_active ON quote_compliance_rules(active);

-- ============================================================================
-- 5. QUOTE PRICING RULES
-- Defines product pricing with region and tier variations
-- Supports price versioning (effective_date allows historical pricing)
-- ============================================================================
CREATE TABLE quote_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Reference (links to existing products table)
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Region & Tier Filters (NULL = applies to all)
  region_id UUID REFERENCES quote_regions(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES quote_customer_tiers(id) ON DELETE CASCADE,

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  markup_pct DECIMAL(5,2) DEFAULT 0, -- Additional markup for this region/tier
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (
    base_price * (1 + markup_pct / 100)
  ) STORED,

  -- Currency
  currency TEXT DEFAULT 'USD',

  -- Versioning (allows price changes without affecting historical quotes)
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_date DATE, -- NULL = no expiration

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for pricing lookups
CREATE INDEX idx_pricing_product ON quote_pricing_rules(product_id);
CREATE INDEX idx_pricing_region ON quote_pricing_rules(region_id);
CREATE INDEX idx_pricing_tier ON quote_pricing_rules(tier_id);
CREATE INDEX idx_pricing_effective ON quote_pricing_rules(effective_date DESC);

-- Unique constraint: One active price per product/region/tier combination
CREATE UNIQUE INDEX idx_pricing_unique_active ON quote_pricing_rules(
  product_id,
  COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::UUID),
  COALESCE(tier_id, '00000000-0000-0000-0000-000000000000'::UUID),
  effective_date
) WHERE expires_date IS NULL;

-- ============================================================================
-- 6. QUOTATIONS (Main Quote Records)
-- Enhanced quote table separate from existing 'quotes' table
-- Links to extraction results via extraction_job_id
-- ============================================================================
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lead & User
  lead_id UUID REFERENCES quote_leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Extraction Link (READ-ONLY reference to existing plan_jobs)
  extraction_job_id UUID REFERENCES plan_jobs(id) ON DELETE SET NULL,

  -- Quote Metadata
  quote_number TEXT UNIQUE, -- Auto-generated: QT-2026-0001
  version INTEGER DEFAULT 1, -- Allows quote revisions

  -- Status Workflow
  status TEXT DEFAULT 'draft',
  -- 'draft' -> 'pending_review' -> 'sent' -> 'accepted' | 'rejected' | 'expired'

  -- Pricing Summary
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_placeholder DECIMAL(10,2) DEFAULT 0, -- Simple placeholder (will enhance later)
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Validity
  valid_until DATE, -- Quote expiration date

  -- Notes & Terms
  internal_notes TEXT, -- Admin notes (not shown to customer)
  customer_notes TEXT, -- Notes shown to customer
  terms_and_conditions TEXT, -- Legal disclaimers

  -- Email Tracking
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  opened_at TIMESTAMPTZ, -- Track if email opened (Phase 2)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Auto-generate quote number on insert
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'QT-' ||
                        TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(NEXTVAL('quote_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE quote_number_seq START 1;

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_number();

-- Indexes
CREATE INDEX idx_quotations_lead ON quotations(lead_id);
CREATE INDEX idx_quotations_user ON quotations(user_id);
CREATE INDEX idx_quotations_extraction ON quotations(extraction_job_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created ON quotations(created_at DESC);

-- ============================================================================
-- 7. QUOTATION LINES (Line Items)
-- Detailed breakdown of each quote item
-- Links back to extraction evidence for transparency
-- ============================================================================
CREATE TABLE quotation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,

  -- Line Item Details
  line_number INTEGER NOT NULL, -- Display order: 1, 2, 3...
  category TEXT NOT NULL, -- 'doors', 'windows', 'kitchen', 'bathrooms', 'fixtures'
  subcategory TEXT, -- 'entry', 'interior', 'sliding' (for doors)

  -- Product Reference
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL, -- User-friendly description

  -- Quantity
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_of_measure TEXT DEFAULT 'ea', -- 'ea', 'sq ft', 'linear ft'

  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (
    quantity * unit_price
  ) STORED,

  -- Extraction Evidence (links to plan_analyses for transparency)
  extraction_evidence JSONB,
  -- Example: {
  --   "source": "door_schedule",
  --   "confidence": "high",
  --   "page_no": 3,
  --   "artifact_id": "uuid",
  --   "note": "Door D1 from schedule on page 3"
  -- }

  -- Admin Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotation_lines_quotation ON quotation_lines(quotation_id);
CREATE INDEX idx_quotation_lines_product ON quotation_lines(product_id);
CREATE INDEX idx_quotation_lines_category ON quotation_lines(category);

-- Ensure line numbers are unique per quotation
CREATE UNIQUE INDEX idx_quotation_lines_number ON quotation_lines(quotation_id, line_number);

-- ============================================================================
-- 8. QUOTATION VERSIONS (Quote Revision History)
-- Tracks changes to quotes over time
-- Allows comparing quote versions and auditing changes
-- ============================================================================
CREATE TABLE quotation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,

  -- Version Info
  version_number INTEGER NOT NULL,
  change_summary TEXT, -- "Updated door pricing", "Added compliance notes"

  -- Snapshot of quote data at this version
  snapshot JSONB NOT NULL, -- Full quote + line items as JSON

  -- Who made the change
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_versions_quotation ON quotation_versions(quotation_id);
CREATE INDEX idx_versions_created ON quotation_versions(created_at DESC);

-- ============================================================================
-- 9. QUOTATION AUDIT LOG (Price Change Tracking)
-- Detailed audit trail of all price changes
-- Required for transparency and compliance
-- ============================================================================
CREATE TABLE quotation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What changed
  entity_type TEXT NOT NULL, -- 'quotation', 'quotation_line', 'pricing_rule'
  entity_id UUID NOT NULL,

  -- Change details
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'price_changed'
  field_name TEXT, -- 'unit_price', 'status', etc.
  old_value TEXT,
  new_value TEXT,

  -- Why (optional)
  reason TEXT,

  -- Who & When
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET
);

CREATE INDEX idx_audit_entity ON quotation_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON quotation_audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON quotation_audit_log(created_by);

-- ============================================================================
-- 10. QUOTE PRODUCT VISIBILITY (Premium Filtering)
-- Controls which products are visible to which customer tiers
-- Addresses user requirement: "admin should have the right to pre-fix which
-- suppliers products to the client and which not, think of it like premium
-- products are shown to specific customers"
-- ============================================================================
CREATE TABLE quote_product_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Filter
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Tier Assignment
  tier_id UUID REFERENCES quote_customer_tiers(id) ON DELETE CASCADE,

  -- Visibility Control
  visible BOOLEAN DEFAULT TRUE, -- If false, hide from this tier

  -- Reason (for admin clarity)
  notes TEXT, -- "Premium product - standard customers see alternative"

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Unique constraint: One visibility rule per product/tier
CREATE UNIQUE INDEX idx_visibility_product_tier ON quote_product_visibility(product_id, tier_id);

CREATE INDEX idx_visibility_tier ON quote_product_visibility(tier_id);
CREATE INDEX idx_visibility_visible ON quote_product_visibility(visible);

-- ============================================================================
-- 11. QUOTE EMAIL TRACKING (Phase 2, but table created now)
-- Tracks email delivery status for sent quotes
-- ============================================================================
CREATE TABLE quote_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,

  -- Email Details
  sent_to TEXT NOT NULL,
  sent_from TEXT,
  subject TEXT,

  -- SendGrid Info
  sendgrid_message_id TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'failed'

  -- Events
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_tracking_quotation ON quote_email_tracking(quotation_id);
CREATE INDEX idx_email_tracking_status ON quote_email_tracking(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE quote_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_customer_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_product_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_email_tracking ENABLE ROW LEVEL SECURITY;

-- quote_regions: Readable by all authenticated users, writable by admins
CREATE POLICY "Regions are viewable by authenticated users"
  ON quote_regions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Regions are editable by admins"
  ON quote_regions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- quote_customer_tiers: Same as regions
CREATE POLICY "Tiers are viewable by authenticated users"
  ON quote_customer_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tiers are editable by admins"
  ON quote_customer_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- quote_leads: Users can only see their own leads, admins see all
CREATE POLICY "Users can view their own leads"
  ON quote_leads FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'sales')
    )
  );

CREATE POLICY "Users can create leads"
  ON quote_leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own leads"
  ON quote_leads FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'sales')
    )
  );

-- quotations: Users can only see their own quotes, admins see all
CREATE POLICY "Users can view their own quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    lead_id IN (SELECT id FROM quote_leads WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'sales')
    )
  );

CREATE POLICY "Authenticated users can create quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'sales')
    )
  );

-- quotation_lines: Inherit access from parent quotation
CREATE POLICY "Users can view quotation lines for accessible quotations"
  ON quotation_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE id = quotation_lines.quotation_id
      AND (
        user_id = auth.uid() OR
        lead_id IN (SELECT id FROM quote_leads WHERE user_id = auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'sales')
        )
      )
    )
  );

CREATE POLICY "Users can manage quotation lines for their quotations"
  ON quotation_lines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE id = quotation_lines.quotation_id
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'sales')
        )
      )
    )
  );

-- Pricing rules and compliance rules: Admins only for write, all can read
CREATE POLICY "Pricing rules viewable by authenticated users"
  ON quote_pricing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pricing rules editable by admins"
  ON quote_pricing_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Compliance rules viewable by authenticated users"
  ON quote_compliance_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Compliance rules editable by admins"
  ON quote_compliance_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Product visibility: Admins only
CREATE POLICY "Product visibility managed by admins"
  ON quote_product_visibility FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Audit log: Read-only for admins
CREATE POLICY "Audit log viewable by admins"
  ON quotation_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- SEED DATA: Los Angeles Region
-- ============================================================================
INSERT INTO quote_regions (code, name, state, compliance_notes, active) VALUES
  ('los-angeles', 'Los Angeles, CA', 'California',
   'LA Building Code 2023. Fire-rated doors required for multi-family buildings. Energy Star windows recommended.',
   true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE quote_regions IS 'Supported regions for quote generation (LA initially, expandable)';
COMMENT ON TABLE quote_customer_tiers IS 'Customer segments for premium/standard product filtering';
COMMENT ON TABLE quote_leads IS 'Lead capture - required before showing pricing';
COMMENT ON TABLE quote_compliance_rules IS 'Region-specific building code requirements';
COMMENT ON TABLE quote_pricing_rules IS 'Product pricing with region/tier variations and versioning';
COMMENT ON TABLE quotations IS 'Main quote records - links to extraction via extraction_job_id';
COMMENT ON TABLE quotation_lines IS 'Quote line items with extraction evidence';
COMMENT ON TABLE quotation_versions IS 'Quote revision history for audit trail';
COMMENT ON TABLE quotation_audit_log IS 'Detailed audit log of all quote changes';
COMMENT ON TABLE quote_product_visibility IS 'Controls which products visible to which tiers (premium filtering)';
COMMENT ON TABLE quote_email_tracking IS 'Email delivery tracking for sent quotes (Phase 2)';

-- ============================================================================
-- VERIFICATION QUERIES (Run to verify schema)
-- ============================================================================

-- List all new tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE 'quote%' OR tablename LIKE 'quotation%')
ORDER BY tablename;

-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE 'quote%' OR tablename LIKE 'quotation%')
ORDER BY tablename;

-- Verify foreign keys to existing tables (read-only references)
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (tc.table_name LIKE 'quote%' OR tc.table_name LIKE 'quotation%')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
