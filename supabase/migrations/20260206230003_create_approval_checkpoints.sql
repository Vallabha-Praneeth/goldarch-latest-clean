-- Migration: Create Approval Checkpoints Table
-- Module: A (Contracts)
-- Description: Defines approval workflow steps for each contract

CREATE TABLE IF NOT EXISTS sandbox_approval_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES sandbox_contracts(id) ON DELETE CASCADE,
  
  -- Checkpoint definition
  checkpoint_name TEXT NOT NULL,
  checkpoint_order INTEGER NOT NULL,
  required_role TEXT CHECK (required_role IN ('owner', 'admin', 'procurement', 'manager')),
  
  -- Status: pending, approved, rejected, skipped
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'skipped')
  ),
  
  -- Approval tracking
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique ordering per contract
  UNIQUE(contract_id, checkpoint_order)
);

-- Indexes
CREATE INDEX idx_sandbox_checkpoints_contract ON sandbox_approval_checkpoints(contract_id);
CREATE INDEX idx_sandbox_checkpoints_status ON sandbox_approval_checkpoints(status);
CREATE INDEX idx_sandbox_checkpoints_order ON sandbox_approval_checkpoints(contract_id, checkpoint_order);

COMMENT ON TABLE sandbox_approval_checkpoints IS 'Approval workflow checkpoints for contracts';
