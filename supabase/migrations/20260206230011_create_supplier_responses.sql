-- Module C: Supplier Responses
CREATE TABLE IF NOT EXISTS sandbox_supplier_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES sandbox_rfq_campaigns(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  quoted_amount DECIMAL(12,2),
  response_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_responses_campaign ON sandbox_supplier_responses(campaign_id);
