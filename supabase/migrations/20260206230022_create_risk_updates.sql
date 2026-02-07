-- Module F: Risk Update History
CREATE TABLE IF NOT EXISTS sandbox_risk_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES sandbox_risk_register(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'assessment_change', 'note')),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_risk_updates_risk ON sandbox_risk_updates(risk_id);
