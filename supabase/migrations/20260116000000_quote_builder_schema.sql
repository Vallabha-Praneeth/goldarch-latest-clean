-- 20260116000000_quote_builder_schema.sql
-- CONSTRUCTION QUOTE BUILDER - DATABASE SCHEMA (System A: quotations/*)
-- All tables are new and prefixed with 'quote_' or 'quotation_' (plus 'quotations').

-- Recommended extensions (Supabase usually has these, but safe to ensure)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. QUOTE REGIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,              -- e.g. 'LA'
  name TEXT NOT NULL,                     -- e.g. 'Los Angeles'
  state TEXT,
  compliance_notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_regions_code ON quote_regions(code);
CREATE INDEX IF NOT EXISTS idx_quote_regions_active ON quote_regions(active);

-- updated_at helper
CREATE OR REPLACE FUNCTION quote_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_regions_touch ON quote_regions;
CREATE TRIGGER trg_quote_regions_touch
  BEFORE UPDATE ON quote_regions
  FOR EACH ROW
  EXECUTE FUNCTION quote_touch_updated_at();

-- ============================================================================
-- 2. QUOTE CUSTOMER TIERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_customer_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,              -- e.g. 'Standard', 'Premium'
  description TEXT,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_customer_tiers_active ON quote_customer_tiers(active);
CREATE INDEX IF NOT EXISTS idx_quote_customer_tiers_priority ON quote_customer_tiers(priority);

DROP TRIGGER IF EXISTS trg_quote_customer_tiers_touch ON quote_customer_tiers;
CREATE TRIGGER trg_quote_customer_tiers_touch
  BEFORE UPDATE ON quote_customer_tiers
  FOR EACH ROW
  EXECUTE FUNCTION quote_touch_updated_at();

-- ============================================================================
-- 3. QUOTE LEADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic customer info
  full_name TEXT,
  phone TEXT,
  email TEXT,

  -- Business segmentation
  region_id UUID REFERENCES quote_regions(id) ON DELETE RESTRICT,
  tier_id UUID REFERENCES quote_customer_tiers(id) ON DELETE SET NULL,

  -- Lead status pipeline
  status TEXT DEFAULT 'new',  -- 'new', 'contacted', 'quoted', 'won', 'lost'

  -- Optional metadata
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_leads_user_id ON quote_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_leads_email ON quote_leads(email);
CREATE INDEX IF NOT EXISTS idx_quote_leads_region_id ON quote_leads(region_id);
CREATE INDEX IF NOT EXISTS idx_quote_leads_tier_id ON quote_leads(tier_id);
CREATE INDEX IF NOT EXISTS idx_quote_leads_status ON quote_leads(status);
CREATE INDEX IF NOT EXISTS idx_quote_leads_created_at ON quote_leads(created_at DESC);

DROP TRIGGER IF EXISTS trg_quote_leads_touch ON quote_leads;
CREATE TRIGGER trg_quote_leads_touch
  BEFORE UPDATE ON quote_leads
  FOR EACH ROW
  EXECUTE FUNCTION quote_touch_updated_at();

-- ============================================================================
-- 4. QUOTE COMPLIANCE RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES quote_regions(id) ON DELETE CASCADE,

  category TEXT NOT NULL,                 -- e.g. 'doors', 'windows'
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  severity TEXT DEFAULT 'info',           -- 'info', 'warning', 'blocker'
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_region ON quote_compliance_rules(region_id);
CREATE INDEX IF NOT EXISTS idx_compliance_category ON quote_compliance_rules(category);
CREATE INDEX IF NOT EXISTS idx_compliance_active ON quote_compliance_rules(active);

DROP TRIGGER IF EXISTS trg_quote_compliance_rules_touch ON quote_compliance_rules;
CREATE TRIGGER trg_quote_compliance_rules_touch
  BEFORE UPDATE ON quote_compliance_rules
  FOR EACH ROW
  EXECUTE FUNCTION quote_touch_updated_at();

-- ============================================================================
-- 5. QUOTE PRICING RULES
-- Defines product pricing with region and tier variations
-- Supports price versioning (effective_date allows historical pricing)
--
-- NOTE (tooling): The products table may not exist in Supabase CLI shadow DB
-- during `supabase db pull` diffing. We therefore add the products FK
-- conditionally to keep migrations self-contained for tooling.
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Reference (links to existing products table, FK added conditionally)
  product_id UUID,

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

  -- Versioning
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_date DATE, -- NULL = no expiration

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add products FK only if products table exists (tooling-safe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname='public'
         AND t.relname='quote_pricing_rules'
         AND c.conname='quote_pricing_rules_product_id_fkey'
     )
  THEN
    ALTER TABLE public.quote_pricing_rules
      ADD CONSTRAINT quote_pricing_rules_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pricing_product ON quote_pricing_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_region ON quote_pricing_rules(region_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier ON quote_pricing_rules(tier_id);
CREATE INDEX IF NOT EXISTS idx_pricing_effective ON quote_pricing_rules(effective_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_unique_active ON quote_pricing_rules(
  product_id,
  COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::UUID),
  COALESCE(tier_id, '00000000-0000-0000-0000-000000000000'::UUID),
  effective_date
);

-- ============================================================================
-- 6. QUOTATIONS (Main Quote Records)
-- Enhanced quote table separate from existing 'quotes' table (System B)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  lead_id UUID REFERENCES quote_leads(id) ON DELETE SET NULL,

  -- Links to extraction job (if you have one)
  extraction_job_id UUID,

  -- Quote Metadata
  quote_number TEXT UNIQUE,           -- Auto-generated: QT-2026-0001
  version INTEGER DEFAULT 1,          -- Allows quote revisions
  status TEXT DEFAULT 'draft',        -- draft, sent, accepted, rejected, expired

  valid_until DATE,                  -- Quote expiration date

  -- Totals
  subtotal DECIMAL(12,2),
  tax_total DECIMAL(12,2),
  discount_total DECIMAL(12,2),
  total DECIMAL(12,2),

  currency TEXT DEFAULT 'USD',

  -- Optional freeform notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_lead ON quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_extraction ON quotations(extraction_job_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON quotations(created_at DESC);

DROP TRIGGER IF EXISTS trg_quotations_touch ON quotations;
CREATE TRIGGER trg_quotations_touch
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION quote_touch_updated_at();

-- Auto-generate quote number on insert
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

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

DROP TRIGGER IF EXISTS set_quote_number ON quotations;
CREATE TRIGGER set_quote_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_number();

-- ============================================================================
-- 7. QUOTATION LINES (Line Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,

  line_number INTEGER NOT NULL,

  -- Product linkage (optional)
  product_id UUID,

  category TEXT,
  title TEXT,
  description TEXT,

  quantity DECIMAL(12,3) DEFAULT 1,
  unit TEXT,

  unit_price DECIMAL(12,2),
  line_total DECIMAL(12,2),

  -- Evidence / extraction metadata
  evidence JSONB,
  extraction_meta JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_lines_quotation ON quotation_lines(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_lines_product ON quotation_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_quotation_lines_category ON quotation_lines(category);

-- Ensure line numbers are unique per quotation
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotation_lines_number
  ON quotation_lines(quotation_id, line_number);

DROP TRIGGER IF EXISTS trg_quotation_lines_touch ON quotation_lines;
CREATE TRIGGER trg_quotation_lines_touch
  BEFORE UPDATE ON quotation_lines
  FOR EACH ROW
  EXECUTE FUNCTION quote_touch_updated_at();

-- Optional product FK (tooling-safe, same trick as pricing rules)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'products'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'quotation_lines'
      AND c.conname = 'quotation_lines_product_id_fkey'
  )
  THEN
    ALTER TABLE public.quotation_lines
      ADD CONSTRAINT quotation_lines_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 8. QUOTATION VERSIONS (Quote Revision History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full quote + line items as JSON
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_versions_quotation ON quotation_versions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_versions_created ON quotation_versions(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_unique ON quotation_versions(quotation_id, version);

-- ============================================================================
-- 9. QUOTATION AUDIT LOG (Price Change Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'quotation', 'quotation_line', 'pricing_rule'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,      -- 'create', 'update', 'delete'
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON quotation_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON quotation_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON quotation_audit_log(created_by);

-- ============================================================================
-- 10. QUOTE PRODUCT VISIBILITY (Premium Filtering)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_product_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  tier_id UUID REFERENCES quote_customer_tiers(id) ON DELETE CASCADE,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_visibility_product_tier
  ON quote_product_visibility(product_id, tier_id);

CREATE INDEX IF NOT EXISTS idx_visibility_tier ON quote_product_visibility(tier_id);
CREATE INDEX IF NOT EXISTS idx_visibility_visible ON quote_product_visibility(visible);

-- Tooling-safe products FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'products'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'quote_product_visibility'
      AND c.conname = 'quote_product_visibility_product_id_fkey'
  )
  THEN
    ALTER TABLE public.quote_product_visibility
      ADD CONSTRAINT quote_product_visibility_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 11. QUOTE EMAIL TRACKING (Phase 2, but table created now)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,

  recipient_email TEXT NOT NULL,
  subject TEXT,
  provider TEXT,               -- e.g. sendgrid
  status TEXT DEFAULT 'queued',-- queued/sent/delivered/bounced/failed
  message_id TEXT,

  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tracking_quotation ON quote_email_tracking(quotation_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON quote_email_tracking(status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent ON quote_email_tracking(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient ON quote_email_tracking(recipient_email);

-- ============================================================================
-- USER ROLES (Infrastructure table for RLS policies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- ============================================================================
-- RLS ENABLEMENT
-- ============================================================================
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

-- Helper: treat JWT claim "app_role" = 'admin' as admin
-- (If claim is missing, expression is false)
CREATE OR REPLACE FUNCTION is_app_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'app_role', '') = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- quote_regions: readable by authenticated, writable by admins
DROP POLICY IF EXISTS "quote_regions_select" ON quote_regions;
CREATE POLICY "quote_regions_select"
  ON quote_regions FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "quote_regions_admin_all" ON quote_regions;
CREATE POLICY "quote_regions_admin_all"
  ON quote_regions FOR ALL
  TO authenticated
  USING (is_app_admin())
  WITH CHECK (is_app_admin());

-- quote_customer_tiers: readable by authenticated, writable by admins
DROP POLICY IF EXISTS "quote_customer_tiers_select" ON quote_customer_tiers;
CREATE POLICY "quote_customer_tiers_select"
  ON quote_customer_tiers FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "quote_customer_tiers_admin_all" ON quote_customer_tiers;
CREATE POLICY "quote_customer_tiers_admin_all"
  ON quote_customer_tiers FOR ALL
  TO authenticated
  USING (is_app_admin())
  WITH CHECK (is_app_admin());

-- quote_leads: users see/manage their own; admins see all
DROP POLICY IF EXISTS "quote_leads_select_own_or_admin" ON quote_leads;
CREATE POLICY "quote_leads_select_own_or_admin"
  ON quote_leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_app_admin());

DROP POLICY IF EXISTS "quote_leads_insert_own" ON quote_leads;
CREATE POLICY "quote_leads_insert_own"
  ON quote_leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_app_admin());

DROP POLICY IF EXISTS "quote_leads_update_own_or_admin" ON quote_leads;
CREATE POLICY "quote_leads_update_own_or_admin"
  ON quote_leads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_app_admin())
  WITH CHECK (user_id = auth.uid() OR is_app_admin());

DROP POLICY IF EXISTS "quote_leads_delete_own_or_admin" ON quote_leads;
CREATE POLICY "quote_leads_delete_own_or_admin"
  ON quote_leads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_app_admin());

-- quote_compliance_rules: readable by authenticated, writable by admins
DROP POLICY IF EXISTS "quote_compliance_rules_select" ON quote_compliance_rules;
CREATE POLICY "quote_compliance_rules_select"
  ON quote_compliance_rules FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "quote_compliance_rules_admin_all" ON quote_compliance_rules;
CREATE POLICY "quote_compliance_rules_admin_all"
  ON quote_compliance_rules FOR ALL
  TO authenticated
  USING (is_app_admin())
  WITH CHECK (is_app_admin());

-- quote_pricing_rules: readable by authenticated, writable by admins
DROP POLICY IF EXISTS "quote_pricing_rules_select" ON quote_pricing_rules;
CREATE POLICY "quote_pricing_rules_select"
  ON quote_pricing_rules FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "quote_pricing_rules_admin_all" ON quote_pricing_rules;
CREATE POLICY "quote_pricing_rules_admin_all"
  ON quote_pricing_rules FOR ALL
  TO authenticated
  USING (is_app_admin())
  WITH CHECK (is_app_admin());

-- quotations: users can see/manage their own quotations (and admin sees all)
DROP POLICY IF EXISTS "quotations_select_own_or_admin" ON quotations;
CREATE POLICY "quotations_select_own_or_admin"
  ON quotations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_app_admin());

DROP POLICY IF EXISTS "quotations_insert_own_or_admin" ON quotations;
CREATE POLICY "quotations_insert_own_or_admin"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_app_admin());

DROP POLICY IF EXISTS "quotations_update_own_or_admin" ON quotations;
CREATE POLICY "quotations_update_own_or_admin"
  ON quotations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_app_admin())
  WITH CHECK (user_id = auth.uid() OR is_app_admin());

DROP POLICY IF EXISTS "quotations_delete_own_or_admin" ON quotations;
CREATE POLICY "quotations_delete_own_or_admin"
  ON quotations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_app_admin());

-- quotation_lines: inherit access from parent quotation
DROP POLICY IF EXISTS "quotation_lines_select_via_parent" ON quotation_lines;
CREATE POLICY "quotation_lines_select_via_parent"
  ON quotation_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_lines.quotation_id
        AND (q.user_id = auth.uid() OR is_app_admin())
    )
  );

DROP POLICY IF EXISTS "quotation_lines_all_via_parent" ON quotation_lines;
CREATE POLICY "quotation_lines_all_via_parent"
  ON quotation_lines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_lines.quotation_id
        AND (q.user_id = auth.uid() OR is_app_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_lines.quotation_id
        AND (q.user_id = auth.uid() OR is_app_admin())
    )
  );

-- quotation_versions: users/admin can read; create for own quotes
DROP POLICY IF EXISTS "quotation_versions_select_via_parent" ON quotation_versions;
CREATE POLICY "quotation_versions_select_via_parent"
  ON quotation_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_versions.quotation_id
        AND (q.user_id = auth.uid() OR is_app_admin())
    )
  );

DROP POLICY IF EXISTS "quotation_versions_insert_via_parent" ON quotation_versions;
CREATE POLICY "quotation_versions_insert_via_parent"
  ON quotation_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_versions.quotation_id
        AND (q.user_id = auth.uid() OR is_app_admin())
    )
  );

-- quotation_audit_log: admin only (audit table)
DROP POLICY IF EXISTS "quotation_audit_log_admin_select" ON quotation_audit_log;
CREATE POLICY "quotation_audit_log_admin_select"
  ON quotation_audit_log FOR SELECT
  TO authenticated
  USING (is_app_admin());

DROP POLICY IF EXISTS "quotation_audit_log_admin_insert" ON quotation_audit_log;
CREATE POLICY "quotation_audit_log_admin_insert"
  ON quotation_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (is_app_admin());

-- quote_product_visibility: admin only
DROP POLICY IF EXISTS "quote_product_visibility_admin_all" ON quote_product_visibility;
CREATE POLICY "quote_product_visibility_admin_all"
  ON quote_product_visibility FOR ALL
  TO authenticated
  USING (is_app_admin())
  WITH CHECK (is_app_admin());

-- quote_email_tracking: users can view their own quote emails; system/admin can write
DROP POLICY IF EXISTS "quote_email_tracking_select_via_quote" ON quote_email_tracking;
CREATE POLICY "quote_email_tracking_select_via_quote"
  ON quote_email_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM quotations q
      WHERE q.id = quote_email_tracking.quotation_id
        AND (q.user_id = auth.uid() OR is_app_admin())
    )
  );

DROP POLICY IF EXISTS "quote_email_tracking_admin_write" ON quote_email_tracking;
CREATE POLICY "quote_email_tracking_admin_write"
  ON quote_email_tracking FOR ALL
  TO authenticated
  USING (is_app_admin())
  WITH CHECK (is_app_admin());

-- ============================================================================
-- Seed minimal reference data (safe idempotent inserts)
-- ============================================================================
INSERT INTO quote_customer_tiers (name, description, discount_pct, priority)
VALUES
  ('Standard', 'Default customer tier', 0, 0),
  ('Premium', 'Preferred customers with better pricing visibility', 5, 10)
ON CONFLICT (name) DO NOTHING;

INSERT INTO quote_regions (code, name, state, compliance_notes, active)
VALUES
  ('LA', 'Los Angeles', 'CA', 'Initial pilot region', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Comments
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
-- Optional introspection helpers (no-op for migration execution)
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND (tablename LIKE 'quote%' OR tablename LIKE 'quotation%');
-- SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
--   AND (tc.table_name LIKE 'quote%' OR tc.table_name LIKE 'quotation%')
-- ORDER BY tc.table_name, kcu.column_name;