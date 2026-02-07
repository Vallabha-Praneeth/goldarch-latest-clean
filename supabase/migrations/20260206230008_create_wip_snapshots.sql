-- Module B: WIP Progress Snapshots
CREATE TABLE IF NOT EXISTS sandbox_wip_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_contract_value DECIMAL(12,2),
  total_billed DECIMAL(12,2),
  total_collected DECIMAL(12,2),
  percent_complete DECIMAL(5,2),
  earned_revenue DECIMAL(12,2),
  over_under_billing DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_wip_project ON sandbox_wip_snapshots(project_id);
CREATE INDEX idx_sandbox_wip_date ON sandbox_wip_snapshots(snapshot_date DESC);
