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
