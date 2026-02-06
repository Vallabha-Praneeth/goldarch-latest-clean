-- Migration: Create templates table
-- Required for MODULE-1C E2E tests (template-editor-ui.spec.ts)

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quotation', 'invoice', 'email', 'contract', 'report')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  content JSONB DEFAULT '{}',
  subject TEXT, -- For email templates
  description TEXT,
  tokens JSONB DEFAULT '[]', -- Available tokens for this template type
  is_default BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_org_id ON templates(org_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_templates_updated_at ON templates;
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- Disable RLS for local dev/testing (following seed.sql pattern)
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Insert default templates for testing
INSERT INTO templates (name, type, status, description, tokens, is_default) VALUES
  ('Standard Quotation', 'quotation', 'active', 'Default quotation template', '["{{company_name}}", "{{client_name}}", "{{quote_number}}", "{{total}}", "{{date}}"]', true),
  ('Professional Invoice', 'invoice', 'active', 'Default invoice template', '["{{invoice_number}}", "{{client_name}}", "{{amount}}", "{{due_date}}"]', true),
  ('Quote Notification', 'email', 'active', 'Email template for quote notifications', '["{{recipient_name}}", "{{quote_link}}", "{{company_name}}"]', true),
  ('Draft Template', 'quotation', 'draft', 'Template in draft status', '["{{company_name}}"]', false)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE templates IS 'Templates table for quotations, invoices, emails and other document types';
