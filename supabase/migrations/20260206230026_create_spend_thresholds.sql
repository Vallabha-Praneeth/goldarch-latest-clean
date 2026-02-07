-- Module H: Spend Thresholds
CREATE TABLE IF NOT EXISTS sandbox_spend_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  threshold_name TEXT NOT NULL,
  min_amount DECIMAL(12,2),
  max_amount DECIMAL(12,2),
  required_approver_role TEXT,
  requires_additional_approval BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_thresholds_category ON sandbox_spend_thresholds(category_id);
