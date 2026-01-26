-- Step 1b: Email Table Indexes
-- Run AFTER step1a succeeds

CREATE INDEX IF NOT EXISTS idx_email_tracking_quotation_id
  ON quote_email_tracking(quotation_id);

CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at
  ON quote_email_tracking(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient
  ON quote_email_tracking(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_tracking_status
  ON quote_email_tracking(status);
