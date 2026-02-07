-- Module A: E-sign Requests (placeholder for external integration)
CREATE TABLE IF NOT EXISTS sandbox_esign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES sandbox_contracts(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_name TEXT,
  signer_role TEXT CHECK (signer_role IN ('client', 'contractor', 'witness', 'approver')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'declined', 'expired')),
  external_provider TEXT,
  external_id TEXT,
  external_url TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_esign_contract ON sandbox_esign_requests(contract_id);
CREATE INDEX idx_sandbox_esign_status ON sandbox_esign_requests(status);
