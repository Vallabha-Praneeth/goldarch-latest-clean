/**
 * Email Tracking Table - SQL Migration
 * Phase 2 - Email Delivery Module
 *
 * This table tracks all quote emails sent to customers
 */

-- Create email tracking table
CREATE TABLE IF NOT EXISTS quote_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL DEFAULT 'resend', -- 'resend', 'sendgrid', etc.
  provider_message_id TEXT, -- Email provider's message ID for tracking
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'bounced'
  error_message TEXT,
  opened_at TIMESTAMPTZ, -- Track when email was opened (if provider supports it)
  clicked_at TIMESTAMPTZ, -- Track when links were clicked (if provider supports it)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_quotation_id
  ON quote_email_tracking(quotation_id);

CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at
  ON quote_email_tracking(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient
  ON quote_email_tracking(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_tracking_status
  ON quote_email_tracking(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_email_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_tracking_updated_at
  BEFORE UPDATE ON quote_email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_updated_at();

-- RLS Policies
ALTER TABLE quote_email_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view email tracking for their quotes
CREATE POLICY "Users can view their quote email tracking"
  ON quote_email_tracking FOR SELECT
  TO authenticated
  USING (
    quotation_id IN (
      SELECT q.id FROM quotations q
      JOIN quote_leads ql ON q.lead_id = ql.id
      WHERE ql.user_id = auth.uid()
    )
  );

-- System can insert email tracking records
CREATE POLICY "System can insert email tracking"
  ON quote_email_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- System can update email tracking records
CREATE POLICY "System can update email tracking"
  ON quote_email_tracking FOR UPDATE
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE quote_email_tracking IS 'Tracks all quote emails sent to customers with delivery status';
