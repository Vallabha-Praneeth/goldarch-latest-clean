-- Migration: Create Contracts Table
-- Module: A (Contracts)
-- Description: Main contract records linked to quotes and projects

CREATE TABLE IF NOT EXISTS sandbox_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links to existing tables
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Contract details
  contract_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),

  -- Status workflow: draft → pending_approval → approved → signed → active → completed
  status TEXT DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_approval', 'approved', 'signed', 'active', 'completed', 'cancelled')
  ),

  -- Terms
  terms_and_conditions TEXT,
  effective_date DATE,
  expiration_date DATE,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sandbox_contracts_quote ON sandbox_contracts(quote_id);
CREATE INDEX idx_sandbox_contracts_project ON sandbox_contracts(project_id);
CREATE INDEX idx_sandbox_contracts_status ON sandbox_contracts(status);
CREATE INDEX idx_sandbox_contracts_number ON sandbox_contracts(contract_number);
CREATE INDEX idx_sandbox_contracts_created_by ON sandbox_contracts(created_by);
CREATE INDEX idx_sandbox_contracts_created_at ON sandbox_contracts(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_sandbox_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sandbox_contracts_updated_at
  BEFORE UPDATE ON sandbox_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_sandbox_contracts_updated_at();

-- Comments
COMMENT ON TABLE sandbox_contracts IS 'Contract records with approval workflow';
COMMENT ON COLUMN sandbox_contracts.status IS 'Workflow: draft → pending_approval → approved → signed → active → completed';
