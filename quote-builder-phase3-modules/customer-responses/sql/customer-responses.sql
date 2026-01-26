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
