-- Module C: RFQ Campaigns
CREATE TABLE IF NOT EXISTS sandbox_rfq_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  scope_of_work TEXT,
  required_by_date DATE,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'collecting', 'closed', 'awarded')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_rfq_project ON sandbox_rfq_campaigns(project_id);
CREATE INDEX idx_sandbox_rfq_status ON sandbox_rfq_campaigns(status);
