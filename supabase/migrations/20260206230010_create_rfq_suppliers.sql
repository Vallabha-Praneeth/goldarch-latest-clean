-- Module C: RFQ Suppliers Junction
CREATE TABLE IF NOT EXISTS sandbox_rfq_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES sandbox_rfq_campaigns(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  contact_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'responded', 'declined')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, supplier_id)
);
CREATE INDEX idx_sandbox_rfq_suppliers_campaign ON sandbox_rfq_suppliers(campaign_id);
CREATE INDEX idx_sandbox_rfq_suppliers_supplier ON sandbox_rfq_suppliers(supplier_id);
