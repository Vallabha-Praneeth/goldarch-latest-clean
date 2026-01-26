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
