-- Public Quote Links Table
-- Allows sharing quotes via unique URLs

CREATE TABLE IF NOT EXISTS public_quote_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_public_quote_links_quotation ON public_quote_links(quotation_id);
CREATE INDEX idx_public_quote_links_token ON public_quote_links(share_token);
CREATE INDEX idx_public_quote_links_expires ON public_quote_links(expires_at);

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;
-- Quote Status History Table
-- Tracks all status changes

CREATE TABLE IF NOT EXISTS quote_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_status_history_quotation ON quote_status_history(quotation_id);
CREATE INDEX idx_quote_status_history_status ON quote_status_history(to_status);
CREATE INDEX idx_quote_status_history_changed_at ON quote_status_history(changed_at DESC);

-- Function to auto-log status changes
CREATE OR REPLACE FUNCTION log_quote_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO quote_status_history (
      quotation_id,
      from_status,
      to_status,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on quotations table
DROP TRIGGER IF EXISTS quote_status_change_trigger ON quotations;
CREATE TRIGGER quote_status_change_trigger
  AFTER UPDATE OF status ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION log_quote_status_change();
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
-- Customer Responses Table
-- Tracks customer actions (accept/reject/changes)

CREATE TABLE IF NOT EXISTS quote_customer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL CHECK (response_type IN ('accept', 'reject', 'request_changes')),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  signature TEXT,
  notes TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_responses_quotation ON quote_customer_responses(quotation_id);
CREATE INDEX idx_customer_responses_type ON quote_customer_responses(response_type);
CREATE INDEX idx_customer_responses_responded ON quote_customer_responses(responded_at DESC);

-- Trigger to auto-update quote status on response
CREATE OR REPLACE FUNCTION handle_customer_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_type = 'accept' THEN
    UPDATE quotations SET status = 'accepted' WHERE id = NEW.quotation_id;
  ELSIF NEW.response_type = 'reject' THEN
    UPDATE quotations SET status = 'rejected' WHERE id = NEW.quotation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_response_trigger ON quote_customer_responses;
CREATE TRIGGER customer_response_trigger
  AFTER INSERT ON quote_customer_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_customer_response();
