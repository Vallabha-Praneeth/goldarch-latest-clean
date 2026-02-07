-- Module H: Audit Trail
CREATE TABLE IF NOT EXISTS sandbox_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'deleted', 'sent')),
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_audit_entity ON sandbox_audit_trail(entity_type, entity_id);
CREATE INDEX idx_sandbox_audit_actor ON sandbox_audit_trail(actor_id);
CREATE INDEX idx_sandbox_audit_date ON sandbox_audit_trail(created_at DESC);
