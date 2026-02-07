-- Module E: Intake Forms
CREATE TABLE IF NOT EXISTS sandbox_intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_type TEXT NOT NULL CHECK (form_type IN ('project_request', 'procurement_request', 'change_request')),
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_intake_forms_type ON sandbox_intake_forms(form_type);
