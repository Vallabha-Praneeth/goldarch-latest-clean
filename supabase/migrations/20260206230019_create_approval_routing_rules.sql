-- Module E: Approval Routing Rules
CREATE TABLE IF NOT EXISTS sandbox_approval_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES sandbox_intake_forms(id),
  rule_name TEXT NOT NULL,
  rule_order INTEGER NOT NULL,
  conditions JSONB,
  approver_role TEXT,
  approver_user_id UUID REFERENCES profiles(id),
  auto_approve BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_routing_form ON sandbox_approval_routing_rules(form_id);
