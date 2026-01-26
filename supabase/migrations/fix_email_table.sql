-- Drop old table and recreate with correct structure
DROP TABLE IF EXISTS quote_email_tracking CASCADE;

-- Create new table with correct columns
CREATE TABLE quote_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_email_tracking_quotation_id
  ON quote_email_tracking(quotation_id);

CREATE INDEX idx_email_tracking_sent_at
  ON quote_email_tracking(sent_at DESC);

CREATE INDEX idx_email_tracking_recipient
  ON quote_email_tracking(recipient_email);

CREATE INDEX idx_email_tracking_status
  ON quote_email_tracking(status);

-- Add comment
COMMENT ON TABLE quote_email_tracking IS 'Tracks all quote emails sent to customers with delivery status';
