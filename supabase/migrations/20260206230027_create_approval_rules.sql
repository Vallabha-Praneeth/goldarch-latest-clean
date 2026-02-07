-- Module H: Approval Rules
CREATE TABLE IF NOT EXISTS sandbox_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('procurement', 'contracts', 'projects', 'invoices')),
  conditions JSONB,
  required_approvers JSONB,
  approval_order TEXT DEFAULT 'sequential' CHECK (approval_order IN ('sequential', 'parallel')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_rules_applies_to ON sandbox_approval_rules(applies_to);
