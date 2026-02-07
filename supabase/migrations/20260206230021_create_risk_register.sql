-- Module F: Risk Register
CREATE TABLE IF NOT EXISTS sandbox_risk_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  risk_code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('schedule', 'budget', 'technical', 'external', 'safety', 'quality')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  likelihood TEXT NOT NULL CHECK (likelihood IN ('unlikely', 'possible', 'likely', 'certain')),
  impact_score INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mitigating', 'mitigated', 'closed', 'accepted')),
  mitigation_plan TEXT,
  contingency_plan TEXT,
  owner_id UUID REFERENCES profiles(id),
  identified_date DATE DEFAULT CURRENT_DATE,
  target_resolution_date DATE,
  actual_resolution_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_risks_project ON sandbox_risk_register(project_id);
CREATE INDEX idx_sandbox_risks_status ON sandbox_risk_register(status);
