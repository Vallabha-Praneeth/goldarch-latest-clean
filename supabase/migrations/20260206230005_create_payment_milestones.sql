-- Module B: Payment Milestones
CREATE TABLE IF NOT EXISTS sandbox_payment_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES sandbox_contracts(id) ON DELETE SET NULL,
  milestone_name TEXT NOT NULL,
  milestone_order INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'partial', 'paid')),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_milestones_project ON sandbox_payment_milestones(project_id);
CREATE INDEX idx_sandbox_milestones_contract ON sandbox_payment_milestones(contract_id);
CREATE INDEX idx_sandbox_milestones_status ON sandbox_payment_milestones(status);
