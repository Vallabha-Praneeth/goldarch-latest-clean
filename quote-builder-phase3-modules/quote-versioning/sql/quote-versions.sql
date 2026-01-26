-- Quote Versions Table
-- Stores historical snapshots

CREATE TABLE IF NOT EXISTS quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  quotation_snapshot JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX idx_quote_versions_original ON quote_versions(original_quotation_id);
CREATE INDEX idx_quote_versions_version ON quote_versions(original_quotation_id, version);
CREATE UNIQUE INDEX idx_quote_versions_unique ON quote_versions(original_quotation_id, version);

-- Function to create new version
CREATE OR REPLACE FUNCTION create_quote_version(p_quotation_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_next_version INTEGER;
  v_snapshot JSONB;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM quote_versions
  WHERE original_quotation_id = p_quotation_id;

  -- Get current quotation data
  SELECT to_jsonb(q.*) INTO v_snapshot
  FROM quotations q
  WHERE id = p_quotation_id;

  -- Insert version
  INSERT INTO quote_versions (
    original_quotation_id,
    version,
    quotation_snapshot,
    reason
  ) VALUES (
    p_quotation_id,
    v_next_version,
    v_snapshot,
    p_reason
  );

  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql;
